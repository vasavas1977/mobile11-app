-- Add column for user-side soft delete of order details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT false;