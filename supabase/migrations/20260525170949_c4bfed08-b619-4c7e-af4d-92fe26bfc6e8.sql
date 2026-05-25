
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.prevent_plaintext_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NEW.password IS NOT NULL AND length(trim(NEW.password)) > 0 THEN
    NEW.password_hash := extensions.crypt(NEW.password, extensions.gen_salt('bf'));
    NEW.password := NULL;
  END IF;
  IF NEW.password_hash IS NOT NULL THEN
    NEW.password := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_hash_password_trg ON public.events;
CREATE TRIGGER events_hash_password_trg
BEFORE INSERT OR UPDATE OF password, password_hash ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_plaintext_password();

CREATE OR REPLACE FUNCTION public.validate_event_password(event_token text, provided_password text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events
    WHERE token = event_token
      AND is_hidden = false
      AND password_hash IS NOT NULL
      AND password_hash = extensions.crypt(provided_password, password_hash)
  );
$$;

GRANT EXECUTE ON FUNCTION public.validate_event_password(text, text) TO anon, authenticated;

UPDATE public.events
SET password_hash = extensions.crypt(password, extensions.gen_salt('bf')),
    password = NULL
WHERE password IS NOT NULL
  AND length(trim(password)) > 0
  AND password_hash IS NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
