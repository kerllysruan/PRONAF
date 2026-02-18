-- Migration: Comprehensive Role-Based Access Control & Agency Isolation
-- Date: 2026-02-18

-- 1. Create Helper Functions for Auth
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'developer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_agency(user_id uuid)
RETURNS uuid AS $$
DECLARE
  agency_id uuid;
BEGIN
  SELECT p.agency_id INTO agency_id
  FROM public.profiles p
  WHERE p.user_id = $1;
  RETURN agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update is_admin to verify 'admin' role (Gerente Geral)
-- Drop first to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Profiles Table & Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agency Admins can view agency profiles" ON public.profiles;
DROP POLICY IF EXISTS "Agency Admins can update agency profiles" ON public.profiles;


-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Super Admins (Devs) can view/edit ALL profiles
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles
FOR ALL USING (public.is_super_admin(auth.uid()));

-- Policy: Agency Admins (Gerente Geral) can view profiles ONLY in their agency
CREATE POLICY "Agency Admins can view agency profiles" ON public.profiles
FOR SELECT USING (
  public.is_admin(auth.uid()) AND 
  agency_id = public.get_user_agency(auth.uid())
);

-- Policy: Agency Admins can update profiles ONLY in their agency
CREATE POLICY "Agency Admins can update agency profiles" ON public.profiles
FOR UPDATE USING (
  public.is_admin(auth.uid()) AND 
  agency_id = public.get_user_agency(auth.uid())
);

-- 4. Update Proposals Table Policies
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.proposals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.proposals;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.proposals;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.proposals;
DROP POLICY IF EXISTS "Super Admins manage all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users view agency proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users update agency proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins delete agency proposals" ON public.proposals;


-- Policy: Super Admins can do everything
CREATE POLICY "Super Admins manage all proposals" ON public.proposals
FOR ALL USING (public.is_super_admin(auth.uid()));

-- Policy: Regular users (including Agency Admin) can view proposals in their agency
CREATE POLICY "Users view agency proposals" ON public.proposals
FOR SELECT USING (
  agency_id = public.get_user_agency(auth.uid()) OR 
  public.is_super_admin(auth.uid()) -- Redundant but safe
);

-- Policy: Creation allowed for authenticated users (agency_id assigned via trigger/backend)
CREATE POLICY "Users create proposals" ON public.proposals
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Update restricted to agency
CREATE POLICY "Users update agency proposals" ON public.proposals
FOR UPDATE USING (
  agency_id = public.get_user_agency(auth.uid())
);

-- Policy: Delete restricted to Admins (Agency or Super)
CREATE POLICY "Admins delete agency proposals" ON public.proposals
FOR DELETE USING (
  (public.is_admin(auth.uid()) AND agency_id = public.get_user_agency(auth.uid())) OR
  public.is_super_admin(auth.uid())
);

-- 5. Update Disbursements Table Policies
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.disbursements;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.disbursements;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.disbursements;
DROP POLICY IF EXISTS "Super Admins manage all disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Users view agency disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Users create disbursements" ON public.disbursements;
DROP POLICY IF EXISTS "Users update agency disbursements" ON public.disbursements;

-- Super Admin
CREATE POLICY "Super Admins manage all disbursements" ON public.disbursements
FOR ALL USING (public.is_super_admin(auth.uid()));

-- View: Agency Scoped
CREATE POLICY "Users view agency disbursements" ON public.disbursements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

-- Create: Authenticated
CREATE POLICY "Users create disbursements" ON public.disbursements
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update: Agency Scoped + Permission Check (implied by role usually, but enforced by agency here)
CREATE POLICY "Users update agency disbursements" ON public.disbursements
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = proposal_id AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

-- 6. Agencies Table
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies viewable by authenticated" ON public.agencies;
DROP POLICY IF EXISTS "Super Admins manage agencies" ON public.agencies;

CREATE POLICY "Agencies viewable by authenticated" ON public.agencies
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super Admins manage agencies" ON public.agencies
FOR ALL USING (public.is_super_admin(auth.uid()));

-- 7. Ensure user_permissions columns exist for finer grain control
ALTER TABLE public.user_permissions
ADD COLUMN IF NOT EXISTS can_view_dashboard BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_proposals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_create_proposals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_proposals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_proposals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_kanban BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_documentation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_view_tasks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_tasks BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_disbursements BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS can_manage_disbursements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_management BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_agencies BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_access_control BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_approve_proposals BOOLEAN DEFAULT false;

-- 8. Fix Permissions Policies
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Super Admins manage all permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Agency Admins manage agency permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users view own permissions" ON public.user_permissions;

CREATE POLICY "Super Admins manage all permissions" ON public.user_permissions
FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency Admins manage agency permissions" ON public.user_permissions
FOR ALL USING (
  public.is_admin(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = user_permissions.user_id AND p.agency_id = public.get_user_agency(auth.uid())
  )
);

CREATE POLICY "Users view own permissions" ON public.user_permissions
FOR SELECT USING (auth.uid() = user_id);
