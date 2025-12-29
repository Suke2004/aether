-- Add SELECT policy for rate_limits table so users can only view their own entries
CREATE POLICY "Users can view their own rate limit entries"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);