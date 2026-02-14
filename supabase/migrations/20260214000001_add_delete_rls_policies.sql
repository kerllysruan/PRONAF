-- Add missing DELETE policies to child tables
-- This migration ensures that authenticated users with 'can_delete_proposals' permission can delete records from these tables.

-- proposal_documents
CREATE POLICY "RLS_ProposalDocs_Delete" ON public.proposal_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.can_delete_proposals = true
    )
  );

-- disbursements
CREATE POLICY "RLS_Disbursements_Delete" ON public.disbursements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.can_delete_proposals = true
    )
  );

-- visits
CREATE POLICY "RLS_Visits_Delete" ON public.visits
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_id = auth.uid()
        AND user_permissions.can_delete_proposals = true
    )
  );
