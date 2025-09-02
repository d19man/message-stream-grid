-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create wa_sessions table
CREATE TABLE IF NOT EXISTS wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('qr_ready','connected','disconnected')) NOT NULL DEFAULT 'qr_ready',
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create wa_outbox table  
CREATE TABLE IF NOT EXISTS wa_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  to_jid TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text','image','video','document','template')) NOT NULL DEFAULT 'text',
  payload_json JSONB NOT NULL,
  status TEXT CHECK (status IN ('queued','sent','failed')) NOT NULL DEFAULT 'queued',
  error_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wa_sessions_status ON wa_sessions(status);
CREATE INDEX IF NOT EXISTS idx_outbox_session ON wa_outbox(session_name, status);