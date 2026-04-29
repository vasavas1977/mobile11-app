-- Re-enable extension support for Thailand Day Pass package
-- The package was incorrectly flagged due to a false Pattern B detection
-- Order history confirms successful true extensions
UPDATE esim_packages 
SET supports_extension = true 
WHERE id = 'c4770249-75a9-4996-bf5e-078eb4e6e795';