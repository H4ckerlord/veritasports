import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { query } from '../db/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function isValidWallet(wallet: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(wallet);
}

function generateReferralCode(): string {
  const digits = '0123456789';
  const specials = '!@$_-~';
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) code += digits[crypto.randomInt(digits.length)];
  for (let i = 0; i < 2; i++) code += specials[crypto.randomInt(specials.length)];
  for (let i = 0; i < 2; i++) code += letters[crypto.randomInt(letters.length)];
  return code;
}

const BASE_URL = process.env.VITE_API_BASE_URL ?? 'https://veritasport.com';

// ─── Action: generate ───────────────────────────────────────────────────────

async function handleGenerate(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { wallet } = req.body as { wallet?: string };
  if (!wallet || !isValidWallet(wallet)) {
    res.status(400).json({ error: 'Valid wallet address required' });
    return;
  }

  const lower = wallet.toLowerCase();

  try {
    const existing = await query<{ code: string }>(
      'SELECT code FROM referrals WHERE referrer_wallet = $1 LIMIT 1',
      [lower]
    );

    if (existing.length > 0) {
      const code = existing[0].code;
      const link = `${BASE_URL}?ref=${encodeURIComponent(code)}`;
      res.status(200).json({ code, link });
      return;
    }

    let code = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = generateReferralCode();
      const conflict = await query(
        'SELECT id FROM referrals WHERE code = $1 LIMIT 1',
        [candidate]
      );
      if (conflict.length === 0) { code = candidate; break; }
    }

    if (!code) {
      res.status(500).json({ error: 'Could not generate unique code. Please try again.' });
      return;
    }

    await query(
      'INSERT INTO referrals (code, referrer_wallet) VALUES ($1, $2)',
      [code, lower]
    );

    const link = `${BASE_URL}?ref=${encodeURIComponent(code)}`;
    res.status(200).json({ code, link });
  } catch (err) {
    res.status(500).json({ error: 'Database error. Run schema.sql on your Neon database.' });
  }
}

// ─── Action: register ───────────────────────────────────────────────────────

async function handleRegister(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, wallet } = req.body as { code?: string; wallet?: string };
  if (!code || !wallet) {
    res.status(400).json({ error: 'code and wallet required' });
    return;
  }

  if (!isValidWallet(wallet)) {
    res.status(400).json({ error: 'Invalid wallet address' });
    return;
  }

  const lower = wallet.toLowerCase();

  try {
    const referralRows = await query<{ id: number; referrer_wallet: string }>(
      'SELECT id, referrer_wallet FROM referrals WHERE code = $1 LIMIT 1',
      [code]
    );

    if (referralRows.length === 0) {
      res.status(404).json({ error: 'Referral code not found' });
      return;
    }

    const referral = referralRows[0];

    if (referral.referrer_wallet.toLowerCase() === lower) {
      res.status(400).json({ error: 'Cannot refer yourself' });
      return;
    }

    const alreadyReferred = await query(
      'SELECT id FROM referrals WHERE referred_wallet = $1 LIMIT 1',
      [lower]
    );

    if (alreadyReferred.length > 0) {
      res.status(200).json({ message: 'Already registered via referral' });
      return;
    }

    await query(
      'UPDATE referrals SET referred_wallet = $1, registered_at = NOW() WHERE id = $2',
      [lower, referral.id]
    );

    res.status(200).json({ message: 'Referral registered successfully' });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
}

// ─── Action: rewards ────────────────────────────────────────────────────────

async function handleRewards(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { wallet } = req.query as { wallet?: string };
  if (!wallet || !isValidWallet(wallet)) {
    res.status(400).json({ error: 'Valid wallet required' });
    return;
  }

  const lower = wallet.toLowerCase();

  try {
    const referrals = await query<{
      id: number;
      code: string;
      referred_wallet: string | null;
      reward_amount: string;
      reward_claimed: boolean;
      registered_at: string | null;
    }>(
      `SELECT id, code, referred_wallet, reward_amount, reward_claimed, registered_at
       FROM referrals
       WHERE referrer_wallet = $1
       ORDER BY id DESC`,
      [lower]
    );

    const totalPending = referrals
      .filter((r) => !r.reward_claimed && parseFloat(r.reward_amount ?? '0') > 0)
      .reduce((sum, r) => sum + parseFloat(r.reward_amount ?? '0'), 0);

    const totalClaimed = referrals
      .filter((r) => r.reward_claimed)
      .reduce((sum, r) => sum + parseFloat(r.reward_amount ?? '0'), 0);

    const referralCode = referrals.length > 0 ? referrals[0].code : null;

    res.status(200).json({
      referralCode,
      referralLink: referralCode
        ? `${BASE_URL}?ref=${encodeURIComponent(referralCode)}`
        : null,
      pendingUsdc: totalPending.toFixed(6),
      claimedUsdc: totalClaimed.toFixed(6),
      referrals,
    });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
}

// ─── Action: claim ──────────────────────────────────────────────────────────

async function handleClaim(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { wallet } = req.body as { wallet?: string };
  if (!wallet || !isValidWallet(wallet)) {
    res.status(400).json({ error: 'Valid wallet required' });
    return;
  }

  const lower = wallet.toLowerCase();

  try {
    const pending = await query<{ id: number; reward_amount: string }>(
      `SELECT id, reward_amount FROM referrals
       WHERE referrer_wallet = $1 AND reward_amount > 0 AND reward_claimed = FALSE`,
      [lower]
    );

    if (pending.length === 0) {
      res.status(200).json({ message: 'No pending rewards to claim', amount: '0.00' });
      return;
    }

    const totalAmount = pending.reduce(
      (sum, r) => sum + parseFloat(r.reward_amount ?? '0'),
      0
    );

    const ids = pending.map((r) => r.id);
    await query(
      `UPDATE referrals SET reward_claimed = TRUE, claimed_at = NOW()
       WHERE id = ANY($1::int[])`,
      [ids]
    );

    res.status(200).json({
      message: 'Rewards claimed successfully',
      amount: totalAmount.toFixed(6),
    });
  } catch {
    res.status(500).json({ error: 'Database error' });
  }
}

// ─── Main Router ─────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query as { action?: string };

  switch (action) {
    case 'generate':
      await handleGenerate(req, res);
      break;
    case 'register':
      await handleRegister(req, res);
      break;
    case 'rewards':
      await handleRewards(req, res);
      break;
    case 'claim':
      await handleClaim(req, res);
      break;
    default:
      res.status(400).json({
        error: 'Unknown action. Use: generate, register, rewards, or claim',
      });
  }
}