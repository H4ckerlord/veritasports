import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '../../services/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    // Fixed 300ms delay to prevent timing attacks
    await new Promise((r) => setTimeout(r, 300));
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const token = signAdminToken();
  res.status(200).json({ token });
}
