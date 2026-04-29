-- Customer Journey Templates table
CREATE TABLE public.customer_journey_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_key text UNIQUE NOT NULL,
  journey_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'support',
  trigger_intents text[] NOT NULL DEFAULT '{}',
  trigger_keywords text[] NOT NULL DEFAULT '{}',
  ideal_steps jsonb NOT NULL DEFAULT '[]',
  action_opportunities jsonb NOT NULL DEFAULT '[]',
  fallback_rules jsonb NOT NULL DEFAULT '{}',
  scoring_criteria jsonb NOT NULL DEFAULT '{}',
  success_outcomes jsonb NOT NULL DEFAULT '{}',
  handoff_triggers jsonb NOT NULL DEFAULT '[]',
  optimization_targets jsonb NOT NULL DEFAULT '{}',
  total_conversations integer NOT NULL DEFAULT 0,
  avg_resolution_rate numeric DEFAULT 0,
  avg_conversion_rate numeric DEFAULT 0,
  avg_satisfaction_score numeric DEFAULT 0,
  avg_dead_air_rate numeric DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Journey execution log
CREATE TABLE public.journey_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid REFERENCES public.customer_journey_templates(id),
  conversation_id uuid REFERENCES public.conversations(id),
  customer_id uuid REFERENCES public.contacts(id),
  current_step text,
  steps_completed jsonb NOT NULL DEFAULT '[]',
  actions_triggered jsonb NOT NULL DEFAULT '[]',
  outcome text,
  outcome_details jsonb,
  journey_score integer,
  matched_success_criteria boolean DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_journey_templates_key ON public.customer_journey_templates(journey_key);
CREATE INDEX idx_journey_templates_active ON public.customer_journey_templates(is_active);
CREATE INDEX idx_journey_executions_journey ON public.journey_executions(journey_id);
CREATE INDEX idx_journey_executions_conversation ON public.journey_executions(conversation_id);
CREATE INDEX idx_journey_executions_outcome ON public.journey_executions(outcome);

-- RLS
ALTER TABLE public.customer_journey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view journey templates" ON public.customer_journey_templates FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Admins can manage journey templates" ON public.customer_journey_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Agents can view journey executions" ON public.journey_executions FOR SELECT TO authenticated USING (public.is_agent_or_higher(auth.uid()));
CREATE POLICY "Service can insert journey executions" ON public.journey_executions FOR INSERT TO authenticated WITH CHECK (true);

-- Seed 7 journey templates
INSERT INTO public.customer_journey_templates (journey_key, journey_name, description, category, trigger_intents, trigger_keywords, ideal_steps, action_opportunities, fallback_rules, scoring_criteria, success_outcomes, handoff_triggers, optimization_targets) VALUES
('package_recommendation', 'Package Recommendation', 'Customer asks which eSIM package to buy', 'commerce', ARRAY['package_recommendation','destination_compatibility'], ARRAY['which package','recommend','best plan','how much data','going to','traveling to'], '[{"step":"identify_destination","description":"Ask or detect travel destination","required":true},{"step":"assess_needs","description":"Determine trip duration, data needs, budget","required":true},{"step":"present_options","description":"Show 2-3 ranked packages","required":true},{"step":"handle_objections","description":"Address concerns","required":false},{"step":"guide_purchase","description":"Provide purchase link","required":true}]'::jsonb, '[{"action":"check_package_details","when":"after destination identified","required":true},{"action":"create_sales_lead","when":"if user shares contact info","required":false},{"action":"generate_cart_url","when":"after package selected","required":true}]'::jsonb, '{"no_packages_found":"Suggest nearby countries or regional packages","budget_too_low":"Offer Lite plans","max_fallback_turns":3}'::jsonb, '{"min_accuracy":80,"min_clarity":85,"min_business_outcome":70,"must_present_packages":true}'::jsonb, '{"primary":"customer purchases a package","secondary":"customer bookmarks link","metric":"conversion_rate"}'::jsonb, '[{"trigger":"customer requests human","priority":"medium"},{"trigger":"enterprise inquiry","priority":"high"}]'::jsonb, '{"resolution_without_human":90,"conversion_rate":35,"satisfaction":85,"max_dead_air_seconds":120}'::jsonb),

