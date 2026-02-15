-- Comprehensive Access Control Fix v2
-- This migration fixes the recursive RLS issue, ensures profiles have correct columns, 
-- and adds the new granular permission system columns.

-- 1. SECURITY DEFINER function to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Profiles Schema is correct
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
    ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 3. Expand Permissions Columns
ALTER TABLE public.user_permissions 
ADD COLUMN IF NOT EXISTS can_view_tasks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_tasks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_disbursements BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_disbursements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_visits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT false;

-- 4. Fix RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 5. Fix RLS Policies for User Permissions
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
FOR ALL USING (is_admin(auth.uid()));

-- 6. Setup Initial Admin Profile for F180227 (Admin)
INSERT INTO public.profiles (id, display_name, user_id)
VALUES ('56461a26-a317-4aa2-baa0-b94d0b5a27f8', 'Admin F180227', '56461a26-a317-4aa2-baa0-b94d0b5a27f8')
ON CONFLICT (id) DO UPDATE SET display_name = 'Admin F180227';

UPDATE public.user_permissions
SET 
  can_view_tasks = true,
  can_manage_tasks = true,
  can_view_disbursements = true,
  can_manage_disbursements = true,
  can_manage_visits = true,
  can_manage_users = true,
  can_view_access_control = true,
  can_approve_proposals = true
WHERE user_id = '56461a26-a317-4aa2-baa0-b94d0b5a27f8';
