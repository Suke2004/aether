-- Fix 1: Parents can only view transactions of their linked children (not all transactions system-wide)
DROP POLICY IF EXISTS "Parents can view all transactions" ON public.transactions;

CREATE POLICY "Parents can view linked children transactions"
ON public.transactions FOR SELECT
USING (
  auth.uid() = user_id OR
  (is_parent(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.family_links
    WHERE parent_id = auth.uid()
    AND child_id = transactions.user_id
    AND status = 'active'
  ))
);

-- Fix 2: Parents can only insert transactions for their linked children (not any user)
DROP POLICY IF EXISTS "Parents can insert transactions" ON public.transactions;

CREATE POLICY "Parents can insert transactions for linked children"
ON public.transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  (is_parent(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.family_links
    WHERE parent_id = auth.uid()
    AND child_id = transactions.user_id
    AND status = 'active'
  ))
);

-- Fix 3: Make quest-proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'quest-proofs';

-- Fix 4: Drop the overly permissive public storage policy
DROP POLICY IF EXISTS "Anyone can view quest proofs" ON storage.objects;

-- Fix 5: Create RLS policy for family members to access quest proofs
CREATE POLICY "Family members can view quest proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'quest-proofs' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.family_links
      WHERE (parent_id = auth.uid() AND child_id::text = (storage.foldername(name))[1])
      AND status = 'active'
    )
  )
);