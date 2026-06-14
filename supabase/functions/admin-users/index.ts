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
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Autorização ausente - Header not found");
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();
    if (authError || !caller) {
      console.error("Auth failed:", authError);
      throw new Error(`Autenticação falhou: ${authError?.message || 'Token inválido'}`);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller role and agency
    const { data: callerRoleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleError || !callerRoleData) throw new Error("Erro ao verificar permissões do usuário.");

    const callerRole = callerRoleData.role;

    // Get caller's agency if not dev
    let callerAgencyId: string | null = null;
    if (callerRole !== "developer") {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("agency_id")
        .eq("user_id", caller.id)
        .single();
      callerAgencyId = profile?.agency_id;
    }

    if (callerRole !== "admin" && callerRole !== "developer") {
      throw new Error("Acesso negado. Apenas gerentes gerais ou desenvolvedores podem gerenciar usuários.");
    }

    const { action, ...payload } = await req.json();
    console.log(`Action: ${action} by ${caller.email} (${callerRole})`);

    let responseData: any = { success: true };

    const getPermissionsForRole = (role: string) => {
      // Default false for everything
      const perms = {
        can_view_dashboard: true, // Everyone sees dashboard
        can_view_proposals: false,
        can_create_proposals: false,
        can_edit_proposals: false,
        can_delete_proposals: false,
        can_approve_proposals: false,
        can_view_kanban: false,
        can_view_documentation: true, // Everyone sees docs
        can_view_tasks: true, // Everyone sees tasks (scoped)
        can_manage_tasks: false,
        can_view_disbursements: false,
        can_manage_disbursements: false,
        can_view_management: false,
        can_manage_users: false,
        can_manage_agencies: false,
        can_view_access_control: false,
      };

      switch (role) {
        case "developer":
          return {
            ...perms,
            can_view_proposals: true,
            can_create_proposals: true,
            can_edit_proposals: true,
            can_delete_proposals: true,
            can_approve_proposals: true,
            can_view_kanban: true,
            can_manage_tasks: true,
            can_view_disbursements: true,
            can_manage_disbursements: true,
            can_view_management: true,
            can_manage_users: true,
            can_manage_agencies: true,
            can_view_access_control: true,
          };
        case "admin": // Gerente Geral
          return {
            ...perms,
            can_view_proposals: true,
            // Gerente Geral usually oversees, maybe edits? Let's say yes.
            can_create_proposals: true,
            can_edit_proposals: true,
            can_delete_proposals: true, // Can delete in their agency
            can_approve_proposals: true,
            can_view_kanban: true,
            can_manage_tasks: true,
            can_view_disbursements: true,
            can_manage_disbursements: true,
            can_view_management: true, // Access to user mgmt
            can_manage_users: true,   // Access to user mgmt
            can_view_access_control: false, // Only dev changes perm logic ideally, or maybe read only? Let's hide for now.
          };
        case "manager": // Gerente de Negócios
          return {
            ...perms,
            can_view_proposals: true,
            can_create_proposals: true,
            can_edit_proposals: true,
            can_approve_proposals: true,
            can_view_kanban: true,
            can_manage_tasks: true,
            can_view_disbursements: true, // Read only disbursements? Or manage? Request says "acesso a tudo menos cadastro usuario"
            can_manage_disbursements: true,
          };
        case "analyst": // Analista
          return {
            ...perms,
            can_view_proposals: true,
            can_create_proposals: true,
            can_edit_proposals: true,
            can_view_kanban: true,
            can_manage_tasks: true,
          };
        case "financial": // Desembolso
          return {
            ...perms,
            can_view_proposals: true, // Needs to see proposals to link disbursements
            can_view_disbursements: true,
            can_manage_disbursements: true,
          };
        case "projetista": // Projetista vinculado à agência
          return {
            ...perms,
            can_view_proposals: true,
            can_create_proposals: true,
            can_edit_proposals: true,
          };
        default: // 'usuario' or others
          return perms;
      }
    };

    switch (action) {
      case "create": {
        let { email, password, display_name, role, agency_id } = payload;
        let matricula: string | null = null;

        // Auto-detect matricula if email doesn't have @
        if (email && !email.includes("@")) {
          matricula = email.toUpperCase();
          email = `admin-${matricula}@pronaf.local`;
        } else if (email) {
          // Try to extract matricula from email if it follows the pattern
          const match = email.match(/admin-(.*)@pronaf\.local/);
          if (match) matricula = match[1].toUpperCase();
        }

        // Validation: Only Dev can create Admins/Devs
        if ((role === "admin" || role === "developer") && callerRole !== "developer") {
          throw new Error("Acesso negado. Apenas desenvolvedores podem criar Gerentes Gerais ou Desenvolvedores.");
        }

        // Validation: Admin can only create users for their own agency
        if (callerRole === "admin") {
          if (agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Você só pode criar usuários para sua própria agência.");
          }
        }

        const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { display_name, matricula }
        });
        if (createError) throw new Error(`Erro Auth: ${createError.message}`);

        const userId = authUser.user.id;

        // Ensure id and user_id are both set to the UID for RLS consistency
        // Handle empty string agency_id as null
        const finalAgencyId = (agency_id === "" || agency_id === "none") ? null : agency_id;

        const { error: profileError } = await adminClient.from("profiles").upsert({
          id: userId,
          user_id: userId,
          email,
          matricula,
          display_name,
          full_name: display_name,
          agency_id: finalAgencyId
        }, { onConflict: "id" });
        if (profileError) throw new Error(`Erro Profile: ${profileError.message}`);

        const { error: roleError } = await adminClient.from("user_roles").upsert({ user_id: userId, role: role || "usuario" }, { onConflict: "user_id" });
        if (roleError) throw new Error(`Erro UserRole: ${roleError.message}`);

        const { error: permError } = await adminClient.from("user_permissions").upsert({
          user_id: userId,
          ...getPermissionsForRole(role || "usuario")
        }, { onConflict: "user_id" });
        if (permError) throw new Error(`Erro UserPermissions: ${permError.message}`);

        responseData = { success: true, user: authUser.user };
        break;
      }

      case "update_role": {
        const { user_id, role } = payload;

        const { data: targetRoleData } = await adminClient.from("user_roles").select("role").eq("user_id", user_id).single();
        const isTargetAdmin = targetRoleData?.role === "admin" || targetRoleData?.role === "developer";
        const isNewAdmin = role === "admin" || role === "developer";

        if ((isTargetAdmin || isNewAdmin) && callerRole !== "developer") {
          throw new Error("Acesso negado. Apenas desenvolvedores podem gerenciar cargos administrativos.");
        }

        const { error: roleError } = await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id" });
        if (roleError) throw new Error(`Erro Role: ${roleError.message}`);

        // Auto-update permissions for the new role
        const { error: permError } = await adminClient.from("user_permissions").upsert({
          user_id,
          ...getPermissionsForRole(role)
        }, { onConflict: "user_id" });
        if (permError) throw new Error(`Erro ao atualizar permissões automáticas: ${permError.message}`);

        break;
      }

      case "update_agency": {
        const { user_id, agency_id } = payload;

        if (callerRole !== "developer") {
          // Admin can only set agency_id to their own agency.
          if (agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Você só pode mover usuários para sua agência.");
          }
        }

        // Handle empty string as null for UUID compatibility
        const finalAgencyId = (agency_id === "" || agency_id === "none") ? null : agency_id;
        console.log(`Updating agency for ${user_id} to ${finalAgencyId}`);

        const { error } = await adminClient.from("profiles").update({ agency_id: finalAgencyId }).eq("user_id", user_id);
        if (error) throw new Error(`Erro Agência: ${error.message}`);
        break;
      }

      case "update_profile": {
        const { user_id, email, display_name, matricula } = payload;
        
        if (callerRole === "admin") {
          const { data: targetProfile } = await adminClient.from("profiles").select("agency_id").eq("user_id", user_id).single();
          if (targetProfile?.agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Usuário pertence a outra agência.");
          }
        }

        const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, { 
          email, 
          user_metadata: { display_name, matricula } 
        });
        if (authError) throw new Error(`Erro Auth: ${authError.message}`);

        const { error: profileError } = await adminClient.from("profiles").update({ 
          email, 
          display_name, 
          full_name: display_name,
          matricula 
        }).eq("user_id", user_id);
        if (profileError) throw new Error(`Erro Perfil: ${profileError.message}`);
        
        break;
      }

      case "update_password": {
        const { user_id, password } = payload;
        // Verify target is in agency if caller is admin
        if (callerRole === "admin") {
          const { data: targetProfile } = await adminClient.from("profiles").select("agency_id").eq("user_id", user_id).single();
          if (targetProfile?.agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Usuário pertence a outra agência.");
          }
        }

        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
        if (error) throw new Error(`Erro Senha: ${error.message}`);
        break;
      }

      case "update_permissions": {
        // Only developer should probably do manual granular overrides? 
        // Or Admin can do it for their staff? Let's allow Admin for their staff.
        const { user_id, permissions } = payload;

        if (callerRole === "admin") {
          const { data: targetProfile } = await adminClient.from("profiles").select("agency_id").eq("user_id", user_id).single();
          if (targetProfile?.agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Usuário pertence a outra agência.");
          }
        }

        const { error } = await adminClient.from("user_permissions").upsert({ user_id, ...permissions }, { onConflict: "user_id" });
        if (error) throw new Error(`Erro Permissões: ${error.message}`);
        break;
      }

      case "delete": {
        const { user_id } = payload;
        if (!user_id) throw new Error("user_id é obrigatório");
        if (user_id === caller.id) throw new Error("Auto-exclusão não permitida");

        if (callerRole === "admin") {
          const { data: targetProfile } = await adminClient.from("profiles").select("agency_id").eq("user_id", user_id).single();
          if (targetProfile?.agency_id !== callerAgencyId) {
            throw new Error("Acesso negado. Usuário pertence a outra agência.");
          }
          // Also check if target is admin/dev?
          const { data: pRole } = await adminClient.from("user_roles").select("role").eq("user_id", user_id).single();
          if (pRole?.role === "admin" || pRole?.role === "developer") {
            throw new Error("Acesso negado. Você não pode deletar administradores.");
          }
        }

        await adminClient.from("proposals").update({ created_by: null }).eq("created_by", user_id);
        await adminClient.from("disbursements").update({ requested_by: null, user_id: null }).or(`requested_by.eq.${user_id},user_id.eq.${user_id}`);
        await adminClient.from("document_tasks").update({ user_id: null }).eq("user_id", user_id);

        await adminClient.from("user_permissions").delete().eq("user_id", user_id);
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        await adminClient.from("profiles").delete().eq("user_id", user_id);

        const { error: delError } = await adminClient.auth.admin.deleteUser(user_id);
        if (delError) throw new Error(`Erro ao remover da Autenticação: ${delError.message}`);
        break;
      }

      default:
        throw new Error(`Ação '${action}' não reconhecida`);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error(`Edge Function Error:`, error.message);
    if (error.stack) console.error(error.stack);

    // Return a more detailed error if available
    const errorMessage = error.message || "Unknown error";
    const errorDetails = error.details || error.hint || null;

    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails
    }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
