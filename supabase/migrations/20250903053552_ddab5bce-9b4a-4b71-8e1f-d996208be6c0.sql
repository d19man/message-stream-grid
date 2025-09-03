-- Update check constraints to allow all necessary status values

-- Drop existing check constraints
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE whatsapp_sessions DROP CONSTRAINT IF EXISTS whatsapp_sessions_status_check;

-- Add new check constraints with all required status values
ALTER TABLE sessions 
ADD CONSTRAINT sessions_status_check 
CHECK (status IN ('disconnected', 'connecting', 'connected', 'qr_required', 'pairing_required', 'error'));

ALTER TABLE whatsapp_sessions 
ADD CONSTRAINT whatsapp_sessions_status_check 
CHECK (status IN ('disconnected', 'connecting', 'connected', 'qr_ready', 'pairing_ready', 'error'));