('payment_problem', 'Payment Problem Resolution', 'Customer has a payment issue', 'support', ARRAY['payment_failed'], ARRAY['payment failed','cannot pay','card declined','payment error','charge failed'], '[{"step":"identify_order","description":"Find order with payment issue","required":true},{"step":"diagnose_issue","description":"Check payment status and failure reason","required":true},{"step":"offer_solution","description":"Resend link or suggest alternative","required":true},{"step":"verify_resolution","description":"Confirm payment completed","required":true}]'::jsonb, '[{"action":"check_payment_status","when":"immediately","required":true},{"action":"resend_payment_link","when":"if payment not completed","required":true},{"action":"send_recovery_message","when":"if customer goes silent","required":false}]'::jsonb, '{"order_not_found":"Ask for email or order reference","repeated_failure":"Suggest alternative payment method","max_fallback_turns":4}'::jsonb, '{"min_accuracy":90,"min_resolution":85,"min_empathy":75,"must_check_payment":true}'::jsonb, '{"primary":"payment completed","secondary":"working payment link sent","metric":"payment_recovery_rate"}'::jsonb, '[{"trigger":"suspected fraud","priority":"critical"},{"trigger":"system error after 2 retries","priority":"high"}]'::jsonb, '{"resolution_without_human":80,"payment_recovery_rate":60,"satisfaction":80,"max_dead_air_seconds":90}'::jsonb),

('activation_not_working', 'Activation Troubleshooting', 'Customer activated but cannot use data', 'support', ARRAY['activation_not_working','roaming_issue'], ARRAY['not working','no data','no internet','cannot connect','activation failed','no signal'], '[{"step":"identify_order","description":"Find order and check activation","required":true},{"step":"check_device_settings","description":"Guide APN and roaming settings","required":true},{"step":"verify_activation","description":"Check provider-side status","required":true},{"step":"troubleshoot","description":"Step-by-step device troubleshooting","required":true},{"step":"resolve_or_escalate","description":"Confirm working or escalate","required":true}]'::jsonb, '[{"action":"check_activation_status","when":"immediately","required":true},{"action":"check_order_status","when":"verify order active","required":true},{"action":"create_escalation_ticket","when":"if troubleshooting fails","required":false}]'::jsonb, '{"order_not_found":"Ask for QR code or email","device_incompatible":"Explain eSIM requirements","provider_issue":"Create escalation ticket","max_fallback_turns":5}'::jsonb, '{"min_accuracy":90,"min_resolution":80,"min_clarity":90,"must_check_activation":true}'::jsonb, '{"primary":"data connection working","secondary":"escalation ticket created","metric":"resolution_rate"}'::jsonb, '[{"trigger":"provider-side issue confirmed","priority":"high"},{"trigger":"customer frustrated after 5 messages","priority":"high"}]'::jsonb, '{"resolution_without_human":70,"satisfaction":80,"max_dead_air_seconds":60}'::jsonb),

('qr_resend', 'QR Code Resend', 'Customer needs QR code resent', 'support', ARRAY['qr_resend','esim_installation'], ARRAY['resend qr','lost qr','qr code','cannot find qr','send again','installation code'], '[{"step":"identify_order","description":"Find order needing QR","required":true},{"step":"verify_identity","description":"Confirm customer owns order","required":true},{"step":"resend_qr","description":"Trigger QR resend","required":true},{"step":"offer_installation_help","description":"Offer step-by-step guide","required":true}]'::jsonb, '[{"action":"resend_esim_qr","when":"after identity verified","required":true},{"action":"check_order_status","when":"verify order exists","required":true}]'::jsonb, '{"order_not_found":"Ask for email","already_installed":"Explain single-install policy","max_fallback_turns":3}'::jsonb, '{"min_accuracy":95,"min_resolution":90,"must_resend_qr":true}'::jsonb, '{"primary":"QR resent and confirmed","secondary":"installation guide provided","metric":"resolution_rate"}'::jsonb, '[{"trigger":"QR data missing","priority":"high"},{"trigger":"already installed on another device","priority":"medium"}]'::jsonb, '{"resolution_without_human":95,"satisfaction":90,"max_dead_air_seconds":60}'::jsonb),

