-- CRITICAL FIX: Consolidate all WhatsApp sessions into single table and prevent conflicts

-- 1. Drop conflicting wa_sessions table that causes confusion
DROP TABLE IF EXISTS public.wa_sessions CASCADE;

-- 2. Drop wa_outbox that references the removed table
DROP TABLE IF EXISTS public.wa_outbox CASCADE;

-- 3. Ensure whatsapp_sessions table has all required columns for Baileys integration
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS auth_state jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 4. Update whatsapp_sessions to have proper structure for Baileys
ALTER TABLE public.whatsapp_sessions 
ALTER COLUMN status SET DEFAULT 'disconnected',
ALTER COLUMN last_seen SET DEFAULT now(),
ALTER COLUMN last_seen SET DATA TYPE timestamp with time zone USING last_seen::timestamp with time zone;

-- 5. Add trigger for automatic updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at_trigger ON public.whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at_trigger
    BEFORE UPDATE ON public.whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_sessions_updated_at();

-- 6. Ensure replica identity for realtime (skip publication since already added)
ALTER TABLE public.whatsapp_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;