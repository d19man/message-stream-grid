-- Create profile for the authenticated user if it doesn't exist
-- This will allow the user to create sessions
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  auth.uid(),
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'admin'::app_role
FROM auth.users au
WHERE au.id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
);