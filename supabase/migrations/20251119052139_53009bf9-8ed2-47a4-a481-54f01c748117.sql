-- Drop the old package_type_check constraint that conflicts with non_stop values
ALTER TABLE esim_packages DROP CONSTRAINT IF EXISTS package_type_check;

-- The check_package_type constraint will remain and correctly allows 'non_stop'