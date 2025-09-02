-- Update role enum to include new user types
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'crm';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'blaster'; 
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warmup';

-- Add admin_id column to track which admin owns which users
ALTER TABLE public.profiles 
ADD COLUMN admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin_id ON public.profiles(admin_id);

-- Update RLS policies for admin isolation
DROP POLICY IF EXISTS "Admins can view their users" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage their users" ON public.profiles;

-- Policy for admins to view only their own users and themselves
CREATE POLICY "Admins can view their users" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND (admin_id = auth.uid() OR id = auth.uid())) OR
  (auth.uid() = id)
);

-- Policy for admins to update their users
CREATE POLICY "Admins can update their users" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid()) OR
  (auth.uid() = id AND role NOT IN ('admin'::app_role, 'superadmin'::app_role))
);

-- Policy for admins to insert their users
CREATE POLICY "Admins can insert their users" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid())
);

-- Policy for admins to delete their users
CREATE POLICY "Admins can delete their users" 
ON public.profiles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'superadmin'::app_role) OR 
  (has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid())
);