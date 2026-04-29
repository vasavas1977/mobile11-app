-- Mark all packages as inactive except Thailand packages
UPDATE esim_packages 
SET is_active = false 
WHERE country_name NOT ILIKE '%thailand%';

-- Ensure all Thailand packages are active
UPDATE esim_packages 
SET is_active = true 
WHERE country_name ILIKE '%thailand%';