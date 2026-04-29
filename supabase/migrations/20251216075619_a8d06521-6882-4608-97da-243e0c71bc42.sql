-- Allow guests (anonymous users) to create contacts without a user_id
CREATE POLICY "Guests can create contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (user_id IS NULL);

-- Allow authenticated users to create their own contact record
CREATE POLICY "Users can create their own contact" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);