('refund_request', 'Refund Request', 'Customer wants a refund', 'support', ARRAY['refund_request'], ARRAY['refund','money back','cancel order','want refund','return'], '[{"step":"identify_order","description":"Find order for refund","required":true},{"step":"understand_reason","description":"Ask why they want refund","required":true},{"step":"check_eligibility","description":"Verify refund policy","required":true},{"step":"attempt_retention","description":"Offer alternative solution","required":true},{"step":"process_or_escalate","description":"Create request or explain denial","required":true}]'::jsonb, '[{"action":"check_order_status","when":"immediately","required":true},{"action":"check_activation_status","when":"check if eSIM used","required":true},{"action":"create_refund_request","when":"if eligible","required":false}]'::jsonb, '{"not_eligible":"Explain policy with empathy, offer credit","partial_use":"Offer partial refund","max_fallback_turns":4}'::jsonb, '{"min_empathy":85,"min_policy_compliance":95,"min_resolution":80,"must_attempt_retention":true}'::jsonb, '{"primary":"issue resolved without refund","secondary":"refund request created","metric":"retention_rate"}'::jsonb, '[{"trigger":"customer threatens chargeback","priority":"critical"},{"trigger":"refund > $50","priority":"high"}]'::jsonb, '{"resolution_without_human":60,"retention_rate":40,"satisfaction":75,"max_dead_air_seconds":90}'::jsonb),

('silent_after_recommendation', 'Silent Customer Recovery', 'Customer silent after recommendation', 'commerce', ARRAY['package_recommendation'], ARRAY[]::text[], '[{"step":"detect_silence","description":"Identify silence after recommendation","required":true},{"step":"gentle_followup","description":"Send non-pushy check-in","required":true},{"step":"offer_help","description":"Ask if they need different options","required":true},{"step":"save_lead","description":"Capture lead for follow-up","required":true}]'::jsonb, '[{"action":"schedule_followup","when":"after 5 min silence","required":true},{"action":"send_recovery_message","when":"after 15 min","required":false},{"action":"create_sales_lead","when":"if contact info available","required":true}]'::jsonb, '{"still_silent":"Save as lead, max 2 follow-ups","responded_negatively":"Thank and close gracefully","max_fallback_turns":2}'::jsonb, '{"min_empathy":80,"min_business_outcome":60,"must_not_spam":true,"max_followups":2}'::jsonb, '{"primary":"customer returns and purchases","secondary":"lead captured","metric":"recovery_rate"}'::jsonb, '[{"trigger":"customer explicitly declines","priority":"low"}]'::jsonb, '{"recovery_rate":20,"conversion_rate":10,"satisfaction":85,"max_dead_air_seconds":300}'::jsonb),

('hot_lead_upsell', 'Hot Lead Upsell', 'High intent customer, upsell opportunity', 'commerce', ARRAY['package_recommendation','plan_upgrade'], ARRAY['upgrade','more data','unlimited','better plan','premium','business trip'], '[{"step":"detect_intent","description":"Identify high purchase intent","required":true},{"step":"understand_needs","description":"Deep-dive into usage requirements","required":true},{"step":"present_premium","description":"Show premium options with value props","required":true},{"step":"compare_value","description":"Compare cost per day/GB","required":true},{"step":"close_sale","description":"Provide purchase link with urgency","required":true}]'::jsonb, '[{"action":"check_package_details","when":"find premium options","required":true},{"action":"create_sales_lead","when":"capture high-value lead","required":true},{"action":"generate_cart_url","when":"for premium package","required":true}]'::jsonb, '{"price_objection":"Show value per day, mention peace of mind","needs_more_time":"Send comparison link","max_fallback_turns":3}'::jsonb, '{"min_business_outcome":80,"min_clarity":85,"must_present_premium":true}'::jsonb, '{"primary":"purchases premium package","secondary":"purchases any package","metric":"upsell_conversion_rate"}'::jsonb, '[{"trigger":"enterprise inquiry","priority":"high"},{"trigger":"bulk purchase","priority":"high"}]'::jsonb, '{"resolution_without_human":85,"upsell_conversion_rate":25,"satisfaction":85,"max_dead_air_seconds":120}'::jsonb);