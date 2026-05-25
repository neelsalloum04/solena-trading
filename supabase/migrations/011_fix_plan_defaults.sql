-- ─── Migration 011 : corriger les plans par défaut ───────────────────────────
-- 1. Ajouter 'expert' dans la contrainte plan (manquant en 002)
-- 2. Rétrograder les users 'starter' sans abonnement actif → 'free'
-- 3. Corriger leurs tokens si la colonne existe déjà (migration 010 appliquée)

-- 1. Mise à jour des contraintes CHECK (profiles + subscriptions)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'expert', 'premium', 'elite', 'admin'));

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'expert', 'premium', 'elite', 'admin'));

-- 2. Rétrograder les comptes sans abonnement actif vers 'free'
UPDATE public.profiles p
SET plan = 'free', updated_at = NOW()
WHERE p.plan IN ('starter', 'pro', 'expert', 'premium')
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = p.id AND s.status = 'active'
  );

-- 3. Corriger les tokens pour les users maintenant sur free
--    (seulement si la colonne token_balance existe — migration 010 appliquée)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'token_balance'
  ) THEN
    UPDATE public.profiles SET
      token_balance       = 5000,
      token_monthly_limit = 5000,
      token_reset_at      = NULL,
      updated_at          = NOW()
    WHERE plan = 'free'
      AND token_monthly_limit > 5000;
  END IF;
END $$;
