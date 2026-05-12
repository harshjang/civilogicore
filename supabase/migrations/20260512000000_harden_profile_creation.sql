-- Harden profile creation so auth signups do not fail on invalid or duplicated usernames.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  candidate_username TEXT;
  user_suffix TEXT;
BEGIN
  base_username := lower(
    regexp_replace(
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'engineer'),
      '[^a-zA-Z0-9_]',
      '_',
      'g'
    )
  );
  base_username := regexp_replace(base_username, '_+', '_', 'g');
  base_username := trim(both '_' from base_username);

  IF char_length(base_username) < 3 THEN
    base_username := 'engineer';
  END IF;

  base_username := left(base_username, 21);
  candidate_username := base_username;
  user_suffix := substr(replace(NEW.id::text, '-', ''), 1, 8);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username) THEN
    candidate_username := left(base_username, 21) || '_' || user_suffix;
  END IF;

  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    candidate_username,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), candidate_username)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
