-- Fix PUBLIC_PARTICIPANT_DATA: Make participant PII access more explicit and secure
-- Drop the confusing 'no_anonymous_participant_access' policy that uses 'false'
DROP POLICY IF EXISTS "no_anonymous_participant_access" ON participants;

-- Drop existing policies to recreate them with better structure
DROP POLICY IF EXISTS "owners_full_participant_access" ON participants;
DROP POLICY IF EXISTS "users_own_participant_access" ON participants;

-- Create clear, explicit policies for participant data access
-- Policy 1: Event owners can see all participant data for their events
CREATE POLICY "Event owners can view all participant data"
ON participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.token = participants.event_token
    AND events.owner_id = auth.uid()
  )
);

-- Policy 2: Users can view only their own participant records
CREATE POLICY "Users can view own participant record"
ON participants
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Add comment explaining the security model
COMMENT ON TABLE participants IS 
'SECURITY: Contains PII (email, phone). Access restricted to event owners and record owners only.
Album pages must use get_public_participant_data() RPC which filters sensitive fields.
Direct SELECT queries return full PII only to authorized users per RLS policies.';