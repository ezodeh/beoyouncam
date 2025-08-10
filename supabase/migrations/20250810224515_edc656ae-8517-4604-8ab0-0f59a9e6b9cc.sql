-- Fix the security warning by setting proper search_path for the function
CREATE OR REPLACE FUNCTION public.is_event_owner(event_token TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token AND owner_id = user_id
  );
$$;