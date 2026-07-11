import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { car_number } = await req.json();

    if (!car_number || !String(car_number).trim()) {
      throw new Error("Número do CAR é obrigatório");
    }

    const cleanCar = String(car_number).trim();

    // Endpoints do SICAR
    // Tentamos primeiro o endpoint tradicional de consulta pública leve
    const sicarUrl = `https://consultapublica.car.gov.br/publico/imoveis/buscar?codImovel=${encodeURIComponent(cleanCar)}`;

    console.log(`Buscando dados do CAR no SICAR: ${cleanCar}`);

    const response = await fetch(sicarUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://consultapublica.car.gov.br/publico/imoveis/index",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta do SICAR: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("A resposta do SICAR não é um JSON válido");
    }

    // Retorna os dados para o frontend
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("consultar-sicar Edge Function error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
