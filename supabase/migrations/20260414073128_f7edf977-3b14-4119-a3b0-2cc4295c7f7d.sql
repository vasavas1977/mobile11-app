
UPDATE public.orders
SET 
  status = 'pending',
  webhook_data = jsonb_build_object(
    'reset_reason', 'USIMSA failed to provision - topupId 202604111225449576718956 returning api_error',
    'reset_at', now()::text,
    'original_topupId', '202604111225449576718956'
  ),
  updated_at = now()
WHERE id = 'e7f8b6fa-6dc8-4a46-8193-5e9695d5ac0e';
