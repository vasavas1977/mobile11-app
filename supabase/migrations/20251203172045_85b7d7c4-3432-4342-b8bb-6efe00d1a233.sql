-- Helper functions for affiliate tracking

-- Function to increment affiliate link click count
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_links
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE id = link_id;
  
  -- Also update the affiliate's total clicks
  UPDATE public.affiliates
  SET total_clicks = total_clicks + 1
  WHERE id = (SELECT affiliate_id FROM public.affiliate_links WHERE id = link_id);
END;
$$;

-- Function to increment affiliate link conversion count
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_conversions(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_links
  SET conversion_count = conversion_count + 1,
      updated_at = now()
  WHERE id = link_id;
END;
$$;

-- Function to update affiliate earnings when conversion is approved
CREATE OR REPLACE FUNCTION public.approve_affiliate_conversion(conversion_id uuid, admin_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversion RECORD;
BEGIN
  -- Get conversion details
  SELECT * INTO v_conversion
  FROM public.affiliate_conversions
  WHERE id = conversion_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversion not found or not pending';
  END IF;
  
  -- Update conversion status
  UPDATE public.affiliate_conversions
  SET status = 'approved',
      approved_at = now(),
      approved_by = admin_user_id
  WHERE id = conversion_id;
  
  -- Note: pending_earnings stays the same until payout
  -- The actual movement from pending to paid happens in process_affiliate_payout
END;
$$;

-- Function to process affiliate payout
CREATE OR REPLACE FUNCTION public.process_affiliate_payout(
  p_payout_id uuid,
  p_admin_user_id uuid,
  p_reference_number text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout RECORD;
  v_total_amount numeric;
BEGIN
  -- Get payout details
  SELECT * INTO v_payout
  FROM public.affiliate_payouts
  WHERE id = p_payout_id AND status IN ('pending', 'processing');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found or already processed';
  END IF;
  
  -- Update payout status
  UPDATE public.affiliate_payouts
  SET status = 'completed',
      processed_at = now(),
      processed_by = p_admin_user_id,
      reference_number = COALESCE(p_reference_number, reference_number)
  WHERE id = p_payout_id;
  
  -- Update affiliate earnings
  UPDATE public.affiliates
  SET pending_earnings = pending_earnings - v_payout.amount,
      paid_earnings = paid_earnings + v_payout.amount
  WHERE id = v_payout.affiliate_id;
  
  -- Mark related conversions as paid
  UPDATE public.affiliate_conversions
  SET status = 'paid',
      paid_at = now(),
      payout_id = p_payout_id
  WHERE affiliate_id = v_payout.affiliate_id
    AND status = 'approved'
    AND payout_id IS NULL
    AND commission_amount <= v_payout.amount;
END;
$$;

-- Function to generate unique link code
CREATE OR REPLACE FUNCTION public.generate_link_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate a random 6-character alphanumeric code
    new_code := lower(substr(md5(random()::text), 1, 6));
    
    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM public.affiliate_links WHERE link_code = new_code) INTO code_exists;
    
    -- Exit loop if unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;