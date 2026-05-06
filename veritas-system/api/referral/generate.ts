import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { wallet } = req.body as { wallet?: string };

  if (!wallet) {
    res.status(400).json({ error: 'Wallet address is required' });
    return;
  }

  const lower = wallet.toLowerCase().trim();

  // Validate wallet address format
  if (!/^0x[0-9a-fA-F]{40}$/.test(lower)) {
    res.status(400).json({ error: 'Invalid wallet address format' });
    return;
  }

  try {
    // Check if this wallet already has a referral code
    const existing = await query<{ code: string }>(
      'SELECT code FROM referrals WHERE referrer_wallet = $1 LIMIT 1',
      [lower]
    );

    if (existing.length > 0) {
      res.status(200).json({ code: existing[0].code });
      return;
    }

    // Generate a unique 8-character code
    let code = '';
    let attempts = 0;
    while (attempts < 10) {
      const candidate = crypto.randomBytes(4).toString('hex');
      const conflict = await query('SELECT id FROM referrals WHERE code = $1 LIMIT 1', [candidate]);
      if (conflict.length === 0) {
        code = candidate;
        break;
      }
      attempts++;
    }

    if (!code) {
      res.status(500).json({ error: 'Could not generate unique code. Please try again.' });
      return;
    }

    await query(
      'INSERT INTO referrals (code, referrer_wallet) VALUES ($1, $2)',
      [code, lower]
    );

    res.status(200).json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Database error. Please make sure you have run schema.sql on your database.' });
  }
}