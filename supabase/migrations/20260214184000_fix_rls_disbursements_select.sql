-- Migration to fix RLS SELECT policy for disbursements
-- Applied on 2026-02-14

DROP POLICY IF EXISTS "RLS_Disbursements_Select" ON "public"."disbursements";

CREATE POLICY "RLS_Disbursements_Select" ON "public"."disbursements"
AS PERMISSIVE FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_permissions.user_id = auth.uid()
        AND (
            user_permissions.can_view_management = true 
            OR user_permissions.can_edit_proposals = true
            OR user_permissions.can_view_proposals = true
        )
    )
);
