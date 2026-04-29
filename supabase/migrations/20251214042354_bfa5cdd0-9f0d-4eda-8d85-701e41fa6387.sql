-- Double all retail prices (price and normal_price) for active eSIM packages
UPDATE esim_packages
SET 
  price = price * 2,
  normal_price = CASE 
    WHEN normal_price > 0 THEN normal_price * 2 
    ELSE normal_price 
  END,
  updated_at = now()
WHERE is_active = true;