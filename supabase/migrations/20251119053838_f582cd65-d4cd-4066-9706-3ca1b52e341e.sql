-- Delete existing non_stop packages to prevent duplicates before re-import
DELETE FROM esim_packages WHERE package_type = 'non_stop';