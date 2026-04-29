-- Hide DOCOMO packages from Japan (can be re-enabled later)
UPDATE esim_packages
SET is_active = false, updated_at = now()
WHERE carrier ILIKE '%docomo%' AND country_name = 'Japan';