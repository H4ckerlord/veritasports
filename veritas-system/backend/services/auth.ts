import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production';

export function signAdminToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyAdminToken(req: IncomingMessage): boolean {
  try {
    const header = (req as any).headers['authorization'];
    if (!header?.startsWith('Bearer ')) return false;
    const token = header.slice(7);
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function verifyCronSecret(req: IncomingMessage): boolean {
  const secret = (req as any).headers['authorization'];
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}