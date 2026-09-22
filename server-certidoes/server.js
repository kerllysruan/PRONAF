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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
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
 * Body: { cpf, data_nascimento, proposta_id }
 */
app.post("/emitir-certidao-pf", authenticate, async (req, res) => {
  const { cpf, data_nascimento, proposta_id } = req.body;

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

  console.log(`[EMISSÃO INICIADA] CPF: ${cleanCpf} | Nasc: ${formattedBirth} | Proposta: ${proposta_id || "avulsa"}`);

  let browser = null;

  try {
    // 1. Iniciar Playwright Chromium
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // 2. Acessar portal da Receita Federal
    const targetUrl = "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf";
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2000);

    // Fechar aviso de cookies se presente
    try {
      const cookieBtn = page.locator('button:has-text("Aceitar")').first();
      if (await cookieBtn.isVisible({ timeout: 2000 })) {
        await cookieBtn.click();
      }
    } catch (_) {}

    // 3. Preencher CPF e Data de Nascimento usando os seletores verificados
    const cpfInput = page.locator('input[name="niContribuinte"]').first();
    await cpfInput.waitFor({ timeout: 10000 });
    await cpfInput.fill(cleanCpf);

    const birthInput = page.locator('input[name="dataNascimento"]').first();
    await birthInput.waitFor({ timeout: 10000 });
    await birthInput.fill(formattedBirth);

    await page.waitForTimeout(500);

    // 4. Clicar em "Emitir Certidão"
    const emitirBtn = page.locator('button[type="submit"]:has-text("Emitir Certidão"), button:has-text("Emitir Certidão")').first();
    await emitirBtn.click();
    console.log("-> Botão de emissão acionado. Aguardando processamento na Receita...");

    // 5. Aguardar resposta
    await page.waitForTimeout(6000);

    // Verificar se houve erro retornado
    const errorLocator = page.locator('.alert-danger, .msg-erro, text="não foi possível", text="inválido", text="Divergência"').first();
    if (await errorLocator.isVisible({ timeout: 2000 })) {
      const errText = (await errorLocator.textContent()) || "Divergência cadastral ou erro retornado pela Receita Federal.";
      console.warn(`[ERRO RECEITA] ${errText.trim()}`);
      await browser.close();
      return res.status(422).json({
        success: false,
        situacao: "NÃO EMITIDA",
        error: errText.trim(),
      });
    }

    // 6. Extrair texto e dados da certidão
    const pageText = await page.innerText("body");
    let situacao = "CERTIDÃO NEGATIVA";
    if (pageText.includes("POSITIVA COM EFEITO DE NEGATIVA")) {
      situacao = "POSITIVA COM EFEITO DE NEGATIVA";
    } else if (pageText.includes("CERTIDÃO POSITIVA")) {
      situacao = "CERTIDÃO POSITIVA";
    } else if (pageText.includes("CONSTA PENDÊNCIA") || pageText.includes("PENDÊNCIAS")) {
      situacao = "COM PENDÊNCIA";
    }

    // Extrair validade e código de controle
    const validadeMatch = pageText.match(/Válida até\s*([0-9/]{10})/i) || pageText.match(/Validade:\s*([0-9/]{10})/i);
    const codigoMatch = pageText.match(/Código de controle[^\n\r:]*:\s*([A-Z0-9.]+)/i);
    const dataValidade = validadeMatch ? validadeMatch[1].trim() : null;
    const codigoControle = codigoMatch ? codigoMatch[1].trim() : null;

    // 7. Gerar PDF do comprovante
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

    // 8. Upload do PDF no Supabase Storage
    const fileBuffer = fs.readFileSync(tempFilePath);
    const storagePath = `certidoes_pf/${tempFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    // Remover arquivo temporário local
    try {
      fs.unlinkSync(tempFilePath);
    } catch (_) {}

    let pdfUrl = null;
    if (uploadError) {
      console.warn("Aviso ao enviar PDF para o Storage:", uploadError.message);
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      pdfUrl = urlData?.publicUrl || null;
    }

    // 9. Atualizar data_nascimento na proposta caso vinculado
    if (proposta_id) {
      await supabase
        .from("stock_proposals")
        .update({ data_nascimento: formattedBirth, updated_at: new Date().toISOString() })
        .eq("id", proposta_id);
    }

    // 10. Gravar na tabela certidoes_produtores
    const nowIso = new Date().toISOString();
    const validadeIso = dataValidade
      ? new Date(dataValidade.split("/").reverse().join("-")).toISOString()
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const { data: certRow, error: insertError } = await supabase
      .from("certidoes_produtores")
      .insert([
        {
          proposal_id: proposta_id || null,
          proposta_id: proposta_id || null,
          tipo: "CPF",
          cpf: cleanCpf,
          identificador: cleanCpf,
          nome: req.body.nome || `Produtor CPF ${cleanCpf}`,
          data_nascimento: formattedBirth,
          situacao,
          data_emissao: nowIso,
          data_validade: validadeIso,
          codigo_controle: codigoControle,
          observacoes: `Emitida via Playwright. Código: ${codigoControle || "OK"}`,
          status_consulta: "OK",
          pdf_url: pdfUrl,
          arquivo_nome: tempFileName,
          atualizado_em: nowIso,
          criado_em: nowIso,
        },
      ])
      .select()
      .single();

    console.log(`[EMISSÃO CONCLUÍDA COM SUCESSO] Situação: ${situacao} | PDF: ${pdfUrl}`);

    return res.status(200).json({
      success: true,
      situacao,
      data_emissao: new Date().toLocaleDateString("pt-BR"),
      data_validade: dataValidade || new Date(validadeIso).toLocaleDateString("pt-BR"),
      codigo_controle: codigoControle,
      pdf_url: pdfUrl,
      arquivo_nome: tempFileName,
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
