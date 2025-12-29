-- Create family_links table for parent-child connections
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  linked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(parent_id, child_id)
);

-- Enable RLS
ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

-- Parents can view their own family links
CREATE POLICY "Parents can view their family links"
ON public.family_links
FOR SELECT
USING (parent_id = auth.uid() OR child_id = auth.uid());

-- Parents can create invite links
CREATE POLICY "Parents can create family links"
ON public.family_links
FOR INSERT
WITH CHECK (parent_id = auth.uid() AND public.is_parent(auth.uid()));

-- Parents can update their family links
CREATE POLICY "Parents can update their family links"
ON public.family_links
FOR UPDATE
USING (parent_id = auth.uid());

-- Children can update links they're part of (to accept)
CREATE POLICY "Children can accept family links"
ON public.family_links
FOR UPDATE
USING (child_id = auth.uid());

-- Allow children to view pending invites by code
CREATE POLICY "Anyone can view pending invites by code"
ON public.family_links
FOR SELECT
USING (status = 'pending' AND invite_code IS NOT NULL);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;