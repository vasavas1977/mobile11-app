-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create fixed policy using auth.email() instead of querying auth.users
CREATE POLICY "Users can view their own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  email = auth.email()
  OR
  has_role(auth.uid(), 'admin'::app_role)
);