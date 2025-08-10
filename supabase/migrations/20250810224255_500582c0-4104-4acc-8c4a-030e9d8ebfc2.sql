-- Create download_album edge function that creates a ZIP file with all event media and blessings
-- This function will be used to download complete event albums

-- First, create a function to check if user is event owner
CREATE OR REPLACE FUNCTION public.is_event_owner(event_token TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token AND owner_id = user_id
  );
$$;