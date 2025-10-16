-- Fix PUBLIC_EVENT_ACCESS: Restrict events table access to owners and participants only
-- Drop the overly permissive policy that allows all authenticated users to view all events
DROP POLICY IF EXISTS "Authenticated users can access visible events" ON events;

-- Drop existing policy if it exists and recreate with correct logic
DROP POLICY IF EXISTS "Participants can view their event details" ON events;

-- Create a more restrictive policy: Only event participants can view event details
CREATE POLICY "Participants can view their event details"
ON events
FOR SELECT
USING (
  -- Event owners can always view their events
  auth.uid() = owner_id
  OR
  -- Event participants can view the event they're part of
  EXISTS (
    SELECT 1 FROM participants
    WHERE participants.event_token = events.token
    AND participants.user_id = auth.uid()
  )
  OR
  -- Public albums can be viewed when published (for album viewing only)
  (
    is_hidden = false
    AND is_private = false
    AND is_album_published = true
  )
);

-- Fix SUPA_function_search_path_mutable: Set search_path on functions
-- Update prevent_plaintext_password function
CREATE OR REPLACE FUNCTION public.prevent_plaintext_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If password is being set and password_hash is null, reject it
  IF NEW.password IS NOT NULL AND NEW.password_hash IS NULL THEN
    RAISE EXCEPTION 'Plaintext passwords are not allowed. Use password_hash column with bcrypt.';
  END IF;
  
  -- If password_hash is being set, clear the password field
  IF NEW.password_hash IS NOT NULL THEN
    NEW.password = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

COMMENT ON POLICY "Participants can view their event details" ON events IS 
'SECURITY: Restricts event visibility to owners, participants, and published public albums only. 
Prevents unauthorized users from viewing private event details like passwords, descriptions, and guest counts.';