-- Remove the unique constraint on session_name in whatsapp_sessions that's causing duplicates
ALTER TABLE public.whatsapp_sessions DROP CONSTRAINT IF EXISTS whatsapp_sessions_session_name_key;

-- Instead, make the combination of session_name and user_id unique
ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_name_user_unique 
UNIQUE (session_name, user_id);