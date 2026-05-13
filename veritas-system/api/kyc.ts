import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { query } from '../db/client';

const TIER1_LIMIT = 1000;
const TIER3_LIMIT = 10000;
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const key = process.env.KYC_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('KYC_ENCRYPTION_KEY must be a 64-character hex string');
  }
  return Buffer.from(key, 'hex');
}

function encryptData(data: object): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const json = JSON.stringify(data);
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

function decryptData(encrypted: string, iv: string, authTag: string): object {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

async function logAudit(wallet: string, action: string, details?: string) {
  try {
    await query(
      'INSERT INTO kyc_audit_log (wallet_address, action, details) VALUES ($1, $2, $3)',
      [wallet.toLowerCase(), action, details ?? null]
    );
  } catch {
    // Silent — audit log failure should not block operations
  }
}

async function ensureUserExists(wallet: string): Promise<void> {
  await query(
    `INSERT INTO user_kyc (wallet_address) VALUES ($1)
     ON CONFLICT (wallet_address) DO NOTHING`,
    [wallet.toLowerCase()]
  );
}

async function getKycStatus(wallet: string) {
  const rows = await query<{
    tier: number;
    cumulative_volume: string;
    kyc_status: string;
    is_frozen: boolean;
    freeze_reason: string | null;
  }>(
    'SELECT tier, cumulative_volume, kyc_status, is_frozen, freeze_reason FROM user_kyc WHERE wallet_address = $1',
    [wallet.toLowerCase()]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    tier: row.tier,
    cumulativeVolume: parseFloat(row.cumulative_volume),
    status: row.kyc_status,
    isFrozen: row.is_frozen,
    freezeReason: row.freeze_reason,
    tier1Remaining: Math.max(0, TIER1_LIMIT - parseFloat(row.cumulative_volume)),
    needsTier2: parseFloat(row.cumulative_volume) >= TIER1_LIMIT && row.tier < 2,
    needsTier3: parseFloat(row.cumulative_volume) >= TIER3_LIMIT && row.tier < 3,
  };
}

async function initDiditSession(wallet: string): Promise<{ sessionUrl: string; sessionId: string }> {
  const clientId = process.env.DIDIT_CLIENT_ID;
  const clientSecret = process.env.DIDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Didit credentials not configured');
  }

  // Get Didit access token
  const tokenRes = await fetch('https://apx.didit.me/auth/v2/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) throw new Error('Failed to get Didit token');
  const tokenData = await tokenRes.json() as { access_token: string };

  // Create verification session
  const sessionRes = await fetch('https://apx.didit.me/v2/session/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      callback: `${process.env.VITE_API_BASE_URL}/api/kyc?action=webhook`,
      features: 'OCR + FACE',
      vendor_data: wallet.toLowerCase(),
    }),
  });

  if (!sessionRes.ok) throw new Error('Failed to create Didit session');
  const sessionData = await sessionRes.json() as { session_id: string; url: string };

  // Save session ID to DB
  await query(
    `UPDATE user_kyc SET didit_session_id = $1, kyc_status = 'tier2_pending', updated_at = NOW()
     WHERE wallet_address = $2`,
    [sessionData.session_id, wallet.toLowerCase()]
  );

  await logAudit(wallet, 'DIDIT_SESSION_CREATED', sessionData.session_id);

  return { sessionUrl: sessionData.url, sessionId: sessionData.session_id };
}

