-- Migration 014: Update free trial tokens from 5 000 to 50 000

-- Update handle_new_user trigger to grant 50 000 tokens to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_tokens BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.free_trial_emails WHERE email = LOWER(NEW.email)
  ) THEN
    trial_tokens := 0;
  ELSE
    trial_tokens := 50000;
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
