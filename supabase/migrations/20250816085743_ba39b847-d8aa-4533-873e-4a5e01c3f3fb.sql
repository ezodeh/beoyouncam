-- Fix security vulnerability: Restrict public access to only safe event fields
-- Current policy exposes passwords, owner_ids, and private details to public

-- Create a function that returns only safe public fields
CREATE OR REPLACE FUNCTION public.get_public_event_info(event_token text)
RETURNS TABLE (
  token text,
  title text,
  description text,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_private boolean,
  cover_url text,
  welcome_title text,
  welcome_text text,
  invite_button_text text,
  show_header boolean,
  is_album_published boolean,
  album_title text,
  album_description text,
  album_cover_url text
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    e.token,
    e.title,
    e.description,
    e.start_at,
    e.end_at,
    e.is_private,
    e.cover_url,
    e.welcome_title,
    e.welcome_text,
    e.invite_button_text,
    e.show_header,
    e.is_album_published,
    e.album_title,
    e.album_description,
    e.album_cover_url
  FROM events e 
  WHERE e.token = event_token 
    AND e.is_hidden = false;
$$;

-- Drop the current public policy that exposes all fields
DROP POLICY IF EXISTS "Public can view basic event info for joining" ON events;

-- Create a much more restrictive public policy
-- This policy should only be used for very specific authenticated operations
CREATE POLICY "Authenticated users can access events for participation" 
ON events 
FOR SELECT 
USING (
  -- Only allow authenticated users to access events for participation purposes
  auth.uid() IS NOT NULL
  AND is_hidden = false
  AND (
    -- Users who are participants in the event
    EXISTS (
      SELECT 1 FROM participants p 
      WHERE p.event_token = events.token 
      AND p.user_id = auth.uid()
    )
    OR
    -- Event owners (they already have their own policy)
    owner_id = auth.uid()
  )
);

-- For completely anonymous access (like password validation), 
-- applications should use the get_public_event_info function instead of direct table access