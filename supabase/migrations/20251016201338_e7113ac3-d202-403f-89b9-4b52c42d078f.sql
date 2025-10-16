-- Fix participants table RLS to prevent direct public access to sensitive data
-- Drop all existing SELECT policies on participants table
DROP POLICY IF EXISTS "Event owners full access" ON participants;
DROP POLICY IF EXISTS "Users own records" ON participants;
DROP POLICY IF EXISTS "Deny direct public access to participants" ON participants;

-- Create a single restrictive policy that denies ALL direct SELECT access
-- This forces all access to go through secure RPC functions that filter sensitive data
CREATE POLICY "Block all direct participant queries"
ON participants
FOR SELECT
TO authenticated, anon
USING (false);

-- Keep the existing INSERT and UPDATE policies unchanged
-- (Anyone can join visible events, Users can update their own records)