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
 * Fluxo:
 *  1. Playwright abre o portal da Receita Federal (https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf)
 *  2. Intercepta a resposta da API POST /Emissao que retorna o PDF em base64
 *  3. Decodifica o base64 → buffer → upload no Supabase Storage
 *  4. Grava registro em certidoes_produtores
 *  5. Retorna pdf_url público
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

  // Format date as DD/MM/YYYY for input
  const formattedBirth = `${cleanBirth.slice(0, 2)}/${cleanBirth.slice(2, 4)}/${cleanBirth.slice(4, 8)}`;

  console.log(
    `[EMISSÃO INICIADA] CPF: ${cleanCpf} | Nasc: ${formattedBirth} | Proposta: ${proposta_id || "avulsa"}`
  );

  let browser = null;

  try {
    // 1. Iniciar Playwright Chromium
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      // Hide webdriver flag
      javaScriptEnabled: true,
    });

    // Remove webdriver property
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    const page = await context.newPage();

    // 2. Interceptar a resposta da API /Emissao para capturar o PDF em base64
    let capturedApiResponse = null;
    let capturedEmissaoError = null;

    // Intercepta respostas do endpoint /Emissao (não /verificar)
    page.on("response", async (response) => {
      const url = response.url();
      const method = response.request().method();
      if (
        url.includes("/Emissao") &&
        !url.includes("/verificar") &&
        !url.includes("/hcaptcha") &&
        method === "POST"
      ) {
        console.log(`[API INTERCEPT] POST ${url} → status ${response.status()}`);
        try {
          const body = await response.json();
          console.log(
            `[API INTERCEPT] statusEmissao: ${body.statusEmissao}, has pdf: ${!!body.pdf}`
          );
          capturedApiResponse = body;
        } catch (e) {
          console.warn("[API INTERCEPT] Não foi possível parsear JSON da resposta:", e.message);
        }
      }
    });

    // 3. Acessar portal da Receita Federal
    const targetUrl = "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf";
    console.log(`-> Navegando para: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2000);

    // Fechar aviso de cookies se presente
    try {
      const cookieBtn = page.locator('button:has-text("Aceitar")').first();
      if (await cookieBtn.isVisible({ timeout: 2000 })) {
        await cookieBtn.click();
        await page.waitForTimeout(500);
      }
    } catch (_) {}

    // 4. Preencher CPF e Data de Nascimento
    const cpfInput = page.locator('input[name="niContribuinte"]').first();
    await cpfInput.waitFor({ timeout: 10000 });
    await cpfInput.click();
    await cpfInput.fill(cleanCpf);
    await page.waitForTimeout(300);

    const birthInput = page.locator('input[name="dataNascimento"]').first();
    await birthInput.waitFor({ timeout: 10000 });
    await birthInput.click();
    await birthInput.fill(formattedBirth);
    await page.waitForTimeout(500);

    // 5. Clicar em "Emitir Certidão" — aguardar resposta da API
    console.log('-> Clicando em "Emitir Certidão"...');
    const emitirBtn = page
      .locator(
        'button[type="submit"]:has-text("Emitir Certidão"), button.br-button.primary.btn-acao-3:has-text("Emitir")'
      )
      .first();

    // Aguardar resposta da API /Emissao OU timeout
    const [apiResponsePromise] = await Promise.allSettled([
      page.waitForResponse(
        (response) => {
          const url = response.url();
          return (
            url.includes("/Emissao") &&
            !url.includes("/verificar") &&
            response.request().method() === "POST"
          );
        },
        { timeout: 40000 }
      ),
    ]);

    // Clicar após configurar o listener
    await emitirBtn.click();
    console.log("-> Botão clicado. Aguardando resposta da Receita Federal...");

    // Aguardar processamento completo (inclui polling se necessário)
    await page.waitForTimeout(5000);

    // Tentar aguardar mais tempo se necessário
    let waitCount = 0;
    while (!capturedApiResponse && waitCount < 8) {
      await page.waitForTimeout(2000);
      waitCount++;
      console.log(`-> Aguardando resposta da API... (${waitCount * 2}s / 16s)`);
    }

    // Verificar erros na página (erro de captcha, divergência cadastral, etc.)
    try {
      const errorLocator = page
        .locator('.alert-danger, .msg-erro, [class*="erro"], [class*="alert-info"]')
        .first();
      if (await errorLocator.isVisible({ timeout: 1500 })) {
        const errText = (await errorLocator.textContent()) || "";
        if (
          errText.toLowerCase().includes("divergência") ||
          errText.toLowerCase().includes("inválido") ||
          errText.toLowerCase().includes("não foi possível") ||
          errText.toLowerCase().includes("pendência")
        ) {
          console.warn(`[ERRO RECEITA] ${errText.trim()}`);
          await browser.close();
          return res.status(422).json({
            success: false,
            situacao: "NÃO EMITIDA",
            error: errText.trim(),
          });
        }
      }
    } catch (_) {}

    // 6. Processar resposta capturada da API
    if (!capturedApiResponse) {
      // Tentar extrair dados da página renderizada como fallback
      console.warn(
        "[AVISO] Resposta da API não capturada. Tentando extrair dados da página renderizada..."
      );

      const pageText = await page.innerText("body").catch(() => "");
      let situacao = "CERTIDÃO NEGATIVA";
      if (pageText.includes("POSITIVA COM EFEITO DE NEGATIVA")) {
        situacao = "POSITIVA COM EFEITO DE NEGATIVA";
      } else if (pageText.includes("CERTIDÃO POSITIVA") || pageText.includes("PENDÊNCIAS")) {
        situacao = "COM PENDÊNCIA";
      }

      // Último recurso: gerar PDF via page.pdf() da página de resultado
      const tempFileName = `CPF_${cleanCpf}_${Date.now()}.pdf`;
      const tempFilePath = path.join(__dirname, tempFileName);
      await page.pdf({
        path: tempFilePath,
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      });

      await browser.close();
      browser = null;

      const fileBuffer = fs.readFileSync(tempFilePath);
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}

      // Verificar se é PDF válido
      const isPdfValid = fileBuffer.slice(0, 5).toString() === "%PDF-";
      console.log(
        `[FALLBACK PDF] Tamanho: ${fileBuffer.length} bytes, válido: ${isPdfValid}`
      );

      const storagePath = `certidoes_pf/${tempFileName}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, { contentType: "application/pdf", upsert: true });

      let pdfUrl = null;
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        pdfUrl = urlData?.publicUrl || null;
      }

      return res.status(200).json({
        success: true,
        situacao,
        data_emissao: new Date().toLocaleDateString("pt-BR"),
        data_validade: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
        pdf_url: pdfUrl,
        arquivo_nome: tempFileName,
        aviso: "PDF gerado via renderização de página (API não capturada)",
      });
    }

    await browser.close();
    browser = null;

    // 7. Decodificar PDF base64 da resposta da API
    const apiBody = capturedApiResponse;
    const statusEmissao = apiBody.statusEmissao || "";
    const pdfBase64 = apiBody.pdf || null;

    // Mapear statusEmissao para situação legível
    let situacao = "CERTIDÃO NEGATIVA";
    if (statusEmissao === "Sucesso" || statusEmissao === "Emitida") {
      situacao = "CERTIDÃO NEGATIVA";
    } else if (statusEmissao === "EmProcessamento") {
      situacao = "EM PROCESSAMENTO";
    } else if (statusEmissao === "SemDireitoCertidao") {
      situacao = "COM PENDÊNCIA";
    } else if (apiBody.mensagem?.texto) {
      situacao = apiBody.mensagem.texto.substring(0, 50);
    }

    // Extrair código de controle e validade da mensagem HTML
    let codigoControle = null;
    let dataValidade = null;
    const htmlMensagem = apiBody.mensagem?.texto || "";

    const codigoMatch = htmlMensagem.match(/Código de controle[^:]*:\s*([A-Z0-9.\-]+)/i);
    if (codigoMatch) codigoControle = codigoMatch[1].trim();

    const validadeMatch = htmlMensagem.match(/Válida até\s*([0-9/]{10})/i);
    if (validadeMatch) dataValidade = validadeMatch[1].trim();

    if (!pdfBase64) {
      console.warn(`[AVISO] API respondeu mas sem campo 'pdf'. statusEmissao: ${statusEmissao}`);
      return res.status(422).json({
        success: false,
        situacao,
        error: `Receita Federal retornou status: ${statusEmissao}. ${apiBody.mensagem?.texto || ""}`,
        status_emissao: statusEmissao,
      });
    }

    // 8. Decodificar base64 → buffer binário do PDF
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    console.log(
      `[PDF CAPTURADO] Tamanho: ${pdfBuffer.length} bytes | Válido: ${pdfBuffer.slice(0, 5).toString() === "%PDF-"}`
    );

    const tempFileName = `CPF_${cleanCpf}_${Date.now()}.pdf`;
    const storagePath = `certidoes_pf/${tempFileName}`;

    // 9. Upload do PDF real no Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    let pdfUrl = null;
    if (uploadError) {
      console.warn("Aviso ao enviar PDF para o Storage:", uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      pdfUrl = urlData?.publicUrl || null;
    }

    // 10. Atualizar data_nascimento na proposta caso vinculado
    if (proposta_id) {
      await supabase
        .from("stock_proposals")
        .update({ data_nascimento: formattedBirth, updated_at: new Date().toISOString() })
        .eq("id", proposta_id);
    }

    // 11. Gravar na tabela certidoes_produtores
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
          observacoes: `Emitida via Playwright. Status: ${statusEmissao}. Código: ${codigoControle || "N/A"}`,
          status_consulta: "OK",
          pdf_url: pdfUrl,
          arquivo_nome: tempFileName,
          atualizado_em: nowIso,
          criado_em: nowIso,
        },
      ])
      .select()
      .single();

    console.log(`[EMISSÃO CONCLUÍDA] Situação: ${situacao} | PDF: ${pdfUrl} | ID: ${certRow?.id}`);

    return res.status(200).json({
      success: true,
      situacao,
      data_emissao: new Date().toLocaleDateString("pt-BR"),
      data_validade: dataValidade || new Date(validadeIso).toLocaleDateString("pt-BR"),
      codigo_controle: codigoControle,
      pdf_url: pdfUrl,
      arquivo_nome: tempFileName,
      certidao_id: certRow?.id || null,
      status_emissao: statusEmissao,
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
