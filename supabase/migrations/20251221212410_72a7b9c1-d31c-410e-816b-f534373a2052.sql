-- RLS policies for users to view conversations by matching email

-- Allow users to view conversations where contact email matches their profile email
CREATE POLICY "Users can view conversations by matching email"
ON conversations FOR SELECT
USING (
  contact_id IN (
    SELECT c.id FROM contacts c
    JOIN profiles p ON LOWER(c.email) = LOWER(p.email)
    WHERE p.user_id = auth.uid()
  )
);

-- Allow users to view messages in conversations where contact email matches their profile email
CREATE POLICY "Users can view messages by matching email"
ON conversation_messages FOR SELECT
USING (
  NOT is_internal_note AND
  conversation_id IN (
    SELECT conv.id FROM conversations conv
    JOIN contacts c ON conv.contact_id = c.id
    JOIN profiles p ON LOWER(c.email) = LOWER(p.email)
    WHERE p.user_id = auth.uid()
  )
);