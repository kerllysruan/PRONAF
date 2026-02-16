
-- 1. Update Foreign Key Constraints to ON DELETE CASCADE for data that should be fully removed
DO $$ 
BEGIN 
    -- Proposals: Deleting agency should delete its proposals
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proposals_agency_id_fkey') THEN
        ALTER TABLE public.proposals DROP CONSTRAINT proposals_agency_id_fkey;
    END IF;
    ALTER TABLE public.proposals ADD CONSTRAINT proposals_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE CASCADE;

    -- Team Members: Deleting agency should delete its specific team configuration
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_agency_id_fkey') THEN
        ALTER TABLE public.team_members DROP CONSTRAINT team_members_agency_id_fkey;
    END IF;
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE CASCADE;

    -- Profiles: Keep as ON DELETE SET NULL (user accounts should not be deleted, just unlinked)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_agency_id_fkey') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_agency_id_fkey;
    END IF;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;
END $$;

-- 2. Create Trigger Function for Automatic Agency Setup
CREATE OR REPLACE FUNCTION public.handle_after_agency_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default team members (Designers and Analysts) for the new agency
    -- These are required for the proposal forms to have selectable options
    INSERT INTO public.team_members (name, role, agency_id, color)
    VALUES 
        ('Ney Medeiros', 'designer', NEW.id, 'blue'),
        ('Analista Padrão', 'analyst', NEW.id, 'green');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_agency_created ON public.agencies;
CREATE TRIGGER on_agency_created
    AFTER INSERT ON public.agencies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_after_agency_created();
