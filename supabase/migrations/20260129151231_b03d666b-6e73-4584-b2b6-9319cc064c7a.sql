-- Re-enable extensions for all previously blocked packages
-- These were incorrectly marked as non-extendable due to user error (changing data amounts)
UPDATE esim_packages 
SET supports_extension = true, 
    updated_at = now()
WHERE supports_extension = false;