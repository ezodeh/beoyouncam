-- Fix participants table RLS to completely block direct queries
-- This ensures participant data (email, phone) can ONLY be accessed through secure RPC functions

-- First, drop all existing SELECT policies on participants
DROP POLICY IF EXISTS "Event owners full access" ON participants;
DROP POLICY IF EXISTS "Users own records" ON participants;
DROP POLICY IF EXISTS "Deny direct public access to participants" ON participants;
DROP POLICY IF EXISTS "Block all direct participant queries" ON participants;

-- Create a single policy that blocks ALL direct SELECT queries
-- This forces all reads to go through get_public_participant_data() and get_owner_participant_data()
-- which properly filter sensitive fields based on context
CREATE POLICY "Force RPC access only"
ON participants
FOR SELECT
USING (false);

-- Note: INSERT and UPDATE policies remain unchanged:
-- - Users can still join events via "Anyone can join visible events" 
-- - Users can still update their own records via "Users can update own participant records"