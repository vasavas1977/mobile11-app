UPDATE public.orders 
SET webhook_data = jsonb_set(
  COALESCE(webhook_data::jsonb, '{}'::jsonb),
  '{replaced_by_order_id}',
  '"50d4fd5f-eaa4-4264-a3db-de3fc0bb1e04"'::jsonb
)
WHERE id = 'cc512927-5568-4d77-b6cb-4879fd33a7d7';