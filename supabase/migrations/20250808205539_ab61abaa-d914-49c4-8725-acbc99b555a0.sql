-- Add missing columns used by the frontend
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS max_shots INTEGER NULL;

-- Ensure a sensible default for max_shots
ALTER TABLE public.events
  ALTER COLUMN max_shots SET DEFAULT 120;