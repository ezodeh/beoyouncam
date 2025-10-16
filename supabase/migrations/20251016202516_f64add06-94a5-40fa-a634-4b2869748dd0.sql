-- Fix PUBLIC_PARTICIPANT_DATA security issue
-- Drop the policy that allows co-participants to see sensitive data
-- Force all public album access through secure RPC functions

DROP POLICY IF EXISTS "authenticated_participant_restricted_access" ON participants;

-- Update table comment to reflect the secure access model
COMMENT ON TABLE participants IS 
'SECURITY CRITICAL: Contains PII (email, phone). 
Direct access restricted to: event owners (via owners_full_participant_access) and users themselves (via users_own_participant_access).
For public album viewing, application MUST use get_public_participant_data() or get_participant_by_name() RPCs which filter to only safe columns (id, name, created_at).
Anonymous access is completely blocked (via no_anonymous_participant_access).';