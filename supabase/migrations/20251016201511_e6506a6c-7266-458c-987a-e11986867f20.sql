-- FINAL FIX: Remove public access to participants table entirely
-- All public album access MUST use get_public_participant_data() RPC

-- Drop the policy that allows public access
DROP POLICY IF EXISTS "Public albums basic participant lookup" ON participants;

-- Now only two policies remain:
-- 1. "Event owners see all participant fields" - event owners see everything
-- 2. "Users see own participant records" - users see their own data
-- 
-- Public album viewers will get empty results from direct queries
-- They MUST use get_public_participant_data() RPC which returns only (id, name, created_at)