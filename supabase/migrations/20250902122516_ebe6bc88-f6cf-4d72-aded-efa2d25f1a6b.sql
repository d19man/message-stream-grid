-- Enable RLS on wa_sessions table
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on wa_outbox table  
ALTER TABLE wa_outbox ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wa_sessions
CREATE POLICY "Superadmin can manage all wa_sessions" 
ON wa_sessions 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Users can view wa_sessions" 
ON wa_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for wa_outbox
CREATE POLICY "Superadmin can manage all wa_outbox" 
ON wa_outbox 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Users can view their own wa_outbox" 
ON wa_outbox 
FOR SELECT 
USING (auth.uid() IS NOT NULL);