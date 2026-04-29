-- Add INSERT policy for payments table
-- Users can insert payments for their own orders
CREATE POLICY "Users can insert their own payments"
ON public.payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = payments.order_id
    AND orders.user_id = auth.uid()
  )
);