-- Add columns to store cached installation data
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cached_installation jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installation_cached_at timestamptz DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.cached_installation IS 'Cached installation status from USIMSA API to reduce API calls';
COMMENT ON COLUMN public.orders.installation_cached_at IS 'Timestamp when installation status was last cached';