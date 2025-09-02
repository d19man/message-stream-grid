-- Update user spvspv303@gmail.com to be superadmin
UPDATE public.profiles 
SET role = 'superadmin'::app_role 
WHERE email = 'spvspv303@gmail.com';