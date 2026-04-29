
-- =============================================
-- SECURITY FIX: Restrict user_loyalty UPDATE
-- Users should NOT be able to modify their own balances/tiers
-- All updates go through edge functions using service role
-- =============================================
DROP POLICY IF EXISTS "Users can update own loyalty" ON public.user_loyalty;

-- =============================================
-- SECURITY FIX: Restrict payments UPDATE
-- Users should NOT be able to update payment status
-- Payment updates only come from webhooks (service role)
-- =============================================
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;

-- =============================================
-- SECURITY FIX: Restrict provider_apn_config public access
-- APN configs contain sensitive provider/network data
-- AI chatbot uses service role so it still works
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active APN configs" ON public.provider_apn_config;

-- Allow authenticated users to read only non-sensitive APN fields
-- via a secure function instead of direct table access
-- The "Admins can manage APN configs" policy already exists for admin access
