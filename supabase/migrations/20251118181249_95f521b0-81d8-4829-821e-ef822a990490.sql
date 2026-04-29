-- Phase 1: Add Missing Columns and Constraints Only
ALTER TABLE esim_packages 
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS speed_after_limit TEXT,
ADD COLUMN IF NOT EXISTS daily_data_reset BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS daily_reset_amount TEXT;

-- Update package_type constraint with new naming
ALTER TABLE esim_packages
DROP CONSTRAINT IF EXISTS check_package_type;

ALTER TABLE esim_packages
ADD CONSTRAINT check_package_type 
CHECK (package_type IS NULL OR package_type IN ('day_pass', 'super_pass', 'max_speed', 'non_stop'));