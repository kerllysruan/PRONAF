import { Buffer } from "buffer";
import officeCrypto from "officecrypto-tool";
import * as XLSX from "xlsx";
import { InversaoItem, InversaoReferencia } from "@/types/inversoes";

// Polyfills in browser if needed
if (typeof window !== "undefined") {
  if (!(window as any).Buffer) {
    (window as any).Buffer = Buffer;
  }
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

export interface ExcelInversoesResult {
  success: boolean;
  items: InversaoItem[];
  custoAssessoria: number;
  totalItens: number;
  totalGeral: number;
  formatDetected?: string;
  error?: string;
}

function normalizeText(str: any): string {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseMoney(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const clean = String(val)
    .replace(/R\$\s?/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function mapUnidade(raw: any): string {
  const norm = normalizeText(raw);
  if (norm.startsWith("CAB")) return "CAB";
  if (norm.startsWith("HECT") || norm === "HA") return "HECT";
  if (norm.startsWith("KG") || norm.startsWith("QUIL")) return "KG";
  if (norm.startsWith("SC") || norm.startsWith("SAC")) return "SC";
  if (norm.startsWith("CX") || norm.startsWith("CAIX")) return "CX";
  if (norm === "T" || norm.startsWith("TON")) return "T";
  if (norm === "M") return "M";
  if (norm === "M2" || norm === "M²") return "M²";
  if (norm === "M3" || norm === "M³") return "M³";
  if (norm.startsWith("DZ") || norm.startsWith("DUZ")) return "DZ";
  if (norm.startsWith("LT") || norm.startsWith("LITR")) return "LT";
  if (norm.startsWith("DIA") || norm.startsWith("D/H")) return "DIA";
  return "UNID";
}

/**
 * Lê e extrai as inversões do plano de um arquivo Excel (.xlsx, .xlsm, .xls, .pronaf_a2, .csv).
 * Trata arquivos com criptografia / senha (senhasBNxI, senhasBN, etc.).
 */
export async function parseExcelInversoes(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options?: {
    findReferencia?: (nome: string) => InversaoReferencia | null;
    uf?: string;
    customPassword?: string;
  }
): Promise<ExcelInversoesResult> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Uint8Array) {
      arrayBuffer = fileOrBuffer.buffer as ArrayBuffer;
    } else {
      arrayBuffer = fileOrBuffer;
    }

    let fileBuffer = Buffer.from(arrayBuffer);

    // 1. Checa se o arquivo é protegido por senha
    let isEncrypted = false;
    try {
      isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
    } catch {
      isEncrypted = false;
    }

    let decryptedBuffer: Buffer | Uint8Array = fileBuffer;
    if (isEncrypted) {
      const passwords = [
        options?.customPassword,
        "senhasBNxI",
        "senhasBN",
        "senhasBNXI",
        "senhaBNxI",
        "senhaBNXI",
        "senhasbnxi",
        "senhasBNx1",
        "VelvetSweatshop",
      ].filter(Boolean) as string[];

      let decrypted = false;
      for (const pwd of passwords) {
        try {
          decryptedBuffer = await officeCrypto.decrypt(fileBuffer, { password: pwd });
          decrypted = true;
          break;
        } catch {
          // tenta a próxima senha
        }
      }

      if (!decrypted) {
        return {
          success: false,
          items: [],
          custoAssessoria: 0,
          totalItens: 0,
          totalGeral: 0,
          error: "O arquivo Excel está protegido com senha. Não foi possível descriptografar com a senha fornecida.",
        };
      }
    }

    // 2. Carrega o Workbook com XLSX
    const wb = XLSX.read(decryptedBuffer, { type: "buffer" });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        items: [],
        custoAssessoria: 0,
        totalItens: 0,
        totalGeral: 0,
        error: "Nenhuma planilha encontrada no arquivo enviado.",
      };
    }

    // 3. Estratégia 1: Formato SEAP / PRONAF-A (Aba BdPRONAF_C)
    if (wb.SheetNames.includes("BdPRONAF_C")) {
      const sheet = wb.Sheets["BdPRONAF_C"];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Detecta UF da proposta a partir do cabeçalho da linha 121 coluna 6 (ex: GOVERNADOR NUNES FREIRE-MA)
      let detectedUf = options?.uf;
      if (!detectedUf && rows[121] && rows[121][6]) {
        const matchUf = String(rows[121][6]).match(/[-/]\s*([A-Z]{2})$/i);
        if (matchUf) detectedUf = matchUf[1].toUpperCase();
      }

      const rawItems: any[] = [];
      let consecutiveEmpty = 0;
      for (let r = 121; r < Math.min(180, rows.length); r++) {
        const row = rows[r] || [];
        const desc = row[22];
        if (!desc || String(desc).trim() === "") {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 8) break;
          continue;
        }
        consecutiveEmpty = 0;

        const nome = String(desc).trim();
        const quant = Math.max(1, parseInt(row[24]) || 1);
        const unid = mapUnidade(row[25]);
        const valorUnit = parseMoney(row[27]);
        const valorTotal = Math.round(quant * valorUnit * 100) / 100;

        rawItems.push({
          quant,
          unid,
          nome: nome.toUpperCase(),
          valor_unitario: valorUnit,
          valor: valorTotal,
        });
      }

      let custoAssessoria = 0;
      const totalItens = rawItems.reduce((acc, i) => acc + i.valor, 0);
      const tipoAssessoria = rows[121] ? rows[121][68] : null;
      if (tipoAssessoria === 1 || tipoAssessoria === "1") {
        custoAssessoria = Math.round(totalItens * 0.05 * 100) / 100;
      }

      const finalItems = enrichItemsWithCatalog(rawItems, options?.findReferencia, detectedUf);

      return {
        success: true,
        formatDetected: "Projeto SEAP / PRONAF-A Oficial",
        items: finalItems,
        custoAssessoria,
        totalItens,
        totalGeral: totalItens + custoAssessoria,
      };
    }

    // 4. Estratégia 2: Varredura de tabelas orçamentárias padrão
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      for (let r = 0; r < Math.min(35, rows.length); r++) {
        const row = rows[r] || [];
        const colMap: Record<string, number> = {};

        row.forEach((cell, cIdx) => {
          const norm = normalizeText(cell);
          if (
            norm.includes("ITEM") ||
            norm.includes("DESCRIC") ||
            norm.includes("DISCRIMIN") ||
            norm.includes("ESPECIFIC") ||
            norm.includes("INVERS")
          ) {
            if (colMap.desc === undefined) colMap.desc = cIdx;
          } else if (norm.includes("QUANT") || norm === "QTD" || norm === "QTE") {
            colMap.quant = cIdx;
          } else if (norm.includes("UNID") || norm === "UND" || norm === "UN") {
            colMap.unid = cIdx;
          } else if (
            norm.includes("UNIT") ||
            norm.includes("VLR. UNIT") ||
            norm.includes("PRECO UNIT") ||
            norm.includes("PREÇO UNIT")
          ) {
            colMap.unit = cIdx;
          } else if (
            norm.includes("TOTAL") ||
            norm.includes("VALOR") ||
            norm.includes("SUBTOTAL")
          ) {
            colMap.total = cIdx;
          }
        });

        if (colMap.desc !== undefined && (colMap.total !== undefined || colMap.unit !== undefined)) {
          const rawItems: any[] = [];
          let custoAssessoria = 0;

          for (let rowIdx = r + 1; rowIdx < rows.length; rowIdx++) {
            const itemRow = rows[rowIdx] || [];
            const descRaw = itemRow[colMap.desc];
            if (!descRaw || String(descRaw).trim() === "") continue;

            const desc = String(descRaw).trim();
            const normDesc = normalizeText(desc);

            if (normDesc.startsWith("TOTAL") || normDesc.startsWith("SOMA")) break;

            const quant = colMap.quant !== undefined ? Math.max(1, parseInt(itemRow[colMap.quant]) || 1) : 1;
            const unid = colMap.unid !== undefined ? mapUnidade(itemRow[colMap.unid]) : "UNID";
            const unitRaw = colMap.unit !== undefined ? parseMoney(itemRow[colMap.unit]) : 0;
            const totalRaw = colMap.total !== undefined ? parseMoney(itemRow[colMap.total]) : 0;

            const valorUnit = unitRaw > 0 ? unitRaw : (totalRaw > 0 ? Math.round((totalRaw / quant) * 100) / 100 : 0);
            const valorTotal = totalRaw > 0 ? totalRaw : (valorUnit > 0 ? Math.round(quant * valorUnit * 100) / 100 : 0);

            if (normDesc.includes("ASSESSORIA") || normDesc.includes("ELABORACAO DO PROJETO") || normDesc.includes("ASSISTENCIA TECNICA")) {
              custoAssessoria = valorTotal;
              continue;
            }

            if (valorTotal > 0 || valorUnit > 0) {
              rawItems.push({
                quant,
                unid,
                nome: desc.toUpperCase(),
                valor_unitario: valorUnit,
                valor: valorTotal,
              });
            }
          }

          if (rawItems.length > 0) {
            const totalItens = rawItems.reduce((acc, i) => acc + i.valor, 0);
            const finalItems = enrichItemsWithCatalog(rawItems, options?.findReferencia, options?.uf);
            return {
              success: true,
              formatDetected: `Tabela Orçamentária (${sheetName})`,
              items: finalItems,
              custoAssessoria,
              totalItens,
              totalGeral: totalItens + custoAssessoria,
            };
          }
        }
      }
    }

    return {
      success: false,
      items: [],
      custoAssessoria: 0,
      totalItens: 0,
      totalGeral: 0,
      error: "Não foi possível encontrar colunas de itens/inversões válidas na planilha informada.",
    };
  } catch (err: any) {
    console.error("Erro ao processar planilha Excel:", err);
    return {
      success: false,
      items: [],
      custoAssessoria: 0,
      totalItens: 0,
      totalGeral: 0,
      error: err?.message || "Erro inesperado ao ler a planilha Excel.",
    };
  }
}

function enrichItemsWithCatalog(
  rawItems: any[],
  findReferencia?: (nome: string) => InversaoReferencia | null,
  uf?: string
): InversaoItem[] {
  return rawItems.map((item) => {
    let item_referencia_id: string | null = null;
    let teto_maximo: number | null = null;
    let unid = item.unid;

    if (findReferencia) {
      const ref = findReferencia(item.nome);
      if (ref) {
        item_referencia_id = ref.id;
        unid = ref.unidade_padrao || unid;
        let teto = ref.valor_maximo;
        if (uf && ref.precos_por_uf && ref.precos_por_uf[uf]) {
          teto = ref.precos_por_uf[uf];
        }
        teto_maximo = teto;
      }
    }

    return {
      quant: item.quant,
      unid,
      nome: item.nome,
      valor_unitario: item.valor_unitario,
      valor: item.valor,
      item_referencia_id,
      teto_maximo,
    };
  });
}
