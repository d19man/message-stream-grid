-- Update RLS policy for whatsapp_contacts to allow users to see contacts from their admin's sessions
DROP POLICY IF EXISTS "Users can view contacts from their sessions" ON whatsapp_contacts;

CREATE POLICY "Users can view contacts from their sessions" 
ON whatsapp_contacts 
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM whatsapp_sessions ws
    WHERE ws.id = whatsapp_contacts.session_id 
    AND (
      -- User can see their own sessions
      ws.user_id = auth.uid() OR
      -- Admin can see their sessions
      ws.admin_id = auth.uid() OR
      -- User can see sessions from their admin
      ws.admin_id IN (
        SELECT p.id 
        FROM profiles p 
        WHERE p.id = (SELECT admin_id FROM profiles WHERE id = auth.uid())
      ) OR
      -- Superadmin can see all
      get_current_user_role() = 'superadmin'::text
    )
  )
);