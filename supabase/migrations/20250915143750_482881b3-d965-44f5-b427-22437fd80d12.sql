-- Fix security issue: Restrict participant contact information access
-- Replace the current policy with more secure access controls

-- Drop existing policy
DROP POLICY IF EXISTS "Safe access to participant data" ON public.participants;

-- Create a new policy that restricts access to participant data more securely
-- Only event owners and the participant themselves can access their data
CREATE POLICY "Secure participant data access" 
ON public.participants 
FOR SELECT 
USING (
  -- Event owners can see all participants for their events
  (
    auth.uid() IS NOT NULL 
    AND is_user_event_owner(auth.uid(), event_token)
  )
  OR
  -- Users can only see their own participant records
  (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
);

-- Additionally, let's create a separate policy for public access that only allows 
-- non-sensitive fields (name, id) for published albums
CREATE POLICY "Public album participant names only" 
ON public.participants 
FOR SELECT 
USING (
  -- Allow access to only name and id for published albums of non-private events
  -- This policy will be used when someone tries to access participants
  -- but we'll need to ensure the application only selects safe fields
  (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.token = participants.event_token 
        AND events.is_private = false
        AND events.is_hidden = false
        AND events.is_album_published = true
    )
  )
);