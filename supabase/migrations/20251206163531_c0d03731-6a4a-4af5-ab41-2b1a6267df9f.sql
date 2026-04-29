-- Add column to track expiry warning emails
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expiry_warning_sent_at TIMESTAMP WITH TIME ZONE;