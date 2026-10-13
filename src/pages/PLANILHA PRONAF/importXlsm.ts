import * as XLSX from "xlsx";
import { createXlsmReader, normalizeSheetKey } from "./exportXlsm";
import { cellsToProjeto, type SheetName } from "./cellMapping";
import type { ProjetoA2 } from "./types";

function isZipSignature(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  return bytes[0] === 0x50 && bytes[1] === 0x4B; // 'PK'
}

function createSheetJsReader(buffer: ArrayBuffer): (sheet: SheetName, cell: string) => string {
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetsMap = new Map<string, XLSX.WorkSheet>();
  const sheetsNormMap = new Map<string, XLSX.WorkSheet>();

  for (const name of wb.SheetNames) {
    const s = wb.Sheets[name];
    if (s) {
      sheetsMap.set(name, s);
      sheetsNormMap.set(normalizeSheetKey(name), s);
    }
  }

  return (sheet: SheetName, cell: string) => {
    const s = sheetsMap.get(sheet) || sheetsNormMap.get(normalizeSheetKey(sheet));
    if (!s) return "";
    const c = s[cell.toUpperCase()];
    if (!c) return "";
    if (c.v !== undefined && c.v !== null) {
      return String(c.v);
    }
    return c.w ? String(c.w) : "";
  };
}

/**
 * Importa um arquivo de planilha (.xlsm, .xlsx ou .xls legada/binária).
 * Lê os valores das células de entrada das 8 abas e reconstrói o projeto.
 * Tudo acontece no navegador; nenhum dado é enviado à rede (LGPD).
 */
export async function importXlsm(file: Blob | ArrayBuffer): Promise<ProjetoA2> {
  const buffer: ArrayBuffer = file instanceof Blob ? await file.arrayBuffer() : file;

  let reader: ((sheet: SheetName, cell: string) => string) | null = null;

  // Se tem assinatura ZIP ('PK'), tenta primeiro o leitor nativo OpenXML/JSZip
  if (isZipSignature(buffer)) {
    try {
      reader = await createXlsmReader(buffer);
    } catch {
      // Fallback para SheetJS se houver qualquer particularidade no empacotamento ZIP
      reader = null;
    }
  }

  // Se não for ZIP (ex: .xls binário do Excel 97-2003) ou se o leitor ZIP falhou:
  if (!reader) {
    try {
      reader = createSheetJsReader(buffer);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Formato não suportado";
      throw new Error(`Não foi possível processar a planilha: ${msg}`);
    }
  }

  return cellsToProjeto(reader);
}
