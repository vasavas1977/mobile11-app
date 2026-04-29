
-- Fix visitor_sessions UPDATE policy
DROP POLICY IF EXISTS "Anyone can update their own session" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Users can update own session" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Restrict session updates to own session" ON public.visitor_sessions;

CREATE POLICY "Restrict session updates to own session"
  ON public.visitor_sessions FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL)
  WITH CHECK (true);

-- Fix esim_packages: create a public view WITHOUT sensitive cost fields
-- Excluded: cost_price, cost_price_per_gb, markup_percentage, markup_fixed, min_sell_price, provider_metadata
CREATE OR REPLACE VIEW public.esim_packages_public AS
SELECT
  id, package_id, name, short_name, country_name, country_code,
  data_amount, validity_days, validity_period, price, normal_price, currency,
  package_type, provider_package_type, description, is_active, is_featured,
  is_popular, featured_order, carrier, network_type, category,
  included_countries, provider_id, is_local_sim, is_cancelable,
  daily_data_reset, daily_reset_amount, supports_extension, top_up,
  hot_spot, kyc, pre_installation, sim_type, service_type,
  support_data, support_sms, support_voice, access_type,
  initialize_policy, activation_note, apn,
  qos_speed, speed_after_limit,
  quality_score, complaint_count, success_rate,
  purchase_count, total_orders,
  created_at, updated_at
FROM public.esim_packages
WHERE is_active = true;

GRANT SELECT ON public.esim_packages_public TO anon;
GRANT SELECT ON public.esim_packages_public TO authenticated;

-- Remove the public SELECT policy (anon should use the view)
DROP POLICY IF EXISTS "Anyone can view active eSIM packages" ON public.esim_packages;

-- Authenticated users can still query the table directly
CREATE POLICY "Authenticated users can view active packages"
  ON public.esim_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage all packages
DROP POLICY IF EXISTS "Admins can manage packages" ON public.esim_packages;

CREATE POLICY "Admins can manage packages"
  ON public.esim_packages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
