-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Parents can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Parents can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Parents can insert transactions" ON public.transactions;

-- Create a security definer function to check if user is a parent
CREATE OR REPLACE FUNCTION public.is_parent(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'parent'::app_role
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Parents can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_parent(auth.uid()));

CREATE POLICY "Parents can view all transactions"
ON public.transactions
FOR SELECT
USING (public.is_parent(auth.uid()));

CREATE POLICY "Parents can insert transactions"
ON public.transactions
FOR INSERT
WITH CHECK (public.is_parent(auth.uid()));