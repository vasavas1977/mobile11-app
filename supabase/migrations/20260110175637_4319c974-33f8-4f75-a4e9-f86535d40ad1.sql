-- =====================================================
-- MULTI-VENDOR ESIM SYSTEM SCHEMA
-- =====================================================

-- 1. Create esim_providers table (vendor registry)
CREATE TABLE public.esim_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT UNIQUE NOT NULL,
  provider_name TEXT NOT NULL,
  api_base_url TEXT,
  api_base_url_sandbox TEXT,
  auth_type TEXT NOT NULL DEFAULT 'bearer_token',
  auth_config JSONB DEFAULT '{}',
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.esim_providers ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage providers" ON public.esim_providers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add provider_id to esim_packages
ALTER TABLE public.esim_packages 
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.esim_providers(id),
  ADD COLUMN IF NOT EXISTS provider_package_type TEXT,
  ADD COLUMN IF NOT EXISTS cost_price_per_gb NUMERIC,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_rate NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}';

-- 3. Add provider tracking to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.esim_providers(id),
  ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS carrier_used TEXT,
  ADD COLUMN IF NOT EXISTS connection_quality_rating INTEGER;

-- 4. Create provider_billing table for monthly aggregation
CREATE TABLE public.provider_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.esim_providers(id) NOT NULL,
  billing_period TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  failed_orders INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  avg_margin_percentage NUMERIC DEFAULT 0,
  avg_cost_per_gb NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, billing_period)
);

-- Enable RLS
ALTER TABLE public.provider_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view provider billing" ON public.provider_billing
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. Create package_quality_reports table
CREATE TABLE public.package_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.esim_packages(id),
  order_id UUID REFERENCES public.orders(id),
  user_id UUID,
  country_used TEXT,
  carrier_used TEXT,
  location_description TEXT,
  issue_type TEXT,
  speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes TEXT,
  is_complaint BOOLEAN DEFAULT false,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_quality_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own quality reports" ON public.package_quality_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage quality reports" ON public.package_quality_reports
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own reports" ON public.package_quality_reports
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Create provider_package_mapping table (for terminology mapping)
CREATE TABLE public.provider_package_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.esim_providers(id) NOT NULL,
  provider_term TEXT NOT NULL,
  standard_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider_id, provider_term)
);

-- Enable RLS
ALTER TABLE public.provider_package_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mappings" ON public.provider_package_mapping
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read mappings" ON public.provider_package_mapping
  FOR SELECT USING (true);

-- 7. Insert initial providers
INSERT INTO public.esim_providers (provider_code, provider_name, auth_type, is_active, priority, notes)
VALUES 
  ('usimsa', 'USIMSA', 'hmac', true, 1, 'Primary provider - HMAC-SHA256 authentication'),
  ('tuge', 'TUGE (TGT Technology)', 'bearer_token', false, 2, 'Secondary provider - Bearer token authentication (24h validity)');

-- 8. Insert package type mappings
INSERT INTO public.provider_package_mapping (provider_id, provider_term, standard_type, description)
SELECT id, 'daily', 'day_pass', 'Daily data allocation with reset' FROM public.esim_providers WHERE provider_code = 'usimsa'
UNION ALL
SELECT id, 'fixed', 'max_speed', 'Fixed total data at max speed' FROM public.esim_providers WHERE provider_code = 'usimsa'
UNION ALL
SELECT id, 'unlimited', 'limitless', 'Unlimited with QoS throttling' FROM public.esim_providers WHERE provider_code = 'usimsa'
UNION ALL
SELECT id, 'DAILY_PACK', 'day_pass', 'Day pass - daily data allocation' FROM public.esim_providers WHERE provider_code = 'tuge'
UNION ALL
SELECT id, 'DATA_PACK', 'max_speed', 'Data package - fixed total data' FROM public.esim_providers WHERE provider_code = 'tuge'
UNION ALL
SELECT id, 'DAILY_PACK_UNLIMITED', 'limitless', 'Day pass Unlimited - tiered speed (10/5/2 Mbps)' FROM public.esim_providers WHERE provider_code = 'tuge';

-- 9. Update existing packages to link to USIMSA provider
UPDATE public.esim_packages 
SET provider_id = (SELECT id FROM public.esim_providers WHERE provider_code = 'usimsa')
WHERE provider_id IS NULL;

