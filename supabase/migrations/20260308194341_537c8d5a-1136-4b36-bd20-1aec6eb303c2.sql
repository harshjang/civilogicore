-- Fix existing rows that don't match the pattern
UPDATE public.profiles
SET username = regexp_replace(username, '[^a-zA-Z0-9_]', '', 'g')
WHERE username !~ '^[a-zA-Z0-9_]{3,30}$';

UPDATE public.profiles
SET username = username || '_user'
WHERE char_length(username) < 3;

UPDATE public.profiles
SET username = left(username, 30)
WHERE char_length(username) > 30;

UPDATE public.profiles
SET display_name = left(display_name, 50)
WHERE display_name IS NOT NULL AND char_length(display_name) > 50;

-- Now add constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  ADD CONSTRAINT profiles_display_name_length CHECK (display_name IS NULL OR char_length(display_name) <= 50);