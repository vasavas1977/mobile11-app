-- Add included_countries column to store regional package details
ALTER TABLE esim_packages 
ADD COLUMN included_countries JSONB DEFAULT NULL;

-- Add GIN index for fast JSONB searches on included countries
CREATE INDEX idx_esim_packages_included_countries 
ON esim_packages USING gin (included_countries);

-- Add comment explaining the structure
COMMENT ON COLUMN esim_packages.included_countries IS 
'JSONB structure: {"countries": [{"name": "France", "code": "FR", "carriers": [{"name": "Orange", "networks": ["3G","4G","5G"]}]}]}';