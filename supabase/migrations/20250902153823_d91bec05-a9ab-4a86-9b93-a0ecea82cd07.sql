-- Create contacts table for the application
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  name text,
  pool text NOT NULL DEFAULT 'CRM',
  tags text[] NOT NULL DEFAULT '{}',
  opt_out boolean NOT NULL DEFAULT false,
  last_contact_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(phone, user_id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can manage their own contacts" 
ON public.contacts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage their users' contacts" 
ON public.contacts 
FOR ALL 
USING (
  get_current_user_role() = 'admin'::text AND 
  admin_id = auth.uid()
)
WITH CHECK (
  get_current_user_role() = 'admin'::text AND 
  admin_id = auth.uid()
);

CREATE POLICY "Superadmins can manage all contacts" 
ON public.contacts 
FOR ALL 
USING (get_current_user_role() = 'superadmin'::text)
WITH CHECK (get_current_user_role() = 'superadmin'::text);

-- Add trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_admin_id ON public.contacts(admin_id);
CREATE INDEX idx_contacts_pool ON public.contacts(pool);
CREATE INDEX idx_contacts_tags ON public.contacts USING GIN(tags);