-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Children can accept family links" ON public.family_links;

-- Create a new policy that allows children to claim pending invites
-- This allows updating where the invite code exists and status is pending
CREATE POLICY "Children can claim pending invites"
ON public.family_links
FOR UPDATE
USING (
  status = 'pending' AND invite_code IS NOT NULL
)
WITH CHECK (
  child_id = auth.uid() AND status = 'active'
);