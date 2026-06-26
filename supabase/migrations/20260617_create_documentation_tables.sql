-- ============================================================
-- Migration: Create documentation tables for token-based upload
-- ============================================================

-- 1. documentation_tokens
CREATE TABLE IF NOT EXISTS documentation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  stock_proposal_id UUID NOT NULL REFERENCES stock_proposals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  documents_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  has_rejections BOOLEAN DEFAULT false
);

-- 2. documentation_files
CREATE TABLE IF NOT EXISTS documentation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES documentation_tokens(id) ON DELETE CASCADE,
  stock_proposal_id UUID NOT NULL REFERENCES stock_proposals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  document_type TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_doc_tokens_token ON documentation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_doc_tokens_proposal ON documentation_tokens(stock_proposal_id);
CREATE INDEX IF NOT EXISTS idx_doc_files_token ON documentation_files(token_id);
CREATE INDEX IF NOT EXISTS idx_doc_files_proposal ON documentation_files(stock_proposal_id);

-- ============================================================
-- RLS: Enable
-- ============================================================
ALTER TABLE documentation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_files ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: documentation_tokens
-- ============================================================

-- Public: anyone can read tokens (to validate link)
CREATE POLICY "documentation_tokens_public_select"
  ON documentation_tokens FOR SELECT
  USING (true);

-- Authenticated: can insert tokens
CREATE POLICY "documentation_tokens_auth_insert"
  ON documentation_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated: can update tokens
CREATE POLICY "documentation_tokens_auth_update"
  ON documentation_tokens FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public: anonymous can update tokens (to mark submitted)
CREATE POLICY "documentation_tokens_anon_update"
  ON documentation_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS Policies: documentation_files
-- ============================================================

-- Authenticated: can read all files
CREATE POLICY "documentation_files_auth_select"
  ON documentation_files FOR SELECT
  TO authenticated
  USING (true);

-- Public/anon: can read files (for submission page to show status)
CREATE POLICY "documentation_files_anon_select"
  ON documentation_files FOR SELECT
  TO anon
  USING (true);

-- Public/anon: can insert files (upload without login)
CREATE POLICY "documentation_files_anon_insert"
  ON documentation_files FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated: can insert files
CREATE POLICY "documentation_files_auth_insert"
  ON documentation_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated: can update files (approve/reject)
CREATE POLICY "documentation_files_auth_update"
  ON documentation_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public/anon: can update files (for resubmission)
CREATE POLICY "documentation_files_anon_update"
  ON documentation_files FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Authenticated: can delete files
CREATE POLICY "documentation_files_auth_delete"
  ON documentation_files FOR DELETE
  TO authenticated
  USING (true);

-- Authenticated: can delete tokens (for revert flow)
CREATE POLICY "documentation_tokens_auth_delete"
  ON documentation_tokens FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- previous_status column (tracks status before documentation)
-- ============================================================
ALTER TABLE documentation_tokens ADD COLUMN IF NOT EXISTS previous_status TEXT;

-- ============================================================
-- RLS: Allow anon SELECT on stock_proposals (only via token)
-- ============================================================
CREATE POLICY "stock_proposals_anon_select"
  ON stock_proposals FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM documentation_tokens
      WHERE documentation_tokens.stock_proposal_id = stock_proposals.id
    )
  );
