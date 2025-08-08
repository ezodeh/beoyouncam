-- Add scheduling and ownership to events, plus max shots
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS max_shots INTEGER NOT NULL DEFAULT 120;

-- Policies: allow owners to manage their events (insert/update/delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Owners can insert events'
  ) THEN
    CREATE POLICY "Owners can insert events" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Owners can update their events'
  ) THEN
    CREATE POLICY "Owners can update their events" ON public.events
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='events' AND policyname='Owners can delete their events'
  ) THEN
    CREATE POLICY "Owners can delete their events" ON public.events
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);
  END IF;
END$$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_events_token ON public.events(token);
