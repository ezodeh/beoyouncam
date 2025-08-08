-- Add owner_id to events and policies for ownership
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS owner_id uuid;

-- Ensure unique token for events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'events_token_key'
  ) THEN
    CREATE UNIQUE INDEX events_token_key ON public.events (token);
  END IF;
END $$;

-- Enable RLS (should already be enabled if there are policies)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies: insert/update by owner; select for all already exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Users can insert their own events'
  ) THEN
    CREATE POLICY "Users can insert their own events"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'events' AND policyname = 'Users can update their own events'
  ) THEN
    CREATE POLICY "Users can update their own events"
    ON public.events
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;

-- Participants: allow users to select their own participation records
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'participants' AND policyname = 'Users can view their own participant rows'
  ) THEN
    CREATE POLICY "Users can view their own participant rows"
    ON public.participants
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;