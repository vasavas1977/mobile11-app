-- Add auto-renewal columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_renewal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS renewal_payment_method_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_renewal_attempt_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS renewal_failure_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS renewal_failure_reason TEXT;

-- Index for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_orders_auto_renewal 
ON orders(auto_renewal_enabled, status) 
WHERE auto_renewal_enabled = true AND status = 'completed';

-- Create renewal_logs table for tracking renewal events
CREATE TABLE IF NOT EXISTS renewal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  new_order_id UUID REFERENCES orders(id),
  error_message TEXT,
  triggered_by TEXT DEFAULT 'auto_cron' CHECK (triggered_by IN ('auto_cron', 'manual')),
  usage_at_renewal JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on renewal_logs
ALTER TABLE renewal_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own renewal logs
CREATE POLICY "Users can view own renewal logs" ON renewal_logs
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

-- Admins can view all renewal logs
CREATE POLICY "Admins can view all renewal logs" ON renewal_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert renewal logs (for edge function)
CREATE POLICY "Service role can insert renewal logs" ON renewal_logs
  FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_renewal_logs_order_id ON renewal_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_renewal_logs_created_at ON renewal_logs(created_at DESC);