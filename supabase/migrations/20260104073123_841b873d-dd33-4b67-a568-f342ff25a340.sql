-- Add RLS policies for trusted_devices table to allow users to manage their own devices

-- Users can view their own trusted devices
CREATE POLICY "Users can view their own trusted devices"
ON public.trusted_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can insert their own trusted devices"
ON public.trusted_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own trusted devices
CREATE POLICY "Users can update their own trusted devices"
ON public.trusted_devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete their own trusted devices"
ON public.trusted_devices
FOR DELETE
USING (auth.uid() = user_id);