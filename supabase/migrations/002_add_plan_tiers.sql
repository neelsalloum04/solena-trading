-- ══════════════════════════════════════════════════════════════════
-- PrimeX — Migration 002 : Plan tiers (free / starter / pro / premium / elite / admin)
-- À exécuter sur une base existante (ALTER uniquement, aucun CREATE TABLE)
-- ══════════════════════════════════════════════════════════════════

-- 1. Contrainte plan sur profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'premium', 'elite', 'admin'));
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';

-- 2. Contrainte plan sur subscriptions
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'premium', 'elite', 'admin'));
ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'free';

-- 3. Colonne updated_at sur profiles (si absente)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. Fonction handle_new_user → plan 'free' par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, plan)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Policy service_role sur profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Service role can manage profiles'
  ) THEN
    EXECUTE '
      CREATE POLICY "Service role can manage profiles"
        ON public.profiles FOR ALL TO service_role
        USING (true) WITH CHECK (true)
    ';
  END IF;
END;
$$;

-- 6. Policy service_role sur subscriptions (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'subscriptions'
      AND policyname = 'Service role can manage subscriptions'
  ) THEN
    EXECUTE '
      CREATE POLICY "Service role can manage subscriptions"
        ON public.subscriptions FOR ALL TO service_role
        USING (true) WITH CHECK (true)
    ';
  END IF;
END;
$$;
