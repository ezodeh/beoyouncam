-- Update existing SMS references to WhatsApp in events table
UPDATE public.events 
SET share_method = 'whatsapp' 
WHERE share_method = 'sms';

-- Add comment to clarify the change
COMMENT ON COLUMN public.events.share_method IS 'Method for sharing album: email, whatsapp, none';