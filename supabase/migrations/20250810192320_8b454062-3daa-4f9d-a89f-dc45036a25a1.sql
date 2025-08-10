-- Add is_hidden column to events table
ALTER TABLE public.events 
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.events.is_hidden IS 'Whether the event is hidden from public view';