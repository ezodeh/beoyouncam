-- Fix security vulnerability: Remove public access to private media submissions
-- The current "Anyone can view media submissions" policy exposes file paths, metadata, and private photos/videos
-- This allows unauthorized users to access private event media

-- Drop the dangerous policy that allows public access to all media submissions
DROP POLICY IF EXISTS "Anyone can view media submissions" ON media_submissions;

-- Create a secure policy that only allows authorized access to media submissions
CREATE POLICY "Authorized users can view media submissions" 
ON media_submissions 
FOR SELECT 
USING (
  -- Event owners can view all media submissions for their events
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = media_submissions.event_token 
    AND events.owner_id = auth.uid()
  )
  OR
  -- Participants can view their own media submissions
  EXISTS (
    SELECT 1 FROM participants p 
    WHERE p.id = media_submissions.participant_id 
    AND p.user_id = auth.uid()
  )
  OR
  -- Allow participants to view other media from the same event they're part of
  -- This maintains the album functionality where participants can see event photos
  EXISTS (
    SELECT 1 FROM participants p 
    WHERE p.event_token = media_submissions.event_token 
    AND p.user_id = auth.uid()
  )
);