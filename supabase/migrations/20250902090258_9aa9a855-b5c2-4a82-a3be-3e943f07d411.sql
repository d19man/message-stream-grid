-- Fix the function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';