-- Add tier tracking columns to affiliates table
ALTER TABLE public.affiliates
ADD COLUMN IF NOT EXISTS current_volume_tier text NOT NULL DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS monthly_sales_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_months integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_tier text NOT NULL DEFAULT 'new',
ADD COLUMN IF NOT EXISTS milestones_claimed jsonb NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS total_lifetime_sales integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_updated_at timestamp with time zone DEFAULT now();

-- Create affiliate tier configuration table (admin-adjustable)
CREATE TABLE IF NOT EXISTS public.affiliate_tier_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name text NOT NULL UNIQUE,
  tier_order integer NOT NULL DEFAULT 0,
  min_sales integer NOT NULL DEFAULT 0,
  max_sales integer,
  commission_rate numeric NOT NULL DEFAULT 8.00,
  override_rate numeric NOT NULL DEFAULT 2.00,
  badge_color text NOT NULL DEFAULT '#6B7280',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create affiliate milestones table
CREATE TABLE IF NOT EXISTS public.affiliate_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_name text NOT NULL UNIQUE,
  sales_threshold integer NOT NULL,
  bonus_amount numeric NOT NULL,
  badge_icon text DEFAULT 'Trophy',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create affiliate milestone claims table
CREATE TABLE IF NOT EXISTS public.affiliate_milestone_claims (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES public.affiliate_milestones(id) ON DELETE CASCADE,
  claimed_at timestamp with time zone NOT NULL DEFAULT now(),
  bonus_amount numeric NOT NULL,
  UNIQUE(affiliate_id, milestone_id)
);

-- Enable RLS on new tables
ALTER TABLE public.affiliate_tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_milestone_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_tier_config (public read, admin write)
CREATE POLICY "Anyone can view tier config" ON public.affiliate_tier_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tier config" ON public.affiliate_tier_config
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for affiliate_milestones (public read, admin write)
CREATE POLICY "Anyone can view milestones" ON public.affiliate_milestones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage milestones" ON public.affiliate_milestones
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for affiliate_milestone_claims
CREATE POLICY "Affiliates can view own claims" ON public.affiliate_milestone_claims
  FOR SELECT USING (affiliate_id = get_affiliate_id(auth.uid()));

CREATE POLICY "Affiliates can insert own claims" ON public.affiliate_milestone_claims
  FOR INSERT WITH CHECK (affiliate_id = get_affiliate_id(auth.uid()));

CREATE POLICY "Admins can manage all claims" ON public.affiliate_milestone_claims
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default tier configuration
INSERT INTO public.affiliate_tier_config (tier_name, tier_order, min_sales, max_sales, commission_rate, override_rate, badge_color)
VALUES 
  ('starter', 0, 0, 10, 8.00, 2.00, '#6B7280'),
  ('bronze', 1, 11, 30, 10.00, 3.00, '#CD7F32'),
  ('silver', 2, 31, 60, 12.00, 4.00, '#C0C0C0'),
  ('gold', 3, 61, 100, 14.00, 4.50, '#FFD700'),
  ('platinum', 4, 101, NULL, 16.00, 5.00, '#E5E4E2')
ON CONFLICT (tier_name) DO NOTHING;

-- Insert default milestones
INSERT INTO public.affiliate_milestones (milestone_name, sales_threshold, bonus_amount, badge_icon)
VALUES 
  ('first_10', 10, 25.00, 'Star'),
  ('first_50', 50, 100.00, 'Award'),
  ('first_100', 100, 250.00, 'Trophy'),
  ('first_500', 500, 750.00, 'Crown')
ON CONFLICT (milestone_name) DO NOTHING;

-- Create function to calculate and update affiliate tier
CREATE OR REPLACE FUNCTION public.calculate_affiliate_tier(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_monthly_sales integer;
  v_new_tier text;
BEGIN
  -- Get current monthly sales
  SELECT monthly_sales_count INTO v_monthly_sales
  FROM affiliates WHERE id = p_affiliate_id;

  -- Determine tier based on monthly sales
  SELECT tier_name INTO v_new_tier
  FROM affiliate_tier_config
  WHERE v_monthly_sales >= min_sales
    AND (max_sales IS NULL OR v_monthly_sales <= max_sales)
  ORDER BY tier_order DESC
  LIMIT 1;

  -- Update affiliate tier
  UPDATE affiliates
  SET current_volume_tier = COALESCE(v_new_tier, 'starter'),
      tier_updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Create function to get commission rate for an affiliate
CREATE OR REPLACE FUNCTION public.get_affiliate_commission_rate(p_affiliate_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_loyalty_tier text;
  v_base_rate numeric;
  v_loyalty_bonus numeric;
BEGIN
  -- Get affiliate tier info
  SELECT current_volume_tier, loyalty_tier INTO v_tier, v_loyalty_tier
  FROM affiliates WHERE id = p_affiliate_id;

  -- Get base commission rate from tier config
  SELECT commission_rate INTO v_base_rate
  FROM affiliate_tier_config
  WHERE tier_name = v_tier;

  -- Calculate loyalty bonus
  v_loyalty_bonus := CASE v_loyalty_tier
    WHEN 'new' THEN 0
    WHEN 'established' THEN 1
    WHEN 'veteran' THEN 2
    WHEN 'elite' THEN 3
    ELSE 0
  END;

  RETURN COALESCE(v_base_rate, 8) + v_loyalty_bonus;
END;
$$;

-- Create function to get override rate for a partner manager
CREATE OR REPLACE FUNCTION public.get_affiliate_override_rate(p_affiliate_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_override_rate numeric;
BEGIN
  SELECT current_volume_tier INTO v_tier
  FROM affiliates WHERE id = p_affiliate_id;

  SELECT override_rate INTO v_override_rate
  FROM affiliate_tier_config
  WHERE tier_name = v_tier;

  RETURN COALESCE(v_override_rate, 2);
END;
$$;