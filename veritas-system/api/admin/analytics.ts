import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../services/auth';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  try {
    const visitorsToday = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '1 day'`
    );
    const visitorsWeek = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '7 days'`
    );
    const visitorsMonth = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '30 days'`
    );
    const visitorsYear = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM page_visits WHERE visited_at >= NOW() - INTERVAL '365 days'`
    );
    const marketsTotal = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM scheduled_markets`
    );
    const marketsPending = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM scheduled_markets WHERE status = 'pending'`
    );
    const marketsPublished = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM scheduled_markets WHERE status = 'published'`
    );
    const referralsTotal = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM referrals WHERE referred_wallet IS NOT NULL`
    );
    const referralsPending = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM referrals WHERE reward_amount > 0 AND reward_claimed = FALSE`
    );
    const dailyVisits = await query<{ day: string; count: string }>(
      `SELECT DATE(visited_at) AS day, COUNT(*)::int AS count
       FROM page_visits
       WHERE visited_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(visited_at)
       ORDER BY day ASC`
    );

    res.status(200).json({
      visitors: {
        today: Number(visitorsToday[0]?.count ?? 0),
        week: Number(visitorsWeek[0]?.count ?? 0),
        month: Number(visitorsMonth[0]?.count ?? 0),
        year: Number(visitorsYear[0]?.count ?? 0),
      },
      markets: {
        total: Number(marketsTotal[0]?.count ?? 0),
        pending: Number(marketsPending[0]?.count ?? 0),
        published: Number(marketsPublished[0]?.count ?? 0),
      },
      referrals: {
        total: Number(referralsTotal[0]?.count ?? 0),
        pendingRewards: Number(referralsPending[0]?.count ?? 0),
      },
      dailyVisits,
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics query failed. Make sure you have run the SQL to create the page_visits table in Neon.' });
  }
}