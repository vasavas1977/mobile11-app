-- Create GIN index for faster message ID searches in conversation metadata
CREATE INDEX IF NOT EXISTS idx_conversations_message_ids 
ON conversations USING GIN ((metadata->'message_ids'));

-- Create index for faster last_message_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id 
ON conversations ((metadata->>'last_message_id'));