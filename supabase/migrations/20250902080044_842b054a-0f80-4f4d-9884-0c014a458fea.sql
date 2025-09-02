-- Create sessions table for WhatsApp sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pool TEXT NOT NULL CHECK (pool IN ('CRM', 'BLASTER', 'WARMUP')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'connecting', 'disconnected')),
  phone TEXT,
  last_seen TEXT DEFAULT 'Never',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Superadmin can manage all sessions" 
ON public.sessions 
FOR ALL
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Admin can view sessions assigned to them or their users" 
ON public.sessions 
FOR SELECT
USING (
  get_current_user_role() = 'admin' AND 
  (admin_id = auth.uid() OR user_id IN (
    SELECT id FROM public.profiles WHERE admin_id = auth.uid()
  ))
);

CREATE POLICY "Admin can update sessions assigned to them" 
ON public.sessions 
FOR UPDATE
USING (
  get_current_user_role() = 'admin' AND admin_id = auth.uid()
);

CREATE POLICY "Users can view their own sessions" 
ON public.sessions 
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.sessions (name, pool, status, phone, last_seen, created_by) VALUES
('CRM Session 1', 'CRM', 'connected', '+1234567890', '2 minutes ago', (SELECT id FROM auth.users LIMIT 1)),
('Blaster Session 1', 'BLASTER', 'disconnected', '+1987654321', '1 hour ago', (SELECT id FROM auth.users LIMIT 1)),
('Warmup Session 1', 'WARMUP', 'connecting', '+1122334455', '5 minutes ago', (SELECT id FROM auth.users LIMIT 1));