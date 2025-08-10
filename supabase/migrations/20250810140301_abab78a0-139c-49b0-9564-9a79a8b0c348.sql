-- Add new columns to events table for enhanced dashboard functionality

-- Privacy and sharing settings
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS share_method TEXT DEFAULT 'email';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_publish_time TEXT DEFAULT 'after_event';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_publish_delay INTEGER DEFAULT 24;

-- Welcome page customization
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS welcome_title TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS welcome_text TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS invite_button_text TEXT;

-- Album settings
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_title TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS album_cover_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_album_published BOOLEAN DEFAULT false;