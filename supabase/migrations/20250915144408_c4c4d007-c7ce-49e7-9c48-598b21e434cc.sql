-- Fix INSERT policy to allow both authenticated and anonymous users
-- to join visible events

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can join visible events" ON public.participants;

-- Create new INSERT policy that allows both authenticated and anonymous users
CREATE POLICY "Anyone can join visible events" 
ON public.participants 
FOR INSERT 
WITH CHECK (
  -- Allow joining if event is visible (not hidden)
  -- This works for both authenticated and anonymous users
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = participants.event_token 
      AND events.is_hidden = false
  )
);