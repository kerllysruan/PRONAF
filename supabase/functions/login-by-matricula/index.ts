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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { matricula } = await req.json();

    if (!matricula || !String(matricula).trim()) {
      throw new Error("Matrícula é obrigatória");
    }

    const normalized = String(matricula).trim().toUpperCase();

    // Buscar o email do perfil pelo número de matrícula (case-insensitive)
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("email")
      .ilike("matricula", normalized)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError.message);
      throw new Error("Erro interno ao buscar matrícula");
    }

    if (!profile) {
      throw new Error("Matrícula não encontrada");
    }

    if (!profile.email) {
      throw new Error("Usuário sem e-mail configurado. Contate o administrador.");
    }

    return new Response(JSON.stringify({ email: profile.email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("login-by-matricula error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
