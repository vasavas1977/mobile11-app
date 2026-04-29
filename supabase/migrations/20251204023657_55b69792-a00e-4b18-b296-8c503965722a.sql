-- Create function to safely update affiliate statistics
CREATE OR REPLACE FUNCTION update_affiliate_stats(
  p_affiliate_id uuid,
  p_add_conversions integer DEFAULT 0,
  p_add_earnings numeric DEFAULT 0,
  p_add_pending_earnings numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET 
    total_conversions = COALESCE(total_conversions, 0) + p_add_conversions,
    total_earnings = COALESCE(total_earnings, 0) + p_add_earnings,
    pending_earnings = COALESCE(pending_earnings, 0) + p_add_pending_earnings,
    updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Fix the existing conversion stats for affiliate 7DD58102
UPDATE affiliates 
SET 
  total_conversions = 1,
  total_earnings = 0.03,
  pending_earnings = 0.03,
  updated_at = now()
WHERE id = '5443227f-978b-4a3f-9691-f6d6db5967c8';