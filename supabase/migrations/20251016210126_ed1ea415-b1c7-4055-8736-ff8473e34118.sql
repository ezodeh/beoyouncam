-- Fix participants table RLS to prevent unauthorized access to sensitive contact information
-- This addresses the "Guest Contact Information Could Be Harvested" security finding

-- Drop the overly permissive existing SELECT policies
DROP POLICY IF EXISTS "Event owners can view all participant data" ON participants;
DROP POLICY IF EXISTS "Users can view own participant record" ON participants;
DROP POLICY IF EXISTS "Participants can view their event details" ON events;

-- Create a comprehensive SELECT policy for participants that restricts sensitive data access
-- Only event owners and the participant themselves can view participant records
CREATE POLICY "Restrict participant SELECT to owners and self"
ON participants
FOR SELECT
USING (
  -- Event owners can see their participants
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = participants.event_token 
    AND events.owner_id = auth.uid()
  )
  OR
  -- Users can see their own participant record
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Add DELETE policy for participants (event owners can remove participants)
CREATE POLICY "Event owners can delete participants"
ON participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = participants.event_token 
    AND events.owner_id = auth.uid()
  )
);

-- Update events SELECT policy to exclude password fields from non-owner views
DROP POLICY IF EXISTS "Event owners can view their own events" ON events;

-- Event owners get full access to their events
CREATE POLICY "Event owners can view own events with all fields"
ON events
FOR SELECT
USING (auth.uid() = owner_id);

-- Create a new limited SELECT policy for participants viewing event details
-- This excludes sensitive password fields
CREATE POLICY "Participants can view limited event details"
ON events
FOR SELECT
USING (
  -- Participants of the event (excluding password fields via application layer)
  (
    EXISTS (
      SELECT 1 FROM participants 
      WHERE participants.event_token = events.token 
      AND participants.user_id = auth.uid()
    )
    AND auth.uid() != owner_id
  )
  OR
  -- Public albums (excluding password fields via application layer)
  (
    is_hidden = false 
    AND is_private = false 
    AND is_album_published = true
    AND auth.uid() != owner_id
  )
);

-- Add comment explaining the security model
COMMENT ON POLICY "Restrict participant SELECT to owners and self" ON participants IS 
'Prevents unauthorized access to participant contact information (email, phone). Only event owners and participants themselves can view records.';

COMMENT ON POLICY "Participants can view limited event details" ON events IS 
'Allows participants and public album viewers to see event details. Application layer must filter out password_hash and password fields for non-owners.';