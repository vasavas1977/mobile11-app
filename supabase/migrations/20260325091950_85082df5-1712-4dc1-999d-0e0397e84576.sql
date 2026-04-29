-- Expand autonomous_actions_log with richer fields
ALTER TABLE public.autonomous_actions_log
  ADD COLUMN IF NOT EXISTS is_dry_run boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS action_summary text,
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Action catalog table
CREATE TABLE IF NOT EXISTS public.action_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  requires_approval boolean NOT NULL DEFAULT false,
  is_enabled boolean NOT NULL DEFAULT true,
  input_schema jsonb NOT NULL DEFAULT '{}',
  approval_roles text[] DEFAULT '{admin,supervisor}',
  max_retries integer NOT NULL DEFAULT 3,
  timeout_seconds integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.action_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can read action_catalog" ON public.action_catalog FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Supervisors can manage action_catalog" ON public.action_catalog FOR ALL TO authenticated USING (public.is_supervisor_or_higher(auth.uid()));

-- Seed action catalog
INSERT INTO public.action_catalog (action_type, display_name, description, category, requires_approval, input_schema) VALUES
  ('check_order_status', 'Check Order Status', 'Look up order status by order ID or email', 'order', false, '{"required":["order_id"],"properties":{"order_id":{"type":"string"}}}'),
  ('check_payment_status', 'Check Payment Status', 'Check payment status for an order', 'payment', false, '{"required":["order_id"],"properties":{"order_id":{"type":"string"}}}'),
  ('resend_payment_link', 'Resend Payment Link', 'Resend payment link to customer email', 'payment', false, '{"required":["order_id"],"properties":{"order_id":{"type":"string"}}}'),
  ('resend_esim_qr', 'Resend eSIM QR', 'Resend eSIM QR code and installation instructions', 'fulfillment', false, '{"required":["order_id"],"properties":{"order_id":{"type":"string"}}}'),
  ('check_activation_status', 'Check Activation Status', 'Check eSIM activation/installation status', 'fulfillment', false, '{"required":["order_id"],"properties":{"order_id":{"type":"string"}}}'),
  ('check_package_details', 'Check Package Details', 'Look up package details by destination', 'catalog', false, '{"required":["country_code"],"properties":{"country_code":{"type":"string"}}}'),
  ('create_refund_request', 'Create Refund Request', 'Initiate a refund for an order (requires approval)', 'finance', true, '{"required":["order_id","reason"],"properties":{"order_id":{"type":"string"},"reason":{"type":"string"},"amount":{"type":"number"}}}'),
  ('create_escalation_ticket', 'Create Escalation Ticket', 'Create a support ticket for human review', 'support', false, '{"required":["subject","description"],"properties":{"subject":{"type":"string"},"description":{"type":"string"},"priority":{"type":"string"}}}'),
  ('schedule_followup', 'Schedule Follow-up', 'Schedule an automated follow-up message', 'engagement', false, '{"required":["conversation_id","delay_minutes","message"],"properties":{"conversation_id":{"type":"string"},"delay_minutes":{"type":"number"},"message":{"type":"string"}}}'),
  ('send_recovery_message', 'Send Recovery Message', 'Send a recovery/win-back message', 'engagement', false, '{"required":["customer_id","message"],"properties":{"customer_id":{"type":"string"},"message":{"type":"string"}}}'),
  ('create_sales_lead', 'Create Sales Lead', 'Log a qualified sales lead', 'sales', false, '{"required":["name","destination"],"properties":{"name":{"type":"string"},"destination":{"type":"string"},"data_usage":{"type":"string"},"trip_days":{"type":"number"}}}'),
  ('human_handoff', 'Hand Off to Human', 'Transfer conversation to a human agent', 'support', false, '{"required":["conversation_id","reason"],"properties":{"conversation_id":{"type":"string"},"reason":{"type":"string"},"priority":{"type":"string"}}}')
ON CONFLICT (action_type) DO NOTHING;