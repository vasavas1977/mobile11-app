-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create enhanced policy that checks both user_id and email
CREATE POLICY "Users can view their own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  has_role(auth.uid(), 'admin'::app_role)
);