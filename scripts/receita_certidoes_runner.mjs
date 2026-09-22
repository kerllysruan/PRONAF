import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ailmvtqnrltepobtwbhq.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbG12dHFucmx0ZXBvYnR3YmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzY0ODQsImV4cCI6MjA4NjE1MjQ4NH0.FEUHSB5ZELbJDyndzbndD6DPcahEs_GEmxIpRAzS8go";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Output directory for PDFs
const OUTPUT_DIR = path.resolve(__dirname, "..", "downloads", "certidoes");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// URLs by type
const URLS = {
  CPF: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf",
  CNPJ: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj",
  CIB: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cib",
};

/**
 * Clean string for safe file naming
 */
function sanitizeFileName(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 40);
}

/**
 * Process a single certificate query
 */
async function processItem(page, item) {
  const { tipo, identificador, nome, data_nascimento, id } = item;
  const targetUrl = URLS[tipo] || URLS.CPF;
  const cleanId = (identificador || "").replace(/\D/g, "");

  console.log(`\n--------------------------------------------------`);
  console.log(`[PROCESSANDO] ${tipo}: ${identificador} | Titular: ${nome}`);
  console.log(`[URL] ${targetUrl}`);

  try {
    // 1. Acessar URL
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2000);

    // 2. Verificar se caiu em tela de login gov.br
    const isGovBr = page.url().includes("gov.br") || (await page.locator("text=Entrar com gov.br").count()) > 0;
    if (isGovBr) {
      console.warn("⚠️ [ATENÇÃO] Aguardando login manual em gov.br — Não tente preencher usuário/senha automaticamente.");
      // Atualizar status no Supabase
      if (id) {
        await supabase
          .from("certidoes_produtores")
          .update({
            status_consulta: "AGUARDANDO_GOVBR",
            motivo_erro: "Aguardando autenticação manual no gov.br",
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", id);
      }
      return {
        tipo,
        identificador,
        nome,
        situacao: "AGUARDANDO GOV.BR",
        data_emissao: null,
        data_validade: null,
        observacoes: "Necessária intervenção manual de login gov.br",
        status: "AGUARDANDO_GOVBR",
        motivo: "Aguardando login manual em gov.br",
      };
    }

    // 3. Preencher formulário de acordo com o tipo
    if (tipo === "CPF") {
      // Input CPF
      const cpfInput = page.locator('input[type="text"]').first();
      await cpfInput.waitFor({ timeout: 10000 });
      await cpfInput.fill(cleanId);

      // Data de nascimento
      if (data_nascimento) {
        const cleanBirth = data_nascimento.replace(/\D/g, "");
        const birthInput = page.locator('input[type="text"]').nth(1);
        if (await birthInput.isVisible()) {
          await birthInput.fill(cleanBirth);
        }
      } else {
        console.warn("ℹ️ CPF sem data de nascimento informada. A consulta pode exigir este campo.");
      }
    } else if (tipo === "CNPJ") {
      const cnpjInput = page.locator('input[type="text"]').first();
      await cnpjInput.waitFor({ timeout: 10000 });
      await cnpjInput.fill(cleanId);
    } else if (tipo === "CIB") {
      const cibInput = page.locator('input[type="text"]').first();
      await cibInput.waitFor({ timeout: 10000 });
      await cibInput.fill(cleanId);
    }

    await page.waitForTimeout(1000);

    // 4. Clique em "Emitir Certidão"
    const emitirBtn = page.locator('button:has-text("Emitir Certidão"), button:has-text("Consultar"), button:has-text("Emitir")').first();
    if (await emitirBtn.isVisible()) {
      await emitirBtn.click();
      console.log("-> Botão 'Emitir Certidão' acionado.");
    } else {
      throw new Error("Botão de emissão não localizado na página da Receita Federal.");
    }

    // 5. Aguardar carregamento (até 30 segundos)
    console.log("-> Aguardando resposta do sistema da Receita Federal (até 30s)...");
    await page.waitForTimeout(5000);

    // Verificar mensagens de erro na tela
    const errorMsgLocator = page.locator('.alert-danger, .msg-erro, .text-danger, text="não foi possível", text="inválido", text="irregular"').first();
    if (await errorMsgLocator.isVisible()) {
      const errText = (await errorMsgLocator.textContent()) || "Erro retornado pelo portal da Receita.";
      console.error(`❌ Erro da Receita: ${errText.trim()}`);
      
      if (id) {
        await supabase
          .from("certidoes_produtores")
          .update({
            status_consulta: "ERRO",
            motivo_erro: errText.trim(),
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", id);
      }

      return {
        tipo,
        identificador,
        nome,
        situacao: "NÃO EMITIDA",
        data_emissao: null,
        data_validade: null,
        observacoes: errText.trim(),
        status: "ERRO",
        motivo: errText.trim(),
      };
    }

    // 6. Extração dos dados e PDF
    const pageText = await page.innerText("body");
    let situacao = "CERTIDÃO NEGATIVA";
    if (pageText.includes("POSITIVA COM EFEITO DE NEGATIVA")) {
      situacao = "POSITIVA COM EFEITO DE NEGATIVA";
    } else if (pageText.includes("CERTIDÃO POSITIVA")) {
      situacao = "CERTIDÃO POSITIVA";
    } else if (pageText.includes("CONSTA PENDÊNCIA") || pageText.includes("PENDÊNCIAS")) {
      situacao = "COM PENDÊNCIA";
    }

    // Extrair datas via Regex
    const emissaoMatch = pageText.match(/Emitida às\s*([^\n\r]+)/i) || pageText.match(/(\d{2}\/\d{2}\/\d{4})/);
    const validadeMatch = pageText.match(/Válida até\s*([0-9/]{10})/i) || pageText.match(/Validade:\s*([0-9/]{10})/i);
    const codigoMatch = pageText.match(/Código de controle[^\n\r:]*:\s*([A-Z0-9.]+)/i);

    const dataEmissao = emissaoMatch ? emissaoMatch[1].trim() : new Date().toLocaleDateString("pt-BR");
    const dataValidade = validadeMatch ? validadeMatch[1].trim() : null;
    const codigoControle = codigoMatch ? codigoMatch[1].trim() : null;

    // 7. Salvar PDF do comprovante
    const safeName = sanitizeFileName(nome);
    const fileName = `${tipo}_${cleanId}_${safeName}.pdf`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    try {
      await page.pdf({
        path: filePath,
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      });
      console.log(`✅ PDF salvo em: ${filePath}`);
    } catch (pdfErr) {
      console.warn(`Aviso ao gerar PDF nativo: ${pdfErr.message}`);
    }

    // 8. Gravação no Supabase
    if (id) {
      await supabase
        .from("certidoes_produtores")
        .update({
          situacao,
          data_emissao: new Date().toISOString(),
          data_validade: dataValidade ? new Date(dataValidade.split("/").reverse().join("-")).toISOString() : null,
          codigo_controle: codigoControle,
          observacoes: `Consulta automatizada realizada com sucesso. Arquivo: ${fileName}`,
          status_consulta: "OK",
          motivo_erro: null,
          arquivo_nome: fileName,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", id);
    } else {
      await supabase.from("certidoes_produtores").insert([
        {
          tipo,
          identificador,
          nome,
          situacao,
          data_emissao: new Date().toISOString(),
          data_validade: dataValidade ? new Date(dataValidade.split("/").reverse().join("-")).toISOString() : null,
          codigo_controle: codigoControle,
          observacoes: `Consulta automatizada via Playwright.`,
          status_consulta: "OK",
          arquivo_nome: fileName,
          atualizado_em: new Date().toISOString(),
        },
      ]);
    }

    console.log(`✅ [SUCESSO] ${nome} -> Situação: ${situacao} | Validade: ${dataValidade || "Consultar PDF"}`);

    return {
      tipo,
      identificador,
      nome,
      situacao,
      data_emissao: dataEmissao,
      data_validade: dataValidade || "—",
      observacoes: `Código: ${codigoControle || "OK"}`,
      status: "OK",
      motivo: null,
      pdfPath: filePath,
    };
  } catch (err) {
    console.error(`❌ [FALHA] ${nome}: ${err.message}`);
    if (id) {
      await supabase
        .from("certidoes_produtores")
        .update({
          status_consulta: "ERRO",
          motivo_erro: err.message,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", id);
    }

    return {
      tipo,
      identificador,
      nome,
      situacao: "ERRO",
      data_emissao: null,
      data_validade: null,
      observacoes: err.message,
      status: "ERRO",
      motivo: err.message,
    };
  }
}

/**
 * Main execution function
 */
async function run() {
  console.log("=================================================================");
  console.log("   SUPERGESTÃO PRONAF — AUTOMATIZADOR DE CERTIDÕES RECEITA       ");
  console.log("=================================================================");

  // Check if items provided via JSON argument or fetch from Supabase
  let items = [];
  const args = process.argv.slice(2);
  const jsonArg = args.find((a) => a.startsWith("--items="));

  if (jsonArg) {
    const raw = jsonArg.replace("--items=", "");
    try {
      items = JSON.parse(raw);
    } catch (e) {
      console.error("Erro ao analisar JSON de itens:", e.message);
    }
  } else {
    // Fetch pending items from Supabase
    console.log("Buscando consultas pendentes no Supabase...");
    const { data, error } = await supabase
      .from("certidoes_produtores")
      .select("*")
      .in("status_consulta", ["PENDENTE", "ERRO"])
      .limit(20);

    if (error) {
      console.error("Erro ao conectar com Supabase:", error.message);
    } else {
      items = data || [];
    }
  }

  if (items.length === 0) {
    console.log("Nenhum item pendente para processar no momento.");
    console.log("Você pode adicionar consultas na tela /automatizador-certidoes.");
    return;
  }

  console.log(`Encontrados ${items.length} itens para processar.`);

  // Launch Chromium
  const browser = await chromium.launch({
    headless: true, // set to false for interactive debugging / gov.br login
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  const results = [];
  for (const item of items) {
    const res = await processItem(page, item);
    results.push(res);
  }

  await browser.close();

  // Consolidação final
  console.log("\n=================================================================");
  console.log("                    TABELA CONSOLIDADA FINAL                     ");
  console.log("=================================================================");
  console.table(
    results.map((r) => ({
      Tipo: r.tipo,
      Identificador: r.identificador,
      Nome: r.nome,
      Situação: r.situacao,
      "Data Emissão": r.data_emissao,
      Validade: r.data_validade,
      Status: r.status,
    }))
  );

  const total = results.length;
  const sucessos = results.filter((r) => r.status === "OK").length;
  const erros = results.filter((r) => r.status === "ERRO").length;
  const aguardandoGovBr = results.filter((r) => r.status === "AGUARDANDO_GOVBR").length;

  console.log("\n========================= RESUMO DA EXECUÇÃO =========================");
  console.log(`Total Processado: ${total}`);
  console.log(`Com Sucesso (OK): ${sucessos}`);
  console.log(`Com Erro:         ${erros}`);
  console.log(`Aguardando Gov.br:${aguardandoGovBr}`);

  if (erros > 0) {
    console.log("\nDetalhamento dos Erros:");
    results
      .filter((r) => r.status === "ERRO")
      .forEach((r) => {
        console.log(` - [${r.tipo}] ${r.identificador} (${r.nome}): ${r.motivo}`);
      });
  }
  console.log("======================================================================\n");
}

run().catch((err) => {
  console.error("Erro fatal na execução do automatizador:", err);
  process.exit(1);
});
