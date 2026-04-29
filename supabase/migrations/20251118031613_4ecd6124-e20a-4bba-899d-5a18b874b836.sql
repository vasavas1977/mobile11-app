-- Create A/B testing framework for destination optimization

-- Table to store A/B test configurations
CREATE TABLE IF NOT EXISTS public.destination_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  traffic_allocation NUMERIC NOT NULL DEFAULT 100, -- percentage of traffic to include
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to store different variants for each test
CREATE TABLE IF NOT EXISTS public.destination_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.destination_ab_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- stores ordering strategy, layout type, etc.
  traffic_weight INTEGER NOT NULL DEFAULT 50, -- relative weight for traffic split
  is_control BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to track user/session assignments to variants
CREATE TABLE IF NOT EXISTS public.destination_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.destination_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.destination_ab_variants(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_or_session_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Table to track conversions from destination clicks to purchases
CREATE TABLE IF NOT EXISTS public.destination_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.destination_ab_tests(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.destination_ab_variants(id) ON DELETE SET NULL,
  analytics_id UUID REFERENCES public.destination_analytics(id) ON DELETE SET NULL,
  user_id UUID,
  session_id TEXT,
  destination TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.esim_packages(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add variant tracking to destination_analytics
ALTER TABLE public.destination_analytics 
ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.destination_ab_tests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.destination_ab_variants(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user ON public.destination_ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_session ON public.destination_ab_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_test ON public.destination_ab_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_conversions_variant ON public.destination_conversions(variant_id);
CREATE INDEX IF NOT EXISTS idx_conversions_test ON public.destination_conversions(test_id);
CREATE INDEX IF NOT EXISTS idx_analytics_variant ON public.destination_analytics(variant_id);

-- Function to get variant assignment for a user/session
CREATE OR REPLACE FUNCTION public.get_variant_assignment(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE(test_id UUID, variant_id UUID, config JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment RECORD;
  v_test RECORD;
  v_variant RECORD;
  v_random NUMERIC;
  v_cumulative_weight INTEGER;
  v_total_weight INTEGER;
BEGIN
  -- Check for existing assignment
  SELECT a.test_id, a.variant_id, v.config INTO v_assignment
  FROM destination_ab_assignments a
  JOIN destination_ab_variants v ON v.id = a.variant_id
  JOIN destination_ab_tests t ON t.id = a.test_id
  WHERE (p_user_id IS NOT NULL AND a.user_id = p_user_id)
     OR (p_session_id IS NOT NULL AND a.session_id = p_session_id)
     AND t.status = 'active'
  ORDER BY a.assigned_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_assignment.test_id, v_assignment.variant_id, v_assignment.config;
    RETURN;
  END IF;

  -- Find active test
  SELECT * INTO v_test
  FROM destination_ab_tests
  WHERE status = 'active'
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Check if user should be included based on traffic allocation
  v_random := random() * 100;
  IF v_random > v_test.traffic_allocation THEN
    RETURN;
  END IF;

  -- Calculate total weight
  SELECT SUM(traffic_weight) INTO v_total_weight
  FROM destination_ab_variants
  WHERE test_id = v_test.id;

  -- Weighted random variant selection
  v_random := random() * v_total_weight;
  v_cumulative_weight := 0;

  FOR v_variant IN
    SELECT * FROM destination_ab_variants
    WHERE test_id = v_test.id
    ORDER BY id
  LOOP
    v_cumulative_weight := v_cumulative_weight + v_variant.traffic_weight;
    IF v_random <= v_cumulative_weight THEN
      -- Assign variant
      INSERT INTO destination_ab_assignments (test_id, variant_id, user_id, session_id)
      VALUES (v_test.id, v_variant.id, p_user_id, p_session_id);

      RETURN QUERY SELECT v_test.id, v_variant.id, v_variant.config;
      RETURN;
    END IF;
  END LOOP;
END;
$$;

-- Function to get A/B test performance metrics
CREATE OR REPLACE FUNCTION public.get_ab_test_metrics(
  p_test_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  variant_id UUID,
  variant_name TEXT,
  is_control BOOLEAN,
  impressions BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  click_rate NUMERIC,
  conversion_rate NUMERIC,
  revenue NUMERIC,
  avg_conversion_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as variant_id,
    v.name as variant_name,
    v.is_control,
    COUNT(DISTINCT a.id) as impressions,
    COUNT(DISTINCT da.id) as clicks,
    COUNT(DISTINCT dc.id) FILTER (WHERE dc.converted_at IS NOT NULL) as conversions,
    ROUND(
      (COUNT(DISTINCT da.id)::NUMERIC / NULLIF(COUNT(DISTINCT a.id), 0)) * 100,
      2
    ) as click_rate,
    ROUND(
      (COUNT(DISTINCT dc.id) FILTER (WHERE dc.converted_at IS NOT NULL)::NUMERIC / 
       NULLIF(COUNT(DISTINCT da.id), 0)) * 100,
      2
    ) as conversion_rate,
    COALESCE(SUM(dc.conversion_value), 0) as revenue,
    ROUND(AVG(dc.conversion_value), 2) as avg_conversion_value
  FROM destination_ab_variants v
  LEFT JOIN destination_ab_assignments a ON a.variant_id = v.id
    AND a.assigned_at > now() - (p_days_back || ' days')::INTERVAL
  LEFT JOIN destination_analytics da ON da.variant_id = v.id
    AND da.clicked_at > now() - (p_days_back || ' days')::INTERVAL
  LEFT JOIN destination_conversions dc ON dc.variant_id = v.id
    AND dc.clicked_at > now() - (p_days_back || ' days')::INTERVAL
  WHERE v.test_id = p_test_id
  GROUP BY v.id, v.name, v.is_control
  ORDER BY v.is_control DESC, impressions DESC;
END;
$$;

-- Enable RLS
ALTER TABLE public.destination_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for destination_ab_tests
CREATE POLICY "Admins can manage A/B tests"
  ON public.destination_ab_tests
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active tests"
  ON public.destination_ab_tests
  FOR SELECT
  USING (status = 'active');

-- RLS Policies for destination_ab_variants
CREATE POLICY "Admins can manage variants"
  ON public.destination_ab_variants
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view variants of active tests"
  ON public.destination_ab_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM destination_ab_tests
      WHERE id = test_id AND status = 'active'
    )
  );

-- RLS Policies for destination_ab_assignments
CREATE POLICY "Anyone can insert assignments"
  ON public.destination_ab_assignments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own assignments"
  ON public.destination_ab_assignments
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for destination_conversions
CREATE POLICY "Anyone can insert conversions"
  ON public.destination_conversions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversions"
  ON public.destination_conversions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON public.destination_ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();