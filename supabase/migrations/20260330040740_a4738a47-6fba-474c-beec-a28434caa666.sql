-- ============================================================
-- Outbound Trigger Engine: journey_enrollments, trigger_catalog, trigger_evaluation_logs
-- ============================================================

-- 1. journey_enrollments
CREATE TABLE public.journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL REFERENCES public.outbound_journeys(id) ON DELETE CASCADE,
  current_step_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'stopped', 'failed')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_step_executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stopped_reason TEXT,
  enrollment_source TEXT NOT NULL
    CHECK (enrollment_source IN ('trigger_engine', 'manual', 'api')),
  enrollment_trigger_key TEXT NOT NULL,
  enrollment_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

COMMENT ON COLUMN public.journey_enrollments.current_step_order IS
  '0 = enrolled but no step executed yet. First executable step is step_order = 1.';

CREATE UNIQUE INDEX idx_journey_enrollments_active_unique
  ON public.journey_enrollments (customer_profile_id, journey_id)
  WHERE status = 'active';

CREATE INDEX idx_journey_enrollments_status ON public.journey_enrollments (status);
CREATE INDEX idx_journey_enrollments_journey ON public.journey_enrollments (journey_id);
CREATE INDEX idx_journey_enrollments_customer ON public.journey_enrollments (customer_profile_id);

ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view enrollments"
  ON public.journey_enrollments FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors manage enrollments"
  ON public.journey_enrollments FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- 2. trigger_catalog
CREATE TABLE public.trigger_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  evaluation_mode TEXT NOT NULL
    CHECK (evaluation_mode IN ('realtime', 'scheduled', 'both')),
  source_event_types TEXT[] NOT NULL DEFAULT '{}',
  default_config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trigger_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view trigger catalog"
  ON public.trigger_catalog FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors manage trigger catalog"
  ON public.trigger_catalog FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

INSERT INTO public.trigger_catalog (trigger_key, display_name, description, evaluation_mode) VALUES
  ('qualified_lead_detected',     'Qualified Lead Detected',       'Customer completed lead qualification flow', 'realtime'),
  ('abandoned_checkout',          'Abandoned Checkout',            'Started checkout but did not complete within threshold', 'scheduled'),
  ('package_inquiry_no_purchase', 'Package Inquiry Without Purchase', 'Viewed or inquired about a package but did not buy', 'scheduled'),
  ('phone_not_compatible',        'Phone Not Compatible Detected', 'Device compatibility check returned incompatible', 'realtime'),
  ('never_used_esim',             'Never Used eSIM Detected',      'Customer purchased but never activated eSIM', 'realtime'),
  ('first_successful_activation', 'First Successful Activation',   'Customer activated their first eSIM successfully', 'realtime'),
  ('good_experience_detected',    'Good Experience Detected',      'High CSAT or positive sentiment detected', 'realtime'),
  ('bad_experience_detected',     'Bad Experience Detected',       'Low CSAT or negative sentiment detected', 'realtime'),
  ('inactive_x_days',             'Inactive for X Days',           'No activity for configurable number of days', 'scheduled'),
  ('repeat_buyer_opportunity',    'Repeat Buyer Opportunity',      'Previous buyer approaching travel window', 'scheduled'),
  ('cross_sell_opportunity',      'Cross-Sell Opportunity',        'Eligible for complementary product', 'scheduled'),
  ('resolved_support_case',       'Resolved Support Case',         'Support conversation resolved successfully', 'realtime'),
  ('promo_click_no_conversion',   'Promo Click Without Conversion','Clicked promo link but did not purchase', 'scheduled');

-- 3. trigger_evaluation_logs
CREATE TABLE public.trigger_evaluation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  trigger_key TEXT NOT NULL,
  journey_id UUID,
  evaluation_result TEXT NOT NULL
    CHECK (evaluation_result IN (
      'enrolled', 'suppressed', 'already_enrolled', 'no_matching_journey',
      'consent_denied', 'trigger_disabled', 'journey_inactive', 'invalid_context', 'error'
    )),
  suppression_reason TEXT,
  evaluation_details JSONB NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trigger_eval_logs_customer ON public.trigger_evaluation_logs (customer_profile_id);
CREATE INDEX idx_trigger_eval_logs_key ON public.trigger_evaluation_logs (trigger_key);
CREATE INDEX idx_trigger_eval_logs_evaluated ON public.trigger_evaluation_logs (evaluated_at);

ALTER TABLE public.trigger_evaluation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view evaluation logs"
  ON public.trigger_evaluation_logs FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors manage evaluation logs"
  ON public.trigger_evaluation_logs FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));