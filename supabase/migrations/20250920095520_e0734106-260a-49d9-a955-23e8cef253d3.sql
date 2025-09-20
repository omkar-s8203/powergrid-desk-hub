-- Fix the handle_new_user trigger to properly create profiles
-- First, let's recreate the trigger function with better error handling

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, specialization)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'employee'),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'specialization' IS NOT NULL 
      THEN (NEW.raw_user_meta_data ->> 'specialization')::specialization_type 
      ELSE NULL 
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create profiles for any existing users that don't have profiles
INSERT INTO public.profiles (user_id, email, full_name, role, specialization)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', au.email),
  COALESCE((au.raw_user_meta_data ->> 'role')::user_role, 'employee'),
  CASE 
    WHEN au.raw_user_meta_data ->> 'specialization' IS NOT NULL 
    THEN (au.raw_user_meta_data ->> 'specialization')::specialization_type 
    ELSE NULL 
  END
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;