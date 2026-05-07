import type { VercelRequest, VercelResponse } from '@vercel/node';
import { telegram } from '../services/telegram';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { message, wallet, contactMethod } = req.body as {
    message?: string;
    wallet?: string | null;
    contactMethod?: string | null;
  };

  if (!message || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  if (message.length > 1000) {
    res.status(400).json({ error: 'Message too long' });
    return;
  }

  const safeWallet = wallet && /^0x[0-9a-fA-F]{40}$/.test(wallet) ? wallet : null;
  const safeContact = contactMethod && contactMethod.trim().length > 0
    ? contactMethod.trim().substring(0, 100)
    : null;

  let fullMessage = message.trim();
  if (safeContact) {
    fullMessage += `\n\nReply to: ${safeContact}`;
  }

  await telegram.feedback(safeWallet, fullMessage);
  res.status(200).json({ message: 'Feedback received. Thank you!' });
}