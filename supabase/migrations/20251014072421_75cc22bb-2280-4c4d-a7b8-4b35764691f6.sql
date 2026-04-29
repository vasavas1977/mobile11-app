-- Add unique constraint on package_id for upsert operations
-- This allows syncing from USIMSA to update existing packages instead of creating duplicates

ALTER TABLE esim_packages 
ADD CONSTRAINT esim_packages_package_id_unique UNIQUE (package_id);