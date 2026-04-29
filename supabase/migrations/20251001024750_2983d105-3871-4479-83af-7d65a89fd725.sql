-- Allow users to update their own orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own payments (when payment belongs to their order)
CREATE POLICY "Users can update their own payments"
ON public.payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
      AND o.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
      AND o.user_id = auth.uid()
  )
);