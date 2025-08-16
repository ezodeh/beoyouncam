-- Review and strengthen participant data security policies
-- The current policies are secure but let's make them more explicit and add extra protection

-- Drop existing policies to recreate them with better clarity
DROP POLICY IF EXISTS "Anyone can insert participant" ON participants;
DROP POLICY IF EXISTS "Event owners can view all participants for their events" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant records" ON participants;

-- Create a more secure insert policy that ensures participants can only join visible events
CREATE POLICY "Users can join non-hidden events" 
ON participants 
FOR INSERT 
WITH CHECK (
  -- Only allow joining events that are not hidden
  EXISTS (
    SELECT 1 FROM events 
    WHERE token = participants.event_token 
    AND is_hidden = false
  )
);

-- Create a strict select policy that protects contact information
CREATE POLICY "Restricted access to participant data" 
ON participants 
FOR SELECT 
USING (
  -- Event owners can view all participants for their events
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.token = participants.event_token 
    AND e.owner_id = auth.uid()
  )
  OR
  -- Users can only view their own participant records
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Create an update policy for user's own records only
CREATE POLICY "Users can update their own participant records" 
ON participants 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Ensure no public delete access (participants should not be deleted casually)
-- Deletion should be handled by event owners through application logic if needed