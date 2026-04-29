-- Fix organization_invitations security vulnerability
-- The current "Anyone can view invitation by token" policy exposes all invitations

-- Drop the insecure policy that allows anyone to view all invitations
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.organization_invitations;

-- Create a secure policy that only allows:
-- 1. Org admins to view invitations for their org (already exists but we'll enhance)
-- 2. Authenticated users to view their own invitation by matching their email
-- 3. Token lookup is intentionally NOT allowed via RLS - should be done server-side

-- Policy for users to view invitations sent to their email address
CREATE POLICY "Users can view invitations sent to their email"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (
  email = (SELECT lower(p.email) FROM profiles p WHERE p.user_id = auth.uid())
);