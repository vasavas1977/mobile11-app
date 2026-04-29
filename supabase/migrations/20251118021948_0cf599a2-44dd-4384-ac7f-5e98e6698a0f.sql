-- Create destination analytics table to track which destinations users click
CREATE TABLE IF NOT EXISTS public.destination_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destination TEXT NOT NULL,
  destination_type TEXT NOT NULL, -- 'country', 'region', or 'all'
  user_country TEXT NOT NULL, -- User's origin country (from IP)
  user_language TEXT NOT NULL, -- User's selected language
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID, -- Optional: track logged-in users
  session_id TEXT -- Optional: track anonymous sessions
);

-- Enable Row Level Security
ALTER TABLE public.destination_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all analytics
CREATE POLICY "Admins can view all analytics"
  ON public.destination_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for anyone to insert analytics (public tracking)
CREATE POLICY "Anyone can insert analytics"
  ON public.destination_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_destination_analytics_destination ON public.destination_analytics(destination);
CREATE INDEX idx_destination_analytics_user_country ON public.destination_analytics(user_country);
CREATE INDEX idx_destination_analytics_clicked_at ON public.destination_analytics(clicked_at DESC);

-- Create function to get popular destinations by origin country (for future admin dashboard)
CREATE OR REPLACE FUNCTION get_destination_stats(
  origin_country TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  destination TEXT,
  click_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.destination,
    COUNT(*) as click_count,
    COUNT(DISTINCT COALESCE(da.user_id::TEXT, da.session_id)) as unique_users
  FROM destination_analytics da
  WHERE 
    (origin_country IS NULL OR da.user_country = origin_country)
    AND da.clicked_at > now() - (days_back || ' days')::INTERVAL
  GROUP BY da.destination
  ORDER BY click_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;