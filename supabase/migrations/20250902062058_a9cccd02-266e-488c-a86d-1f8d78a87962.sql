-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete their users" ON public.profiles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_admin_id()
RETURNS UUID AS $$
  SELECT admin_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create safe RLS policies using the functions
CREATE POLICY "Admins can view their users" 
ON public.profiles 
FOR SELECT 
USING (
  public.get_current_user_role() = 'superadmin' OR 
  (public.get_current_user_role() = 'admin' AND (admin_id = auth.uid() OR id = auth.uid())) OR
  (auth.uid() = id)
);

CREATE POLICY "Admins can update their users" 
ON public.profiles 
FOR UPDATE 
USING (
  public.get_current_user_role() = 'superadmin' OR 
  (public.get_current_user_role() = 'admin' AND admin_id = auth.uid()) OR
  (auth.uid() = id AND role::text NOT IN ('admin', 'superadmin'))
);

CREATE POLICY "Admins can insert their users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() = 'superadmin' OR 
  (public.get_current_user_role() = 'admin' AND admin_id = auth.uid())
);

CREATE POLICY "Admins can delete their users" 
ON public.profiles 
FOR DELETE 
USING (
  public.get_current_user_role() = 'superadmin' OR 
  (public.get_current_user_role() = 'admin' AND admin_id = auth.uid())
);