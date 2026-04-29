-- Add featured package management fields
ALTER TABLE esim_packages 
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN featured_order INTEGER,
ADD COLUMN purchase_count INTEGER DEFAULT 0;

-- Create index for featured packages
CREATE INDEX idx_esim_packages_featured ON esim_packages(is_featured, featured_order) WHERE is_featured = true;

-- Add comment
COMMENT ON COLUMN esim_packages.is_featured IS 'Whether this package should appear in Popular Destinations section';
COMMENT ON COLUMN esim_packages.featured_order IS 'Display order for featured packages (lower numbers first)';
COMMENT ON COLUMN esim_packages.purchase_count IS 'Total number of purchases for this package';