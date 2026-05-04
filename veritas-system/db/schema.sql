-- Veritas Database Schema
-- Run once against your PostgreSQL instance

CREATE TABLE IF NOT EXISTS scheduled_markets (
  id              SERIAL PRIMARY KEY,
  question        TEXT        NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  publish_time    TIMESTAMPTZ NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pending',
  -- possible statuses: pending | published | failed
  azuro_market_id TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_markets_status
  ON scheduled_markets (status);

CREATE INDEX IF NOT EXISTS idx_scheduled_markets_publish_time
  ON scheduled_markets (publish_time);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id              SERIAL PRIMARY KEY,
  code            TEXT        NOT NULL UNIQUE,
  referrer_wallet TEXT        NOT NULL,
  referred_wallet TEXT,
  registered_at   TIMESTAMPTZ,
  first_trade_at  TIMESTAMPTZ,
  reward_amount   NUMERIC(18, 6) DEFAULT 0,
  reward_claimed  BOOLEAN     NOT NULL DEFAULT FALSE,
  claimed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON referrals (code);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_wallet
  ON referrals (referrer_wallet);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_settings (
  key             TEXT        NOT NULL PRIMARY KEY,
  value           TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default placeholders (update via admin panel or directly in DB)
INSERT INTO admin_settings (key, value)
VALUES
  ('fee_wallet_address', ''),
  ('referral_reward_usdc', '1.00')
ON CONFLICT (key) DO NOTHING;
