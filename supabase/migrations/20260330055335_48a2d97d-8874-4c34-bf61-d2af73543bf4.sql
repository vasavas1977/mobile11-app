
-- =============================================================
-- Self-Improving Outbound Optimization Engine
-- =============================================================
-- Architecture notes:
-- 1. Read-only engine: generates and stores recommendations only.
--    No mutations to campaigns, journeys, templates, or experiments.
-- 2. Higher-risk recommendations (journey_pause, suppression_rule)
--    default to severity high/critical and require supervisor review.
-- 3. Evidence JSONB includes keys like sample_size, metric_name,
--    metric_value, control_value, delta, time_window_days.
-- 4. Deduplication: engine checks for existing pending recommendations
--    with same type + scope FKs before inserting.
-- 5. impact_score: normalized 0-100 priority score, comparable across types.
-- 6. confidence_score: 0-100 reflecting sample size and signal strength.
-- =============================================================

CREATE TABLE public.outbound_optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  current_value JSONB NULL,
  recommended_value JSONB NULL,
  campaign_id UUID REFERENCES public.outbound_campaigns(id) ON DELETE SET NULL,
  journey_id UUID REFERENCES public.outbound_journeys(id) ON DELETE SET NULL,
  journey_step_id UUID REFERENCES public.outbound_journey_steps(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.outbound_message_templates(id) ON DELETE SET NULL,
  experiment_id UUID REFERENCES public.outbound_experiments(id) ON DELETE SET NULL,
  impact_score NUMERIC(5,2) NULL,
  confidence_score NUMERIC(5,2) NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  review_notes TEXT NULL,
  implemented_at TIMESTAMPTZ NULL,
  implementation_notes TEXT NULL,
  generated_by TEXT NOT NULL DEFAULT 'optimization_engine',
  engine_version TEXT NULL,
  analysis_window_days INTEGER NOT NULL DEFAULT 30,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_optimization_recommendation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected', 'implemented', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.recommendation_type NOT IN (
    'channel_order', 'send_timing', 'wait_duration', 'message_tone',
    'cta_type', 'segment_targeting', 'suppression_rule', 'journey_pause'
  ) THEN
    RAISE EXCEPTION 'Invalid recommendation_type: %', NEW.recommendation_type;
  END IF;
  IF NEW.severity NOT IN ('low', 'medium', 'high', 'critical') THEN
    RAISE EXCEPTION 'Invalid severity: %', NEW.severity;
  END IF;
  IF NEW.impact_score IS NOT NULL AND (NEW.impact_score < 0 OR NEW.impact_score > 100) THEN
    RAISE EXCEPTION 'impact_score must be between 0 and 100, got: %', NEW.impact_score;
  END IF;
  IF NEW.confidence_score IS NOT NULL AND (NEW.confidence_score < 0 OR NEW.confidence_score > 100) THEN
    RAISE EXCEPTION 'confidence_score must be between 0 and 100, got: %', NEW.confidence_score;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_optimization_recommendation
  BEFORE INSERT OR UPDATE ON public.outbound_optimization_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.validate_optimization_recommendation();

-- Indexes
CREATE INDEX idx_opt_rec_status_created ON public.outbound_optimization_recommendations (status, created_at DESC);
CREATE INDEX idx_opt_rec_type ON public.outbound_optimization_recommendations (recommendation_type);
CREATE INDEX idx_opt_rec_campaign ON public.outbound_optimization_recommendations (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_opt_rec_journey ON public.outbound_optimization_recommendations (journey_id) WHERE journey_id IS NOT NULL;
CREATE INDEX idx_opt_rec_severity ON public.outbound_optimization_recommendations (severity);

-- RLS
ALTER TABLE public.outbound_optimization_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view optimization recommendations"
  ON public.outbound_optimization_recommendations FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage optimization recommendations"
  ON public.outbound_optimization_recommendations FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));
