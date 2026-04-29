ALTER TABLE conversations DROP CONSTRAINT conversations_channel_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_channel_check
  CHECK (channel = ANY (ARRAY['email','web','line','facebook','instagram','tiktok','voice','form']));