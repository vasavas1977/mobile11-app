
-- ============================================================
-- Outbound Message Variant Experimentation
-- ============================================================
-- Architecture Notes:
--
-- 1. Stop-loss semantics: stop_loss_threshold is an absolute percentage-point
--    drop vs control. If control conversion_rate is 12% and threshold is 5,
--    the experiment stops if any candidate drops below 7%.
--
-- 2. Winner recommendation: Advisory only. When all variants reach
--    min_sends_per_variant AND the best candidate exceeds control by
--    >= min_improvement_pct on success_metric, is_winner is set true
--    and winner_variant_id is populated. No auto-promotion.
--
-- 3. Traffic allocation: The sender reads outbound_experiment_variants
--    for the matching experiment, uses allocation_weight for weighted
--    random assignment, and writes experiment_id + variant_id to the
--    learning event.
--
-- 4. Result aggregation: A periodic job (or on-demand query) counts
--    learning events grouped by experiment_id, variant_id and upserts
--    into outbound_experiment_results (current aggregate, one row per
--    experiment+variant, updated in place).
-- ============================================================

-- 1. outbound_message_variants
CREATE TABLE public.outbound_message_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.outbound_message_templates(id) ON DELETE CASCADE,
  variant_key TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  style TEXT NOT NULL,
  language TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  email_subject TEXT,
  cta_type TEXT,
  cta_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbound_message_variants_template ON public.outbound_message_variants (template_id);

-- 2. outbound_experiments
CREATE TABLE public.outbound_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  description TEXT,
  experiment_type TEXT NOT NULL,
  campaign_type TEXT,
  channel_type TEXT NOT NULL,
  language TEXT,
  journey_id UUID REFERENCES public.outbound_journeys(id) ON DELETE SET NULL,
  journey_step_id UUID REFERENCES public.outbound_journey_steps(id) ON DELETE SET NULL,
  intent_type TEXT,
  rollout_percentage SMALLINT NOT NULL DEFAULT 10,
  min_sends_per_variant INTEGER NOT NULL DEFAULT 100,
  success_metric TEXT NOT NULL DEFAULT 'conversion_rate',
  min_improvement_pct NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  stop_loss_metric TEXT,
  stop_loss_threshold NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'draft',
  winner_variant_id UUID REFERENCES public.outbound_message_variants(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_outbound_experiments_status ON public.outbound_experiments (status);
CREATE INDEX idx_outbound_experiments_journey ON public.outbound_experiments (journey_id);
CREATE INDEX idx_outbound_experiments_campaign_channel ON public.outbound_experiments (campaign_type, channel_type);

-- 3. outbound_experiment_variants (join table)
CREATE TABLE public.outbound_experiment_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.outbound_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.outbound_message_variants(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  allocation_weight INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, variant_id)
);

CREATE INDEX idx_outbound_experiment_variants_experiment ON public.outbound_experiment_variants (experiment_id);

-- 4. outbound_experiment_results (current aggregate)
CREATE TABLE public.outbound_experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.outbound_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.outbound_message_variants(id) ON DELETE CASCADE,
  sends_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  seen_count INTEGER NOT NULL DEFAULT 0,
  replied_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  converted_count INTEGER NOT NULL DEFAULT 0,
  opted_out_count INTEGER NOT NULL DEFAULT 0,
  complaint_count INTEGER NOT NULL DEFAULT 0,
  total_conversion_value NUMERIC NOT NULL DEFAULT 0,
  delivery_rate NUMERIC(5,2),
  reply_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),
  avg_post_send_rating NUMERIC(3,1),
  is_winner BOOLEAN NOT NULL DEFAULT false,
  last_aggregated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (experiment_id, variant_id)
);

CREATE INDEX idx_outbound_experiment_results_experiment ON public.outbound_experiment_results (experiment_id);

