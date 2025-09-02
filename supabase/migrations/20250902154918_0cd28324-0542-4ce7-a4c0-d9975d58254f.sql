-- Fix search_path for security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $function$
  SELECT admin_id FROM public.profiles WHERE id = auth.uid();
$function$;