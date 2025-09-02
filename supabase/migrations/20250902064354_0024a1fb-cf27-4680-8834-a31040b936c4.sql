-- Sync profile emails with auth.users emails
UPDATE profiles 
SET 
  email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id),
  full_name = CASE 
    WHEN profiles.id = '10456229-2703-4057-af47-33910810f222' THEN 'John Smith'
    ELSE profiles.full_name
  END
WHERE profiles.email != (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
   OR profiles.id = '10456229-2703-4057-af47-33910810f222';

-- Add trigger to keep profile email in sync with auth.users email
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profile email when auth.users email changes
  UPDATE public.profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();