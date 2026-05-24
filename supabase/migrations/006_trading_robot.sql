-- ─── 006 : Robot de trading automatique ──────────────────────────────────────

-- Clés API Bybit chiffrées (AES-256-GCM côté serveur)
CREATE TABLE IF NOT EXISTS bybit_credentials (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  api_key_enc     TEXT NOT NULL,          -- chiffré
  api_secret_enc  TEXT NOT NULL,          -- chiffré
  api_key_preview VARCHAR(20) NOT NULL,   -- 8 premiers chars, affichage only
  is_valid        BOOLEAN DEFAULT false,
  permissions     JSONB DEFAULT '{}',
  validated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Session robot (1 par utilisateur)
CREATE TABLE IF NOT EXISTS bot_sessions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_active           BOOLEAN DEFAULT false,
  mode                VARCHAR(10) DEFAULT 'paper' CHECK (mode IN ('paper','live')),
  started_at          TIMESTAMPTZ,
  stopped_at          TIMESTAMPTZ,
  last_tick_at        TIMESTAMPTZ,
  consecutive_losses  INTEGER DEFAULT 0,
  suspended_until     TIMESTAMPTZ,
  daily_pnl           DECIMAL(12,4) DEFAULT 0,
  weekly_pnl          DECIMAL(12,4) DEFAULT 0,
  monthly_pnl         DECIMAL(12,4) DEFAULT 0,
  total_pnl           DECIMAL(12,4) DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Paramètres de risque (1 par utilisateur)
CREATE TABLE IF NOT EXISTS risk_settings (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_risk_pct            DECIMAL(5,2) DEFAULT 1.0,
  max_daily_loss_pct      DECIMAL(5,2) DEFAULT 5.0,
  max_weekly_loss_pct     DECIMAL(5,2) DEFAULT 10.0,
  max_consecutive_losses  INTEGER DEFAULT 3,
  suspension_hours        INTEGER DEFAULT 2,
  max_positions           INTEGER DEFAULT 1,
  min_confidence          INTEGER DEFAULT 75,
  leverage                INTEGER DEFAULT 5,
  paper_balance           DECIMAL(12,2) DEFAULT 10000,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Compte paper trading (solde virtuel)
CREATE TABLE IF NOT EXISTS paper_accounts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance         DECIMAL(12,2) DEFAULT 10000,
  initial_balance DECIMAL(12,2) DEFAULT 10000,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Positions ouvertes
CREATE TABLE IF NOT EXISTS positions (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bybit_order_id        VARCHAR(100),
  mode                  VARCHAR(10) NOT NULL CHECK (mode IN ('paper','live')),
  symbol                VARCHAR(20) DEFAULT 'BTCUSDT',
  side                  VARCHAR(5)  NOT NULL CHECK (side IN ('LONG','SHORT')),
  entry_price           DECIMAL(12,2) NOT NULL,
  quantity              DECIMAL(18,8) NOT NULL,
  usdt_size             DECIMAL(12,2) NOT NULL,
  stop_loss             DECIMAL(12,2) NOT NULL,
  tp1                   DECIMAL(12,2) NOT NULL,
  tp2                   DECIMAL(12,2) NOT NULL,
  tp3                   DECIMAL(12,2) NOT NULL,
  tp1_hit               BOOLEAN DEFAULT false,
  tp2_hit               BOOLEAN DEFAULT false,
  sl_at_breakeven       BOOLEAN DEFAULT false,
  trailing_active       BOOLEAN DEFAULT false,
  trailing_price        DECIMAL(12,2),
  score                 INTEGER,
  opened_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Trades clôturés
CREATE TABLE IF NOT EXISTS trades (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id      UUID REFERENCES positions(id),
  mode             VARCHAR(10) NOT NULL CHECK (mode IN ('paper','live')),
  symbol           VARCHAR(20) DEFAULT 'BTCUSDT',
  side             VARCHAR(5)  NOT NULL CHECK (side IN ('LONG','SHORT')),
  entry_price      DECIMAL(12,2) NOT NULL,
  close_price      DECIMAL(12,2) NOT NULL,
  quantity         DECIMAL(18,8) NOT NULL,
  usdt_size        DECIMAL(12,2) NOT NULL,
  pnl              DECIMAL(12,4) NOT NULL,
  pnl_pct          DECIMAL(8,4)  NOT NULL,
  close_reason     VARCHAR(20)   NOT NULL,
  score            INTEGER,
  duration_minutes INTEGER,
  closed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Logs du robot
CREATE TABLE IF NOT EXISTS bot_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  level      VARCHAR(10) DEFAULT 'info' CHECK (level IN ('info','warn','error','signal','trade')),
  message    TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user     ON trades(user_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_logs_user   ON bot_logs(user_id, created_at DESC);

-- RLS
ALTER TABLE bybit_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_logs           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_credentials" ON bybit_credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sessions"    ON bot_sessions       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_risk"        ON risk_settings      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_paper"       ON paper_accounts     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_positions"   ON positions          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_trades"      ON trades             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_logs"        ON bot_logs           FOR ALL USING (auth.uid() = user_id);
