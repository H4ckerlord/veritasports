/**
 * Azuro integration service.
 *
 * Azuro is a decentralised sports-betting / prediction-market protocol.
 * Markets ("conditions") are created on-chain; liquidity and resolution are
 * handled by Azuro's infrastructure.
 *
 * Docs: https://gem.azuro.org/
 *
 * This file provides helpers for:
 *  1. Creating a market condition via the LP contract.
 *  2. Fetching active conditions from Azuro's subgraph.
 */

import { ethers } from 'ethers';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AzuroConfig {
  environment: 'testnet' | 'mainnet';
  chainId: number;
  rpcUrl: string;
}

export interface MarketCondition {
  conditionId: string;
  question: string;
  endTime: number; // unix timestamp
  status: string;
  outcomes: { id: string; name: string; currentOdds: string }[];
}

// ─── ABIs (minimal) ───────────────────────────────────────────────────────────

/**
 * Minimal ABI for Azuro LP contract – only the functions we call.
 * Full ABI: https://gem.azuro.org/contracts
 */
const LP_ABI = [
  // createCondition(uint256 gameId, uint256 conditionId, uint256[2] odds,
  //                uint64 reinforcement, uint64 margin, address oracle)
  'function createCondition(uint256 gameId, uint256 conditionId, uint256[] calldata odds, uint64 reinforcement, uint64 margin, address oracle) external returns (uint256)',
];

// ─── Contract addresses ───────────────────────────────────────────────────────

const CONTRACTS: Record<
  string,
  { lp: string; oracle: string; subgraphUrl: string }
> = {
  // Polygon Amoy testnet (chainId 80002)
  '80002': {
    lp: '0x904eBd7d03f6Fb60B47BcfC9fc5c1c8e5D5EFe44', // replace with actual Azuro testnet LP
    oracle: '0x4eB4D2B09b0D0e3B12B39F7e23B28d73b7c8d95a', // replace with actual oracle
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-testnet',
  },
  // Polygon mainnet (chainId 137)
  '137': {
    lp: '0xd26a7e79b91e3b0b45571abac1a57a09c4abf9f6', // replace with actual mainnet LP
    oracle: '0x62a5d1b81cd1da1a36498dbbacdd8da1a61e4a33', // replace with actual oracle
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-mainnet',
  },
};

// ─── Config loader ────────────────────────────────────────────────────────────

function loadConfig(): AzuroConfig {
  const raw = process.env.AZURO_CONFIG;
  if (!raw) throw new Error('AZURO_CONFIG env var not set');
  return JSON.parse(raw) as AzuroConfig;
}

// ─── Provider / signer ────────────────────────────────────────────────────────

function getSigner(): ethers.Wallet {
  const config = loadConfig();
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const pk = process.env.ADMIN_PRIVATE_KEY;
  if (!pk) throw new Error('ADMIN_PRIVATE_KEY env var not set');
  return new ethers.Wallet(pk, provider);
}

// ─── Create market on Azuro ───────────────────────────────────────────────────

/**
 * Creates a binary YES/NO market on Azuro by calling `createCondition` on the
 * LP contract.
 *
 * Returns the on-chain conditionId that Azuro will use to track the market.
 */
export async function createMarketOnAzuro(
  question: string,
  endTimestamp: number
): Promise<string> {
  const config = loadConfig();
  const contracts = CONTRACTS[String(config.chainId)];
  if (!contracts) throw new Error(`No Azuro contracts for chainId ${config.chainId}`);

  const signer = getSigner();
  const lp = new ethers.Contract(contracts.lp, LP_ABI, signer);

  // Generate a unique conditionId from the question hash + timestamp
  const conditionIdBig = BigInt(
    ethers.keccak256(
      ethers.toUtf8Bytes(`${question}:${endTimestamp}:${Date.now()}`)
    )
  ) % BigInt('0xFFFFFFFFFFFF'); // keep it 48-bit for Azuro

  // gameId – for non-sports markets we use a generic game. Azuro requires
  // a pre-created game; for testnet we use a known generic gameId.
  const gameId = BigInt(1); // replace with actual gameId from Azuro

  // Initial odds: 2.0 / 2.0 (50/50) in 1e9 format
  const ODDS_UNIT = 10n ** 9n;
  const odds = [2n * ODDS_UNIT, 2n * ODDS_UNIT];

  // Reinforcement = 1000 USDC (in 1e6) – Azuro's minimum liquidity backing
  const reinforcement = 1_000_000_000n; // 1000 USDC

  // Margin = 5% in basis points (500)
  const margin = 500n;

  const tx = await lp.createCondition(
    gameId,
    conditionIdBig,
    odds,
    reinforcement,
    margin,
    contracts.oracle
  );

  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction reverted');
  }

  return conditionIdBig.toString();
}

// ─── Fetch active markets from subgraph ───────────────────────────────────────

const MARKETS_QUERY = `
  query ActiveMarkets($now: Int!) {
    conditions(
      where: { status: Created, game_: { startsAt_gt: $now } }
      orderBy: createdBlockTimestamp
      orderDirection: desc
      first: 50
    ) {
      conditionId
      status
      game {
        gameId
        startsAt
        title
      }
      outcomes {
        outcomeId
        currentOdds
      }
    }
  }
`;

export interface SubgraphCondition {
  conditionId: string;
  status: string;
  game: { gameId: string; startsAt: string; title: string };
  outcomes: { outcomeId: string; currentOdds: string }[];
}

export async function fetchActiveMarkets(): Promise<SubgraphCondition[]> {
  const config = loadConfig();
  const contracts = CONTRACTS[String(config.chainId)];
  if (!contracts) return [];

  const now = Math.floor(Date.now() / 1000);

  const res = await fetch(contracts.subgraphUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: MARKETS_QUERY,
      variables: { now },
    }),
  });

  if (!res.ok) throw new Error(`Subgraph error: ${res.status}`);
  const json = (await res.json()) as {
    data?: { conditions: SubgraphCondition[] };
  };
  return json.data?.conditions ?? [];
}

// ─── Transfer USDC reward (off-chain referral) ────────────────────────────────

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// Standard USDC addresses
const USDC: Record<number, string> = {
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Amoy testnet USDC
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon mainnet USDC
};

export async function sendUsdcReward(
  toAddress: string,
  amountUsdc: number
): Promise<string> {
  const config = loadConfig();
  const usdcAddress = USDC[config.chainId];
  if (!usdcAddress)
    throw new Error(`No USDC address for chainId ${config.chainId}`);

  const signer = getSigner();
  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, signer);
  const decimals: bigint = await usdc.decimals();
  const amount = BigInt(Math.round(amountUsdc * 10 ** Number(decimals)));

  const tx = await usdc.transfer(toAddress, amount);
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error('USDC transfer reverted');
  }
  return tx.hash as string;
}
