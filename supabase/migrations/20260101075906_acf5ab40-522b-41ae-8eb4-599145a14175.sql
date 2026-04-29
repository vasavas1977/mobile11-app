-- Add unique constraint on endpoint for upsert operations
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- Add RLS policy for admins to read all subscriptions (for sending notifications)
CREATE POLICY "Admins can view all push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to delete expired subscriptions
CREATE POLICY "Admins can delete push subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));