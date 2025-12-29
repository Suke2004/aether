-- Fix: Restrict invite code visibility to authenticated users only
-- Remove the overly permissive policy that allows anyone to view pending invites
DROP POLICY IF EXISTS "Anyone can view pending invites by code" ON public.family_links;

-- Create a more secure policy that requires authentication
-- Users can only view invite codes they're trying to claim (with a matching code in the request)
-- This is handled by the update policy already - children claim invites by updating them
-- We don't need a separate SELECT policy for anonymous enumeration