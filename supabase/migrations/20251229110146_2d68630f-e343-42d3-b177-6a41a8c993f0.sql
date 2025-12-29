-- Add explicit DELETE policy for family_links table
-- Option 1: Allow parents to delete their own family links
CREATE POLICY "Parents can delete their family links"
ON public.family_links
FOR DELETE
USING (parent_id = auth.uid() AND is_parent(auth.uid()));

-- Create rate_limits table for server-side rate limiting
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_rate_limits_user_action_time ON public.rate_limits (user_id, action_type, created_at DESC);

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to insert their own rate limit entries
CREATE POLICY "Users can insert their own rate limit entries"
ON public.rate_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role to read all entries (for edge function)
-- The edge function uses service role key, so it can read/write regardless
-- No SELECT policy needed for regular users

-- Create function to check rate limits (used by edge functions)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action_type text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*)
  INTO request_count
  FROM public.rate_limits
  WHERE user_id = _user_id
    AND action_type = _action_type
    AND created_at > now() - (_window_seconds || ' seconds')::interval;

  -- Return true if under limit, false if exceeded
  RETURN request_count < _max_requests;
END;
$$;

-- Create function to record a rate limit entry
CREATE OR REPLACE FUNCTION public.record_rate_limit(
  _user_id uuid,
  _action_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rate_limits (user_id, action_type)
  VALUES (_user_id, _action_type);
  
  -- Clean up old entries (older than 1 hour) to prevent table bloat
  DELETE FROM public.rate_limits
  WHERE created_at < now() - interval '1 hour';
END;
$$;