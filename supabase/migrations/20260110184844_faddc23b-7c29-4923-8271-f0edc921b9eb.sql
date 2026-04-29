-- Fix Security Issue: Agent status information exposed to public
-- Create an aggregate view for public access and restrict direct table access

-- Create a view that exposes only aggregate availability information (no individual agent details)
CREATE OR REPLACE VIEW public.support_availability AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'online') as agents_online,
  SUM(active_conversations) as total_active_chats,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'online' AND active_conversations < max_conversations) > 0 
    THEN true 
    ELSE false 
  END as agents_available
FROM agent_status;

-- Grant access to the view for public use (chat widget)
GRANT SELECT ON public.support_availability TO anon, authenticated;

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view agent status" ON agent_status;

-- Create a more restrictive policy - only authenticated users can view agent status
CREATE POLICY "Authenticated users can view agent status"
ON agent_status
FOR SELECT
USING (auth.uid() IS NOT NULL);