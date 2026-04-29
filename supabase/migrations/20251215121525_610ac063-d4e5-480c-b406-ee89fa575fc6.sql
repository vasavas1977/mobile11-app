-- Create function to increment affiliate clicks
CREATE OR REPLACE FUNCTION public.update_affiliate_clicks(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE affiliates
  SET total_clicks = COALESCE(total_clicks, 0) + 1,
      updated_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- Sync existing click counts from affiliate_clicks table
UPDATE affiliates a
SET total_clicks = (
  SELECT COUNT(*) FROM affiliate_clicks ac WHERE ac.affiliate_id = a.id
);