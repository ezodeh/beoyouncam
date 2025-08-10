-- Add new columns to events table for privacy, sharing, welcome page customization, and album settings
ALTER TABLE public.events 
ADD COLUMN password TEXT,
ADD COLUMN share_method TEXT DEFAULT 'email',
ADD COLUMN album_publish_time TEXT DEFAULT 'after_event',
ADD COLUMN custom_publish_delay INTEGER DEFAULT 24,
ADD COLUMN welcome_title TEXT,
ADD COLUMN welcome_text TEXT,
ADD COLUMN invite_button_text TEXT,
ADD COLUMN album_title TEXT,
ADD COLUMN album_description TEXT,
ADD COLUMN album_cover_url TEXT,
ADD COLUMN is_album_published BOOLEAN DEFAULT false;