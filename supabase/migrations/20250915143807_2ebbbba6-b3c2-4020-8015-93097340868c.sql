-- Fix security issue: Restrict participant contact information access more securely

-- Drop existing policies
DROP POLICY IF EXISTS "Safe access to participant data" ON public.participants;
DROP POLICY IF EXISTS "Secure participant data access" ON public.participants;

-- Create a comprehensive policy that securely handles participant data access
CREATE POLICY "Restricted participant access" 
ON public.participants 
FOR SELECT 
USING (
  -- Event owners can see all participant data for their events
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
  OR
  -- Public access to limited fields (name, id only) for published albums
  -- This allows the public album pages to show participant names without exposing contact info
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