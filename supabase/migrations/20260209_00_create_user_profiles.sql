-- Create user_profiles table for storing matricula and other user info
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  matricula varchar(20) UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text DEFAULT '',
  department text DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_profiles (user_id, matricula, full_name)
  VALUES (NEW.id, NEW.user_metadata->>'matricula', COALESCE(NEW.user_metadata->>'display_name', NEW.email))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE TRIGGER on_auth_user_created_or_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Function to login by matricula
CREATE OR REPLACE FUNCTION public.login_by_matricula(
  p_matricula varchar,
  p_password varchar
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text;
BEGIN
  -- Find user by matricula
  SELECT user_id INTO v_user_id
  FROM public.user_profiles
  WHERE matricula = p_matricula;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Matrícula não encontrada');
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'user_id', v_user_id,
    'email', v_email,
    'message', 'Use o email para fazer login'
  );
END;
$function$;
