-- Create post_payment_verifications table
CREATE TABLE public.post_payment_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (service role only - no public policies)
ALTER TABLE public.post_payment_verifications ENABLE ROW LEVEL SECURITY;

-- Add email_verified column to orders (default true for backward compatibility)
ALTER TABLE public.orders ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT true;

-- Index for lookups
CREATE INDEX idx_post_payment_verifications_user_email 
  ON public.post_payment_verifications (user_id, email, verified_at);
CREATE INDEX idx_orders_email_verified 
  ON public.orders (email_verified) WHERE email_verified = false;