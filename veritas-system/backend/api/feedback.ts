import type { VercelRequest, VercelResponse } from '@vercel/node';
import { telegram } from '../services/telegram';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message, wallet } = req.body as {
    message?: string;
    wallet?: string | null;
  };

  if (!message || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    return;
  }

  // Validate wallet if provided
  const safeWallet =
    wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet) ? wallet : null;

  await telegram.feedback(safeWallet, message.trim());

  res.status(200).json({ message: 'Feedback received. Thank you!' });
}