async function handleDiditWebhook(req: VercelRequest): Promise<{ success: boolean }> {
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;

  // Verify webhook signature
  const signature = req.headers['x-didit-signature'] as string;
  if (webhookSecret && signature) {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expected) {
      throw new Error('Invalid webhook signature');
    }
  }

  const payload = req.body as {
    session_id: string;
    status: string;
    vendor_data: string;
    decision: {
      kyc: { status: string };
    };
    kyc: {
      data: {
        date_of_birth: string;
        nationality: string;
        first_name: string;
        last_name: string;
        document_type: string;
      };
    };
  };

  const wallet = payload.vendor_data?.toLowerCase();
  if (!wallet) return { success: false };

  const isVerified = payload.decision?.kyc?.status === 'Approved';

  if (isVerified && payload.kyc?.data) {
    const personalData = {
      fullName: `${payload.kyc.data.first_name} ${payload.kyc.data.last_name}`.trim(),
      dateOfBirth: payload.kyc.data.date_of_birth,
      nationality: payload.kyc.data.nationality,
      documentType: payload.kyc.data.document_type,
    };

    const { encrypted, iv, authTag } = encryptData(personalData);

    await query(
      `INSERT INTO kyc_data (wallet_address, encrypted_data, iv, auth_tag, data_type)
       VALUES ($1, $2, $3, $4, 'tier2_personal')
       ON CONFLICT DO NOTHING`,
      [wallet, encrypted, iv, authTag]
    );

    await query(
      `UPDATE user_kyc
       SET tier = 2, kyc_status = 'tier2_verified', didit_verified_at = NOW(), updated_at = NOW()
       WHERE wallet_address = $1`,
      [wallet]
    );

    await logAudit(wallet, 'TIER2_VERIFIED', 'Didit verification successful');
  } else {
    await query(
      `UPDATE user_kyc SET kyc_status = 'tier2_failed', updated_at = NOW() WHERE wallet_address = $1`,
      [wallet]
    );
    await logAudit(wallet, 'TIER2_FAILED', payload.decision?.kyc?.status ?? 'Unknown');
  }

  return { success: true };
}

