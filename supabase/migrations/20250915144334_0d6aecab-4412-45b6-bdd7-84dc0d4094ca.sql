-- Fix INSERT policy for participants table
-- Allow users to join visible events

-- Add INSERT policy for participants to join events
CREATE POLICY "Users can join visible events" 
ON public.participants 
FOR INSERT 
WITH CHECK (
  -- Allow joining if event is visible and not hidden
  is_event_visible(event_token)
);

-- Also allow UPDATE policy for users to update their own records
CREATE POLICY "Users can update own participant records" 
ON public.participants 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);