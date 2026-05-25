-- ─── Token balance system ───────────────────────────────────────────────────
-- Replaces the count-based quota (free_analyse_used / free_chat_used)
-- with real Anthropic token tracking per user.

-- Add token columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS token_balance       BIGINT NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS token_monthly_limit BIGINT NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS token_reset_at      TIMESTAMPTZ;

-- Seed correct values for existing users based on their plan
UPDATE profiles SET
  token_balance = CASE plan
    WHEN 'starter' THEN 1000000
    WHEN 'pro'     THEN 3000000
    WHEN 'expert'  THEN 8000000
    WHEN 'premium' THEN 50000000
    WHEN 'elite'   THEN 50000000
    WHEN 'admin'   THEN 999999999
    ELSE 5000
  END,
  token_monthly_limit = CASE plan
    WHEN 'starter' THEN 1000000
    WHEN 'pro'     THEN 3000000
    WHEN 'expert'  THEN 8000000
    WHEN 'premium' THEN 50000000
    WHEN 'elite'   THEN 50000000
    WHEN 'admin'   THEN 999999999
    ELSE 5000
  END;

-- ─── Atomic token deduction ─────────────────────────────────────────────────
-- SECURITY DEFINER: called from API routes, bypasses RLS safely.
CREATE OR REPLACE FUNCTION deduct_tokens(p_user_id UUID, p_amount BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE profiles
  SET token_balance = GREATEST(0, token_balance - p_amount),
      updated_at    = NOW()
  WHERE id = p_user_id
  RETURNING token_balance INTO new_balance;
  RETURN COALESCE(new_balance, 0);
END;
$$;

-- Only authenticated users (via service role) should call this
REVOKE ALL ON FUNCTION deduct_tokens(UUID, BIGINT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION deduct_tokens(UUID, BIGINT) TO service_role;

-- ─── Realtime: broadcast profile updates (token_balance) ────────────────────
ALTER TABLE profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
END $$;
