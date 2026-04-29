-- =============================================================
-- AI Next Best Action Engine
-- =============================================================
-- Architecture notes:
-- 1. Read-only engine: generates and stores recommendations only.
-- 2. Consent-aware: send_sales_followup requires prefers_sales_followup.
--    send_promotion and send_educational require prefers_news_and_promotions.
-- 3. Future scheduler integration: optional advisory only.
-- 4. Bulk accept: UI filters by action type AND risk level.
-- 5. Risk: low(wait,educational,promo), medium(sales,switch,recovery), high(stop,suppress,upsell,crosssell)
-- =============================================================

CREATE TABLE public.outbound_next_best_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  recommended_action TEXT NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL,
  explanation TEXT NOT NULL,
  reasoning_factors JSONB NOT NULL DEFAULT '{}',
  recommended_channel TEXT,
  current_channel TEXT,
  recommended_delay_hours INTEGER,
  recommended_journey_id UUID REFERENCES public.outbound_journeys(id) ON DELETE SET NULL,
  recommended_campaign_id UUID REFERENCES public.outbound_campaigns(id) ON DELETE SET NULL,
  funnel_stage TEXT,
  capability_stage TEXT,
  experience_stage TEXT,
  recent_sentiment TEXT,
  sends_last_7d INTEGER,
  complaints_last_30d INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  executed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  engine_version TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_next_best_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected', 'executed', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.recommended_action NOT IN (
    'send_sales_followup', 'send_promotion', 'send_educational', 'send_recovery',
    'wait',
    'switch_channel',
    'stop_messaging', 'suppress_annoyance',
    'move_to_upsell', 'move_to_crosssell'
  ) THEN
    RAISE EXCEPTION 'Invalid recommended_action: %', NEW.recommended_action;
  END IF;
  IF NEW.confidence_score < 0 OR NEW.confidence_score > 100 THEN
    RAISE EXCEPTION 'confidence_score must be between 0 and 100, got: %', NEW.confidence_score;
  END IF;
  IF NEW.recent_sentiment IS NOT NULL AND NEW.recent_sentiment NOT IN ('positive', 'neutral', 'negative') THEN
    RAISE EXCEPTION 'Invalid recent_sentiment: %', NEW.recent_sentiment;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_next_best_action
  BEFORE INSERT OR UPDATE ON public.outbound_next_best_actions
  FOR EACH ROW EXECUTE FUNCTION public.validate_next_best_action();

CREATE INDEX idx_nba_customer_created ON public.outbound_next_best_actions (customer_profile_id, created_at DESC);
CREATE INDEX idx_nba_status_created ON public.outbound_next_best_actions (status, created_at);
CREATE INDEX idx_nba_action ON public.outbound_next_best_actions (recommended_action);

ALTER TABLE public.outbound_next_best_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view NBA decisions"
  ON public.outbound_next_best_actions FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage NBA decisions"
  ON public.outbound_next_best_actions FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));