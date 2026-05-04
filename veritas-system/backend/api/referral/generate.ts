import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';
import crypto from 'crypto';

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

  const lower = wallet.toLowerCase();

  const existing = await query<{ code: string }>(
    `SELECT code FROM referrals WHERE referrer_wallet = $1 LIMIT 1`,
    [lower]
  );

  if (existing.length > 0) {
    res.status(200).json({ code: existing[0].code });
    return;
  }

  const code = crypto.randomBytes(4).toString('hex');

  await query(
    `INSERT INTO referrals (code, referrer_wallet) VALUES ($1, $2)`,
    [code, lower]
  );

  res.status(200).json({ code });
}