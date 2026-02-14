-- Create a secure function to delete proposals
-- Runs as SECURITY DEFINER to bypass RLS checks on child tables during cascade.
-- But performs explicit permission check against user_permissions table.

CREATE OR REPLACE FUNCTION public.delete_proposal(proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check that the user has permission to delete proposals
  IF NOT EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_id = auth.uid()
      AND can_delete_proposals = true
  ) THEN
    RAISE EXCEPTION 'Permissão negada: você não tem permissão para excluir propostas';
  END IF;

  -- Check that the proposal exists
  IF NOT EXISTS (SELECT 1 FROM proposals WHERE id = proposal_id) THEN
    RAISE EXCEPTION 'Proposta não encontrada';
  END IF;

  -- Delete the proposal (ON DELETE CASCADE handles all child records)
  DELETE FROM proposals WHERE id = proposal_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_proposal(uuid) TO authenticated;
