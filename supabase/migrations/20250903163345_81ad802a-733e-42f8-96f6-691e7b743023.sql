-- Fix security warning: Function Search Path Mutable
ALTER FUNCTION public.update_whatsapp_sessions_updated_at() SET search_path = public;