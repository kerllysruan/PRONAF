import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ailmvtqnrltepobtwbhq.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbG12dHFucmx0ZXBvYnR3YmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzY0ODQsImV4cCI6MjA4NjE1MjQ4NH0.FEUHSB5ZELbJDyndzbndD6DPcahEs_GEmxIpRAzS8go";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET_NAME = process.env.STORAGE_BUCKET || "certidoes";
const AUTH_SECRET = process.env.AUTH_SECRET_TOKEN || "supergestao_certidoes_secret_token_2026";

// Auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token de autorização não fornecido" });
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token !== AUTH_SECRET) {
    return res.status(403).json({ error: "Token de autorização inválido" });
  }
  next();
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

/**
 * POST /emitir-certidao-pf
 * Body: { cpf, data_nascimento, proposta_id, nome }
 *
 * Fluxo oficial da Receita Federal:
 *  1. Acessa: https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf
 *  2. Preenche CPF e Data de Nascimento
 *  3. Clica em "Emitir Certidão"
 *  4. Se houver modal de certidão existente ("Segunda Via"), clica em "Emitir Nova Certidão"
 *  5. Aguarda a navegação OBRIGATÓRIA para:
 *     https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf/resultado
 *  6. Na página #/home/cpf/resultado, extrai o PDF através de 4 camadas de garantia:
 *     - Evento automático de download disparado pelo site
 *     - Clique no link manual de download (a[download]) na página
 *     - Leitura direta do blob: via evaluate(fetch(href)) no navegador
 *     - Resposta da API /Emissao (campo pdf em base64) interceptada na página de resultado
 *  7. Valida se o arquivo é um PDF íntegro (%PDF-)
 *  8. Envia o PDF oficial para o Supabase Storage (bucket 'certidoes')
 *  9. Salva no banco de dados e retorna o link para download direto
 */
