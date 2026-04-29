-- Add columns to esim_packages for fields available from USIMSA API
ALTER TABLE esim_packages
ADD COLUMN IF NOT EXISTS qos_speed text,
ADD COLUMN IF NOT EXISTS is_cancelable boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sim_type text DEFAULT 'eSIM',
ADD COLUMN IF NOT EXISTS validity_period text DEFAULT '180Days';

-- Add comment for clarity
COMMENT ON COLUMN esim_packages.qos_speed IS 'Quality of Service speed (e.g., "384kbps", "512kbps")';
COMMENT ON COLUMN esim_packages.is_cancelable IS 'Whether the package can be canceled after purchase';
COMMENT ON COLUMN esim_packages.sim_type IS 'Type of SIM card (eSIM, Physical SIM, etc.)';
COMMENT ON COLUMN esim_packages.validity_period IS 'Validity period after activation (e.g., "180Days")';