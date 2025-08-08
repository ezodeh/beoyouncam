-- Ensure the 'event-media' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do update set public = excluded.public;

-- Allow public read access to files in the 'event-media' bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read for event-media'
  ) THEN
    CREATE POLICY "Public read for event-media"
    ON storage.objects
    FOR SELECT
    USING ( bucket_id = 'event-media' );
  END IF;
END$$;

-- Allow anyone (including anonymous) to upload to the 'event-media' bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Anyone can upload to event-media'
  ) THEN
    CREATE POLICY "Anyone can upload to event-media"
    ON storage.objects
    FOR INSERT
    WITH CHECK ( bucket_id = 'event-media' );
  END IF;
END$$;
