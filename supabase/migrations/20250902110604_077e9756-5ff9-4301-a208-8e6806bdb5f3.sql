-- Create WhatsApp sessions table
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'qr_required', 'pairing_required')),
  qr_code TEXT,
  phone_number TEXT,
  auth_state JSONB,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Superadmin can manage all sessions"
ON public.whatsapp_sessions FOR ALL
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Admin can manage their assigned sessions"
ON public.whatsapp_sessions FOR ALL
USING (
  get_current_user_role() = 'admin' AND 
  admin_id = auth.uid()
);

CREATE POLICY "Users can view their own sessions"
ON public.whatsapp_sessions FOR SELECT
USING (user_id = auth.uid());

-- Create WhatsApp messages table
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  message_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document')),
  media_url TEXT,
  is_from_me BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their sessions"
ON public.whatsapp_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_sessions ws 
    WHERE ws.id = session_id 
    AND (ws.user_id = auth.uid() OR ws.admin_id = auth.uid() OR get_current_user_role() = 'superadmin')
  )
);

CREATE POLICY "System can insert messages"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (true);

-- Create WhatsApp contacts table
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  is_business BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, phone_number)
);

-- Enable RLS for contacts
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts  
CREATE POLICY "Users can view contacts from their sessions"
ON public.whatsapp_contacts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.whatsapp_sessions ws 
    WHERE ws.id = session_id 
    AND (ws.user_id = auth.uid() OR ws.admin_id = auth.uid() OR get_current_user_role() = 'superadmin')
  )
);

-- Update triggers for timestamps
CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all WhatsApp tables
ALTER TABLE public.whatsapp_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_contacts REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;