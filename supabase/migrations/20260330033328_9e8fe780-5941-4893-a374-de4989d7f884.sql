
-- ============================================================
-- Customer Stage Memory Module
-- ============================================================

-- 1. customer_stage_state — current snapshot (1:1 with customer_profiles)
CREATE TABLE public.customer_stage_state (
  customer_profile_id UUID PRIMARY KEY REFERENCES public.customer_profiles(id) ON DELETE CASCADE,

  funnel_stage TEXT NOT NULL DEFAULT 'new_lead'
    CHECK (funnel_stage IN ('new_lead','engaged_lead','qualified_lead','follow_up_needed','purchase_intent_high','converted_customer','repeat_customer','inactive_customer','churn_risk')),
  funnel_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (funnel_confidence >= 0 AND funnel_confidence <= 1),
  funnel_source_type TEXT NOT NULL DEFAULT 'system'
    CHECK (funnel_source_type IN ('ai_auto','ai_suggestion','admin_manual','system','trigger')),
  funnel_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  capability_stage TEXT DEFAULT NULL
    CHECK (capability_stage IS NULL OR capability_stage IN ('phone_not_compatible','never_used_esim','first_time_esim_user','experienced_esim_user','frequent_traveler','enterprise_buyer')),
  capability_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (capability_confidence >= 0 AND capability_confidence <= 1),
  capability_source_type TEXT NOT NULL DEFAULT 'system'
    CHECK (capability_source_type IN ('ai_auto','ai_suggestion','admin_manual','system','trigger')),
  capability_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  experience_stage TEXT DEFAULT NULL
    CHECK (experience_stage IS NULL OR experience_stage IN ('good_experience_customer','bad_experience_customer','unresolved_issue_customer','price_sensitive_customer','promo_responsive_customer','support_heavy_customer','high_value_customer')),
  experience_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (experience_confidence >= 0 AND experience_confidence <= 1),
  experience_source_type TEXT NOT NULL DEFAULT 'system'
    CHECK (experience_source_type IN ('ai_auto','ai_suggestion','admin_manual','system','trigger')),
  experience_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  last_updated_source_type TEXT NOT NULL DEFAULT 'system'
    CHECK (last_updated_source_type IN ('ai_auto','ai_suggestion','admin_manual','system','trigger')),
  last_updated_user_id UUID DEFAULT NULL,
  last_updated_reason TEXT DEFAULT NULL,
  classification_version TEXT NOT NULL DEFAULT 'v1',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_css_funnel_stage ON public.customer_stage_state (funnel_stage);
CREATE INDEX idx_css_capability_stage ON public.customer_stage_state (capability_stage);
CREATE INDEX idx_css_experience_stage ON public.customer_stage_state (experience_stage);

-- 2. customer_stage_history — full audit trail
CREATE TABLE public.customer_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  stage_dimension TEXT NOT NULL CHECK (stage_dimension IN ('funnel','capability','experience')),
  old_stage TEXT DEFAULT NULL,
  new_stage TEXT NOT NULL,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT DEFAULT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('ai_auto','ai_suggestion','admin_manual','system','trigger')),
  source_user_id UUID DEFAULT NULL,
  source_event_type TEXT DEFAULT NULL,
  source_event_id UUID DEFAULT NULL,
  classification_version TEXT DEFAULT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_csh_profile_created ON public.customer_stage_history (customer_profile_id, created_at DESC);
CREATE INDEX idx_csh_dimension ON public.customer_stage_history (stage_dimension);
CREATE INDEX idx_csh_source_event_type ON public.customer_stage_history (source_event_type);
CREATE INDEX idx_csh_source_event_id ON public.customer_stage_history (source_event_id);

-- 3. Auto-history trigger
CREATE OR REPLACE FUNCTION public.track_customer_stage_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.funnel_stage IS DISTINCT FROM NEW.funnel_stage) THEN
    INSERT INTO public.customer_stage_history
      (customer_profile_id, stage_dimension, old_stage, new_stage, confidence, reason, source_type, source_user_id, classification_version)
    VALUES
      (NEW.customer_profile_id, 'funnel',
       CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.funnel_stage END,
       NEW.funnel_stage, NEW.funnel_confidence, NEW.last_updated_reason,
       NEW.funnel_source_type, NEW.last_updated_user_id, NEW.classification_version);
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.capability_stage IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND OLD.capability_stage IS DISTINCT FROM NEW.capability_stage) THEN
    INSERT INTO public.customer_stage_history
      (customer_profile_id, stage_dimension, old_stage, new_stage, confidence, reason, source_type, source_user_id, classification_version)
    VALUES
      (NEW.customer_profile_id, 'capability',
       CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.capability_stage END,
       NEW.capability_stage, NEW.capability_confidence, NEW.last_updated_reason,
       NEW.capability_source_type, NEW.last_updated_user_id, NEW.classification_version);
  END IF;

  IF (TG_OP = 'INSERT' AND NEW.experience_stage IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND OLD.experience_stage IS DISTINCT FROM NEW.experience_stage) THEN
    INSERT INTO public.customer_stage_history
      (customer_profile_id, stage_dimension, old_stage, new_stage, confidence, reason, source_type, source_user_id, classification_version)
    VALUES
      (NEW.customer_profile_id, 'experience',
       CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.experience_stage END,
       NEW.experience_stage, NEW.experience_confidence, NEW.last_updated_reason,
       NEW.experience_source_type, NEW.last_updated_user_id, NEW.classification_version);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customer_stage_changes
  AFTER INSERT OR UPDATE ON public.customer_stage_state
  FOR EACH ROW EXECUTE FUNCTION public.track_customer_stage_changes();

-- 4. updated_at trigger
CREATE TRIGGER update_customer_stage_state_updated_at
  BEFORE UPDATE ON public.customer_stage_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS
ALTER TABLE public.customer_stage_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view stage state" ON public.customer_stage_state
  FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage stage state" ON public.customer_stage_state
  FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));

CREATE POLICY "Agents can view stage history" ON public.customer_stage_history
  FOR SELECT TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage stage history" ON public.customer_stage_history
  FOR ALL TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));
