-- Clean up duplicate WhatsApp sessions
DELETE FROM public.whatsapp_sessions 
WHERE id NOT IN (
  SELECT DISTINCT ON (session_name, user_id) id 
  FROM public.whatsapp_sessions 
  ORDER BY session_name, user_id, created_at DESC
);

-- Make session names more unique by adding timestamps in the app
-- This will prevent duplicate names from being created