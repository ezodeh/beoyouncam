-- Add thumbnail_path column to media_submissions table for video thumbnails
ALTER TABLE public.media_submissions 
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;