-- Drop the existing insert policy for ticket messages
DROP POLICY IF EXISTS "Users can add messages to their tickets" ON ticket_messages;

-- Create updated policy that checks both user_id and email
CREATE POLICY "Users can add messages to their tickets"
ON ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR support_tickets.email = auth.email()
    )
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);