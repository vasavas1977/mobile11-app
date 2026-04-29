-- Disable USIMSA day_pass where TUGE is cheaper (1,3,5,7,10 days, 500MB/1GB/2GB/3GB)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA'
  AND carrier = 'AT&T / T-Mobile'
  AND package_type = 'day_pass'
  AND validity_days IN (1, 3, 5, 7, 10)
  AND data_amount IN ('500MB', '1GB', '2GB', '3GB');

-- Disable TUGE day_pass where USIMSA is cheaper (20,30 days, 2GB/day and 3GB/day)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA'
  AND carrier = 'T-Mobile/AT&T'
  AND package_type = 'day_pass'
  AND validity_days IN (20, 30)
  AND data_amount IN ('2GB/day', '3GB/day');