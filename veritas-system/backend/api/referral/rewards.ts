import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const wallet = req.query.wallet as string | undefined;

  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    res.status(400).json({ error: 'Valid wallet address required' });
    return;
  }

  const rows = await query<{
    code: string;
    referred_wallet: string | null;
    reward_amount: string;
    reward_claimed: boolean;
    claimed_at: string | null;
  }>(
    `SELECT code, referred_wallet, reward_amount, reward_claimed, claimed_at
     FROM referrals
     WHERE referrer_wallet = $1`,
    [wallet.toLowerCase()]
  );

  const totalPending = rows
    .filter((r) => !r.reward_claimed && parseFloat(r.reward_amount) > 0)
    .reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);

  const totalClaimed = rows
    .filter((r) => r.reward_claimed)
    .reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);

  // Generate referral code for this wallet if it doesn't exist yet
  const existingCode = rows[0]?.code ?? null;

  res.status(200).json({
    referralCode: existingCode,
    referrals: rows,
    pendingUsdc: totalPending.toFixed(6),
    claimedUsdc: totalClaimed.toFixed(6),
  });
}
