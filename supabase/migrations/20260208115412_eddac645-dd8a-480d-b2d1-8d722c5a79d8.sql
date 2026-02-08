
-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'usuario');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'usuario',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  can_view_dashboard boolean NOT NULL DEFAULT true,
  can_view_proposals boolean NOT NULL DEFAULT true,
  can_view_kanban boolean NOT NULL DEFAULT true,
  can_view_documentation boolean NOT NULL DEFAULT true,
  can_view_visits boolean NOT NULL DEFAULT true,
  can_view_management boolean NOT NULL DEFAULT true,
  can_view_access_control boolean NOT NULL DEFAULT false,
  can_create_proposals boolean NOT NULL DEFAULT true,
  can_edit_proposals boolean NOT NULL DEFAULT true,
  can_delete_proposals boolean NOT NULL DEFAULT true,
  can_approve_proposals boolean NOT NULL DEFAULT false,
  read_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for user_permissions
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Auto-create default permissions on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_permissions (user_id)
  VALUES (NEW.id);
  
  -- First user gets admin role
  IF (SELECT count(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    UPDATE public.user_permissions SET can_view_access_control = true, can_approve_proposals = true WHERE user_id = NEW.id;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'usuario');
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created_permissions
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();

-- Add trigger for updated_at on user_permissions
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
