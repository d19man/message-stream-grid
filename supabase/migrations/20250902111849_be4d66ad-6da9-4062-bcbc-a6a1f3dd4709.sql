-- Fix session creation policies to handle cases where user has a profile
-- First drop the existing INSERT policies that aren't working
DROP POLICY IF EXISTS "Admin can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Superadmin can create sessions" ON public.sessions;

-- Create new INSERT policies that work with the actual profile data
CREATE POLICY "Users with admin role can create sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Also allow users to create sessions assigned to themselves
CREATE POLICY "Users can create their own sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid()
  ) 
  AND (user_id = auth.uid() OR created_by = auth.uid())
);