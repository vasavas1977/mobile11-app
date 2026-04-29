-- Clean up orphaned parent_order_id references
-- Set parent_order_id to NULL where the referenced parent order doesn't exist
UPDATE orders o1
SET parent_order_id = NULL
WHERE parent_order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders o2 
    WHERE o2.order_id = o1.parent_order_id
  );