-- Migration 002: Add free + premium + admin plan tiers
-- Run this in the Supabase SQL Editor

-- ─── 1. Update profiles plan constraint ──────────────────────────────────────

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'premium', 'elite', 'admin'));

-- Change default from 'starter' to 'free' (new users start on free plan)
ALTER TABLE public.profiles
  ALTER COLUMN plan SET DEFAULT 'free';

-- ─── 2. Update subscriptions plan constraint ─────────────────────────────────

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'premium', 'elite', 'admin'));

ALTER TABLE public.subscriptions
  ALTER COLUMN plan SET DEFAULT 'free';

-- ─── 3. Update handle_new_user to assign free plan ───────────────────────────

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

-- ─── 4. Add updated_at to profiles if missing ────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ─── 5. Add admin policy for profiles ────────────────────────────────────────

-- Allow service role to update any profile (for webhooks)
CREATE POLICY IF NOT EXISTS "Service role can manage profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 6. Existing users: keep their current plan, update only if 'starter' with no active sub ──

-- Note: Do NOT run this automatically — review before executing
-- UPDATE public.profiles SET plan = 'free'
-- WHERE plan = 'starter'
--   AND id NOT IN (
--     SELECT user_id FROM public.subscriptions WHERE status = 'active'
--   );

-- ─── Summary ─────────────────────────────────────────────────────────────────
-- Plan hierarchy: free < starter < pro < premium (= elite) < admin
-- New users → free
-- After Stripe checkout → starter / pro / premium
-- After cancellation → free (was: starter)
-- 'elite' is kept as valid for backward compatibility, normalized to 'premium' in app
