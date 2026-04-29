-- Remove the foreign key constraint that blocks customer messages
-- This allows sender_id to store either:
-- - Agent UUIDs (from auth.users when sender_type = 'agent')
-- - Customer UUIDs (from contacts when sender_type = 'customer')
ALTER TABLE conversation_messages
DROP CONSTRAINT IF EXISTS conversation_messages_sender_id_fkey;