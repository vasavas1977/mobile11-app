-- Add markup and cost price columns to esim_packages
ALTER TABLE esim_packages 
ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_percentage numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_fixed numeric DEFAULT 0;

-- Update existing packages to have cost_price = price (initially)
UPDATE esim_packages 
SET cost_price = price 
WHERE cost_price = 0 OR cost_price IS NULL;

-- Add comment to clarify the columns
COMMENT ON COLUMN esim_packages.cost_price IS 'Original cost price from provider';
COMMENT ON COLUMN esim_packages.markup_percentage IS 'Percentage markup to add to cost price';
COMMENT ON COLUMN esim_packages.markup_fixed IS 'Fixed amount markup to add to cost price';
COMMENT ON COLUMN esim_packages.price IS 'Final selling price (calculated from cost + markups)';