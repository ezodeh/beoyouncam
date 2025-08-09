-- Add expected_guests column to events for attendance planning
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS expected_guests INTEGER NOT NULL DEFAULT 100;