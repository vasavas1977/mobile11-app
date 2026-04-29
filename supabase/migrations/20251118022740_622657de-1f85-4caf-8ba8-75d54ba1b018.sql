-- Fix search_path security warning for get_destination_stats function
CREATE OR REPLACE FUNCTION get_destination_stats(
  origin_country TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  destination TEXT,
  click_count BIGINT,
  unique_users BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;