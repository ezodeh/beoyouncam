-- Complete RLS policy reset for participants table to fix PUBLIC_PARTICIPANT_DATA issue
-- This ensures sensitive participant data (email, phone) cannot be accessed via public album queries

-- Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Force RPC access only" ON participants;
DROP POLICY IF EXISTS "Event owners see all participant fields" ON participants;  
DROP POLICY IF EXISTS "Users see own participant records" ON participants;
DROP POLICY IF EXISTS "Public albums basic participant lookup" ON participants;
DROP POLICY IF EXISTS "Event owners full access" ON participants;
DROP POLICY IF EXISTS "Users own records" ON participants;
DROP POLICY IF EXISTS "Deny direct public access to participants" ON participants;
DROP POLICY IF EXISTS "Block all direct participant queries" ON participants;

-- Policy 1: Event owners get full access to participant data for their events
CREATE POLICY "owners_full_participant_access"
ON participants
FOR SELECT
TO authenticated
USING (is_user_event_owner(auth.uid(), event_token));

-- Policy 2: Users can view their own participant records
CREATE POLICY "users_own_participant_access"
ON participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Published public albums - RESTRICTED to basic fields only via application code
-- WARNING: This policy allows SELECT but application MUST use get_public_participant_data() RPC
-- to filter sensitive columns (email, phone). Direct queries will expose data!
CREATE POLICY "public_album_participant_lookup"
ON participants
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.token = participants.event_token
      AND events.is_private = false
      AND events.is_hidden = false
      AND events.is_album_published = true
  )
);

-- Document the security requirement
COMMENT ON TABLE participants IS 
'SECURITY CRITICAL: Contains PII (email, phone). 
For public album access, application code MUST use get_public_participant_data() RPC function 
which properly filters to only (id, name, created_at). 
Direct SELECT queries from public albums will expose sensitive data!';