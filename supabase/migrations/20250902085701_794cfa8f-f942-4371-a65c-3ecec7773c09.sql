-- Allow users to view their admin's profile for subscription checking
CREATE POLICY "Users can view their admin profile" ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id 
    FROM public.profiles 
    WHERE admin_id = profiles.id
  )
);