
-- Create disbursements table
CREATE TABLE public.disbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  disbursed_date DATE,
  bank_name TEXT DEFAULT '',
  agency TEXT DEFAULT '',
  account TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own disbursements" ON public.disbursements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own disbursements" ON public.disbursements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disbursements" ON public.disbursements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own disbursements" ON public.disbursements
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_disbursements_updated_at
  BEFORE UPDATE ON public.disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
