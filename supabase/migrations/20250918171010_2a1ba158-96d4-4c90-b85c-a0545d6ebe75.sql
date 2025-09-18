-- Fix infinite recursion in RLS policies by creating security definer functions
-- and add specialization enum and column

-- Create specialization enum
CREATE TYPE public.specialization_type AS ENUM ('hardware', 'software', 'network', 'access', 'other');

-- Add specialization column to profiles table  
ALTER TABLE public.profiles ADD COLUMN specialization specialization_type;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;

-- Create new policies using security definer function
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update profiles" ON public.profiles
FOR UPDATE USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can view all tickets" ON public.tickets
FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update all tickets" ON public.tickets
FOR UPDATE USING (public.get_current_user_role() = 'admin');