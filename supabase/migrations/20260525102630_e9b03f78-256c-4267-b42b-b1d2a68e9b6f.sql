-- Comprehensive schema initialization

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for calendar type
DO $$ BEGIN CREATE TYPE public.calendar_type AS ENUM ('gregorian','hijri'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create enum for application roles
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- events table
CREATE TABLE IF NOT EXISTS public.events (
  token text PRIMARY KEY, title text NOT NULL, description text, cover_url text,
  sign_in_method text NOT NULL DEFAULT 'phone', created_at timestamptz NOT NULL DEFAULT now(),
  start_at timestamptz, end_at timestamptz, owner_id uuid, max_shots INTEGER NOT NULL DEFAULT 120,
  expected_guests INTEGER NOT NULL DEFAULT 100, calendar_type public.calendar_type NOT NULL DEFAULT 'gregorian',
  is_private boolean NOT NULL DEFAULT false, published_at timestamptz, country_code text,
  is_hidden boolean NOT NULL DEFAULT false, password text, password_hash text,
  share_method text DEFAULT 'email', album_publish_time text DEFAULT 'after_event',
  custom_publish_delay INTEGER DEFAULT 24, welcome_title text, welcome_text text,
  invite_button_text text, album_title text, album_description text, album_cover_url text,
  is_album_published boolean DEFAULT false, show_header boolean DEFAULT true,
  custom_publish_date text, custom_publish_time text, enable_video boolean NOT NULL DEFAULT true
);

-- participants table
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_token text NOT NULL, user_id uuid,
  method text NOT NULL CHECK (method IN ('phone','email','google')), country_code text,
  phone text, email text, name text, consent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text,
  phone text, country_code text, country text, gender text CHECK (gender IN ('male','female','other')),
  birthdate date, agreed_terms_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- blessings table
CREATE TABLE IF NOT EXISTS public.blessings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_token text NOT NULL, user_id uuid,
  name text, content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

-- media_submissions table
CREATE TABLE IF NOT EXISTS public.media_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_token text NOT NULL,
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  file_path text NOT NULL, file_name text NOT NULL, media_type text NOT NULL,
  thumbnail_path text, created_at timestamptz NOT NULL DEFAULT now(), metadata jsonb
);

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id), UNIQUE (user_id, role)
);

-- indexes
CREATE UNIQUE INDEX IF NOT EXISTS events_token_key ON public.events(token);
CREATE INDEX IF NOT EXISTS idx_events_token ON public.events(token);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_private, published_at);
CREATE INDEX IF NOT EXISTS idx_media_submissions_event_token ON public.media_submissions(event_token);
CREATE INDEX IF NOT EXISTS idx_media_submissions_participant_id ON public.media_submissions(participant_id);

-- trigger functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.prevent_plaintext_password() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NEW.password IS NOT NULL AND NEW.password_hash IS NULL THEN RAISE EXCEPTION 'Plaintext passwords are not allowed.'; END IF; IF NEW.password_hash IS NOT NULL THEN NEW.password = NULL; END IF; RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS enforce_password_hashing ON public.events;
CREATE TRIGGER enforce_password_hashing BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.prevent_plaintext_password();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- helper functions
CREATE OR REPLACE FUNCTION public.is_user_event_owner(user_id uuid, event_token text) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token AND owner_id = user_id); $$;

CREATE OR REPLACE FUNCTION public.is_event_visible(event_token text) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token AND is_hidden = false); $$;

CREATE OR REPLACE FUNCTION public.is_event_owner(event_token text, user_id uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token AND owner_id = user_id); $$;

CREATE OR REPLACE FUNCTION public.user_owns_event(event_token_param text, user_id_param uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token_param AND owner_id = user_id_param); $$;

CREATE OR REPLACE FUNCTION public.is_event_public_album(event_token_param text) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token_param AND is_hidden = false AND is_private = false AND is_album_published = true); $$;