-- 5. ALTER outbound_learning_events — first-class experiment attribution
ALTER TABLE public.outbound_learning_events
  ADD COLUMN experiment_id UUID REFERENCES public.outbound_experiments(id) ON DELETE SET NULL,
  ADD COLUMN variant_id UUID REFERENCES public.outbound_message_variants(id) ON DELETE SET NULL;

CREATE INDEX idx_learning_events_experiment ON public.outbound_learning_events (experiment_id, variant_id);

-- 6. updated_at triggers
CREATE TRIGGER set_outbound_message_variants_updated_at
  BEFORE UPDATE ON public.outbound_message_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_outbound_experiments_updated_at
  BEFORE UPDATE ON public.outbound_experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Validation trigger for outbound_experiments
CREATE OR REPLACE FUNCTION public.validate_outbound_experiment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'active', 'paused', 'completed', 'stopped') THEN
    RAISE EXCEPTION 'Invalid experiment status: %', NEW.status;
  END IF;
  IF NEW.experiment_type NOT IN ('ab', 'multivariate') THEN
    RAISE EXCEPTION 'Invalid experiment_type: %', NEW.experiment_type;
  END IF;
  IF NEW.rollout_percentage < 0 OR NEW.rollout_percentage > 100 THEN
    RAISE EXCEPTION 'rollout_percentage must be between 0 and 100, got: %', NEW.rollout_percentage;
  END IF;
  IF NEW.success_metric NOT IN ('conversion_rate', 'click_rate', 'reply_rate', 'delivery_rate') THEN
    RAISE EXCEPTION 'Invalid success_metric: %', NEW.success_metric;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_outbound_experiment
  BEFORE INSERT OR UPDATE ON public.outbound_experiments
  FOR EACH ROW EXECUTE FUNCTION public.validate_outbound_experiment();

-- 8. Validation trigger for outbound_experiment_variants role
CREATE OR REPLACE FUNCTION public.validate_experiment_variant_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.role NOT IN ('control', 'candidate') THEN
    RAISE EXCEPTION 'Invalid experiment variant role: %. Must be control or candidate.', NEW.role;
  END IF;
  IF NEW.allocation_weight < 1 THEN
    RAISE EXCEPTION 'allocation_weight must be >= 1, got: %', NEW.allocation_weight;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_experiment_variant_role
  BEFORE INSERT OR UPDATE ON public.outbound_experiment_variants
  FOR EACH ROW EXECUTE FUNCTION public.validate_experiment_variant_role();

-- 9. Validation trigger for outbound_message_variants style
CREATE OR REPLACE FUNCTION public.validate_message_variant()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.style NOT IN ('short', 'medium', 'soft_cta', 'strong_cta', 'educational', 'promotional') THEN
    RAISE EXCEPTION 'Invalid variant style: %', NEW.style;
  END IF;
  IF NEW.cta_type IS NOT NULL AND NEW.cta_type NOT IN ('link', 'reply', 'button', 'none') THEN
    RAISE EXCEPTION 'Invalid cta_type: %', NEW.cta_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_message_variant
  BEFORE INSERT OR UPDATE ON public.outbound_message_variants
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_variant();

-- 10. RLS — all tables follow agent-SELECT / supervisor-full pattern
ALTER TABLE public.outbound_message_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outbound_experiment_results ENABLE ROW LEVEL SECURITY;

-- outbound_message_variants
CREATE POLICY "Agents can view message variants"
  ON public.outbound_message_variants FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage message variants"
  ON public.outbound_message_variants FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- outbound_experiments
CREATE POLICY "Agents can view experiments"
  ON public.outbound_experiments FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage experiments"
  ON public.outbound_experiments FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- outbound_experiment_variants
CREATE POLICY "Agents can view experiment variants"
  ON public.outbound_experiment_variants FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage experiment variants"
  ON public.outbound_experiment_variants FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

-- outbound_experiment_results
CREATE POLICY "Agents can view experiment results"
  ON public.outbound_experiment_results FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage experiment results"
  ON public.outbound_experiment_results FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));
