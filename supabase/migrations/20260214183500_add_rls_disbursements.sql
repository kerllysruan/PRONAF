-- Migration to add RLS policies for disbursements INSERT and UPDATE
-- Applied on 2026-02-14

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'disbursements' AND policyname = 'RLS_Disbursements_Insert'
    ) THEN
        CREATE POLICY "RLS_Disbursements_Insert" ON "public"."disbursements"
        AS PERMISSIVE FOR INSERT
        TO public
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_permissions
                WHERE user_permissions.user_id = auth.uid()
                AND (user_permissions.can_edit_proposals = true OR user_permissions.can_create_proposals = true)
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'disbursements' AND policyname = 'RLS_Disbursements_Update'
    ) THEN
        CREATE POLICY "RLS_Disbursements_Update" ON "public"."disbursements"
        AS PERMISSIVE FOR UPDATE
        TO public
        USING (
            EXISTS (
                SELECT 1 FROM user_permissions
                WHERE user_permissions.user_id = auth.uid()
                AND user_permissions.can_edit_proposals = true
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM user_permissions
                WHERE user_permissions.user_id = auth.uid()
                AND user_permissions.can_edit_proposals = true
            )
        );
    END IF;
END
$$;
