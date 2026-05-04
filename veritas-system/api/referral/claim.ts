import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';
import { sendUsdcReward } from '../../services/azuro';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { wallet } = req.body as { wallet?: string };

  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    res.status(400).json({ error: 'Valid wallet address required' });
    return;
  }

  // Find unclaimed rewards for this referrer
  const rows = await query<{
    id: number;
    reward_amount: string;
  }>(
    `SELECT id, reward_amount
     FROM referrals
     WHERE referrer_wallet = $1 AND reward_claimed = FALSE AND reward_amount > 0`,
    [wallet.toLowerCase()]
  );

  if (rows.length === 0) {
    res.status(200).json({ message: 'No claimable rewards', amount: '0' });
    return;
  }

  const total = rows.reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);

  // Transfer USDC from fee wallet to the referrer
  let txHash: string;
  try {
    txHash = await sendUsdcReward(wallet, total);
  } catch (err) {
    res.status(500).json({ error: 'Transfer failed. Try again later.' });
    return;
  }

  // Mark as claimed
  const ids = rows.map((r) => r.id);
  await query(
    `UPDATE referrals
     SET reward_claimed = TRUE, claimed_at = NOW()
     WHERE id = ANY($1::int[])`,
    [ids]
  );

  res.status(200).json({
    message: 'Rewards claimed',
    amount: total.toFixed(6),
    txHash,
  });
}
