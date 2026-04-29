-- Create function to safely increment promo code usage
CREATE OR REPLACE FUNCTION public.increment_promo_code_usage(promo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = promo_id;
END;
$$;