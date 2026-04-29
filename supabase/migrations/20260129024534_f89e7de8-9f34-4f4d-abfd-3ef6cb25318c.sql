-- Add supports_extension column to esim_packages
-- This flag indicates whether the package supports true extension (same ICCID)
-- or if USIMSA creates a new eSIM profile instead

ALTER TABLE esim_packages 
ADD COLUMN IF NOT EXISTS supports_extension BOOLEAN DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN esim_packages.supports_extension IS 
'Whether this package supports true extension (same ICCID). False means USIMSA creates new eSIM profiles instead of extending.';

-- Mark known non-extendable packages (South East Asia multi-country packages)
UPDATE esim_packages 
SET supports_extension = false 
WHERE country_name ILIKE '%south east asia%' 
   OR country_name ILIKE '%southeast asia%';