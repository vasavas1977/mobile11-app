// Telecom Core Domain Types

export type SimType = 'physical' | 'esim';
export type SimStatus = 'inventory' | 'reserved' | 'active' | 'suspended' | 'deactivated' | 'lost';
export type PlanType = 'prepaid' | 'postpaid';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired' | 'terminated';
export type JobType = 'activate' | 'suspend' | 'resume' | 'terminate' | 'sync_usage' | 'change_plan' | 'topup';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
export type TransactionType = 'activation' | 'suspension' | 'reactivation' | 'termination' | 'topup' | 'plan_change' | 'renewal';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type EventEntityType = 'sim_card' | 'subscription' | 'job' | 'transaction' | 'plan';
export type EventActorType = 'user' | 'system' | 'cron' | 'webhook';
export type UsageSyncSource = 'api_poll' | 'webhook' | 'manual';

export interface TelecomSimCard {
  id: string;
  sim_type: SimType;
  iccid: string | null;
  msisdn: string | null;
  imsi: string | null;
  status: SimStatus;
  provider_id: string | null;
  mno_reference_id: string | null;
  assigned_user_id: string | null;
  assigned_org_id: string | null;
  order_id: string | null;
  activation_date: string | null;
  deactivation_date: string | null;
  batch_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  provider?: { name: string } | null;
  subscription?: TelecomSubscription | null;
}

export interface TelecomPlan {
  id: string;
  plan_name: string;
  plan_code: string | null;
  plan_type: PlanType;
  sim_type: 'physical' | 'esim' | 'both';
  data_limit_mb: number | null;
  voice_minutes: number | null;
  sms_limit: number | null;
  validity_days: number | null;
  monthly_cost: number;
  retail_price: number;
  currency: string;
  speed_tier: string | null;
  is_active: boolean;
  provider_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TelecomSubscription {
  id: string;
  sim_card_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  next_renewal_date: string | null;
  assigned_user_id: string | null;
  assigned_org_id: string | null;
  auto_renew: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  plan?: TelecomPlan | null;
  sim_card?: TelecomSimCard | null;
}

export interface TelecomUsageRecord {
  id: string;
  sim_card_id: string;
  subscription_id: string | null;
  record_date: string;
  data_used_mb: number;
  data_remaining_mb: number | null;
  voice_used_minutes: number;
  sms_used: number;
  sync_source: UsageSyncSource;
  mno_sync_id: string | null;
  created_at: string;
}

export interface TelecomTransaction {
  id: string;
  sim_card_id: string;
  subscription_id: string | null;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  initiated_by: string | null;
  mno_transaction_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TelecomProviderJob {
  id: string;
  job_type: JobType;
  sim_card_id: string;
  provider_id: string | null;
  status: JobStatus;
  request_payload: Record<string, unknown>;
  response_payload: Record<string, unknown> | null;
  attempts: number;
  max_attempts: number;
  next_retry_at: string | null;
  created_by: string | null;
  error_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  sim_card?: TelecomSimCard | null;
}

export interface TelecomEventLog {
  id: string;
  entity_type: EventEntityType;
  entity_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  actor_id: string | null;
  actor_type: EventActorType;
  created_at: string;
}
