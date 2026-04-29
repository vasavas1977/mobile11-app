UPDATE public.orders 
SET status = 'failed',
    provider_status = 'FAILED_NO_DEVICE_INFO',
    updated_at = now()
WHERE id = 'cc512927-5568-4d77-b6cb-4879fd33a7d7';