CREATE OR REPLACE FUNCTION public.is_user_participant(event_token_param text, user_id_param uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM participants WHERE event_token = event_token_param AND user_id = user_id_param); $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- RPC functions
CREATE OR REPLACE FUNCTION public.get_public_event_info(event_token text) RETURNS TABLE(token text, title text, description text, start_at timestamptz, end_at timestamptz, is_private boolean, cover_url text, welcome_title text, welcome_text text, invite_button_text text, show_header boolean, is_album_published boolean, album_title text, album_description text, album_cover_url text, sign_in_method text, share_method text, max_shots integer, enable_video boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT e.token, e.title, e.description, e.start_at, e.end_at, e.is_private, e.cover_url, e.welcome_title, e.welcome_text, e.invite_button_text, e.show_header, e.is_album_published, e.album_title, e.album_description, e.album_cover_url, e.sign_in_method, e.share_method, e.max_shots, e.enable_video FROM events e WHERE e.token = event_token AND e.is_hidden = false; $$;

CREATE OR REPLACE FUNCTION public.validate_event_password(event_token text, provided_password text) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token AND is_hidden = false AND password = provided_password); $$;

CREATE OR REPLACE FUNCTION public.grant_album_access(event_token_param text, provided_password text) RETURNS TABLE(access_granted boolean, expires_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NOT EXISTS (SELECT 1 FROM events WHERE token = event_token_param AND is_hidden = false AND password_hash IS NOT NULL AND password_hash = crypt(provided_password, password_hash)) THEN RETURN QUERY SELECT false, NULL::timestamptz; RETURN; END IF; RETURN QUERY SELECT true, (now() + interval '24 hours')::timestamptz; END; $$;

CREATE OR REPLACE FUNCTION public.can_access_album(event_token_param text, user_id_param uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM events WHERE token = event_token_param AND is_hidden = false AND (is_private = false OR owner_id = COALESCE(user_id_param, auth.uid()) OR (is_private = true AND password_hash IS NULL AND is_album_published = true))); $$;

CREATE OR REPLACE FUNCTION public.get_public_participant_data(event_token_param text) RETURNS TABLE(id uuid, name text, created_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN QUERY SELECT p.id, p.name, p.created_at FROM participants p JOIN events e ON e.token = p.event_token WHERE p.event_token = event_token_param AND e.is_private = false AND e.is_hidden = false AND e.is_album_published = true; END; $$;

CREATE OR REPLACE FUNCTION public.get_owner_participant_data(event_token_param text, owner_user_id uuid) RETURNS TABLE(id uuid, name text, email text, phone text, method text, created_at timestamptz, user_id uuid, country_code text, consent boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN IF NOT EXISTS (SELECT 1 FROM events WHERE token = event_token_param AND owner_id = owner_user_id) THEN RETURN; END IF; RETURN QUERY SELECT p.id, p.name, p.email, p.phone, p.method, p.created_at, p.user_id, p.country_code, p.consent FROM participants p WHERE p.event_token = event_token_param; END; $$;

CREATE OR REPLACE FUNCTION public.get_my_participant_record(event_token_param text) RETURNS TABLE(id uuid, name text, email text, phone text, method text, created_at timestamptz, country_code text, consent boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN QUERY SELECT p.id, p.name, p.email, p.phone, p.method, p.created_at, p.country_code, p.consent FROM participants p WHERE p.event_token = event_token_param AND p.user_id = auth.uid() AND auth.uid() IS NOT NULL; END; $$;

CREATE OR REPLACE FUNCTION public.get_participant_by_name(event_token_param text, participant_name text) RETURNS TABLE(id uuid, name text) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN QUERY SELECT p.id, p.name FROM participants p JOIN events e ON e.token = p.event_token WHERE p.event_token = event_token_param AND (p.name ILIKE '%' || participant_name || '%') AND e.is_private = false AND e.is_hidden = false AND e.is_album_published = true; END; $$;

-- grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_public_event_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_event_password(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_album_access(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_album(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_participant_data(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_participant_data(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_participant_record(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_participant_by_name(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- RLS enable
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blessings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- events policies
CREATE POLICY "Event owners can view own events with all fields" ON events FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their events" ON events FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their events" ON events FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Participants can view limited event details" ON events FOR SELECT USING ((public.is_user_participant(token, auth.uid()) AND auth.uid() <> owner_id) OR (is_hidden = false AND is_private = false AND is_album_published = true AND auth.uid() <> owner_id));

-- participants policies
CREATE POLICY "Anyone can join visible events" ON participants FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.token = participants.event_token AND events.is_hidden = false));
CREATE POLICY "Event owners can view all participant data" ON participants FOR SELECT USING (public.user_owns_event(event_token, auth.uid()));
CREATE POLICY "Users can view own participant record" ON participants FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Public can view participant names for published albums" ON participants FOR SELECT USING (public.is_event_public_album(event_token));
CREATE POLICY "Event owners can delete participants" ON participants FOR DELETE USING (public.user_owns_event(event_token, auth.uid()));
CREATE POLICY "Users can update own participant records" ON participants FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- blessings policies
CREATE POLICY "Secure blessings access" ON blessings FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.token = blessings.event_token AND events.owner_id = auth.uid()) OR (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM participants WHERE participants.event_token = blessings.event_token AND participants.user_id = auth.uid())) OR (EXISTS (SELECT 1 FROM events WHERE events.token = blessings.event_token AND events.is_private = false AND events.is_hidden = false AND events.is_album_published = true)));
CREATE POLICY "Anyone can insert blessings" ON blessings FOR INSERT WITH CHECK (true);
CREATE POLICY "Event owners can delete blessings" ON blessings FOR DELETE USING (EXISTS (SELECT 1 FROM events WHERE events.token = blessings.event_token AND events.owner_id = auth.uid()));
CREATE POLICY "Event owners can update blessings" ON blessings FOR UPDATE USING (EXISTS (SELECT 1 FROM events WHERE events.token = blessings.event_token AND events.owner_id = auth.uid()));

-- media_submissions policies
CREATE POLICY "Authorized users can view media submissions" ON media_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.token = media_submissions.event_token AND events.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM participants p WHERE p.id = media_submissions.participant_id AND p.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM participants p WHERE p.event_token = media_submissions.event_token AND p.user_id = auth.uid()));
CREATE POLICY "Participants can create their own media submissions" ON media_submissions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM participants p WHERE p.id = participant_id AND (p.user_id = auth.uid() OR p.user_id IS NULL)));
CREATE POLICY "Event owners can delete media submissions" ON media_submissions FOR DELETE USING (EXISTS (SELECT 1 FROM events WHERE events.token = media_submissions.event_token AND events.owner_id = auth.uid()));
CREATE POLICY "Event owners can update media submissions" ON media_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM events WHERE events.token = media_submissions.event_token AND events.owner_id = auth.uid()));

