ALTER TABLE public.voice_bot_config DROP CONSTRAINT voice_bot_config_mode_check;
ALTER TABLE public.voice_bot_config ADD CONSTRAINT voice_bot_config_mode_check 
  CHECK (mode = ANY (ARRAY['ai'::text, 'ai_live'::text, 'ivr'::text, 'forward'::text]));