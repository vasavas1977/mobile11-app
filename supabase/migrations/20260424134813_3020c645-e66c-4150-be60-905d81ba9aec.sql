CREATE POLICY "Service role can insert bridge logs"
  ON public.voice_bridge_logs FOR INSERT
  TO service_role
  WITH CHECK (true);