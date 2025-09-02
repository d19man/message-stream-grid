-- Add missing INSERT policies for sessions table
CREATE POLICY "Admin can create sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'admin'::text);

CREATE POLICY "Superadmin can create sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'superadmin'::text);

-- Also add INSERT policy for whatsapp_sessions
CREATE POLICY "Users can create their own whatsapp sessions" 
ON public.whatsapp_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);