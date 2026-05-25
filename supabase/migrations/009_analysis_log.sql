-- ─── Migration 009: Analysis log + signal status tracking ────────────────────

-- ─── Table analysis_log ───────────────────────────────────────────────────────
-- Enregistre TOUTES les analyses, même celles qui ne génèrent pas de signal.
-- Conserve les 500 dernières lignes via trigger.

CREATE TABLE IF NOT EXISTS public.analysis_log (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now() NOT NULL,
  asset        text NOT NULL,
  asset_name   text NOT NULL,
  category     text NOT NULL,
  timeframe    text NOT NULL,
  status       text NOT NULL CHECK (status IN ('NEUTRE', 'SIGNAL')),
  score        smallint,
  signal_label text,
  rsi          numeric(6, 2),
  ema_trend    text,
  reason       text NOT NULL
);

CREATE INDEX idx_analysis_log_created_at ON public.analysis_log (created_at DESC);

ALTER TABLE public.analysis_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_log_authenticated_read"
  ON public.analysis_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "analysis_log_anon_read"
  ON public.analysis_log FOR SELECT TO anon USING (true);

CREATE POLICY "analysis_log_service_role_all"
  ON public.analysis_log FOR ALL TO service_role USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_log;

-- Trim automatique : garde les 500 dernières lignes
CREATE OR REPLACE FUNCTION trim_analysis_log()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.analysis_log
  WHERE id NOT IN (
    SELECT id FROM public.analysis_log
    ORDER BY created_at DESC
    LIMIT 500
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trim_analysis_log_trigger
  AFTER INSERT ON public.analysis_log
  FOR EACH ROW EXECUTE FUNCTION trim_analysis_log();

-- ─── Suivi statut sur la table signals ────────────────────────────────────────

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS sig_status text DEFAULT 'active'
    CHECK (sig_status IN ('active', 'tp1_hit', 'tp2_hit', 'tp3_hit', 'sl_hit', 'expired')),
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_signals_sig_status
  ON public.signals (sig_status, created_at DESC);
