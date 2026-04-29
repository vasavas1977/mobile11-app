
-- Backfill eSIM callback data from webhook_data JSON to individual columns
UPDATE orders
SET 
  expiry_date = CASE 
    WHEN webhook_data->>'expiredDate' IS NOT NULL 
    THEN (webhook_data->>'expiredDate')::timestamp with time zone 
    ELSE NULL 
  END,
  download_link = webhook_data->>'downloadLink',
  smdp_address = webhook_data->>'smdp',
  activation_code = webhook_data->>'activateCode'
WHERE webhook_data IS NOT NULL 
  AND (expiry_date IS NULL OR download_link IS NULL OR smdp_address IS NULL OR activation_code IS NULL);
