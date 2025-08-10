-- Add header visibility setting for events
ALTER TABLE events 
ADD COLUMN show_header boolean DEFAULT true;