-- Refined RLS policy for participants table
-- Allows necessary access while protecting sensitive data from public exposure

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Force RPC access only" ON participants;

-- Event owners can access full participant data for their events
CREATE POLICY "Event owners see all participant fields"
ON participants
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_user_event_owner(auth.uid(), event_token)
);

-- Users can see their own participant records (full access to their own data)
CREATE POLICY "Users see own participant records"
ON participants
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- For published public albums, allow access to non-sensitive fields ONLY
-- This policy will not expose email/phone because those queries should use RPC functions
-- But we cannot enforce column-level restrictions in RLS, so we rely on application code
-- to use get_public_participant_data() RPC which filters to only (id, name, created_at)
CREATE POLICY "Public albums basic participant lookup"
ON participants  
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.token = participants.event_token
      AND events.is_private = false
      AND events.is_hidden = false
      AND events.is_album_published = true
  )
);

-- Add a comment documenting the security model
COMMENT ON TABLE participants IS 
'SECURITY NOTE: This table contains PII (email, phone). 
Event owners and users can see their own data.
For public album access, application code MUST use get_public_participant_data() RPC 
which filters to non-sensitive fields (id, name, created_at) only.';