-- Ensure RLS is actually disabled on sessions table
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

-- Check if there are any policies still active
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users with admin role can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can view sessions" ON public.sessions;