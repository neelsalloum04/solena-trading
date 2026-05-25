-- ─── Migration 008: Signals v2 — composite scoring engine ────────────────────
-- Replaces 007 (never applied). Full schema with all 13 indicators,
-- composite score, entry/SL/TP levels, and AI analysis text.

DROP TABLE IF EXISTS public.signals;

CREATE TABLE public.signals (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,

  -- Asset identification
  asset        text NOT NULL,
  asset_name   text NOT NULL,
  category     text NOT NULL CHECK (category IN ('crypto', 'forex', 'stocks', 'indices', 'metals')),
  timeframe    text NOT NULL CHECK (timeframe IN ('15m', '1h', '4h', '1d')),

  -- Composite signal
  signal_label text NOT NULL CHECK (signal_label IN ('ACHAT FORT', 'ACHAT', 'NEUTRE', 'VENTE', 'VENTE FORTE')),
  direction    text NOT NULL CHECK (direction IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  score        smallint NOT NULL CHECK (score BETWEEN -100 AND 100),
  strength     smallint NOT NULL CHECK (strength BETWEEN 0 AND 100),

  -- Price
  price        numeric(20, 8),

  -- Indicators
  rsi          numeric(6, 2),
  macd_hist    numeric(20, 8),
  ema20        numeric(20, 8),
  ema50        numeric(20, 8),
  ema200       numeric(20, 8),
  bb_upper     numeric(20, 8),
  bb_lower     numeric(20, 8),
  bb_mid       numeric(20, 8),
  stoch_k      numeric(6, 2),
  stoch_d      numeric(6, 2),
  atr          numeric(20, 8),
  vwap         numeric(20, 8),
  volume_ratio numeric(8, 4),

  -- Entry / SL / TP
  entry_low    numeric(20, 8),
  entry_high   numeric(20, 8),
  stop_loss    numeric(20, 8),
  tp1          numeric(20, 8),
  tp2          numeric(20, 8),
  tp3          numeric(20, 8),
  risk_reward  numeric(6, 2),

  -- AI interpretation (Claude Haiku, 2 sentences)
  ai_analysis  text,

  -- Extra details (swing levels, raw MACD line, etc.)
  details      jsonb DEFAULT '{}'::jsonb
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_signals_created_at  ON public.signals (created_at DESC);
CREATE INDEX idx_signals_dedup       ON public.signals (asset, timeframe, signal_label, created_at DESC);
CREATE INDEX idx_signals_category    ON public.signals (category, created_at DESC);
CREATE INDEX idx_signals_direction   ON public.signals (direction, created_at DESC);
CREATE INDEX idx_signals_score       ON public.signals (score DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signals_authenticated_read"
  ON public.signals FOR SELECT TO authenticated USING (true);

CREATE POLICY "signals_anon_read"
  ON public.signals FOR SELECT TO anon USING (true);

CREATE POLICY "signals_service_role_all"
  ON public.signals FOR ALL TO service_role USING (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
