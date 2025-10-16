-- Hash all existing plaintext passwords
UPDATE events 
SET password_hash = crypt(password, gen_salt('bf')),
    password = NULL
WHERE password IS NOT NULL 
  AND password_hash IS NULL;

-- Create function to grant temporary album access tokens
-- This creates a simple time-based access control without JWT complexity
CREATE OR REPLACE FUNCTION public.grant_album_access(
  event_token_param text,
  provided_password text
)
RETURNS TABLE(access_granted boolean, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Verify password first
  IF NOT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token_param 
      AND is_hidden = false
      AND password_hash IS NOT NULL
      AND password_hash = crypt(provided_password, password_hash)
  ) THEN
    RETURN QUERY SELECT false, NULL::timestamptz;
    RETURN;
  END IF;
  
  -- Grant access with 24-hour expiration
  RETURN QUERY SELECT true, (now() + interval '24 hours')::timestamptz;
END;
$$;

-- Create function to validate album access on server-side
-- This checks if access should be granted based on event privacy and ownership
CREATE OR REPLACE FUNCTION public.can_access_album(
  event_token_param text,
  user_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token_param 
      AND is_hidden = false
      AND (
        -- Public events are accessible
        is_private = false
        OR
        -- Event owners can access their own events
        owner_id = COALESCE(user_id_param, auth.uid())
        OR
        -- Private events without password are accessible when published
        (is_private = true AND password_hash IS NULL AND is_album_published = true)
      )
  );
$$;