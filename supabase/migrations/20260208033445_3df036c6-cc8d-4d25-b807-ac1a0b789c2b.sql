-- Remove "1Mbps" suffix from Global 109 Countries Limitless package names
UPDATE esim_packages 
SET name = REPLACE(name, ' 1Mbps', ''),
    updated_at = NOW()
WHERE name ILIKE '%Global 109 Countries%' 
  AND name ILIKE '%1Mbps%';