-- Add is_hidden column to events table
ALTER TABLE public.events 
ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;