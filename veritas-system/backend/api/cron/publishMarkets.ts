import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCronSecret } from '../../services/auth';
import { query } from '../../db/client';
import { createMarketOnAzuro } from '../../services/azuro';
import { telegram } from '../../services/telegram';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  // Find all markets due to be published (publish_time <= now AND still pending)
  const due = await query<{
    id: number;
    question: string;
    end_time: string;
  }>(
    `SELECT id, question, end_time
     FROM scheduled_markets
     WHERE status = 'pending' AND publish_time <= NOW()`
  );

  if (due.length === 0) {
    res.status(200).json({ processed: 0 });
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const market of due) {
    try {
      const endTimestamp = Math.floor(
        new Date(market.end_time).getTime() / 1000
      );

      const azuroMarketId = await createMarketOnAzuro(
        market.question,
        endTimestamp
      );

      await query(
        `UPDATE scheduled_markets
         SET status = 'published', azuro_market_id = $1
         WHERE id = $2`,
        [azuroMarketId, market.id]
      );

      await telegram.marketCreated(market.question, azuroMarketId);
      successCount++;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unknown error';

      await query(
        `UPDATE scheduled_markets
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [errorMsg, market.id]
      );

      await telegram.marketFailed(market.question, errorMsg);
      failCount++;
    }
  }

  res.status(200).json({ processed: due.length, successCount, failCount });
}
