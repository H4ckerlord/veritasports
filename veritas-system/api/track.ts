import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(200).end(); return; }
  try {
    const { page } = req.body as { page?: string };
    const safePage = (page ?? '/').substring(0, 200);
    await query('INSERT INTO page_visits (page) VALUES ($1)', [safePage]);
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false });
  }
}