-- 10. Create function to calculate cost per GB
CREATE OR REPLACE FUNCTION public.calculate_cost_per_gb(
  p_package_type TEXT,
  p_cost_price NUMERIC,
  p_data_amount TEXT,
  p_validity_days INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  data_gb NUMERIC;
BEGIN
  -- Extract numeric value from data_amount (e.g., '2GB' -> 2, '500MB' -> 0.5)
  IF p_data_amount IS NULL OR p_data_amount = '' OR p_data_amount ILIKE '%unlimited%' THEN
    RETURN NULL;
  END IF;
  
  -- Handle MB
  IF p_data_amount ILIKE '%MB%' THEN
    data_gb := CAST(regexp_replace(p_data_amount, '[^0-9.]', '', 'g') AS NUMERIC) / 1024;
  ELSE
    data_gb := CAST(regexp_replace(p_data_amount, '[^0-9.]', '', 'g') AS NUMERIC);
  END IF;
  
  IF data_gb IS NULL OR data_gb = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Calculate based on package type
  IF p_package_type = 'day_pass' THEN
    -- Day pass: cost / (data_per_day * days)
    RETURN ROUND(p_cost_price / (data_gb * COALESCE(p_validity_days, 1)), 4);
  ELSIF p_package_type = 'max_speed' THEN
    -- Max speed: cost / total_data
    RETURN ROUND(p_cost_price / data_gb, 4);
  ELSE
    -- Limitless: cannot calculate per GB
    RETURN NULL;
  END IF;
END;
$$;

-- 11. Create trigger to auto-calculate cost_per_gb on package insert/update
CREATE OR REPLACE FUNCTION public.trigger_calculate_cost_per_gb()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.cost_price_per_gb := public.calculate_cost_per_gb(
    NEW.package_type,
    NEW.cost_price,
    NEW.data_amount,
    NEW.validity_days
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_cost_per_gb_trigger ON public.esim_packages;
CREATE TRIGGER calculate_cost_per_gb_trigger
  BEFORE INSERT OR UPDATE OF cost_price, data_amount, validity_days, package_type
  ON public.esim_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_calculate_cost_per_gb();

-- 12. Update existing packages to calculate cost_per_gb
UPDATE public.esim_packages
SET cost_price_per_gb = public.calculate_cost_per_gb(package_type, cost_price, data_amount, validity_days)
WHERE cost_price IS NOT NULL;

-- 13. Create function to update package quality score
CREATE OR REPLACE FUNCTION public.update_package_quality_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_complaint_count INTEGER;
  v_total_reports INTEGER;
  v_avg_rating NUMERIC;
  v_new_score INTEGER;
BEGIN
  -- Count complaints in last 90 days
  SELECT 
    COUNT(*) FILTER (WHERE is_complaint = true),
    COUNT(*),
    AVG(overall_rating)
  INTO v_complaint_count, v_total_reports, v_avg_rating
  FROM public.package_quality_reports
  WHERE package_id = NEW.package_id
    AND created_at > now() - interval '90 days';
  
  -- Calculate quality score (base 100, minus 5 per complaint, plus rating bonus)
  v_new_score := GREATEST(0, LEAST(100, 
    100 - (v_complaint_count * 5) + COALESCE((v_avg_rating - 3) * 5, 0)::INTEGER
  ));
  
  -- Update package
  UPDATE public.esim_packages
  SET 
    complaint_count = v_complaint_count,
    quality_score = v_new_score
  WHERE id = NEW.package_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_quality_score_trigger ON public.package_quality_reports;
CREATE TRIGGER update_quality_score_trigger
  AFTER INSERT ON public.package_quality_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_package_quality_score();

-- 14. Create function to update provider billing
CREATE OR REPLACE FUNCTION public.update_provider_billing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_period TEXT;
  v_provider_id UUID;
BEGIN
  -- Only process completed orders
  IF NEW.status NOT IN ('completed', 'active') THEN
    RETURN NEW;
  END IF;
  
  v_period := to_char(NEW.created_at, 'YYYY-MM');
  v_provider_id := NEW.provider_id;
  
  -- Skip if no provider
  IF v_provider_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Upsert billing record
  INSERT INTO public.provider_billing (provider_id, billing_period, total_orders, total_cost, total_revenue, total_profit)
  VALUES (
    v_provider_id,
    v_period,
    1,
    COALESCE(NEW.provider_cost, 0),
    NEW.total_amount,
    NEW.total_amount - COALESCE(NEW.provider_cost, 0)
  )
  ON CONFLICT (provider_id, billing_period) DO UPDATE SET
    total_orders = provider_billing.total_orders + 1,
    total_cost = provider_billing.total_cost + COALESCE(NEW.provider_cost, 0),
    total_revenue = provider_billing.total_revenue + NEW.total_amount,
    total_profit = provider_billing.total_profit + (NEW.total_amount - COALESCE(NEW.provider_cost, 0)),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_provider_billing_trigger ON public.orders;
CREATE TRIGGER update_provider_billing_trigger
  AFTER INSERT OR UPDATE OF status
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_billing();

-- 15. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_esim_packages_provider ON public.esim_packages(provider_id);
CREATE INDEX IF NOT EXISTS idx_esim_packages_cost_per_gb ON public.esim_packages(cost_price_per_gb) WHERE cost_price_per_gb IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_esim_packages_quality ON public.esim_packages(quality_score);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_package ON public.package_quality_reports(package_id);
CREATE INDEX IF NOT EXISTS idx_provider_billing_period ON public.provider_billing(billing_period);

-- 16. Add updated_at trigger for esim_providers
CREATE TRIGGER update_esim_providers_updated_at
  BEFORE UPDATE ON public.esim_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Add updated_at trigger for provider_billing
CREATE TRIGGER update_provider_billing_updated_at
  BEFORE UPDATE ON public.provider_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();