-- Harden functions: set stable/security definer and search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_event_creator_is_adult()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  bdate date;
  age_years int;
BEGIN
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT birthdate INTO bdate FROM public.profiles WHERE id = NEW.owner_id;
  IF bdate IS NULL THEN
    RETURN NEW;
  END IF;
  age_years := DATE_PART('year', AGE(now(), bdate));
  IF age_years < 18 THEN
    RAISE EXCEPTION 'You must be 18+ to create an event';
  END IF;
  RETURN NEW;
END;
$$;