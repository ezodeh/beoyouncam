-- Allow event owners to delete media submissions
CREATE POLICY "Event owners can delete media submissions" ON public.media_submissions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.token = media_submissions.event_token 
    AND events.owner_id = auth.uid()
  )
);

-- Allow event owners to delete blessings
CREATE POLICY "Event owners can delete blessings" ON public.blessings
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.token = blessings.event_token 
    AND events.owner_id = auth.uid()
  )
);

-- Allow event owners to update media submissions (for any update operations)
CREATE POLICY "Event owners can update media submissions" ON public.media_submissions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.token = media_submissions.event_token 
    AND events.owner_id = auth.uid()
  )
);

-- Allow event owners to update blessings (for any update operations)
CREATE POLICY "Event owners can update blessings" ON public.blessings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.token = blessings.event_token 
    AND events.owner_id = auth.uid()
  )
);