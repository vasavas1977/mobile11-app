
-- Telecom Core Tables for Mobile11 MVNO Platform

-- 1. telecom_sim_cards — Unified SIM inventory
CREATE TABLE public.telecom_sim_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sim_type TEXT NOT NULL DEFAULT 'physical' CHECK (sim_type IN ('physical', 'esim')),
  iccid TEXT,
  msisdn TEXT,
  imsi TEXT,
  status TEXT NOT NULL DEFAULT 'inventory' CHECK (status IN ('inventory', 'reserved', 'active', 'suspended', 'deactivated', 'lost')),
  provider_id UUID REFERENCES public.esim_providers(id),
  mno_reference_id TEXT,
  assigned_user_id UUID,
  assigned_org_id UUID,
  order_id UUID REFERENCES public.orders(id),
  activation_date TIMESTAMPTZ,
  deactivation_date TIMESTAMPTZ,
  batch_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_telecom_sim_cards_iccid ON public.telecom_sim_cards(iccid) WHERE iccid IS NOT NULL;
CREATE INDEX idx_telecom_sim_cards_status ON public.telecom_sim_cards(status);
CREATE INDEX idx_telecom_sim_cards_msisdn ON public.telecom_sim_cards(msisdn) WHERE msisdn IS NOT NULL;
CREATE INDEX idx_telecom_sim_cards_assigned_user ON public.telecom_sim_cards(assigned_user_id) WHERE assigned_user_id IS NOT NULL;
CREATE INDEX idx_telecom_sim_cards_assigned_org ON public.telecom_sim_cards(assigned_org_id) WHERE assigned_org_id IS NOT NULL;
CREATE INDEX idx_telecom_sim_cards_batch ON public.telecom_sim_cards(batch_id) WHERE batch_id IS NOT NULL;

ALTER TABLE public.telecom_sim_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all SIM cards"
  ON public.telecom_sim_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own SIM cards"
  ON public.telecom_sim_cards FOR SELECT TO authenticated
  USING (assigned_user_id = auth.uid());

CREATE TRIGGER update_telecom_sim_cards_updated_at
  BEFORE UPDATE ON public.telecom_sim_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. telecom_plans — Plan/package definitions
CREATE TABLE public.telecom_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  plan_code TEXT,
  plan_type TEXT NOT NULL DEFAULT 'prepaid' CHECK (plan_type IN ('prepaid', 'postpaid')),
  sim_type TEXT NOT NULL DEFAULT 'both' CHECK (sim_type IN ('physical', 'esim', 'both')),
  data_limit_mb INTEGER,
  voice_minutes INTEGER,
  sms_limit INTEGER,
  validity_days INTEGER,
  monthly_cost NUMERIC(10,2) DEFAULT 0,
  retail_price NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  speed_tier TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  provider_id UUID REFERENCES public.esim_providers(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_plans_active ON public.telecom_plans(is_active);

ALTER TABLE public.telecom_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all plans"
  ON public.telecom_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active plans"
  ON public.telecom_plans FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TRIGGER update_telecom_plans_updated_at
  BEFORE UPDATE ON public.telecom_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. telecom_subscriptions — SIM-to-plan assignments
CREATE TABLE public.telecom_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sim_card_id UUID NOT NULL REFERENCES public.telecom_sim_cards(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.telecom_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired', 'terminated')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  next_renewal_date TIMESTAMPTZ,
  assigned_user_id UUID,
  assigned_org_id UUID,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_subscriptions_sim ON public.telecom_subscriptions(sim_card_id);
CREATE INDEX idx_telecom_subscriptions_status ON public.telecom_subscriptions(status);
CREATE INDEX idx_telecom_subscriptions_user ON public.telecom_subscriptions(assigned_user_id) WHERE assigned_user_id IS NOT NULL;

ALTER TABLE public.telecom_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all subscriptions"
  ON public.telecom_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own subscriptions"
  ON public.telecom_subscriptions FOR SELECT TO authenticated
  USING (assigned_user_id = auth.uid());

CREATE TRIGGER update_telecom_subscriptions_updated_at
  BEFORE UPDATE ON public.telecom_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. telecom_usage_records — Usage tracking
CREATE TABLE public.telecom_usage_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sim_card_id UUID NOT NULL REFERENCES public.telecom_sim_cards(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.telecom_subscriptions(id),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data_used_mb NUMERIC(12,2) DEFAULT 0,
  data_remaining_mb NUMERIC(12,2),
  voice_used_minutes NUMERIC(10,2) DEFAULT 0,
  sms_used INTEGER DEFAULT 0,
  sync_source TEXT NOT NULL DEFAULT 'manual' CHECK (sync_source IN ('api_poll', 'webhook', 'manual')),
  mno_sync_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_usage_sim_date ON public.telecom_usage_records(sim_card_id, record_date DESC);

ALTER TABLE public.telecom_usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all usage records"
  ON public.telecom_usage_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own usage"
  ON public.telecom_usage_records FOR SELECT TO authenticated
  USING (
    sim_card_id IN (SELECT id FROM public.telecom_sim_cards WHERE assigned_user_id = auth.uid())
  );

-- 5. telecom_transactions — Billing/lifecycle ledger
CREATE TABLE public.telecom_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sim_card_id UUID NOT NULL REFERENCES public.telecom_sim_cards(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.telecom_subscriptions(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('activation', 'suspension', 'reactivation', 'termination', 'topup', 'plan_change', 'renewal')),
  amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  initiated_by UUID,
  mno_transaction_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_transactions_sim ON public.telecom_transactions(sim_card_id);
CREATE INDEX idx_telecom_transactions_type ON public.telecom_transactions(transaction_type);

ALTER TABLE public.telecom_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all transactions"
  ON public.telecom_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own transactions"
  ON public.telecom_transactions FOR SELECT TO authenticated
  USING (initiated_by = auth.uid());

-- 6. telecom_provider_jobs — Async provisioning queue
CREATE TABLE public.telecom_provider_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL CHECK (job_type IN ('activate', 'suspend', 'resume', 'terminate', 'sync_usage', 'change_plan', 'topup')),
  sim_card_id UUID NOT NULL REFERENCES public.telecom_sim_cards(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.esim_providers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  request_payload JSONB DEFAULT '{}'::jsonb,
  response_payload JSONB,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_by UUID,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_jobs_status ON public.telecom_provider_jobs(status);
CREATE INDEX idx_telecom_jobs_sim ON public.telecom_provider_jobs(sim_card_id);
CREATE INDEX idx_telecom_jobs_pending ON public.telecom_provider_jobs(status, next_retry_at) WHERE status IN ('pending', 'retrying');

ALTER TABLE public.telecom_provider_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all provider jobs"
  ON public.telecom_provider_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_telecom_provider_jobs_updated_at
  BEFORE UPDATE ON public.telecom_provider_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. telecom_event_log — Immutable audit trail
CREATE TABLE public.telecom_event_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sim_card', 'subscription', 'job', 'transaction', 'plan')),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user', 'system', 'cron', 'webhook')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telecom_event_log_entity ON public.telecom_event_log(entity_type, entity_id);
CREATE INDEX idx_telecom_event_log_created ON public.telecom_event_log(created_at DESC);

ALTER TABLE public.telecom_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all event logs"
  ON public.telecom_event_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
