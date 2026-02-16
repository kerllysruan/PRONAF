```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Autorização ausente");

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) throw new Error(`Autenticação falhou: ${ authError?.message || 'Token inválido' } `);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin/developer role
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleError || !roleData || (roleData.role !== "admin" && roleData.role !== "developer")) {
      throw new Error("Acesso negado. Apenas gerentes gerais ou desenvolvedores podem gerenciar usuários.");
    }

    const { action, ...payload } = await req.json();
    console.log(`Action: ${ action } by ${ caller.email } `);

    let responseData: any = { success: true };

    const getPermissionsForRole = (role: string) => {
      const isStaff = (role === "admin" || role === "gerente" || role === "tecnico" || role === "developer");
      const isAdminOrDev = (role === "admin" || role === "developer");

      return {
        can_view_dashboard: true,
        can_view_proposals: true,
        can_view_kanban: true,
        can_view_documentation: true,
        can_view_tasks: true,
        can_view_disbursements: true,
        can_view_agencies: true,
        can_create_proposals: isStaff,
        can_edit_proposals: isStaff,
        can_delete_proposals: isAdminOrDev,
        can_approve_proposals: isStaff,
        can_view_access_control: isAdminOrDev,
        can_view_management: isStaff,
        can_manage_users: isAdminOrDev,
        can_manage_agencies: isAdminOrDev,
        can_manage_tasks: isStaff,
        can_manage_disbursements: isStaff,
        read_only: false,
      };
    };

    switch (action) {
      case "create": {
        const { email, password, display_name, role, agency_id } = payload;
        const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { display_name }
        });
        if (createError) throw new Error(`Erro Auth: ${ createError.message } `);

        const userId = authUser.user.id;

        await adminClient.from("profiles").upsert({
          user_id: userId,
          email,
          display_name,
          full_name: display_name,
          agency_id
        }, { onConflict: "user_id" });

        await adminClient.from("user_roles").upsert({ user_id: userId, role: role || "usuario" }, { onConflict: "user_id" });
        await adminClient.from("user_permissions").upsert({
          user_id: userId,
          ...getPermissionsForRole(role || "usuario")
        }, { onConflict: "user_id" });

        responseData = { success: true, user: authUser.user };
        break;
      }

      case "update_role": {
        const { user_id, role } = payload;
        const { error: roleError } = await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id" });
        if (roleError) throw new Error(`Erro Role: ${ roleError.message } `);

        // Auto-update permissions for the new role
        const { error: permError } = await adminClient.from("user_permissions").upsert({
          user_id,
          ...getPermissionsForRole(role)
        }, { onConflict: "user_id" });
        if (permError) throw new Error(`Erro ao atualizar permissões automáticas: ${ permError.message } `);

        break;
      }

      case "update_agency": {
        const { user_id, agency_id } = payload;
        const { error } = await adminClient.from("profiles").update({ agency_id }).eq("user_id", user_id);
        if (error) throw new Error(`Erro Agência: ${ error.message } `);
        break;
      }

      case "update_password": {
        const { user_id, password } = payload;
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
        if (error) throw new Error(`Erro Senha: ${ error.message } `);
        break;
      }

      case "update_permissions": {
        const { user_id, permissions } = payload;
        const { error } = await adminClient.from("user_permissions").upsert({ user_id, ...permissions }, { onConflict: "user_id" });
        if (error) throw new Error(`Erro Permissões: ${ error.message } `);
        break;
      }

      case "delete": {
        const { user_id } = payload;
        if (!user_id) throw new Error("user_id é obrigatório");
        if (user_id === caller.id) throw new Error("Auto-exclusão não permitida");

        await adminClient.from("proposals").update({ created_by: null }).eq("created_by", user_id);
        await adminClient.from("disbursements").update({ requested_by: null, user_id: null }).or(`requested_by.eq.${ user_id }, user_id.eq.${ user_id } `);
        await adminClient.from("document_tasks").update({ user_id: null }).eq("user_id", user_id);

        await adminClient.from("user_permissions").delete().eq("user_id", user_id);
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        await adminClient.from("profiles").delete().eq("user_id", user_id);

        const { error: delError } = await adminClient.auth.admin.deleteUser(user_id);
        if (delError) throw new Error(`Erro ao remover da Autenticação: ${ delError.message } `);
        break;
      }

      default:
        throw new Error(`Ação '${action}' não reconhecida`);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error(`Edge Function Error: `, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
