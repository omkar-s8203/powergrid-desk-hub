-- Insert test users to help with testing the update functionality
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at, 
  aud, 
  role,
  raw_user_meta_data
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'employee@powergrid.com',
  crypt('employee123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"full_name": "John Employee", "role": "employee"}'::jsonb
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'ithelp@powergrid.com',
  crypt('ithelp123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '{"full_name": "Sarah IT Support", "role": "it_helpdesk", "specialization": "software"}'::jsonb
);