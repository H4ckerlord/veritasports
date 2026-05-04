import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCronSecret } from '../../services/auth';
import { query } from '../../db/client';

/**
 * Daily cron: check for referred wallets that have made their first trade on
 * Azuro (via subgraph) and credit the referrer with a USDC reward.
 *
 * Note: actual bet detection uses Azuro's subgraph. We query for any `Bet`
 * events where the bettor matches a referred_wallet that hasn't been rewarded.
 */

const REWARD_USDC = 1.0; // reward per successful referral

const BETS_QUERY = `
  query FirstBets($wallets: [String!]!) {
    bets(where: { bettor_in: $wallets }, orderBy: createdAt, first: 200) {
      bettor
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

  // Get all referred wallets that haven't had a first trade credited yet
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
  let bettors: Set<string>;
  try {
    const url = await getSubgraphUrl();
    const res2 = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: BETS_QUERY, variables: { wallets } }),
    });
    const json = (await res2.json()) as {
      data?: { bets: { bettor: string }[] };
    };
    bettors = new Set(
      (json.data?.bets ?? []).map((b) => b.bettor.toLowerCase())
    );
  } catch {
    res.status(500).json({ error: 'Subgraph query failed' });
    return;
  }

  let credited = 0;
  for (const row of pending) {
    if (bettors.has(row.referred_wallet.toLowerCase())) {
      await query(
        `UPDATE referrals
         SET first_trade_at = NOW(), reward_amount = $1
         WHERE id = $2`,
        [REWARD_USDC, row.id]
      );
      credited++;
    }
  }

  res.status(200).json({ credited });
}
