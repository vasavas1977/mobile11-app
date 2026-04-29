-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;

-- Create a new simplified policy without auth.users reference
CREATE POLICY "Users can view their own tickets" ON support_tickets
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);