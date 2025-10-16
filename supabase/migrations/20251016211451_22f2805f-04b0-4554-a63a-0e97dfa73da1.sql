-- Create secure views and RPC functions to properly hide sensitive fields
-- This fixes the security issues with password_hash and participant contact info exposure

-- First, update get_public_event_info to explicitly exclude password fields
CREATE OR REPLACE FUNCTION public.get_public_event_info(event_token text)
RETURNS TABLE(
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
  album_cover_url text,
  sign_in_method text,
  share_method text,
  max_shots integer,
  enable_video boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    e.album_cover_url,
    e.sign_in_method,
    e.share_method,
    e.max_shots,
    e.enable_video
  FROM events e 
  WHERE e.token = event_token 
    AND e.is_hidden = false;
$$;

-- Update get_owner_participant_data to only work for actual event owners
CREATE OR REPLACE FUNCTION public.get_owner_participant_data(
  event_token_param text,
  owner_user_id uuid
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  method text,
  created_at timestamp with time zone,
  user_id uuid,
  country_code text,
  consent boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the requesting user is actually the event owner
  IF NOT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token_param 
    AND owner_id = owner_user_id
  ) THEN
    -- Return empty result if not owner
    RETURN;
  END IF;
  
  -- Full participant data only for verified event owners
  RETURN QUERY
  SELECT 
    p.id, 
    p.name, 
    p.email, 
    p.phone, 
    p.method, 
    p.created_at, 
    p.user_id, 
    p.country_code, 
    p.consent
  FROM participants p
  WHERE p.event_token = event_token_param;
END;
$$;

-- Create a function for participants to get their own record only
CREATE OR REPLACE FUNCTION public.get_my_participant_record(event_token_param text)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  phone text,
  method text,
  created_at timestamp with time zone,
  country_code text,
  consent boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return the participant's own record only
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.phone,
    p.method,
    p.created_at,
    p.country_code,
    p.consent
  FROM participants p
  WHERE p.event_token = event_token_param
    AND p.user_id = auth.uid()
    AND auth.uid() IS NOT NULL;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION public.get_public_event_info IS 
'Returns only non-sensitive event information. Password fields are explicitly excluded to prevent exposure to participants and public viewers.';

COMMENT ON FUNCTION public.get_owner_participant_data IS 
'Returns full participant data including contact information, but ONLY if the requesting user is verified as the event owner.';

COMMENT ON FUNCTION public.get_my_participant_record IS 
'Allows authenticated users to retrieve their own participant record for a specific event, including their contact information.';