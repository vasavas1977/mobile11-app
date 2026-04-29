-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.destination_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.destination_analytics;

-- Create policies
CREATE POLICY "Admins can view all analytics"
  ON public.destination_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert analytics"
  ON public.destination_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_destination_analytics_destination ON public.destination_analytics(destination);
CREATE INDEX IF NOT EXISTS idx_destination_analytics_user_country ON public.destination_analytics(user_country);
CREATE INDEX IF NOT EXISTS idx_destination_analytics_clicked_at ON public.destination_analytics(clicked_at DESC);