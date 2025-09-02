-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view their admin profile" ON public.profiles;

-- Create a security definer function to check if a user can view an admin's profile
CREATE OR REPLACE FUNCTION public.can_view_admin_profile(admin_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has this admin_id in their profile
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND admin_id = admin_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create a new policy using the security definer function
CREATE POLICY "Users can view their admin profile via function" ON public.profiles
FOR SELECT
USING (public.can_view_admin_profile(id));