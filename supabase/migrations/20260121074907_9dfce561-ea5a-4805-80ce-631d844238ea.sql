-- Create organization credit transactions table
CREATE TABLE public.organization_credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'purchase', 'refund', 'adjustment')),
  description TEXT,
  reference_id UUID,
  performed_by UUID,
  balance_after NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organization members can view their own org transactions
CREATE POLICY "Organization members can view credit transactions"
ON public.organization_credit_transactions
FOR SELECT
USING (organization_id IN (SELECT get_user_org_ids()));

-- Only service role can insert (via edge function)
-- No insert policy for regular users - edge function uses service role

-- Create index for faster lookups
CREATE INDEX idx_org_credit_transactions_org_id ON public.organization_credit_transactions(organization_id);
CREATE INDEX idx_org_credit_transactions_created_at ON public.organization_credit_transactions(created_at DESC);
CREATE INDEX idx_org_credit_transactions_type ON public.organization_credit_transactions(type);