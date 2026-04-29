-- Add public RLS policy for package_display_settings
-- This ensures anonymous users can view display settings
CREATE POLICY "Public can view display settings"
ON package_display_settings
FOR SELECT
TO public
USING (true);