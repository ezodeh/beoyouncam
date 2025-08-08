-- Add privacy and organizer country fields to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS country_code text;

-- Optional helpful index
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events (is_private, published_at);
