-- Phase 1: Affiliate Marketing System Database Schema

-- 1. Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';

-- 2. Create affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  affiliate_code text NOT NULL UNIQUE,
  affiliate_type text NOT NULL DEFAULT 'affiliate' CHECK (affiliate_type IN ('partner_manager', 'affiliate')),
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate numeric NOT NULL DEFAULT 10.00,
  override_rate numeric DEFAULT 2.00,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  company_name text,
  website_url text,
  payment_method text DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'paypal', 'crypto', 'other')),
  payment_details jsonb DEFAULT '{}',
  total_clicks integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  pending_earnings numeric DEFAULT 0,
  paid_earnings numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id)
);

-- 3. Create affiliate_links table
CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  link_code text NOT NULL UNIQUE,
  campaign_name text,
  destination_url text NOT NULL DEFAULT '/',
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create affiliate_clicks table
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  session_id text,
  ip_address text,
  user_agent text,
  referrer text,
  country text,
  device_type text,
  clicked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Create affiliate_conversions table
CREATE TABLE public.affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_amount numeric NOT NULL,
  commission_type text NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  override_affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  override_rate numeric,
  override_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  rejection_reason text,
  converted_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  paid_at timestamp with time zone,
  payout_id uuid
);

-- 6. Create affiliate_payouts table
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payout_method text NOT NULL,
  payment_details jsonb DEFAULT '{}',
  reference_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  notes text,
  admin_notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Add affiliate_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_session_id text;

-- 8. Create indexes for performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_parent_id ON public.affiliates(parent_affiliate_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliate_links_affiliate_id ON public.affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_code ON public.affiliate_links(link_code);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_session ON public.affiliate_clicks(session_id);
CREATE INDEX idx_affiliate_clicks_date ON public.affiliate_clicks(clicked_at);
CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_conversions_order_id ON public.affiliate_conversions(order_id);
CREATE INDEX idx_affiliate_conversions_status ON public.affiliate_conversions(status);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON public.affiliate_payouts(status);
CREATE INDEX idx_orders_affiliate_id ON public.orders(affiliate_id);

-- 9. Create helper functions for RLS

-- Function to get affiliate_id for a user
CREATE OR REPLACE FUNCTION public.get_affiliate_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.affiliates WHERE user_id = _user_id AND status = 'active' LIMIT 1
$$;

-- Function to check if user is an active affiliate
CREATE OR REPLACE FUNCTION public.is_affiliate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE user_id = _user_id AND status = 'active'
  )
$$;

-- Function to check if user is a partner manager
CREATE OR REPLACE FUNCTION public.is_partner_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE user_id = _user_id 
    AND affiliate_type = 'partner_manager' 
    AND status = 'active'
  )
$$;

-- Function to check if affiliate is a sub-affiliate of user's affiliate
CREATE OR REPLACE FUNCTION public.is_sub_affiliate(_user_id uuid, _affiliate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates a
    WHERE a.id = _affiliate_id
    AND a.parent_affiliate_id = (SELECT id FROM public.affiliates WHERE user_id = _user_id LIMIT 1)
  )
$$;

-- 10. Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for affiliates table

-- Admins can do everything
CREATE POLICY "Admins can manage all affiliates"
ON public.affiliates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own affiliate record
CREATE POLICY "Users can view own affiliate"
ON public.affiliates FOR SELECT
USING (auth.uid() = user_id);

-- Partner managers can view their sub-affiliates
CREATE POLICY "Partner managers can view sub-affiliates"
ON public.affiliates FOR SELECT
USING (parent_affiliate_id = public.get_affiliate_id(auth.uid()));

-- Users can insert their own affiliate application
CREATE POLICY "Users can apply as affiliate"
ON public.affiliates FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update limited fields on their own record
CREATE POLICY "Users can update own affiliate profile"
ON public.affiliates FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 12. RLS Policies for affiliate_links table

-- Admins can do everything
CREATE POLICY "Admins can manage all links"
ON public.affiliate_links FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates can manage their own links
CREATE POLICY "Affiliates can manage own links"
ON public.affiliate_links FOR ALL
USING (affiliate_id = public.get_affiliate_id(auth.uid()));

-- Partner managers can view sub-affiliate links
CREATE POLICY "Partner managers can view sub-affiliate links"
ON public.affiliate_links FOR SELECT
USING (public.is_sub_affiliate(auth.uid(), affiliate_id));

-- 13. RLS Policies for affiliate_clicks table

-- Admins can view all
CREATE POLICY "Admins can view all clicks"
ON public.affiliate_clicks FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates can view their own clicks
CREATE POLICY "Affiliates can view own clicks"
ON public.affiliate_clicks FOR SELECT
USING (affiliate_id = public.get_affiliate_id(auth.uid()));

-- Partner managers can view sub-affiliate clicks
CREATE POLICY "Partner managers can view sub-affiliate clicks"
ON public.affiliate_clicks FOR SELECT
USING (public.is_sub_affiliate(auth.uid(), affiliate_id));

-- Anyone can insert clicks (for tracking)
CREATE POLICY "Anyone can insert clicks"
ON public.affiliate_clicks FOR INSERT
WITH CHECK (true);

-- 14. RLS Policies for affiliate_conversions table

-- Admins can do everything
CREATE POLICY "Admins can manage all conversions"
ON public.affiliate_conversions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates can view their own conversions
CREATE POLICY "Affiliates can view own conversions"
ON public.affiliate_conversions FOR SELECT
USING (affiliate_id = public.get_affiliate_id(auth.uid()) OR override_affiliate_id = public.get_affiliate_id(auth.uid()));

-- Partner managers can view sub-affiliate conversions
CREATE POLICY "Partner managers can view sub-affiliate conversions"
ON public.affiliate_conversions FOR SELECT
USING (public.is_sub_affiliate(auth.uid(), affiliate_id));

-- 15. RLS Policies for affiliate_payouts table

-- Admins can do everything
CREATE POLICY "Admins can manage all payouts"
ON public.affiliate_payouts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Affiliates can view their own payouts
CREATE POLICY "Affiliates can view own payouts"
ON public.affiliate_payouts FOR SELECT
USING (affiliate_id = public.get_affiliate_id(auth.uid()));

-- Affiliates can request payouts
CREATE POLICY "Affiliates can request payouts"
ON public.affiliate_payouts FOR INSERT
WITH CHECK (affiliate_id = public.get_affiliate_id(auth.uid()) AND status = 'pending');

-- 16. Create triggers for updated_at

CREATE TRIGGER update_affiliates_updated_at
BEFORE UPDATE ON public.affiliates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
BEFORE UPDATE ON public.affiliate_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at
BEFORE UPDATE ON public.affiliate_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substr(md5(random()::text), 1, 8));
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE affiliate_code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;