-- user_roles policies
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can insert roles" ON user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', true) ON CONFLICT (id) DO UPDATE SET public = excluded.public;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-customization', 'event-customization', true) ON CONFLICT (id) DO UPDATE SET public = excluded.public;

-- storage policies
CREATE POLICY "Public read for event-media" ON storage.objects FOR SELECT USING (bucket_id = 'event-media');
CREATE POLICY "Anyone can upload to event-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-media');
CREATE POLICY "Anyone can view customization images" ON storage.objects FOR SELECT USING (bucket_id = 'event-customization');
CREATE POLICY "Event owners can upload customization images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-customization');
CREATE POLICY "Event owners can update customization images" ON storage.objects FOR UPDATE USING (bucket_id = 'event-customization');
CREATE POLICY "Event owners can delete customization images" ON storage.objects FOR DELETE USING (bucket_id = 'event-customization');

-- table comments
COMMENT ON TABLE participants IS 'SECURITY: This table contains PII (email, phone). Public album queries MUST only SELECT (id, name, created_at). Use get_public_participant_data() RPC function for safe public access.';
COMMENT ON COLUMN participants.email IS 'SENSITIVE: Only accessible to event owners and record owner';
COMMENT ON COLUMN participants.phone IS 'SENSITIVE: Only accessible to event owners and record owner';
COMMENT ON COLUMN participants.country_code IS 'SENSITIVE: Only accessible to event owners and record owner';
COMMENT ON COLUMN participants.consent IS 'SENSITIVE: Only accessible to event owners and record owner';
COMMENT ON TABLE user_roles IS 'User role assignments for access control. Never store roles in profiles table - use this table for proper authorization. Check roles using has_role() function in RLS policies and application code.';
