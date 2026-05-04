import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '../../services/auth';

// Track failed attempts per IP
const failedAttempts: Record<string, { count: number; lockedUntil: number }> = {};

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Get IP address
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    'unknown';

  // Check if IP is locked out
  const record = failedAttempts[ip];
  const now = Date.now();

  if (record && record.lockedUntil > now) {
    const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
    res.status(429).json({
      error: `🔒 KEEP OFF — UNAUTHORISED ACCESS. Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
    });
    return;
  }

  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ error: 'Password required' });
    return;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!hash) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const valid = await bcrypt.compare(password.trim(), hash.trim());

    if (!valid) {
      // Record failed attempt
      if (!failedAttempts[ip]) {
        failedAttempts[ip] = { count: 0, lockedUntil: 0 };
      }
      failedAttempts[ip].count += 1;

      const attemptsLeft = MAX_ATTEMPTS - failedAttempts[ip].count;

      if (failedAttempts[ip].count >= MAX_ATTEMPTS) {
        failedAttempts[ip].lockedUntil = now + LOCKOUT_MS;
        res.status(429).json({
          error: '🔒 KEEP OFF — UNAUTHORISED ACCESS. Login locked for 1 hour due to too many failed attempts.',
        });
        return;
      }

      await new Promise((r) => setTimeout(r, 500));
      res.status(401).json({
        error: `❌ Incorrect password. ${attemptsLeft} attempt(s) remaining before 1 hour lockout.`,
      });
      return;
    }

    // Success — clear failed attempts
    delete failedAttempts[ip];
    const token = signAdminToken();
    res.status(200).json({ token });

  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}