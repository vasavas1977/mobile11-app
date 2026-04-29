-- Allow anyone to create contacts for chat widget (public chat functionality)
CREATE POLICY "Anyone can create contacts for chat widget" 
ON public.contacts 
FOR INSERT 
WITH CHECK (true);