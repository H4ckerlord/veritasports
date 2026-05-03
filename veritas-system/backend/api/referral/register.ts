import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, wallet } = req.body as {
    code?: string;
    wallet?: string;
  };

  if (!code || !wallet) {
    res.status(400).json({ error: 'code and wallet are required' });
    return;
  }

  // Validate code format (alphanumeric, 6-12 chars)
  if (!/^[a-zA-Z0-9]{6,12}$/.test(code)) {
    res.status(400).json({ error: 'Invalid referral code format' });
    return;
  }

  // Validate wallet address
  if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  // Check the referral code exists
  const [referral] = await query<{
    id: number;
    referrer_wallet: string;
    referred_wallet: string | null;
  }>(
    `SELECT id, referrer_wallet, referred_wallet FROM referrals WHERE code = $1`,
    [code]
  );

  if (!referral) {
    res.status(404).json({ error: 'Referral code not found' });
    return;
  }

  // Prevent self-referral
  if (referral.referrer_wallet.toLowerCase() === wallet.toLowerCase()) {
    res.status(400).json({ error: 'Cannot use your own referral code' });
    return;
  }

  // Only register once (first wallet to use this code)
  if (referral.referred_wallet) {
    res.status(200).json({ message: 'Already registered' });
    return;
  }

  await query(
    `UPDATE referrals SET referred_wallet = $1, registered_at = NOW() WHERE id = $2`,
    [wallet.toLowerCase(), referral.id]
  );

  res.status(200).json({ message: 'Referral registered successfully' });
}
