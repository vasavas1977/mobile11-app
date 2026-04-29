-- Enable REPLICA IDENTITY FULL for complete row data in realtime
ALTER TABLE conversation_messages REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;