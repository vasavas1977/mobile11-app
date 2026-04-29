-- Add promotional_emails column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS promotional_emails boolean DEFAULT true;

-- Create voucher_codes table for voucher redemption
CREATE TABLE IF NOT EXISTS public.voucher_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  voucher_type TEXT NOT NULL DEFAULT 'mobile11_money', -- 'mobile11_money' or 'esim'
  value_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  package_id UUID REFERENCES public.esim_packages(id), -- for esim vouchers
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.voucher_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voucher_codes
CREATE POLICY "Admins can manage voucher codes"
ON public.voucher_codes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their redeemed vouchers"
ON public.voucher_codes FOR SELECT
USING (used_by = auth.uid());

-- Service role can update vouchers (for redemption via edge function)
CREATE POLICY "Service can update vouchers"
ON public.voucher_codes FOR UPDATE
USING (true)
WITH CHECK (true);