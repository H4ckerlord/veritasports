import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';
import crypto from 'crypto';

function generateReferralCode(): string {
  const digits = '0123456789';
  const specials = '!@$_-~';
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let code = '';

  // 6 random digits
  for (let i = 0; i < 6; i++) {
    code += digits[crypto.randomInt(digits.length)];
  }

  // 2 random special characters
  for (let i = 0; i < 2; i++) {
    code += specials[crypto.randomInt(specials.length)];
  }

  // 2 random letters (upper or lower case)
  for (let i = 0; i < 2; i++) {
    code += letters[crypto.randomInt(letters.length)];
  }

  return code;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
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

  if (!/^0x[0-9a-fA-F]{40}$/.test(lower)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  try {
    // Check if wallet already has a code
    const existing = await query<{ code: string }>(
      'SELECT code FROM referrals WHERE referrer_wallet = $1 LIMIT 1',
      [lower]
    );

    if (existing.length > 0) {
      const code = existing[0].code;
      const link = `https://veritasports.com?ref=${encodeURIComponent(code)}`;
      res.status(200).json({ code, link });
      return;
    }

    // Generate unique code with retries
    let code = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = generateReferralCode();
      const conflict = await query(
        'SELECT id FROM referrals WHERE code = $1 LIMIT 1',
        [candidate]
      );
      if (conflict.length === 0) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      res.status(500).json({ error: 'Could not generate unique code. Please try again.' });
      return;
    }

    await query(
      'INSERT INTO referrals (code, referrer_wallet) VALUES ($1, $2)',
      [code, lower]
    );

    const link = `https://veritasports.com?ref=${encodeURIComponent(code)}`;
    res.status(200).json({ code, link });

  } catch (err) {
    res.status(500).json({
      error: 'Database error. Please make sure you have run the schema.sql on your Neon database.',
    });
  }
}