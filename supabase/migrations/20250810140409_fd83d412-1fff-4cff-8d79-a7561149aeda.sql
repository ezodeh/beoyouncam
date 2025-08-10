-- Add only missing columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS share_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS album_publish_time TEXT DEFAULT 'after_event',
ADD COLUMN IF NOT EXISTS custom_publish_delay INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS welcome_title TEXT,
ADD COLUMN IF NOT EXISTS welcome_text TEXT,
ADD COLUMN IF NOT EXISTS invite_button_text TEXT,
ADD COLUMN IF NOT EXISTS album_title TEXT,
ADD COLUMN IF NOT EXISTS album_description TEXT,
ADD COLUMN IF NOT EXISTS album_cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_album_published BOOLEAN DEFAULT false;