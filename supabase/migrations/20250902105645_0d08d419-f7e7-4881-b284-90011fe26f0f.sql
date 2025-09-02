-- Enable realtime for roles table
ALTER TABLE public.roles REPLICA IDENTITY FULL;

-- Add roles table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.roles;