-- Add columns to track priority changes and auto-escalation
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS initial_priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS priority_changed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS priority_changed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS auto_escalated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_escalated_at timestamp with time zone;