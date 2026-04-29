-- Allow public read of orders by short_code (only installation-relevant columns)
-- We create a security-definer function to safely return only needed fields
CREATE OR REPLACE FUNCTION public.get_esim_install_data(p_short_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'qr_code', o.qr_code,
    'smdp_address', o.smdp_address,
    'activation_code', o.activation_code,
    'download_link', o.download_link,
    'esim_packages', json_build_object(
      'country_name', ep.country_name,
      'data_amount', ep.data_amount,
      'validity_days', ep.validity_days
    )
  ) INTO result
  FROM orders o
  LEFT JOIN esim_packages ep ON ep.id = o.package_id
  WHERE o.short_code = p_short_code
  LIMIT 1;
  
  RETURN result;
END;
$$;