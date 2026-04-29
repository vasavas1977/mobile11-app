-- Push devices table for native iOS / Android push notifications
CREATE TABLE public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  token text NOT NULL,
  app_version text,
  device_model text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, token)
);

CREATE INDEX idx_push_devices_user_id ON public.push_devices(user_id);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own push devices"
  ON public.push_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own push devices"
  ON public.push_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own push devices"
  ON public.push_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own push devices"
  ON public.push_devices FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all push devices"
  ON public.push_devices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_push_devices_updated_at
  BEFORE UPDATE ON public.push_devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();