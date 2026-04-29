-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Update the revenue calculation to include all orders, not just completed ones
-- This will help show data since your orders are currently "pending"