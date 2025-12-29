-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;

-- Create a new restrictive policy that only allows parents to read app settings
CREATE POLICY "Only parents can read app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (is_parent(auth.uid()));