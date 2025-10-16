-- Fix infinite recursion in RLS policies
-- Create security definer functions to break circular dependencies between events and participants tables

-- Drop problematic policies
DROP POLICY IF EXISTS "Event owners can view all participant data" ON participants;
DROP POLICY IF EXISTS "Public can view participant names for published albums" ON participants;
DROP POLICY IF EXISTS "Participants can view limited event details" ON events;

-- Create security definer function to check if user owns an event
CREATE OR REPLACE FUNCTION public.user_owns_event(event_token_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE token = event_token_param
    AND owner_id = user_id_param
  );
$$;

-- Create security definer function to check if event is publicly accessible
CREATE OR REPLACE FUNCTION public.is_event_public_album(event_token_param text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE token = event_token_param
    AND is_hidden = false
    AND is_private = false
    AND is_album_published = true
  );
$$;

-- Create security definer function to check if user is participant in event
CREATE OR REPLACE FUNCTION public.is_user_participant(event_token_param text, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE event_token = event_token_param
    AND user_id = user_id_param
  );
$$;

-- Recreate participant policies using security definer functions
CREATE POLICY "Event owners can view all participant data"
ON participants
FOR SELECT
USING (
  public.user_owns_event(event_token, auth.uid())
);

CREATE POLICY "Public can view participant names for published albums"
ON participants
FOR SELECT
USING (
  public.is_event_public_album(event_token)
);

-- Recreate event policy using security definer function
CREATE POLICY "Participants can view limited event details"
ON events
FOR SELECT
USING (
  (public.is_user_participant(token, auth.uid()) AND auth.uid() <> owner_id)
  OR (is_hidden = false AND is_private = false AND is_album_published = true AND auth.uid() <> owner_id)
);