
-- 1. Fix user_roles unique constraint (Required for upsert on user_id)
-- First check if a single-column unique constraint exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key' 
        AND contype = 'u'
    ) THEN
        -- Add unique constraint to allow upsert by user_id
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Ensure user_permissions has the unique constraint
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_permissions_user_id_key' 
        AND contype = 'u'
    ) THEN
        ALTER TABLE public.user_permissions ADD CONSTRAINT user_permissions_user_id_key UNIQUE (user_id);
    END IF;
END $$;
