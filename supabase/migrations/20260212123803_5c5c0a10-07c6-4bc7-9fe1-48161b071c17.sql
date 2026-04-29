-- Activate all 1,249 inactive, non-local TUGE expansion packages
-- Safety: only targets is_active=false AND is_local_sim=false for TUGE provider
-- No existing live packages will be touched
UPDATE esim_packages
SET is_active = true, updated_at = now()
WHERE provider_id = '4e7e5af2-8e7a-4d5c-aea2-302fea9c5dac'
  AND is_active = false
  AND is_local_sim = false;