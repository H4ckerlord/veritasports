import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../services/auth';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const rows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::int AS count FROM scheduled_markets GROUP BY status`
  );

  const counts = { pending: 0, published: 0, failed: 0 };
  for (const row of rows) {
    counts[row.status as keyof typeof counts] = Number(row.count);
  }

  // Latest 20 markets for the admin table
  const recent = await query(
    `SELECT id, question, end_time, publish_time, status, azuro_market_id, error_message, created_at
     FROM scheduled_markets ORDER BY created_at DESC LIMIT 20`
  );

  res.status(200).json({ counts, recent });
}
