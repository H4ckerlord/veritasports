import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchActiveMarkets } from '../services/azuro';

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const markets = await fetchActiveMarkets();
    res.status(200).json({ markets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
}
