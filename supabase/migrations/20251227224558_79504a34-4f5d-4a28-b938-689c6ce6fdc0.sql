-- Email verification codes for guests claiming an existing contact email
CREATE TABLE IF NOT EXISTS public.chat_email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_token text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS chat_email_verifications_email_session_idx
  ON public.chat_email_verifications (email, session_token, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_email_verifications_unverified_idx
  ON public.chat_email_verifications (email, session_token, verified_at, expires_at);

-- Enable RLS (no public policies; edge function uses service role)
ALTER TABLE public.chat_email_verifications ENABLE ROW LEVEL SECURITY;