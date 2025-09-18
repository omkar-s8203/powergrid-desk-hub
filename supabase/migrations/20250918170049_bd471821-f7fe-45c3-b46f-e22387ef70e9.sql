-- Insert a default admin user
-- Note: In production, you should create users through the Supabase auth interface
-- This is for development/testing purposes only

-- First, we'll create a function to safely create an admin user
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@powergrid.com') THEN
    RAISE NOTICE 'Admin user already exists';
    RETURN;
  END IF;

  -- Generate a UUID for the admin user
  admin_user_id := gen_random_uuid();

  -- Insert into auth.users (this simulates user creation)
  -- NOTE: In a real scenario, users should be created through Supabase Auth UI or API
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role,
    aud
  ) VALUES (
    admin_user_id,
    'admin@powergrid.com',
    crypt('admin123', gen_salt('bf')), -- Password: admin123
    now(),
    now(),
    now(),
    '{"full_name": "System Administrator", "role": "admin"}'::jsonb,
    'authenticated',
    'authenticated'
  );

  -- The trigger will automatically create the profile
  RAISE NOTICE 'Admin user created successfully with email: admin@powergrid.com and password: admin123';
END;
$$;

-- Execute the function
SELECT create_admin_user();

-- Drop the function as it's no longer needed
DROP FUNCTION create_admin_user();