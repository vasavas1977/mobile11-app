-- Lock down chat_email_verifications: no client-side access (edge function uses service role)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'chat_email_verifications'
      AND policyname = 'No direct access to chat email verifications'
  ) THEN
    CREATE POLICY "No direct access to chat email verifications"
    ON public.chat_email_verifications
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;