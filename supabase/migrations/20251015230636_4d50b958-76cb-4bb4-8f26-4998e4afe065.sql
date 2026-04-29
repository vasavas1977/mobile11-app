-- Allow anyone (including non-authenticated users) to view active eSIM packages
CREATE POLICY "Anyone can view active eSIM packages"
  ON public.esim_packages
  FOR SELECT
  USING (is_active = true);