-- Create subscription types enum
CREATE TYPE public.subscription_type AS ENUM (
  'lifetime',
  'trial_1_day',
  'trial_3_days', 
  'trial_5_days',
  '1_month',
  '2_months',
  '3_months',
  '6_months',
  '1_year'
);

-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_type public.subscription_type DEFAULT NULL,
ADD COLUMN subscription_start TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN subscription_end TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN subscription_active BOOLEAN DEFAULT FALSE;

-- Create function to check if subscription is active
CREATE OR REPLACE FUNCTION public.is_subscription_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
    AND subscription_active = true
    AND (
      subscription_type = 'lifetime' 
      OR subscription_end > NOW()
    )
  );
END;
$$;

-- Create function to update subscription status
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-deactivate expired subscriptions (except lifetime)
  IF NEW.subscription_type != 'lifetime' AND NEW.subscription_end <= NOW() THEN
    NEW.subscription_active = false;
  END IF;
  
  -- Auto-activate subscriptions that are not expired
  IF NEW.subscription_end > NOW() OR NEW.subscription_type = 'lifetime' THEN
    NEW.subscription_active = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update subscription status
CREATE TRIGGER update_subscription_status_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_status();

-- Create RLS policy for superadmin to manage subscriptions
CREATE POLICY "Superadmins can manage subscriptions" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'::app_role));