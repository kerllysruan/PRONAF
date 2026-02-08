import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Não autorizado");

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!callerRole) throw new Error("Apenas administradores podem gerenciar usuários");

    const { action, ...payload } = await req.json();

    if (action === "list") {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;

      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const { data: permissions } = await supabaseAdmin.from("user_permissions").select("*");
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

      const enriched = users.users.map((u) => ({
        id: u.id,
        email: u.email,
        display_name: profiles?.find((p) => p.user_id === u.id)?.display_name || u.email,
        created_at: u.created_at,
        role: roles?.find((r) => r.user_id === u.id)?.role || "usuario",
        permissions: permissions?.find((p) => p.user_id === u.id) || null,
      }));

      return new Response(JSON.stringify({ users: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, display_name, role } = payload;
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
      if (error) throw error;

      // Update role if not default
      if (role && role !== "usuario") {
        await supabaseAdmin
          .from("user_roles")
          .update({ role })
          .eq("user_id", newUser.user.id);
      }

      return new Response(JSON.stringify({ user: newUser.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role } = payload;
      await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", user_id);
      
      // If admin, enable access control view
      if (role === "admin") {
        await supabaseAdmin.from("user_permissions").update({ 
          can_view_access_control: true, can_approve_proposals: true 
        }).eq("user_id", user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_permissions") {
      const { user_id, permissions } = payload;
      await supabaseAdmin.from("user_permissions").update(permissions).eq("user_id", user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      const { user_id, password } = payload;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (user_id === caller.id) throw new Error("Não é possível excluir a si mesmo");
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
