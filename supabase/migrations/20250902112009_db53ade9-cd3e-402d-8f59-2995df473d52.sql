-- Add a temporary policy to allow authenticated users to create sessions
-- This will help debug the authentication issue
CREATE POLICY "Authenticated users can create sessions" 
ON public.sessions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Update the SELECT policy to also allow basic authenticated access
CREATE POLICY "Authenticated users can view sessions" 
ON public.sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);