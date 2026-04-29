UPDATE esim_packages
SET is_active = true, updated_at = now()
WHERE provider_metadata->>'source' = 'bulk-import-multi'
  AND is_active = false;