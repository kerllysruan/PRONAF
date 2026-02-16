import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: "Cabeçalho de autorização ausente" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client with the caller's auth context
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the JWT and get the user
    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser();

    if (authError || !caller) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Não autenticado", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing request from: ${caller.email}`);

    // Create admin client for sensitive operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin role - check both user_roles and permissions for redundancy
    const { data: roleData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (roleError || !roleData || roleData.role !== "admin") {
      console.warn(`Access denied for ${caller.email}: Not an admin`);
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores podem gerenciar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...payload } = await req.json();
    console.log(`Action: ${action}`);

    let responseData: any = { success: true };

    switch (action) {
      case "create": {
        const { email, password, display_name, role } = payload;
        if (!email || !password) throw new Error("Email e senha são obrigatórios");

        // 1. Create user in auth
        const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name },
        });

        if (createError) throw createError;
        const userId = authUser.user.id;

        // 2. Create profile
        await adminClient.from("profiles").upsert({
          id: userId,
          user_id: userId,
          email,
          display_name: display_name || email.split("@")[0],
          full_name: display_name || email.split("@")[0],
        });

        // 3. Set role
        await adminClient.from("user_roles").upsert({
          user_id: userId,
          role: role || "usuario",
        });

        // 4. Set default permissions
        const isStaff = (role === "admin" || role === "gerente");
        await adminClient.from("user_permissions").upsert({
          user_id: userId,
          can_view_dashboard: true,
          can_view_proposals: true,
          can_view_kanban: true,
          can_view_documentation: true,
          can_view_tasks: true,
          can_view_disbursements: true,
          can_view_visits: true,
          can_create_proposals: isStaff,
          can_edit_proposals: isStaff,
          can_delete_proposals: role === "admin",
          can_approve_proposals: isStaff,
          can_view_access_control: role === "admin",
          can_view_management: isStaff,
          can_manage_users: role === "admin",
          can_manage_tasks: isStaff,
          can_manage_disbursements: isStaff,
          can_manage_visits: isStaff,
          read_only: false,
        });

        responseData = { success: true, user: authUser.user };
        break;
      }

      case "update_role": {
        const { user_id, role } = payload;
        if (!user_id || !role) throw new Error("ID e cargo são obrigatórios");

        const { error: updateError } = await adminClient
          .from("user_roles")
          .upsert({ user_id, role }, { onConflict: "user_id" });

        if (updateError) throw updateError;
        break;
      }

      case "update_permissions": {
        const { user_id, permissions } = payload;
        if (!user_id || !permissions) throw new Error("ID e permissões são obrigatórios");

        const { error: permError } = await adminClient
          .from("user_permissions")
          .upsert({ user_id, ...permissions }, { onConflict: "user_id" });

        if (permError) throw permError;
        break;
      }

      case "update_password": {
        const { user_id, password } = payload;
        if (!user_id || !password) throw new Error("ID e senha são obrigatórios");

        const { error: pwError } = await adminClient.auth.admin.updateUserById(user_id, {
          password,
        });

        if (pwError) throw pwError;
        break;
      }

      case "delete": {
        const { user_id } = payload;
        if (!user_id) throw new Error("ID do usuário é obrigatório");
        if (user_id === caller.id) throw new Error("Você não pode excluir a si mesmo");

        // Delete dependencies first
        await adminClient.from("user_permissions").delete().eq("user_id", user_id);
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        await adminClient.from("profiles").delete().eq("id", user_id);

        const { error: delError } = await adminClient.auth.admin.deleteUser(user_id);
        if (delError) throw delError;
        break;
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`Error processing action:`, error.message);
    return new Response(JSON.stringify({ error: error.message || "Erro interno do servidor" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
