
DROP POLICY IF EXISTS "Owners and participants can upload to event-media" ON storage.objects;

CREATE POLICY "Owners and participants can upload to event-media"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'event-media'
  AND (
    -- Event owners uploading cover/auxiliary images under covers/...
    (
      (storage.foldername(name))[1] = 'covers'
      AND auth.uid() IS NOT NULL
    )
    OR
    -- Owners uploading directly under events/<token>/...
    (
      (storage.foldername(name))[1] = 'events'
      AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.token = (storage.foldername(name))[2]
          AND e.owner_id = auth.uid()
      )
    )
    OR
    -- Verified participants of active, visible events uploading under events/<token>/...
    (
      (storage.foldername(name))[1] = 'events'
      AND EXISTS (
        SELECT 1
        FROM public.participants p
        JOIN public.events e ON e.token = p.event_token
        WHERE p.event_token = (storage.foldername(name))[2]
          AND e.is_hidden = false
          AND (e.start_at IS NULL OR e.start_at <= now())
          AND (e.end_at IS NULL OR e.end_at >= now())
          AND (
            (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
            OR p.user_id IS NULL
          )
      )
    )
  )
);
