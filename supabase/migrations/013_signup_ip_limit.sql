-- Track IP addresses used for signups to prevent free trial abuse
CREATE TABLE IF NOT EXISTS public.signup_ips (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip         text        NOT NULL,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signup_ips_lookup ON public.signup_ips (ip, created_at);

-- Only service role can access — no public RLS policies
ALTER TABLE public.signup_ips ENABLE ROW LEVEL SECURITY;
