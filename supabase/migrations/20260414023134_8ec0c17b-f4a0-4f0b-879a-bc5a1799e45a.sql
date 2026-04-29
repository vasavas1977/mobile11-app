UPDATE public.orders 
SET status = 'completed', 
    provider_status = 'NOTACTIVE',
    webhook_data = jsonb_set(
      COALESCE(webhook_data::jsonb, '{}'::jsonb),
      '{push_mode}',
      'true'::jsonb
    ),
    updated_at = now()
WHERE id = 'fc204588-0c54-443e-b2d2-0b063e3989b3';

UPDATE public.orders 
SET status = 'failed',
    provider_status = 'FAILED_NO_DEVICE_INFO',
    updated_at = now()
WHERE id = '36f98ab5-0a2e-4d6f-8aad-a2f42e01327e';