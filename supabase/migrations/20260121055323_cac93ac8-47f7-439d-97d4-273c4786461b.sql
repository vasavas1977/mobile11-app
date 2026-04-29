-- Allow org creators to insert the initial owner membership row
-- This unblocks the create-organization flow where we create the org first, then add the creator as 'owner'.
DROP POLICY IF EXISTS "Creators can add themselves as owner" ON public.organization_members;

CREATE POLICY "Creators can add themselves as owner"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::org_role
  AND EXISTS (
    SELECT 1
    FROM public.organizations o
    WHERE o.id = organization_id
      AND o.created_by = auth.uid()
  )
);
