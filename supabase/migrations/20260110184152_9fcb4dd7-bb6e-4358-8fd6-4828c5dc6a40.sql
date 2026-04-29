-- Fix Critical Security Issue: Public exposure of all orders via short_code

-- Drop the dangerous policy that exposes ALL orders to anyone
DROP POLICY IF EXISTS "Anyone can view order by short_code" ON orders;

-- Create a secure policy for order lookup by short_code
-- This requires either authentication (order owner or admin) 
-- OR uses a secure function approach via edge functions with service role
-- Since short_code lookup is typically used for order confirmation pages,
-- we'll require authentication for direct database access

-- Users can view their own orders (already exists, but keeping for clarity)
-- Admins can view all orders (already exists)

-- For unauthenticated short_code lookup (like confirmation pages),
-- this should go through an edge function that:
-- 1. Uses service role to query
-- 2. Returns only non-sensitive fields (status, expiry, package name)
-- 3. Never exposes PII like email, phone, ICCID, activation codes