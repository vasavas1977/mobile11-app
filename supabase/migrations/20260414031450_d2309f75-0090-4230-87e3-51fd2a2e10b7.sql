
-- Update Order 2 (cc512927) with new May 21 TUGE order
UPDATE orders SET
  provider_order_id = 'SE20260414111416530001',
  provider_status = 'RECEIVED',
  status = 'processing',
  webhook_data = jsonb_build_object(
    'push_mode', true,
    'device_eid2', '89049032020008884800239872835350',
    'device_imei2', '350453400140312',
    'orderNo', 'SE20260414111416530001',
    'designated_activate', true,
    'activation_date', '2026-05-21T00:00:00Z',
    'customer_requested_start', '2026-05-21',
    'customer_requested_end', '2026-06-03',
    'previous_tuge_orders', jsonb_build_array('SE20260413122319630001', 'SE20260414104128020001'),
    'corrected_at', '2026-04-14T03:14:16Z'
  ),
  updated_at = now()
WHERE id = 'cc512927-5568-4d77-b6cb-4879fd33a7d7';

-- Update Order 1 (fc204588) with new May 27 TUGE order
UPDATE orders SET
  provider_order_id = 'SE20260414111427510001',
  provider_status = 'RECEIVED',
  status = 'processing',
  webhook_data = jsonb_build_object(
    'push_mode', true,
    'device_eid2', '89049032020008884800239872835350',
    'device_imei2', '350453400140312',
    'orderNo', 'SE20260414111427510001',
    'designated_activate', true,
    'activation_date', '2026-05-27T00:00:00Z',
    'customer_requested_start', '2026-05-27',
    'customer_requested_end', '2026-06-03',
    'previous_tuge_order', 'SE20260414002432850001',
    'corrected_at', '2026-04-14T03:14:27Z'
  ),
  updated_at = now()
WHERE id = 'fc204588-0c54-443e-b2d2-0b063e3989b3';

-- Clean up duplicate order records created by create-tuge-order
DELETE FROM payments WHERE order_id IN ('7587750e-2414-4598-9a0e-27a6407b178c', 'b6cb911c-fd5f-4ee7-9c46-04d9cf2a5f2d');
DELETE FROM orders WHERE id IN ('7587750e-2414-4598-9a0e-27a6407b178c', 'b6cb911c-fd5f-4ee7-9c46-04d9cf2a5f2d');
