-- Get the user IDs from auth.users and insert corresponding profiles
INSERT INTO public.profiles (user_id, email, full_name, role, specialization)
SELECT 
  id as user_id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  (raw_user_meta_data->>'role')::user_role as role,
  CASE 
    WHEN raw_user_meta_data->>'specialization' IS NOT NULL 
    THEN (raw_user_meta_data->>'specialization')::specialization_type 
    ELSE NULL 
  END as specialization
FROM auth.users 
WHERE email IN ('employee@powergrid.com', 'ithelp@powergrid.com')
ON CONFLICT (user_id) DO NOTHING;