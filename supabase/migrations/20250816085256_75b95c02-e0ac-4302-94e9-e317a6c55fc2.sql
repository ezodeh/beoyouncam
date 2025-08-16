-- Fix security vulnerability: Remove overly permissive policy that exposes participant personal data
-- The current "Anyone can view participant count for events" policy allows public access to all participant data

-- Drop both problematic policies
DROP POLICY IF EXISTS "Anyone can view participant count for events" ON participants;
DROP POLICY IF EXISTS "Public can view participant count only" ON participants;

-- For now, we'll rely only on the existing secure policy:
-- "Event owners can view all participants for their events" which properly restricts access to:
-- 1. Event owners for their own events
-- 2. Individual participants for their own data

-- If public participant counts are needed, they should be implemented through:
-- 1. A separate view/function that only exposes counts, not personal data
-- 2. Or application-level caching of participant counts
-- 3. Or a dedicated table for public event statistics