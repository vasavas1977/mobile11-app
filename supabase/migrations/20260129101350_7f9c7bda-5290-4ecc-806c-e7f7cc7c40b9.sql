-- Flag Thailand Day Pass package as not supporting extension (Pattern B behavior)
UPDATE esim_packages 
SET supports_extension = false 
WHERE id = 'c4770249-75a9-4996-bf5e-078eb4e6e795';