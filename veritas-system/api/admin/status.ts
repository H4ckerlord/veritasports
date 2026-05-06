import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../services/auth';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (!verifyAdminToken(req)) { res.status(401).json({ error: 'Unauthorised' }); return; }

  // DELETE a pending market
  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) { res.status(400).json({ error: 'ID required' }); return; }
    try {
      await query('DELETE FROM scheduled_markets WHERE id = $1 AND status = $2', [id, 'pending']);
      res.status(200).json({ message: 'Deleted' });
    } catch {
      res.status(500).json({ error: 'Delete failed' });
    }
    return;
  }

  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const counts = await query<{ status: string; count: string }>(
      'SELECT status, COUNT(*)::int AS count FROM scheduled_markets GROUP BY status'
    );
    const countsObj = { pending: 0, published: 0, failed: 0 };
    for (const row of counts) {
      countsObj[row.status as keyof typeof countsObj] = Number(row.count);
    }

    const recent = await query(
      `SELECT id, question, end_time, publish_time, status, azuro_market_id, error_message, created_at
       FROM scheduled_markets ORDER BY created_at DESC LIMIT 20`
    );

    // Analytics
    let analytics = null;
    try {
      const [vToday, vWeek, vMonth, vYear, refTotal, refPending, dailyV] = await Promise.all([
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '1 day'`),
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '7 days'`),
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '30 days'`),
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '365 days'`),
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM referrals WHERE referred_wallet IS NOT NULL`),
        query<{ count: string }>(`SELECT COUNT(*)::int AS count FROM referrals WHERE reward_amount > 0 AND reward_claimed = FALSE`),
        query<{ day: string; count: string }>(
          `SELECT DATE(visited_at) AS day, COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(visited_at) ORDER BY day ASC`
        ),
      ]);
      analytics = {
        visitors: {
          today: Number(vToday[0]?.count ?? 0),
          week: Number(vWeek[0]?.count ?? 0),
          month: Number(vMonth[0]?.count ?? 0),
          year: Number(vYear[0]?.count ?? 0),
        },
        referrals: {
          total: Number(refTotal[0]?.count ?? 0),
          pendingRewards: Number(refPending[0]?.count ?? 0),
        },
        dailyVisits: dailyV,
      };
    } catch {
      // page_visits table might not exist yet — analytics optional
      analytics = null;
    }

    res.status(200).json({ counts: countsObj, recent, analytics });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
}