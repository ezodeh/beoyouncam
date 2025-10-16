-- Fix 1: PUBLIC_PARTICIPANT_DATA
-- Tighten RLS policies on participants table to prevent direct access to sensitive fields
-- Drop overly permissive public policies and replace with function-based access only

-- Drop the public album policies that allow direct SELECT access
DROP POLICY IF EXISTS "Public album participant names only" ON public.participants;
DROP POLICY IF EXISTS "Public album limited access" ON public.participants;

-- Add restrictive policy that prevents direct SELECT on participants table for non-owners
-- This forces all access through secure RPC functions
CREATE POLICY "Deny direct public access to participants"
ON public.participants
FOR SELECT
TO public
USING (false);

-- Keep the existing secure access policies for owners and users
-- (Event owners full access, Users own records, etc. are already in place)

-- Fix 2: SECRETS_EXPOSED  
-- Add password_hash column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS password_hash text;

-- Create function to verify hashed passwords
CREATE OR REPLACE FUNCTION public.verify_event_password(
  event_token_param text,
  password_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the password hash for the event
  SELECT password_hash INTO stored_hash
  FROM events
  WHERE token = event_token_param
    AND is_hidden = false;
  
  -- If no hash found, check if there's a legacy plaintext password
  IF stored_hash IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM events
      WHERE token = event_token_param
        AND is_hidden = false
        AND password = password_param
    );
  END IF;
  
  -- Use pgcrypto extension to verify hash
  -- Note: This requires bcrypt hashing to be done client-side initially
  -- For now, we'll do simple comparison until migration is complete
  RETURN stored_hash = crypt(password_param, stored_hash);
END;
$$;

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create trigger to prevent storing plaintext passwords after migration
CREATE OR REPLACE FUNCTION public.prevent_plaintext_password()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If password is being set and password_hash is null, reject it
  IF NEW.password IS NOT NULL AND NEW.password_hash IS NULL THEN
    RAISE EXCEPTION 'Plaintext passwords are not allowed. Use password_hash column with bcrypt.';
  END IF;
  
  -- If password_hash is being set, clear the password field
  IF NEW.password_hash IS NOT NULL THEN
    NEW.password = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: Trigger is commented out to allow gradual migration
-- Uncomment after all passwords are migrated
-- CREATE TRIGGER enforce_password_hashing
-- BEFORE INSERT OR UPDATE ON public.events
-- FOR EACH ROW
-- EXECUTE FUNCTION public.prevent_plaintext_password();