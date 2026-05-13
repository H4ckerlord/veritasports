import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db/client';

function verifyCronSecret(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers['authorization'];
  return auth === `Bearer ${secret}`;
}

const PLATFORM_FEE_PERCENT = 0.02;
const REFERRAL_SHARE_PERCENT = 0.30;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!verifyCronSecret(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  try {
    const pending = await query<{
      id: number;
      referred_wallet: string;
    }>(
      `SELECT id, referred_wallet FROM referrals
       WHERE referred_wallet IS NOT NULL
         AND first_trade_at IS NULL
         AND reward_amount = 0`
    );

    if (pending.length === 0) {
      res.status(200).json({ credited: 0, message: 'No pending referrals' });
      return;
    }

    const wallets = pending.map((r) => r.referred_wallet.toLowerCase());

    const trades = await query<{
      wallet_address: string;
      total: string;
    }>(
      `SELECT wallet_address, SUM(amount)::float AS total
       FROM platform_trades
       WHERE wallet_address = ANY($1::text[])
       GROUP BY wallet_address`,
      [wallets]
    );

    const tradeMap: Record<string, number> = {};
    for (const t of trades) {
      tradeMap[t.wallet_address.toLowerCase()] = Number(t.total);
    }

    let credited = 0;
    for (const row of pending) {
      const wallet = row.referred_wallet.toLowerCase();
      const totalVolume = tradeMap[wallet] ?? 0;

      if (totalVolume > 0) {
        const platformFee = totalVolume * PLATFORM_FEE_PERCENT;
        const reward = platformFee * REFERRAL_SHARE_PERCENT;

        await query(
          `UPDATE referrals
           SET first_trade_at = NOW(), reward_amount = $1
           WHERE id = $2`,
          [reward.toFixed(6), row.id]
        );
        credited++;
      }
    }

    res.status(200).json({
      credited,
      total: pending.length,
      message: `Processed ${pending.length} referrals, credited ${credited}`,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}