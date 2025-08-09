-- Create enum for calendar type
DO $$ BEGIN
  CREATE TYPE public.calendar_type AS ENUM ('gregorian','hijri');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add calendar_type to events with default 'gregorian'
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS calendar_type public.calendar_type NOT NULL DEFAULT 'gregorian';

-- Create profiles table to store user details and terms acceptance
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  country_code text,
  country text,
  gender text CHECK (gender IN ('male','female','other')),
  birthdate date,
  agreed_terms_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to auto update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Blessings table for event congratulations/messages
CREATE TABLE IF NOT EXISTS public.blessings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_token text NOT NULL,
  user_id uuid,
  name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blessings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read blessings"
  ON public.blessings FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can insert blessings"
  ON public.blessings FOR INSERT
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Validation: prevent under-18 from creating events (best-effort)
CREATE OR REPLACE FUNCTION public.ensure_event_creator_is_adult()
RETURNS TRIGGER AS $$
DECLARE
  bdate date;
  age_years int;
BEGIN
  IF NEW.owner_id IS NULL THEN
    RETURN NEW; -- skip if not provided (legacy/anonymous)
  END IF;
  SELECT birthdate INTO bdate FROM public.profiles WHERE id = NEW.owner_id;
  IF bdate IS NULL THEN
    RETURN NEW; -- allow if birthdate not set (UI should enforce collection)
  END IF;
  age_years := DATE_PART('year', AGE(now(), bdate));
  IF age_years < 18 THEN
    RAISE EXCEPTION 'You must be 18+ to create an event';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER ensure_event_creator_is_adult
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.ensure_event_creator_is_adult();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;