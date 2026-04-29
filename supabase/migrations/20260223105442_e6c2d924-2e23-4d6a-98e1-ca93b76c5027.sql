-- A1: Disable TUGE max_speed 1GB 7-day (USIMSA cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'T-Mobile/AT&T'
  AND package_type = 'max_speed' AND validity_days = 7 AND data_amount = '1GB';

-- A2: Disable USIMSA max_speed 30-day (1GB, 3GB, 5GB, 10GB — TUGE cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'AT&T / T-Mobile'
  AND package_type = 'max_speed' AND validity_days = 30
  AND data_amount IN ('1GB', '3GB', '5GB', '10GB');

-- A3: Disable TUGE max_speed 20GB 30-day (USIMSA cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'T-Mobile/AT&T'
  AND package_type = 'max_speed' AND validity_days = 30 AND data_amount = '20GB';

-- B: Disable USIMSA day_pass 15-day overlaps (TUGE cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'AT&T / T-Mobile'
  AND package_type = 'day_pass' AND validity_days = 15
  AND data_amount IN ('500MB', '1GB', '2GB', '3GB');

-- C: Disable USIMSA day_pass 20-day overlaps (TUGE cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'AT&T / T-Mobile'
  AND package_type = 'day_pass' AND validity_days = 20
  AND data_amount IN ('500MB', '1GB');

-- D: Disable USIMSA day_pass 30-day overlaps (TUGE cheaper)
UPDATE esim_packages SET is_active = false, updated_at = now()
WHERE country_name = 'USA' AND carrier = 'AT&T / T-Mobile'
  AND package_type = 'day_pass' AND validity_days = 30
  AND data_amount IN ('500MB', '1GB');