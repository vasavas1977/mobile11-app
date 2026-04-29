ALTER TABLE public.voice_call_logs
  ADD COLUMN IF NOT EXISTS rating SMALLINT,
  ADD COLUMN IF NOT EXISTS rating_source TEXT,
  ADD COLUMN IF NOT EXISTS rating_text TEXT,
  ADD COLUMN IF NOT EXISTS rating_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS contact_id UUID,
  ADD COLUMN IF NOT EXISTS call_end_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'voice_call_logs_rating_range_chk'
  ) THEN
    ALTER TABLE public.voice_call_logs
      ADD CONSTRAINT voice_call_logs_rating_range_chk
      CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5));
  END IF;
END $$;