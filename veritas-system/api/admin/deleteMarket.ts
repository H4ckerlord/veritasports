import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdminToken } from '../../services/auth';
import { query } from '../../db/client';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const { id } = req.query as { id?: string };

  if (!id) {
    res.status(400).json({ error: 'ID required' });
    return;
  }

  try {
    await query(
      'DELETE FROM scheduled_markets WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    res.status(200).json({ message: 'Deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
}