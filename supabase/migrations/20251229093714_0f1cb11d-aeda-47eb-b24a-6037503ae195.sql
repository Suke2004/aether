-- Create quests table for parent-assigned quests
CREATE TABLE public.quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tokens INTEGER NOT NULL DEFAULT 10,
  quest_type TEXT NOT NULL DEFAULT 'custom',
  verification_method TEXT NOT NULL DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_verification_method CHECK (verification_method IN ('ai', 'parent'))
);

-- Create pending_verifications table for parent verification fallback
CREATE TABLE public.pending_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL,
  quest_name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  image_path TEXT NOT NULL,
  ai_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quests
CREATE POLICY "Parents can create quests for linked children"
ON public.quests FOR INSERT
WITH CHECK (
  is_parent(auth.uid()) AND 
  parent_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.family_links 
    WHERE parent_id = auth.uid() 
    AND child_id = quests.child_id 
    AND status = 'active'
  )
);

CREATE POLICY "Parents can view quests they created"
ON public.quests FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Children can view their quests"
ON public.quests FOR SELECT
USING (child_id = auth.uid());

CREATE POLICY "Parents can update quests they created"
ON public.quests FOR UPDATE
USING (parent_id = auth.uid());

CREATE POLICY "Children can update their quest status"
ON public.quests FOR UPDATE
USING (child_id = auth.uid());

-- RLS Policies for pending_verifications
CREATE POLICY "Children can create pending verifications"
ON public.pending_verifications FOR INSERT
WITH CHECK (child_id = auth.uid());

CREATE POLICY "Parents can view pending verifications for their children"
ON public.pending_verifications FOR SELECT
USING (parent_id = auth.uid());

CREATE POLICY "Children can view their pending verifications"
ON public.pending_verifications FOR SELECT
USING (child_id = auth.uid());

CREATE POLICY "Parents can update pending verifications"
ON public.pending_verifications FOR UPDATE
USING (parent_id = auth.uid());