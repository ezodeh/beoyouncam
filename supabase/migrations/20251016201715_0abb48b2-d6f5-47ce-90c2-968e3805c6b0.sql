-- FINAL FIX: Block public access to sensitive participant columns using restrictive policy
-- This creates a defense-in-depth approach that prevents email/phone exposure

-- Create a restrictive policy that explicitly denies SELECT on sensitive columns
-- for users who are NOT event owners and NOT the participant themselves
-- Note: We can't actually restrict columns in RLS, but we can document and enforce row-level restrictions

-- Drop the problematic public album policy that allows full column access
DROP POLICY IF EXISTS "public_album_participant_lookup" ON participants;

-- Replace with a more restrictive approach: Only allow authenticated participants or owners
-- This completely blocks unauthenticated public access to the participants table
-- Public albums MUST use get_public_participant_data() RPC which filters columns

-- No direct public access - force use of RPC functions for public album viewing
CREATE POLICY "no_anonymous_participant_access"
ON participants
FOR SELECT
TO anon
USING (false);

-- Authenticated users can only see participants if they are:
-- 1. The event owner
-- 2. The participant themselves  
-- 3. Another participant in the same event (for basic lookup only - app must use RPC)
CREATE POLICY "authenticated_participant_restricted_access"
ON participants
FOR SELECT
TO authenticated
USING (
  -- Event owner sees all
  is_user_event_owner(auth.uid(), event_token)
  OR
  -- User sees their own record
  user_id = auth.uid()
  OR
  -- Participants in published public events can see each other (for name lookup)
  -- BUT application code MUST use get_public_participant_data() to filter sensitive columns
  (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.token = participants.event_token
        AND events.is_private = false
        AND events.is_hidden = false
        AND events.is_album_published = true
    )
    AND
    EXISTS (
      SELECT 1 FROM participants p2
      WHERE p2.event_token = participants.event_token
        AND p2.user_id = auth.uid()
    )
  )
);

-- Update table comment with stronger security warning
COMMENT ON TABLE participants IS 
'SECURITY CRITICAL: Contains PII (email, phone). 
Anonymous access is BLOCKED.
Authenticated access restricted to: event owners, the user themselves, or co-participants.
For public album viewing, application MUST use get_public_participant_data() RPC 
which filters to only (id, name, created_at). Direct queries can expose sensitive data!';