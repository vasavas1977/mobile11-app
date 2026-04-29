
-- =============================================
-- Outbound Send Scheduler tables
-- =============================================

-- outbound_send_queue
CREATE TABLE public.outbound_send_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.journey_enrollments(id) ON DELETE CASCADE,
  journey_step_id UUID NOT NULL REFERENCES public.outbound_journey_steps(id) ON DELETE CASCADE,
  customer_profile_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  message_template_id UUID NULL,
  scheduled_send_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_attempt_at TIMESTAMPTZ NULL,
  failure_reason TEXT NULL,
  suppression_reason TEXT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status check via trigger (avoids immutable constraint issues)
CREATE OR REPLACE FUNCTION public.validate_send_queue_status()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'suppressed', 'skipped', 'sending', 'sent', 'failed', 'retryable') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_send_queue_status
  BEFORE INSERT OR UPDATE ON public.outbound_send_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_send_queue_status();

-- Deduplication: prevent multiple non-terminal queue rows per enrollment+step
CREATE UNIQUE INDEX idx_send_queue_dedup
  ON public.outbound_send_queue (enrollment_id, journey_step_id)
  WHERE status NOT IN ('sent', 'failed', 'suppressed', 'skipped');

-- Sender pickup index
CREATE INDEX idx_send_queue_status_schedule
  ON public.outbound_send_queue (status, scheduled_send_at);

-- Enrollment lookup
CREATE INDEX idx_send_queue_enrollment
  ON public.outbound_send_queue (enrollment_id);

-- Customer history
CREATE INDEX idx_send_queue_customer_created
  ON public.outbound_send_queue (customer_profile_id, created_at);

-- RLS
ALTER TABLE public.outbound_send_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view send queue"
  ON public.outbound_send_queue FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage send queue"
  ON public.outbound_send_queue FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));


-- scheduler_run_logs
CREATE TABLE public.scheduler_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_mode TEXT NOT NULL DEFAULT 'live',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  enrollments_evaluated INTEGER NOT NULL DEFAULT 0,
  sends_queued INTEGER NOT NULL DEFAULT 0,
  sends_suppressed INTEGER NOT NULL DEFAULT 0,
  sends_skipped INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'
);

-- Run mode validation trigger
CREATE OR REPLACE FUNCTION public.validate_scheduler_run_mode()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF NEW.run_mode NOT IN ('live', 'dry_run') THEN
    RAISE EXCEPTION 'Invalid run_mode: %', NEW.run_mode;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_scheduler_run_mode
  BEFORE INSERT OR UPDATE ON public.scheduler_run_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_scheduler_run_mode();

-- RLS
ALTER TABLE public.scheduler_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view scheduler logs"
  ON public.scheduler_run_logs FOR SELECT
  TO authenticated
  USING (public.is_agent_or_higher(auth.uid()));

CREATE POLICY "Supervisors can manage scheduler logs"
  ON public.scheduler_run_logs FOR ALL
  TO authenticated
  USING (public.is_supervisor_or_higher(auth.uid()))
  WITH CHECK (public.is_supervisor_or_higher(auth.uid()));
