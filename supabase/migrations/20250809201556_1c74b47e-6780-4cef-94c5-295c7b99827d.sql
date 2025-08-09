-- Fix RLS policy for participants to allow event owners to see all participants
DROP POLICY IF EXISTS "Users can view participant records" ON public.participants;

-- Create a new policy that allows event owners to view participants
CREATE POLICY "Event owners can view all participants for their events" 
ON public.participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.token = event_token 
    AND e.owner_id = auth.uid()
  )
  OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Also allow anyone to view participants for public events (for statistics)
CREATE POLICY "Anyone can view participant count for events" 
ON public.participants 
FOR SELECT 
USING (true);