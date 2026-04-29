-- Consolidate Korea packages to South Korea
UPDATE esim_packages 
SET country_name = 'South Korea',
    updated_at = now()
WHERE country_name = 'Korea';