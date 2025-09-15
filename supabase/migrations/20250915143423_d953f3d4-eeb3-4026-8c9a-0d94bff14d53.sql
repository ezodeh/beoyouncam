-- Fix security issue: Restrict blessings access to authorized users only
-- Drop the overly permissive policy that allows anyone to read blessings
DROP POLICY IF EXISTS "Anyone can read blessings" ON public.blessings;

-- Create a secure policy that only allows access to:
-- 1. Event owners (for their events)
-- 2. Participants of the event (for events they've joined)
-- 3. Public access only for published albums of non-private events
CREATE POLICY "Secure blessings access" 
ON public.blessings 
FOR SELECT 
USING (
  -- Event owners can see all blessings for their events
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = blessings.event_token 
      AND events.owner_id = auth.uid()
  )
  OR
  -- Participants can see blessings for events they've joined
  (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM participants 
      WHERE participants.event_token = blessings.event_token 
        AND participants.user_id = auth.uid()
    )
  )
  OR
  -- Public access only for published albums of non-private events
  (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.token = blessings.event_token 
        AND events.is_private = false
        AND events.is_hidden = false
        AND events.is_album_published = true
    )
  )
);