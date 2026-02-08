
-- Proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producer_name TEXT NOT NULL,
  producer_cpf TEXT NOT NULL,
  producer_address TEXT DEFAULT '',
  producer_phone TEXT DEFAULT '',
  pronaf_line TEXT NOT NULL DEFAULT 'custeio',
  requested_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'nova',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- Proposal documents table
CREATE TABLE public.proposal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposal docs" ON public.proposal_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_documents.proposal_id AND proposals.user_id = auth.uid()));
CREATE POLICY "Users can create own proposal docs" ON public.proposal_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_documents.proposal_id AND proposals.user_id = auth.uid()));
CREATE POLICY "Users can update own proposal docs" ON public.proposal_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_documents.proposal_id AND proposals.user_id = auth.uid()));
CREATE POLICY "Users can delete own proposal docs" ON public.proposal_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_documents.proposal_id AND proposals.user_id = auth.uid()));

-- Visits table
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producer_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL DEFAULT '09:00',
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada',
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visits" ON public.visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own visits" ON public.visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visits" ON public.visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visits" ON public.visits FOR DELETE USING (auth.uid() = user_id);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'hsl(215, 70%, 32%)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own team" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own team" ON public.team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own team" ON public.team_members FOR DELETE USING (auth.uid() = user_id);

-- Document tasks table
CREATE TABLE public.document_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  due_date DATE,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  document_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.document_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.document_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.document_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.document_tasks FOR DELETE USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_document_tasks_updated_at BEFORE UPDATE ON public.document_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
