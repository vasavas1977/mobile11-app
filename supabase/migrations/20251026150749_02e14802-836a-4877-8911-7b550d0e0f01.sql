-- Add parent_order_id and item_index columns to orders table
ALTER TABLE orders ADD COLUMN parent_order_id TEXT;
ALTER TABLE orders ADD COLUMN item_index INTEGER DEFAULT 1;

-- Add index for faster parent order lookups
CREATE INDEX idx_orders_parent_order_id ON orders(parent_order_id);

-- Update existing orders to set parent_order_id = order_id (for backwards compatibility)
UPDATE orders SET parent_order_id = order_id WHERE parent_order_id IS NULL;