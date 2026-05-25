-- Migration 012: Anti-double free trial
-- Tracks emails that have already used the free trial.
-- Re-registering with the same email gets 0 tokens instead of 5000.

CREATE TABLE IF NOT EXISTS public.free_trial_emails (
  email        TEXT PRIMARY KEY,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill: mark all existing profiles as having used the trial
INSERT INTO public.free_trial_emails (email)
SELECT LOWER(email) FROM public.profiles WHERE email IS NOT NULL
ON CONFLICT DO NOTHING;

-- Updated handle_new_user: checks free_trial_emails before granting tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_tokens BIGINT;
BEGIN
  -- Default: grant trial tokens only if email has never been used before
  IF EXISTS (
    SELECT 1 FROM public.free_trial_emails WHERE email = LOWER(NEW.email)
  ) THEN
    trial_tokens := 0;
  ELSE
    trial_tokens := 5000;
    INSERT INTO public.free_trial_emails (email)
    VALUES (LOWER(NEW.email))
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    plan,
    token_balance,
    token_monthly_limit
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'free',
    trial_tokens,
    trial_tokens
  );

  RETURN NEW;
END;
$$;
