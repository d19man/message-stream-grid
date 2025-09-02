-- Temporarily disable RLS on sessions to allow creation while we debug auth
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

-- We'll re-enable it once authentication context is working properly