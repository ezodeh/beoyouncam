-- Fix infinite recursion in events table policies

-- Drop the problematic events policies  
DROP POLICY IF EXISTS "Authenticated users can access events for participation" ON events;

-- Create a simpler, safer policy for authenticated participants
CREATE POLICY "Authenticated users can access visible events" 
ON events 
FOR SELECT 
USING (
  -- Allow authenticated users to access non-hidden events
  auth.uid() IS NOT NULL 
  AND is_hidden = false
);

-- The existing "Event owners can view their own events" policy should remain untouched
-- as it's working correctly