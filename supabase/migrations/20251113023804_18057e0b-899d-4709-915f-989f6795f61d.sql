-- Drop the existing select policy for ticket messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON ticket_messages;

-- Create updated policy that checks both user_id and email
CREATE POLICY "Users can view messages for their tickets"
ON ticket_messages
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1
    FROM support_tickets
    WHERE support_tickets.id = ticket_messages.ticket_id
    AND (
      support_tickets.user_id = auth.uid()
      OR support_tickets.email = auth.email()
    )
  ))
  AND (
    NOT is_internal_note OR has_role(auth.uid(), 'admin'::app_role)
  )
);