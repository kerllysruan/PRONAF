import { chromium } from "playwright";

async function testFlow() {
  console.log("Iniciando teste de automação...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  // Monitorar navegações e URLs
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
      console.log(`[NAVIGATED] URL atual: ${frame.url()}`);
    }
  });

  // Monitorar downloads
  page.on("download", (download) => {
    console.log(`[DOWNLOAD INICIADO] Nome sugerido: ${download.suggestedFilename()}`);
  });

  console.log("Acessando página inicial...");
  await page.goto("https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // Aguardar campos do formulário ficarem visíveis
  await page.locator('input[name="niContribuinte"]').waitFor({ state: "visible", timeout: 15000 });


  console.log("Página carregada com sucesso.");
  console.log("URL:", page.url());

  // Fechar cookies se presente
  try {
    const cookieBtn = page.locator('button:has-text("Aceitar")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 })) {
      await cookieBtn.click();
      console.log("Aviso de cookies aceito.");
    }
  } catch (_) {}

  // Usar CPF de teste (vamos testar preenchimento)
  const testCpf = "00000000191"; // CPF de teste para ver o comportamento da validação
  const testBirth = "01/01/2000";

  console.log(`Preenchendo CPF: ${testCpf} e Data: ${testBirth}...`);
  const cpfInput = page.locator('input[name="niContribuinte"]').first();
  await cpfInput.click();
  await cpfInput.fill(testCpf);

  const birthInput = page.locator('input[name="dataNascimento"]').first();
  await birthInput.click();
  await birthInput.fill(testBirth);

  console.log("Configurando listener de download...");
  const downloadPromise = page.waitForEvent("download", { timeout: 20000 }).catch(() => null);

  console.log("Clicando em 'Emitir Certidão'...");
  const emitirBtn = page.locator('button[type="submit"]:has-text("Emitir Certidão")').first();
  await emitirBtn.click();

  console.log("Aguardando resposta da página...");
  await page.waitForTimeout(5000);

  console.log("URL após clique:", page.url());

  // Verificar se modal de segunda via apareceu
  const modalVisible = await page.locator('.modal-segunda-via, text="Certidão Válida Encontrada"').isVisible().catch(() => false);
  console.log("Modal de certidão já existente visível?", modalVisible);
  if (modalVisible) {
    console.log("Clicando em 'Emitir Nova Certidão' no modal...");
    const btnNova = page.locator('button:has-text("Emitir Nova Certidão")').first();
    if (await btnNova.isVisible()) {
      await btnNova.click();
    }
    await page.waitForTimeout(4000);
    console.log("URL após clicar no modal:", page.url());
  }

  // Verificar se há mensagem de erro / divergência
  const alertText = await page.locator('.br-message, .alert, [class*="feedback"], [class*="erro"]').allInnerTexts().catch(() => []);
  console.log("Mensagens de alerta na tela:", alertText);

  const download = await downloadPromise;
  if (download) {
    console.log(">>> SUCESSO: Download disparado pelo navegador!", download.suggestedFilename());
  } else {
    console.log("Download não disparou automaticamente no tempo limite.");
  }

  console.log("Corpo da página atual (primeiros 300 caracteres):");
  console.log((await page.innerText("body")).substring(0, 300));


  await browser.close();
  console.log("Teste finalizado com sucesso.");
}

testFlow().catch(console.error);
