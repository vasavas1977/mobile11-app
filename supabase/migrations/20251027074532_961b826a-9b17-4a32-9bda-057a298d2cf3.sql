-- Backfill parent_order_id for existing extension orders
-- This updates orders that have originalOrderId in webhook_data but null parent_order_id

UPDATE orders
SET parent_order_id = (webhook_data->>'originalOrderId')
WHERE parent_order_id IS NULL
  AND webhook_data IS NOT NULL
  AND webhook_data->>'originalOrderId' IS NOT NULL
  AND webhook_data->>'originalOrderId' != ''
  AND webhook_data->>'originalOrderId' != order_id;