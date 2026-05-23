-- ══════════════════════════════════════════════════════════════════
-- PrimeX — Migration 003 : Système d'essai gratuit
-- ══════════════════════════════════════════════════════════════════

-- 1. Compteurs d'essai gratuit sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_analyse_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_chat_used    integer NOT NULL DEFAULT 0;

-- 2. Table de configuration admin (quotas ajustables sans modifier le code)
CREATE TABLE IF NOT EXISTS public.app_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Service role gère tout
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_config' AND policyname = 'Service role manages app_config'
  ) THEN
    EXECUTE '
      CREATE POLICY "Service role manages app_config"
        ON public.app_config FOR ALL TO service_role
        USING (true) WITH CHECK (true)
    ';
  END IF;
END;
$$;

-- Utilisateurs authentifiés peuvent lire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'app_config' AND policyname = 'Authenticated can read app_config'
  ) THEN
    EXECUTE '
      CREATE POLICY "Authenticated can read app_config"
        ON public.app_config FOR SELECT TO authenticated
        USING (true)
    ';
  END IF;
END;
$$;

-- 3. Valeurs par défaut des quotas d'essai
INSERT INTO public.app_config (key, value, description)
VALUES (
  'free_trial',
  '{"analyse_limit": 3, "chat_limit": 3}',
  'Quotas d''essai gratuit pour les nouveaux utilisateurs (modifiable sans code)'
)
ON CONFLICT (key) DO NOTHING;
