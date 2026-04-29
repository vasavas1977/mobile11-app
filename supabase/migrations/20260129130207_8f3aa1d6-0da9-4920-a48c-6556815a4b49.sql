-- Recover order 1: Has complete USIMSA eSIM data with QR code
UPDATE orders 
SET status = 'completed',
    qr_code = webhook_data->>'qrcodeImgUrl',
    activation_code = webhook_data->>'activateCode',
    download_link = webhook_data->>'downloadLink',
    smdp_address = webhook_data->>'smdp'
WHERE id = '2ac72e74-6922-4ea3-820f-ea3da99a0881';

-- Recover order 2: Has complete USIMSA eSIM data with QR code
UPDATE orders 
SET status = 'completed',
    qr_code = webhook_data->>'qrcodeImgUrl',
    activation_code = webhook_data->>'activateCode',
    download_link = webhook_data->>'downloadLink',
    smdp_address = webhook_data->>'smdp'
WHERE id = 'bc4cba4a-1f36-4820-bc12-2f5311b0d04d';

-- Recover order 3: True extension completed successfully
UPDATE orders 
SET status = 'completed'
WHERE id = '35226601-ef4c-4f2c-88b8-de7f76b5d724';

-- Also update payments to completed
UPDATE payments 
SET status = 'completed'
WHERE order_id IN (
  '2ac72e74-6922-4ea3-820f-ea3da99a0881',
  'bc4cba4a-1f36-4820-bc12-2f5311b0d04d',
  '35226601-ef4c-4f2c-88b8-de7f76b5d724'
);