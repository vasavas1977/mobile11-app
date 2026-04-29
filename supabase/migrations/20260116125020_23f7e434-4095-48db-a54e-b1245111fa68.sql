-- Fix foreign key constraints that block user deletion

-- Drop and recreate constraints with ON DELETE SET NULL for audit/tracking columns
ALTER TABLE public.affiliate_conversions DROP CONSTRAINT IF EXISTS affiliate_conversions_approved_by_fkey;
ALTER TABLE public.affiliate_conversions ADD CONSTRAINT affiliate_conversions_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.affiliate_payouts DROP CONSTRAINT IF EXISTS affiliate_payouts_processed_by_fkey;
ALTER TABLE public.affiliate_payouts ADD CONSTRAINT affiliate_payouts_processed_by_fkey 
  FOREIGN KEY (processed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.affiliates DROP CONSTRAINT IF EXISTS affiliates_approved_by_fkey;
ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.price_file_uploads DROP CONSTRAINT IF EXISTS price_file_uploads_uploaded_by_fkey;
ALTER TABLE public.price_file_uploads ADD CONSTRAINT price_file_uploads_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_created_by_fkey;
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.spam_filter_rules DROP CONSTRAINT IF EXISTS spam_filter_rules_created_by_fkey;
ALTER TABLE public.spam_filter_rules ADD CONSTRAINT spam_filter_rules_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets DROP CONSTRAINT IF EXISTS support_tickets_priority_changed_by_fkey;
ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_priority_changed_by_fkey 
  FOREIGN KEY (priority_changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing foreign key constraints with CASCADE for user-owned data
ALTER TABLE public.mobile11_money_transactions DROP CONSTRAINT IF EXISTS mobile11_money_transactions_user_id_fkey;
ALTER TABLE public.mobile11_money_transactions ADD CONSTRAINT mobile11_money_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.promo_code_usage DROP CONSTRAINT IF EXISTS promo_code_usage_user_id_fkey;
ALTER TABLE public.promo_code_usage ADD CONSTRAINT promo_code_usage_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.trusted_devices DROP CONSTRAINT IF EXISTS trusted_devices_user_id_fkey;
ALTER TABLE public.trusted_devices ADD CONSTRAINT trusted_devices_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_loyalty DROP CONSTRAINT IF EXISTS user_loyalty_user_id_fkey;
ALTER TABLE public.user_loyalty ADD CONSTRAINT user_loyalty_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also make nullable the columns that should allow SET NULL
ALTER TABLE public.affiliate_conversions ALTER COLUMN approved_by DROP NOT NULL;
ALTER TABLE public.affiliate_payouts ALTER COLUMN processed_by DROP NOT NULL;
ALTER TABLE public.affiliates ALTER COLUMN approved_by DROP NOT NULL;
ALTER TABLE public.price_file_uploads ALTER COLUMN uploaded_by DROP NOT NULL;
ALTER TABLE public.promo_codes ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.support_tickets ALTER COLUMN priority_changed_by DROP NOT NULL;