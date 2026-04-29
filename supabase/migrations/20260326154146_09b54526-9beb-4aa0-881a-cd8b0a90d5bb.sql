
-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'commerce_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'territory_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reseller_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'distributor_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'api_partner_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'read_only_analyst';
