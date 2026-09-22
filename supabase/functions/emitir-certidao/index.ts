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
    const playwrightServiceUrl = Deno.env.get("PLAYWRIGHT_SERVICE_URL") || "http://localhost:3333";
    const authSecretToken = Deno.env.get("AUTH_SECRET_TOKEN") || "supergestao_certidoes_secret_token_2026";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { proposta_id, cpf: customCpf, data_nascimento: customBirth, nome: customNome } = await req.json();

    let targetCpf = customCpf;
    let targetBirth = customBirth;
    let targetNome = customNome;

    // Se veio proposta_id, buscar dados oficiais no banco
    if (proposta_id) {
      const { data: proposal, error: propError } = await adminClient
        .from("stock_proposals")
        .select("id, producer_name, producer_cpf, data_nascimento")
        .eq("id", proposta_id)
        .maybeSingle();

      if (propError) throw propError;
      if (proposal) {
        targetCpf = targetCpf || proposal.producer_cpf;
        targetBirth = targetBirth || proposal.data_nascimento;
        targetNome = targetNome || proposal.producer_name;
      }
    }

    if (!targetCpf) {
      return new Response(
        JSON.stringify({ error: "CPF do produtor não encontrado ou não informado." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!targetBirth) {
      return new Response(
        JSON.stringify({
          error: "Data de nascimento do produtor é obrigatória para emissão na Receita Federal.",
          needs_birth_date: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Chamar servidor Node.js Playwright
    try {
      const response = await fetch(`${playwrightServiceUrl}/emitir-certidao-pf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSecretToken}`,
        },
        body: JSON.stringify({
          proposta_id: proposta_id || null,
          cpf: targetCpf,
          data_nascimento: targetBirth,
          nome: targetNome,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (networkErr: any) {
      return new Response(
        JSON.stringify({
          error: `Não foi possível conectar ao servidor de automação Playwright (${playwrightServiceUrl}): ${networkErr.message}. Certifique-se de que o servidor server-certidoes está em execução.`,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
