-- Enable RLS on tables that need it
ALTER TABLE wa_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;