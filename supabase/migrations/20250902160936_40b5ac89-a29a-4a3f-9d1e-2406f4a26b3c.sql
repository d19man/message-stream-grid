-- Clean up mock/sample session data
DELETE FROM public.sessions 
WHERE name IN ('Blaster Session 1', 'Warmup Session 1', '1') 
   OR phone IN ('+1987654321', '+1122334455');

-- Clean up any related whatsapp_sessions entries
DELETE FROM public.whatsapp_sessions 
WHERE session_name IN ('Blaster Session 1', 'Warmup Session 1', '1');