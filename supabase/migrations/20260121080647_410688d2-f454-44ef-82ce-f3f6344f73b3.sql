-- Table to track pending organization credit top-up requests
CREATE TABLE public.organization_topup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount >= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', '2c2p')),
  payment_reference TEXT,
  stripe_session_id TEXT,
  created_by UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_topup_requests ENABLE ROW LEVEL SECURITY;

-- Org members can view their organization's top-up requests
CREATE POLICY "Org members can view topup requests"
  ON public.organization_topup_requests
  FOR SELECT
  USING (is_org_member(organization_id));

-- Only authenticated users can create requests for their org
CREATE POLICY "Org admins can create topup requests"
  ON public.organization_topup_requests
  FOR INSERT
  WITH CHECK (is_org_admin(organization_id));

-- Indexes
CREATE INDEX idx_org_topup_requests_org_id ON public.organization_topup_requests(organization_id);
CREATE INDEX idx_org_topup_requests_stripe_session ON public.organization_topup_requests(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_org_topup_requests_status ON public.organization_topup_requests(status);