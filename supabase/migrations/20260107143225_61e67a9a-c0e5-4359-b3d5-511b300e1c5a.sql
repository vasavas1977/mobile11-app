-- Add caching columns for eSIM usage data to reduce USIMSA API calls
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cached_usage JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS usage_cached_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the purpose
COMMENT ON COLUMN public.orders.cached_usage IS 'Cached eSIM usage data from USIMSA API to reduce vendor API calls';
COMMENT ON COLUMN public.orders.usage_cached_at IS 'Timestamp of when cached_usage was last updated';