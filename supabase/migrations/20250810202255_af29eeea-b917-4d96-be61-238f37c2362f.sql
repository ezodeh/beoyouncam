-- Add missing columns for custom publish date and time
ALTER TABLE public.events 
ADD COLUMN custom_publish_date TEXT,
ADD COLUMN custom_publish_time TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN public.events.custom_publish_date IS 'Custom publish date for specific time publishing (YYYY-MM-DD format)';
COMMENT ON COLUMN public.events.custom_publish_time IS 'Custom publish time for specific time publishing (HH:MM format)';