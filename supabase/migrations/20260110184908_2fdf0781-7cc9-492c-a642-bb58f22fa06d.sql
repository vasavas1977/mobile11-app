-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.support_availability;

CREATE VIEW public.support_availability 
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'online') as agents_online,
  COALESCE(SUM(active_conversations), 0) as total_active_chats,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'online' AND active_conversations < max_conversations) > 0 
    THEN true 
    ELSE false 
  END as agents_available
FROM agent_status;

-- Grant access to the view
GRANT SELECT ON public.support_availability TO anon, authenticated;