-- Migration to add Project Designer field
-- Create ENUM type for project designers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_designer_enum') THEN
        CREATE TYPE project_designer_enum AS ENUM ('ney_medeiros', 'jairo_santana', 'cledson', 'jailson');
    END IF;
END$$;

-- Add column to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS project_designer project_designer_enum;
