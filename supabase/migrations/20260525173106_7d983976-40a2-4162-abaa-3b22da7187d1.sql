
-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1) Hide events.password / password_hash from PostgREST
--    (validate_event_password RPC bypasses via SECURITY DEFINER)
REVOKE SELECT (password, password_hash) ON public.events FROM anon, authenticated;

-- 2) Drop overly broad public SELECT on participants.
--    Public album code paths already use get_public_participant_data RPC.
DROP POLICY IF EXISTS "Public can view participant names for published albums" ON public.participants;

-- 3) Tighten blessings INSERT (was WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can insert blessings" ON public.blessings;
CREATE POLICY "Anyone can insert blessings on active events"
  ON public.blessings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.token = blessings.event_token
        AND e.is_hidden = false
        AND (e.start_at IS NULL OR e.start_at <= now())
        AND (e.end_at   IS NULL OR e.end_at   >= now())
    )
  );

-- 4) Tighten media_submissions INSERT.
--    Require event to be active AND not hidden; keep anon path (NULL user_id)
--    for guest uploads but only via a real participant on a live event.
DROP POLICY IF EXISTS "Participants can create their own media submissions" ON public.media_submissions;
CREATE POLICY "Participants can create media on active events"
  ON public.media_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.participants p
      JOIN public.events e ON e.token = p.event_token
      WHERE p.id = media_submissions.participant_id
        AND p.event_token = media_submissions.event_token
        AND e.is_hidden = false
        AND (e.start_at IS NULL OR e.start_at <= now())
        AND (e.end_at   IS NULL OR e.end_at   >= now())
        AND (
          (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
          OR p.user_id IS NULL
        )
    )
  );

-- 5) Tighten storage event-customization: only event owner can write under <token>/...
DROP POLICY IF EXISTS "Event owners can upload customization images" ON storage.objects;
DROP POLICY IF EXISTS "Event owners can update customization images" ON storage.objects;
DROP POLICY IF EXISTS "Event owners can delete customization images" ON storage.objects;

CREATE POLICY "Event owners can upload customization images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-customization'
    AND (
      EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.token = (storage.foldername(name))[1]
          AND e.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event owners can update customization images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-customization'
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.token = (storage.foldername(name))[1]
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can delete customization images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-customization'
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.token = (storage.foldername(name))[1]
        AND e.owner_id = auth.uid()
    )
  );

-- 6) Tighten storage event-media INSERT: only owners (covers/*) or participants (events/<token>/*)
DROP POLICY IF EXISTS "Anyone can upload to event-media" ON storage.objects;

CREATE POLICY "Owners and participants can upload to event-media"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'event-media'
    AND (
      -- Owner uploading event cover via CreateEvent (path: covers/<token>-<ts>.<ext>)
      (
        (storage.foldername(name))[1] = 'covers'
        AND auth.uid() IS NOT NULL
      )
      -- Participant uploading media (path: events/<token>/<file>)
      OR (
        (storage.foldername(name))[1] = 'events'
        AND EXISTS (
          SELECT 1
          FROM public.participants p
          JOIN public.events e ON e.token = p.event_token
          WHERE p.event_token = (storage.foldername(name))[2]
            AND e.is_hidden = false
            AND (e.start_at IS NULL OR e.start_at <= now())
            AND (e.end_at   IS NULL OR e.end_at   >= now())
            AND (
              (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
              OR p.user_id IS NULL
            )
        )
      )
    )
  );

-- 7) Realtime PII: remove participants table from realtime publication.
--    media_submissions and blessings stay published (no direct PII columns).
ALTER PUBLICATION supabase_realtime DROP TABLE public.participants;
