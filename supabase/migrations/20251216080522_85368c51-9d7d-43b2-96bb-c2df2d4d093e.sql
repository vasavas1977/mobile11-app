-- Fix contacts INSERT RLS: remove conflicting restrictive policies and replace with a single permissive policy

-- Drop existing INSERT policies on contacts (names as previously created)
DROP POLICY IF EXISTS "Agents can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can create contacts for chat widget" ON public.contacts;
DROP POLICY IF EXISTS "Guests can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create their own contact" ON public.contacts;

-- Create a single permissive INSERT policy that supports:
-- 1) Guests (user_id IS NULL)
-- 2) Authenticated users (user_id = auth.uid())
-- 3) Agents (is_agent_or_higher)
CREATE POLICY "Allow contact creation for chat"
ON public.contacts
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  user_id IS NULL
  OR user_id = auth.uid()
  OR is_agent_or_higher(auth.uid())
);
