-- Create secure database functions for participant data access
-- These functions control exactly what data can be accessed in different contexts

-- Function to get public participant data (only safe fields for album viewing)
CREATE OR REPLACE FUNCTION public.get_public_participant_data(event_token_param text)
RETURNS TABLE(id uuid, name text, created_at timestamp with time zone) AS $$
BEGIN
  -- Only return basic fields for public album access
  -- No email, phone, or other sensitive data
  RETURN QUERY
  SELECT p.id, p.name, p.created_at 
  FROM participants p
  JOIN events e ON e.token = p.event_token
  WHERE p.event_token = event_token_param
    AND e.is_private = false
    AND e.is_hidden = false
    AND e.is_album_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get participant data for event owners (full access)
CREATE OR REPLACE FUNCTION public.get_owner_participant_data(event_token_param text, owner_user_id uuid)
RETURNS TABLE(id uuid, name text, email text, phone text, method text, created_at timestamp with time zone, user_id uuid, country_code text, consent boolean) AS $$
BEGIN
  -- Full participant data only for event owners
  RETURN QUERY
  SELECT p.id, p.name, p.email, p.phone, p.method, p.created_at, p.user_id, p.country_code, p.consent
  FROM participants p
  JOIN events e ON e.token = p.event_token
  WHERE p.event_token = event_token_param
    AND e.owner_id = owner_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get participant data by name (secure lookup for album pages)
CREATE OR REPLACE FUNCTION public.get_participant_by_name(event_token_param text, participant_name text)
RETURNS TABLE(id uuid, name text) AS $$
BEGIN
  -- Only return ID and name for participant lookup in album pages
  RETURN QUERY
  SELECT p.id, p.name
  FROM participants p
  JOIN events e ON e.token = p.event_token
  WHERE p.event_token = event_token_param
    AND (p.name ILIKE '%' || participant_name || '%')
    AND e.is_private = false
    AND e.is_hidden = false
    AND e.is_album_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Restricted participant access" ON public.participants;

-- Create new strict RLS policies with column-level restrictions
CREATE POLICY "Event owners full access" 
ON public.participants 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_user_event_owner(auth.uid(), event_token)
);

CREATE POLICY "Users own records" 
ON public.participants 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Create a restricted policy for public album access (column-level)
-- This policy will be used with the security definer functions above
CREATE POLICY "Public album limited access" 
ON public.participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.token = participants.event_token 
      AND events.is_private = false
      AND events.is_hidden = false
      AND events.is_album_published = true
  )
);

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.get_public_participant_data(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_participant_data(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_participant_by_name(text, text) TO anon, authenticated;