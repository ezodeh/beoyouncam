-- Fix event-customization storage upload (allow any authenticated user to upload,
-- since CreateEvent uploads cover images before the event token exists).
DROP POLICY IF EXISTS "Owners can upload event customization assets" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update event customization assets" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete event customization assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload event customization assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-customization');

CREATE POLICY "Authenticated users can update own event customization assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-customization' AND owner = auth.uid())
WITH CHECK (bucket_id = 'event-customization' AND owner = auth.uid());

CREATE POLICY "Authenticated users can delete own event customization assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-customization' AND owner = auth.uid());

-- Tighten participants INSERT: require user_id match when authenticated,
-- allow event owners to test hidden events, and improve clarity of failure cases.
DROP POLICY IF EXISTS "Anyone can join visible events" ON public.participants;

CREATE POLICY "Users can join events"
ON public.participants
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.token = participants.event_token
      AND (
        -- Visible event: anyone can join
        e.is_hidden = false
        OR
        -- Hidden event: only the owner (for testing) can join
        e.owner_id = auth.uid()
      )
  )
  AND (
    -- If authenticated, the user_id must match the auth user
    (auth.uid() IS NOT NULL AND participants.user_id = auth.uid())
    OR
    -- Anonymous joins (no auth) must leave user_id null
    (auth.uid() IS NULL AND participants.user_id IS NULL)
  )
);