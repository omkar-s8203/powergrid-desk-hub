-- Create IT helpdesk users with different specializations for automatic ticket routing
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'hardware.specialist@powergrid.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Mike Hardware", "role": "it_helpdesk", "specialization": "hardware"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'software.specialist@powergrid.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Sarah Software", "role": "it_helpdesk", "specialization": "software"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'network.specialist@powergrid.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Alex Network", "role": "it_helpdesk", "specialization": "network"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'email.specialist@powergrid.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "Emma Email", "role": "it_helpdesk", "specialization": "email_systems"}',
  false,
  'authenticated'
);

-- Create corresponding profiles (this should happen automatically via trigger, but let's ensure it)
INSERT INTO public.profiles (user_id, email, full_name, role, specialization)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  (au.raw_user_meta_data->>'role')::user_role,
  (au.raw_user_meta_data->>'specialization')::specialization_type
FROM auth.users au
WHERE au.email IN (
  'hardware.specialist@powergrid.com',
  'software.specialist@powergrid.com', 
  'network.specialist@powergrid.com',
  'email.specialist@powergrid.com'
)
ON CONFLICT (user_id) DO NOTHING;