async function screenWithWalletScreener(wallet: string): Promise<{ passed: boolean; score: number; details: string }> {
  const apiKey = process.env.WALLETSCREENER_API_KEY;
  if (!apiKey) throw new Error('WalletScreener API key not configured');

  const res = await fetch(`https://api.walletscreener.io/v1/screen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      address: wallet,
      chain: 'polygon',
    }),
  });

  if (!res.ok) throw new Error(`WalletScreener API error: ${res.status}`);

  const data = await res.json() as {
    risk_score: number;
    risk_level: string;
    flags: string[];
    sanctioned: boolean;
    is_mixer: boolean;
    is_darknet: boolean;
  };

  const score = data.risk_score ?? 0;
  const flags: string[] = data.flags ?? [];

  if (data.sanctioned) flags.push('SANCTIONED');
  if (data.is_mixer) flags.push('MIXER');
  if (data.is_darknet) flags.push('DARKNET');

  const details = flags.length > 0 ? flags.join(', ') : 'CLEAN';
  const passed = score < 70 && !data.sanctioned && !data.is_darknet;

  await query(
    `UPDATE user_kyc
     SET misttrack_score = $1, misttrack_screened_at = NOW(), updated_at = NOW()
     WHERE wallet_address = $2`,
    [score, wallet.toLowerCase()]
  );

  if (passed) {
    await query(
      `UPDATE user_kyc SET tier = 3, kyc_status = 'tier3_passed', updated_at = NOW() WHERE wallet_address = $1`,
      [wallet.toLowerCase()]
    );
    await logAudit(wallet, 'TIER3_PASSED', `Score: ${score}`);
  } else {
    await query(
      `UPDATE user_kyc
       SET kyc_status = 'tier3_failed', is_frozen = TRUE, freeze_reason = $1, updated_at = NOW()
       WHERE wallet_address = $2`,
      [`AML flags: ${details}`, wallet.toLowerCase()]
    );
    await logAudit(wallet, 'TIER3_FAILED', `Score: ${score}, Flags: ${details}`);
  }

  const encData = encryptData({ score, riskLevel: data.risk_level, flags, screenedAt: new Date().toISOString() });
  await query(
    `INSERT INTO kyc_data (wallet_address, encrypted_data, iv, auth_tag, data_type)
     VALUES ($1, $2, $3, $4, 'tier3_aml')`,
    [wallet.toLowerCase(), encData.encrypted, encData.iv, encData.authTag]
  );

  return { passed, score, details };
}

async function updateVolume(wallet: string, betAmount: number): Promise<{
  newVolume: number;
  needsTier2: boolean;
  needsTier3: boolean;
  frozen: boolean;
}> {
  await ensureUserExists(wallet);

  const rows = await query<{
    cumulative_volume: string;
    tier: number;
    is_frozen: boolean;
    kyc_status: string;
  }>(
    'SELECT cumulative_volume, tier, is_frozen, kyc_status FROM user_kyc WHERE wallet_address = $1',
    [wallet.toLowerCase()]
  );

  const current = rows[0];
  if (current?.is_frozen) {
    return { newVolume: parseFloat(current.cumulative_volume), needsTier2: false, needsTier3: false, frozen: true };
  }

  const newVolume = parseFloat(current?.cumulative_volume ?? '0') + betAmount;

  await query(
    'UPDATE user_kyc SET cumulative_volume = $1, updated_at = NOW() WHERE wallet_address = $2',
    [newVolume.toFixed(6), wallet.toLowerCase()]
  );

  const tier = current?.tier ?? 1;
  const needsTier2 = newVolume >= TIER1_LIMIT && tier < 2;
  const needsTier3 = newVolume >= TIER3_LIMIT && tier < 3;

  if (needsTier2) {
    await query(
      `UPDATE user_kyc SET kyc_status = 'tier1_limit_reached', is_frozen = TRUE,
       freeze_reason = 'Tier 1 volume limit reached. KYC required.', updated_at = NOW()
       WHERE wallet_address = $1 AND tier < 2`,
      [wallet.toLowerCase()]
    );
    await logAudit(wallet, 'TIER1_LIMIT_REACHED', `Volume: ${newVolume}`);
  }

  if (needsTier3 && tier >= 2) {
    await logAudit(wallet, 'TIER3_TRIGGERED', `Volume: ${newVolume}`);
  }

  return { newVolume, needsTier2, needsTier3: needsTier3 && tier >= 2, frozen: false };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { action } = req.query as { action?: string };

  try {
    // GET /api/kyc?wallet=0x... — check status
    if (req.method === 'GET') {
      const { wallet } = req.query as { wallet?: string };
      if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address required' });
        return;
      }
      await ensureUserExists(wallet);
      const status = await getKycStatus(wallet);
      res.status(200).json(status);
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // POST /api/kyc?action=initiate — start Didit session
    if (action === 'initiate') {
      const { wallet } = req.body as { wallet?: string };
      if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address required' });
        return;
      }
      await ensureUserExists(wallet);
      const { sessionUrl, sessionId } = await initDiditSession(wallet);
      res.status(200).json({ sessionUrl, sessionId });
      return;
    }

    // POST /api/kyc?action=webhook — Didit webhook
    if (action === 'webhook') {
      const result = await handleDiditWebhook(req);
      res.status(200).json(result);
      return;
    }

    // POST /api/kyc?action=screen — WalletScreener AML screening
    if (action === 'screen') {
      const { wallet } = req.body as { wallet?: string };
      if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address required' });
        return;
      }
      const result = await screenWithWalletScreener(wallet);
      res.status(200).json(result);
      return;
    }

    // POST /api/kyc?action=volume — update cumulative volume
    if (action === 'volume') {
      const { wallet, amount } = req.body as { wallet?: string; amount?: number };
      if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
        res.status(400).json({ error: 'Valid wallet address required' });
        return;
      }
      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Valid amount required' });
        return;
      }
      const result = await updateVolume(wallet, amount);
      res.status(200).json(result);
      return;
    }
    
    // POST /api/kyc?action=record_trade — record a platform trade
    if (action === 'record_trade') {
      const { wallet, amount, marketId, outcome } = req.body as {
        wallet?: string;
        amount?: number;
        marketId?: string;
        outcome?: string;
      };
      if (!wallet || !amount || amount <= 0) {
        res.status(400).json({ error: 'wallet and amount required' });
        return;
      }
      try {
        await query(
          'INSERT INTO platform_trades (wallet_address, amount, market_id, outcome) VALUES ($1, $2, $3, $4)',
          [wallet.toLowerCase(), amount, marketId ?? null, outcome ?? null]
        );
        const volumeResult = await updateVolume(wallet, amount);
        res.status(200).json({ recorded: true, ...volumeResult });
      } catch {
        res.status(500).json({ error: 'Failed to record trade' });
      }
      return;
    }
    // POST /api/kyc?action=email_subscribe
    if (action === 'email_subscribe') {
      const { wallet: w, email, marketId: mid } = req.body as {
        wallet?: string;
        email?: string;
        marketId?: string | null;
      };
      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Valid email required' });
        return;
      }
      try {
        const encEmail = encryptData({ email: email.toLowerCase().trim() });
        await query(
          `INSERT INTO email_subscriptions (wallet_address, email_encrypted, email_iv, email_auth_tag, market_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            (w ?? 'anonymous').toLowerCase(),
            encEmail.encrypted,
            encEmail.iv,
            encEmail.authTag,
            mid ?? null,
          ]
        );
        res.status(200).json({ subscribed: true });
      } catch {
        res.status(500).json({ error: 'Failed to save subscription' });
      }
      return;
    }
    res.status(400).json({ error: 'Unknown action' });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
}