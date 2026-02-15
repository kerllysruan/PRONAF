import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPermissions {
  can_view_dashboard: boolean;
  can_view_proposals: boolean;
  can_view_kanban: boolean;
  can_view_documentation: boolean;
  can_view_visits: boolean;
  can_manage_visits: boolean;
  can_view_tasks: boolean;
  can_manage_tasks: boolean;
  can_view_disbursements: boolean;
  can_manage_disbursements: boolean;
  can_view_management: boolean;
  can_manage_users: boolean;
  can_view_access_control: boolean;
  can_create_proposals: boolean;
  can_edit_proposals: boolean;
  can_delete_proposals: boolean;
  can_approve_proposals: boolean;
  read_only: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  can_view_dashboard: true,
  can_view_proposals: true,
  can_view_kanban: true,
  can_view_documentation: true,
  can_view_tasks: true,
  can_view_disbursements: true,
  can_view_visits: true,
  can_view_management: true,
  can_view_access_control: false,
  can_manage_users: false,
  can_create_proposals: true,
  can_edit_proposals: true,
  can_delete_proposals: true,
  can_approve_proposals: false,
  can_manage_tasks: false,
  can_manage_disbursements: false,
  can_manage_visits: false,
  read_only: false,
};

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [role, setRole] = useState<string>("usuario");
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [permRes, roleRes] = await Promise.all([
      supabase.from("user_permissions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    if (permRes.data) {
      const { id, user_id, created_at, updated_at, ...perms } = permRes.data as any;
      setPermissions(perms);
    }
    if (roleRes.data) {
      setRole(roleRes.data.role);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isAdmin = role === "admin";

  return { permissions, role, isAdmin, loading, refetch: fetchPermissions };
}
