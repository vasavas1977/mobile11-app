-- Allow invited users to accept their invitation and join the organization
CREATE POLICY "Invited users can accept and join"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.organization_invitations inv
    JOIN public.profiles p ON lower(p.email) = lower(inv.email)
    WHERE inv.organization_id = organization_members.organization_id
      AND p.user_id = auth.uid()
      AND inv.status = 'pending'
      AND inv.expires_at > now()
      AND inv.role = organization_members.role
  )
);

-- Allow users to accept/decline their own invitation
CREATE POLICY "Users can accept their own invitation"
ON public.organization_invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND lower(p.email) = lower(email)
  )
  AND status = 'pending'
)
WITH CHECK (
  status IN ('accepted', 'declined')
);