app.post("/emitir-certidao-pf", authenticate, async (req, res) => {
  const { cpf, data_nascimento, proposta_id, nome } = req.body;

  if (!cpf || !data_nascimento) {
    return res.status(400).json({
      error: "Campos obrigatórios ausentes: 'cpf' e 'data_nascimento' são requeridos.",
    });
  }

  const cleanCpf = cpf.replace(/\D/g, "");
  const cleanBirth = data_nascimento.replace(/\D/g, "");

  if (cleanCpf.length !== 11) {
    return res.status(400).json({ error: "CPF inválido. Deve conter 11 dígitos numéricos." });
  }

  if (cleanBirth.length !== 8) {
    return res.status(400).json({
      error: "Data de nascimento inválida. Formato esperado: DDMMAAAA ou DD/MM/AAAA.",
    });
  }

  const formattedBirth = `${cleanBirth.slice(0, 2)}/${cleanBirth.slice(2, 4)}/${cleanBirth.slice(4, 8)}`;

  console.log(`================================================================`);
  console.log(`[INÍCIO EMISSÃO] CPF: ${cleanCpf} | Nascimento: ${formattedBirth}`);
  console.log(`Proposta: ${proposta_id || "Avulsa"} | Nome: ${nome || "Não informado"}`);
  console.log(`================================================================`);

  let browser = null;

  try {
    // 1. Iniciar Playwright Chromium com downloads habilitados
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 2. Interceptar a resposta da API /Emissao para metadados e garantia
    let capturedApiResponse = null;
    page.on("response", async (response) => {
      const url = response.url();
      const method = response.request().method();
      if (
        url.includes("/Emissao") &&
        !url.includes("/verificar") &&
        !url.includes("/hcaptcha") &&
        method === "POST"
      ) {
        try {
          const body = await response.json();
          console.log(`[API /Emissao] Resposta capturada. statusEmissao=${body.statusEmissao}, tem PDF=${!!body.pdf}`);
          capturedApiResponse = body;
        } catch (_) {}
      }
    });

    // 3. Acessar o formulário inicial da Receita Federal
    const homeUrl = "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf";
    console.log(`-> Acessando: ${homeUrl}`);
    await page.goto(homeUrl, { waitUntil: "domcontentloaded", timeout: 35000 });

    // Aguardar campos do formulário
    const cpfInput = page.locator('input[name="niContribuinte"]').first();
    await cpfInput.waitFor({ state: "visible", timeout: 15000 });

    // Fechar cookies se presente
    try {
      const cookieBtn = page.locator('button:has-text("Aceitar")').first();
      if (await cookieBtn.isVisible({ timeout: 2000 })) {
        await cookieBtn.click();
        console.log("-> Aviso de cookies aceito.");
      }
    } catch (_) {}

    // 4. Preencher CPF e Data de Nascimento
    console.log("-> Preenchendo campos do formulário...");
    await cpfInput.click();
    await cpfInput.fill(cleanCpf);
    await page.waitForTimeout(300);

    const birthInput = page.locator('input[name="dataNascimento"]').first();
    await birthInput.click();
    await birthInput.fill(formattedBirth);
    await page.waitForTimeout(400);

    // 5. Preparar escuta de evento de download antes do clique
    const downloadPromise = page.waitForEvent("download", { timeout: 40000 }).catch(() => null);

    // 6. Clicar em "Emitir Certidão"
    console.log("-> Clicando em 'Emitir Certidão'...");
    const emitirBtn = page.locator('button[type="submit"]:has-text("Emitir Certidão")').first();
    await emitirBtn.click();

    // 7. Aguardar processamento da validação (3 a 5 segundos)
    await page.waitForTimeout(4000);

    // Verificar se modal de certidão existente ("Segunda Via") apareceu
    try {
      const modalSegundaVia = page.locator('.modal-segunda-via, text="Certidão Válida Encontrada", text="Já existe uma certidão válida"').first();
      if (await modalSegundaVia.isVisible({ timeout: 2000 })) {
        console.log('[MODAL SEGUNDA VIA] Certidão existente encontrada. Clicando em "Emitir Nova Certidão"...');
        const btnNova = page.locator('button:has-text("Emitir Nova Certidão")').first();
        if (await btnNova.isVisible({ timeout: 2000 })) {
          await btnNova.click();
        } else {
          const btnConsultar = page.locator('button:has-text("Consultar Certidão")').first();
          await btnConsultar.click();
        }
      }
    } catch (_) {}

    // 8. Aguardar navegação até a página de resultado da certidão:
    // https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf/resultado
    console.log("-> Aguardando navegação para: #/home/cpf/resultado ...");
    let chegouAoResultado = false;
    try {
      await page.waitForURL("**/resultado**", { timeout: 15000 });
      chegouAoResultado = true;
      console.log(`-> SUCESSO: Navegou para a página de resultado: ${page.url()}`);
    } catch (_) {
      console.log(`-> Não navegou para resultado. URL atual: ${page.url()}`);
    }

    // Se NÃO chegou à página de resultado, extrair os alertas de erro da Receita Federal
    if (!chegouAoResultado) {
      const errTexts = await page
        .locator('.br-message, .alert, [class*="feedback"], [class*="erro"], text="Mensagem de Erro", text="Não foi possível"')
        .allInnerTexts()
        .catch(() => []);

      let errorMsg = "A Receita Federal não avançou para a página de resultado da certidão.";
      if (errTexts.length > 0) {
        const cleanTexts = errTexts
          .map((t) => t.replace(/Fechar/g, "").replace(/\s+/g, " ").trim())
          .filter((t) => t.length > 5);
        if (cleanTexts.length > 0) {
          errorMsg = cleanTexts.join(" | ");
        }
      }

      await browser.close();
      browser = null;

      console.warn(`[ERRO NA EMISSÃO RECEITA] ${errorMsg}`);
      return res.status(422).json({
        success: false,
        situacao: "NÃO EMITIDA",
        error: errorMsg,
      });
    }

    // 9. CAPTURAR O PDF OFICIAL NA PÁGINA DE RESULTADO
    // (https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf/resultado)
    console.log("-> Extraindo o PDF oficial gerado na página de resultado...");
    let downloadedPdfBuffer = null;
    let nomeArquivoBaixado = `Certidao_${cleanCpf}.pdf`;

    // Camada 1: Evento automático de download do navegador disparado na página
    const autoDownload = await downloadPromise;
    if (autoDownload) {
      console.log(`-> [DOWNLOAD CAMADA 1 - OK] Evento automático disparado: ${autoDownload.suggestedFilename()}`);
      nomeArquivoBaixado = autoDownload.suggestedFilename();
      const tempPath = path.join(__dirname, `temp_auto_${Date.now()}_${nomeArquivoBaixado}`);
      await autoDownload.saveAs(tempPath);
      downloadedPdfBuffer = fs.readFileSync(tempPath);
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }

    // Camada 2: Clicar no link manual "download do documento PDF da certidão" presente na página
    if (!downloadedPdfBuffer) {
      console.log("-> Tentando Camada 2: Link manual de download na página de resultado...");
      try {
        const manualLink = page
          .locator('a[download], a:has-text("download do documento PDF"), a:has-text("download")')
          .first();

        if (await manualLink.isVisible({ timeout: 6000 })) {
          console.log("-> Link manual visível. Clicando...");
          const [manualDownload] = await Promise.all([
            page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
            manualLink.click(),
          ]);

          if (manualDownload) {
            console.log(`-> [DOWNLOAD CAMADA 2 - OK] Baixado via link: ${manualDownload.suggestedFilename()}`);
            nomeArquivoBaixado = manualDownload.suggestedFilename();
            const tempPath = path.join(__dirname, `temp_manual_${Date.now()}_${nomeArquivoBaixado}`);
            await manualDownload.saveAs(tempPath);
            downloadedPdfBuffer = fs.readFileSync(tempPath);
            try { fs.unlinkSync(tempPath); } catch (_) {}
          }
        }
      } catch (e2) {
        console.warn("-> Camada 2 aviso:", e2.message);
      }
    }

    // Camada 3: Leitura direta do objeto blob: URL gerado no DOM da página
    if (!downloadedPdfBuffer) {
      console.log("-> Tentando Camada 3: Extrair conteúdo do blob URL no navegador...");
      try {
        const manualLink = page
          .locator('a[download], a:has-text("download do documento PDF"), a:has-text("download")')
          .first();

        const blobHref = await manualLink.getAttribute("href").catch(() => null);
        if (blobHref && blobHref.startsWith("blob:")) {
          console.log(`-> Blob URL encontrado: ${blobHref}. Baixando diretamente via evaluate...`);
          const base64Data = await page.evaluate(async (url) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const resStr = reader.result;
                resolve(resStr.split(",")[1]);
              };
              reader.readAsDataURL(blob);
            });
          }, blobHref);

          if (base64Data) {
            console.log("-> [DOWNLOAD CAMADA 3 - OK] Blob extraído com sucesso!");
            downloadedPdfBuffer = Buffer.from(base64Data, "base64");
          }
        }
      } catch (e3) {
        console.warn("-> Camada 3 aviso:", e3.message);
      }
    }

    // Camada 4: Utilizar o PDF oficial retornado em base64 pela chamada da API /Emissao
    if (!downloadedPdfBuffer && capturedApiResponse?.pdf) {
      console.log("-> [DOWNLOAD CAMADA 4 - OK] Utilizando PDF retornado na resposta da API /Emissao da página de resultado.");
      downloadedPdfBuffer = Buffer.from(capturedApiResponse.pdf, "base64");
    }

    // Fechar o navegador
    await browser.close();
    browser = null;

    // 10. Validação de integridade do arquivo PDF
    if (!downloadedPdfBuffer || downloadedPdfBuffer.length < 500) {
      return res.status(500).json({
        success: false,
        error: "Não foi possível baixar o PDF oficial na página de resultado da Receita Federal.",
      });
    }

    const pdfHeader = downloadedPdfBuffer.slice(0, 5).toString();
    if (pdfHeader !== "%PDF-") {
      return res.status(500).json({
        success: false,
        error: `Arquivo baixado da Receita Federal possui cabeçalho inválido: '${pdfHeader}'. Esperado '%PDF-'.`,
      });
    }

    console.log(`-> [VALIDAÇÃO OK] PDF oficial verificado (%PDF-), tamanho: ${downloadedPdfBuffer.length} bytes.`);

    // 11. Extrair informações cadastrais da resposta oficial
    let situacao = "CERTIDÃO NEGATIVA";
    let dataValidade = null;
    let codigoControle = null;

    if (capturedApiResponse) {
      const msgTexto = capturedApiResponse.mensagem?.texto || "";
      if (msgTexto.includes("POSITIVA COM EFEITO DE NEGATIVA")) {
        situacao = "POSITIVA COM EFEITO DE NEGATIVA";
      } else if (msgTexto.includes("CERTIDÃO POSITIVA")) {
        situacao = "CERTIDÃO POSITIVA";
      } else if (msgTexto.includes("PENDÊNCIAS") || msgTexto.includes("PENDÊNCIA")) {
        situacao = "COM PENDÊNCIA";
      }

      const valMatch = msgTexto.match(/Válida até\s*([0-9/]{10})/i) || msgTexto.match(/Validade:\s*([0-9/]{10})/i);
      if (valMatch) dataValidade = valMatch[1].trim();

      const codMatch = msgTexto.match(/Código de controle[^:]*:\s*([A-Z0-9.\-]+)/i);
      if (codMatch) codigoControle = codMatch[1].trim();
    }

    // 12. Fazer upload do PDF oficial no Supabase Storage
    const storageFileName = `CPF_${cleanCpf}_${Date.now()}.pdf`;
    const storagePath = `certidoes_pf/${storageFileName}`;

    console.log(`-> Salvando PDF no Supabase Storage (${BUCKET_NAME}/${storagePath})...`);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, downloadedPdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    let pdfUrl = null;
    if (uploadError) {
      console.warn("-> Aviso no upload Storage:", uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      pdfUrl = urlData?.publicUrl || null;
      console.log(`-> PDF armazenado com sucesso: ${pdfUrl}`);
    }

    // 13. Atualizar data_nascimento na proposta
    if (proposta_id) {
      await supabase
        .from("stock_proposals")
        .update({ data_nascimento: formattedBirth, updated_at: new Date().toISOString() })
        .eq("id", proposta_id);
    }

    // 14. Registrar certidão emitida em public.certidoes_produtores
    const nowIso = new Date().toISOString();
    const validadeIso = dataValidade
      ? new Date(dataValidade.split("/").reverse().join("-")).toISOString()
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const { data: certRow } = await supabase
      .from("certidoes_produtores")
      .insert([
        {
          proposal_id: proposta_id || null,
          proposta_id: proposta_id || null,
          tipo: "CPF",
          cpf: cleanCpf,
          identificador: cleanCpf,
          nome: nome || `Produtor CPF ${cleanCpf}`,
          data_nascimento: formattedBirth,
          situacao,
          data_emissao: nowIso,
          data_validade: validadeIso,
          codigo_controle: codigoControle,
          observacoes: `Certidão oficial baixada diretamente do portal da Receita Federal (#/home/cpf/resultado). Código: ${codigoControle || "OK"}`,
          status_consulta: "OK",
          pdf_url: pdfUrl,
          arquivo_nome: storageFileName,
          atualizado_em: nowIso,
          criado_em: nowIso,
        },
      ])
      .select()
      .single();

    console.log(`================================================================`);
    console.log(`[EMISSÃO CONCLUÍDA COM SUCESSO]`);
    console.log(`Situação: ${situacao} | Validade: ${dataValidade || "180 dias"}`);
    console.log(`Código: ${codigoControle || "N/A"} | PDF: ${pdfUrl}`);
    console.log(`================================================================`);

    return res.status(200).json({
      success: true,
      situacao,
      data_emissao: new Date().toLocaleDateString("pt-BR"),
      data_validade: dataValidade || new Date(validadeIso).toLocaleDateString("pt-BR"),
      codigo_controle: codigoControle,
      pdf_url: pdfUrl,
      arquivo_nome: storageFileName,
      certidao_id: certRow?.id || null,
    });
  } catch (err) {
    console.error("[ERRO CRÍTICO NO RUNNER]", err);
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }

    return res.status(500).json({
      success: false,
      error: `Falha na automação da Receita Federal: ${err.message}`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  SUPERGESTÃO PRONAF — SERVIÇO DE CERTIDÕES PLAYWRIGHT          `);
  console.log(`  Servidor ouvindo na porta ${PORT}                             `);
  console.log(`  Endpoint: POST http://localhost:${PORT}/emitir-certidao-pf    `);
  console.log(`================================================================`);
});
