-- Drop and recreate the function with additional fields
DROP FUNCTION IF EXISTS public.get_public_event_info(text);

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
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$