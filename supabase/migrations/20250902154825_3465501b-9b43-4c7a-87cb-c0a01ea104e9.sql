-- Create templates table
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text', 'image', 'audio', 'button', 'text_button', 'text_image', 'image_text_button')),
  allowed_in text[] NOT NULL DEFAULT '{}',
  content_json jsonb NOT NULL DEFAULT '{}',
  preview text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Superadmins can manage all templates" 
ON public.templates 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Admins can manage their users' templates" 
ON public.templates 
FOR ALL 
USING (
  (get_current_user_role() = 'admin' AND admin_id = auth.uid()) OR
  (get_current_user_role() = 'superadmin')
);

CREATE POLICY "Users can manage their own templates" 
ON public.templates 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create broadcast_jobs table
CREATE TABLE public.broadcast_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  pool text NOT NULL CHECK (pool IN ('CRM', 'BLASTER', 'WARMUP')),
  template_id uuid REFERENCES public.templates(id) ON DELETE CASCADE,
  target_contacts uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'running', 'paused', 'completed', 'failed')),
  plan_json jsonb NOT NULL DEFAULT '{}',
  stats jsonb NOT NULL DEFAULT '{"total": 0, "sent": 0, "failed": 0, "pending": 0}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for broadcast_jobs
ALTER TABLE public.broadcast_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for broadcast_jobs
CREATE POLICY "Superadmins can manage all broadcast jobs" 
ON public.broadcast_jobs 
FOR ALL 
USING (get_current_user_role() = 'superadmin');

CREATE POLICY "Admins can manage their users' broadcast jobs" 
ON public.broadcast_jobs 
FOR ALL 
USING (
  (get_current_user_role() = 'admin' AND admin_id = auth.uid()) OR
  (get_current_user_role() = 'superadmin')
);

CREATE POLICY "Users can manage their own broadcast jobs" 
ON public.broadcast_jobs 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for broadcast_jobs updated_at
CREATE TRIGGER update_broadcast_jobs_updated_at
BEFORE UPDATE ON public.broadcast_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();