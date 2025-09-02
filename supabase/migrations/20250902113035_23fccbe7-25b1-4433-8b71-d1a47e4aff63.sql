-- Also disable RLS on whatsapp_sessions table to fix edge function
ALTER TABLE public.whatsapp_sessions DISABLE ROW LEVEL SECURITY;