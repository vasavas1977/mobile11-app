UPDATE public.orders 
SET 
  status = 'processing',
  provider_order_id = 'SE20260414104128020001',
  provider_status = 'RECEIVED',
  webhook_data = jsonb_set(
    COALESCE(webhook_data::jsonb, '{}'::jsonb),
    '{replacement_info}',
    '{"replaced_by_order_id": "50d4fd5f-eaa4-4264-a3db-de3fc0bb1e04", "replacement_tuge_order": "SE20260414104128020001", "device_eid": "89049032020008884800239872835350", "device_imei2": "350453400140312", "replaced_at": "2026-04-14T10:41:00Z"}'::jsonb
  ),
  updated_at = now()
WHERE id = 'cc512927-5568-4d77-b6cb-4879fd33a7d7';