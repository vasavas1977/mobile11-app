-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Create new SELECT policy that allows:
-- 1. Organization members to view their org
-- 2. The creator to view the org they just created (for INSERT...RETURNING)
CREATE POLICY "Members and creators can view organizations" 
ON public.organizations 
FOR SELECT 
USING (
  is_org_member(id) OR created_by = auth.uid()
);