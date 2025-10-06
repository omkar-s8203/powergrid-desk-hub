-- Create pending_users table for signup requests
CREATE TABLE public.pending_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'employee',
  specialization specialization_type,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Anyone can create a signup request
CREATE POLICY "Anyone can submit signup requests"
ON public.pending_users
FOR INSERT
WITH CHECK (true);

-- Admins can view all pending requests
CREATE POLICY "Admins can view all requests"
ON public.pending_users
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.pending_users
FOR UPDATE
USING (get_current_user_role() = 'admin');