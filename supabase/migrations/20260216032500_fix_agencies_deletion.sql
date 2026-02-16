-- Update foreign key constraints to ON DELETE SET NULL for safe agency deletion
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_agency_id_fkey,
  ADD CONSTRAINT profiles_agency_id_fkey 
    FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;

ALTER TABLE public.proposals 
  DROP CONSTRAINT IF EXISTS proposals_agency_id_fkey,
  ADD CONSTRAINT proposals_agency_id_fkey 
    FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;

ALTER TABLE public.team_members 
  DROP CONSTRAINT IF EXISTS team_members_agency_id_fkey,
  ADD CONSTRAINT team_members_agency_id_fkey 
    FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Allow admins and developers to manage agencies (Insert)
CREATE POLICY "Agencies_Admin_Developer_Insert" ON public.agencies
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_developer(auth.uid()));

-- Allow admins and developers to manage agencies (Update)
CREATE POLICY "Agencies_Admin_Developer_Update" ON public.agencies
  FOR UPDATE USING (is_admin(auth.uid()) OR is_developer(auth.uid()));

-- Allow admins and developers to manage agencies (Delete)
CREATE POLICY "Agencies_Admin_Developer_Delete" ON public.agencies
  FOR DELETE USING (is_admin(auth.uid()) OR is_developer(auth.uid()));
