import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCronSecret } from '../../services/auth';
import { query } from '../../db/client';

const PLATFORM_FEE_PERCENT = 0.02;      // 2% platform fee
const REFERRAL_SHARE_PERCENT = 0.30;    // referrer gets 30% of platform fee

const BETS_QUERY = `
  query RecentBets($wallets: [String!]!) {
    bets(
      where: { bettor_in: $wallets }
      orderBy: createdAt
      orderDirection: desc
      first: 200
    ) {
      bettor
      amount
      createdAt
    }
  }
`;

async function getSubgraphUrl(): Promise<string> {
  const raw = process.env.AZURO_CONFIG;
  if (!raw) throw new Error('AZURO_CONFIG not set');
  const cfg = JSON.parse(raw) as { chainId: number };
  const map: Record<number, string> = {
    80002: 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-testnet',
    137: 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-mainnet',
  };
  return map[cfg.chainId] ?? map[80002];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  // Get all referred wallets that have not had first trade credited yet
  const pending = await query<{
    id: number;
    referred_wallet: string;
  }>(
    `SELECT id, referred_wallet
     FROM referrals
     WHERE referred_wallet IS NOT NULL
       AND first_trade_at IS NULL
       AND reward_amount = 0`
  );

  if (pending.length === 0) {
    res.status(200).json({ credited: 0 });
    return;
  }

  const wallets = pending.map((r) => r.referred_wallet.toLowerCase());

  // Query Azuro subgraph for bets by these wallets
  let bets: { bettor: string; amount: string }[];
  try {
    const url = await getSubgraphUrl();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: BETS_QUERY, variables: { wallets } }),
    });
    const json = (await response.json()) as {
      data?: { bets: { bettor: string; amount: string }[] };
    };
    bets = json.data?.bets ?? [];
  } catch {
    res.status(500).json({ error: 'Subgraph query failed' });
    return;
  }

  // Group bets by bettor to get total amount bet
  const bettorAmounts: Record<string, number> = {};
  for (const bet of bets) {
    const addr = bet.bettor.toLowerCase();
    const amt = parseFloat(bet.amount) || 0;
    bettorAmounts[addr] = (bettorAmounts[addr] ?? 0) + amt;
  }

  let credited = 0;

  for (const row of pending) {
    const wallet = row.referred_wallet.toLowerCase();
    const totalBetAmount = bettorAmounts[wallet];

    if (totalBetAmount && totalBetAmount > 0) {
      // Calculate reward: 30% of 2% platform fee on their total bets
      const platformFee = totalBetAmount * PLATFORM_FEE_PERCENT;
      const referrerReward = platformFee * REFERRAL_SHARE_PERCENT;

      await query(
        `UPDATE referrals
         SET first_trade_at = NOW(),
             reward_amount = $1
         WHERE id = $2`,
        [referrerReward.toFixed(6), row.id]
      );
      credited++;
    }
  }

  res.status(200).json({ credited });
}