-- Standardize Hong Kong naming (with space) across all packages
-- Update single country packages
UPDATE esim_packages 
SET country_name = 'Hong Kong'
WHERE country_name = 'Hongkong';

-- Update Hong Kong/Macau regional packages  
UPDATE esim_packages
SET country_name = 'Hong Kong/Macau'
WHERE country_name = 'Hongkong/Macau';

-- Update China/Hong Kong/Macau regional packages
UPDATE esim_packages
SET country_name = 'China/Hong Kong/Macau'  
WHERE country_name = 'China/Hongkong/Macau';