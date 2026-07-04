-- ============================================================
-- Migration: Add ged_id column to documentation_files
-- The ID-GED is assigned manually by the authenticated reviewer,
-- not auto-generated. It serves as a GED document reference ID.
-- ============================================================

ALTER TABLE documentation_files
  ADD COLUMN IF NOT EXISTS ged_id TEXT DEFAULT NULL;

COMMENT ON COLUMN documentation_files.ged_id IS
  'GED document identifier assigned manually by the authenticated reviewer (e.g. GED-001).';
