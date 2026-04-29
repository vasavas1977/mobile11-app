-- Create admin activity logs table
CREATE TABLE public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_admin_activity_logs_admin_user_id ON public.admin_activity_logs(admin_user_id);
CREATE INDEX idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX idx_admin_activity_logs_entity_type ON public.admin_activity_logs(entity_type);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for edge functions)
CREATE POLICY "Service role can insert logs"
ON public.admin_activity_logs
FOR INSERT
WITH CHECK (true);

-- Create helper function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_admin_user_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_user_id,
    action_type,
    entity_type,
    entity_id,
    old_value,
    new_value,
    description,
    metadata
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_old_value,
    p_new_value,
    COALESCE(p_description, p_action_type || ' on ' || p_entity_type),
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;