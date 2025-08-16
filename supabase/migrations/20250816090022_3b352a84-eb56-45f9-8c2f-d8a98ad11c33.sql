-- Create a secure function for password validation
CREATE OR REPLACE FUNCTION public.validate_event_password(event_token text, provided_password text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token 
      AND is_hidden = false
      AND password = provided_password
  );
$$;