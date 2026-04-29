-- Phase 1: Consolidate super_pass into day_pass
-- Step 1: Update all super_pass packages to day_pass with consistent speed format
UPDATE esim_packages 
SET 
  package_type = 'day_pass',
  speed_after_limit = '1 Mbps',
  updated_at = now()
WHERE package_type = 'super_pass';

-- Step 2: Standardize inconsistent speed_after_limit casing (384kbps → 384 Kbps)
UPDATE esim_packages 
SET 
  speed_after_limit = '384 Kbps',
  updated_at = now()
WHERE speed_after_limit = '384kbps';

-- Verification: Check package type distribution
-- Expected: day_pass: ~2,058, max_speed: 324, non_stop: 625, super_pass: 0
COMMENT ON TABLE esim_packages IS 'Migration completed: super_pass merged into day_pass. All day_pass packages now use speed_after_limit field to distinguish between 384 Kbps and 1 Mbps backup speeds.';