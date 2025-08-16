-- Fix infinite recursion in RLS policies by creating security definer functions

-- Create a function to check if user is event owner
CREATE OR REPLACE FUNCTION public.is_user_event_owner(user_id uuid, event_token text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token 
    AND owner_id = user_id
  );
$$;

-- Create a function to check if event is not hidden
CREATE OR REPLACE FUNCTION public.is_event_visible(event_token text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events 
    WHERE token = event_token 
    AND is_hidden = false
  );
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can join non-hidden events" ON participants;
DROP POLICY IF EXISTS "Restricted access to participant data" ON participants;
DROP POLICY IF EXISTS "Users can update their own participant records" ON participants;

-- Create new, safer policies using the security definer functions
CREATE POLICY "Users can join visible events" 
ON participants 
FOR INSERT 
WITH CHECK (
  public.is_event_visible(event_token)
);

CREATE POLICY "Safe access to participant data" 
ON participants 
FOR SELECT 
USING (
  -- Event owners can view all participants for their events
  public.is_user_event_owner(auth.uid(), event_token)
  OR
  -- Users can only view their own participant records
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Create an update policy for user's own records only
CREATE POLICY "Users can update own participant records" 
ON participants 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());