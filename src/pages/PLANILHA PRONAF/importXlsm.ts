import { Buffer } from "buffer";
import officeCrypto from "officecrypto-tool";
import * as XLSX from "xlsx";
import { createXlsmReader, normalizeSheetKey } from "./exportXlsm";
import { cellsToProjeto, type SheetName } from "./cellMapping";
import type { ProjetoA2 } from "./types";

// Polyfills para ambiente de navegador
if (typeof window !== "undefined") {
  if (!(window as unknown as { Buffer?: typeof Buffer }).Buffer) {
    (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  }
  if (!(window as unknown as { global?: typeof window }).global) {
    (window as unknown as { global: typeof window }).global = window;
  }
  if (!(window as unknown as { process?: { env: Record<string, string> } }).process) {
    (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
  }
}

export const DEFAULT_SPREADSHEET_PASSWORDS = [
  "senhasBN",
  "senhasBNxI",
  "senhasBNXI",
  "senhaBNxI",
  "senhaBNXI",
  "senhasbnxi",
  "senhasBNx1",
  "VelvetSweatshop",
];

export async function decryptSpreadsheetIfNeeded(
  buffer: ArrayBuffer,
  customPassword?: string
): Promise<ArrayBuffer> {
  const fileBuffer = Buffer.from(buffer);

  let isEncrypted = false;
  try {
    isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
  } catch {
    isEncrypted = false;
  }

  if (!isEncrypted) {
    return buffer;
  }

  const passwords = [customPassword, ...DEFAULT_SPREADSHEET_PASSWORDS].filter(Boolean) as string[];

  for (const pwd of passwords) {
    try {
      const dec = await officeCrypto.decrypt(fileBuffer, { password: pwd });
      const uint8 = new Uint8Array(dec);
      return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
    } catch {
      // tenta próxima senha
    }
  }

  throw new Error("Planilha protegida com senha não reconhecida (tentou senhasBN e variações).");
}

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
 * Descriptografa automaticamente se estiver protegido por senha (ex: senhasBN).
 * Lê os valores das células de entrada das 8 abas e reconstrói o projeto.
 * Tudo acontece no navegador; nenhum dado é enviado à rede (LGPD).
 */
export async function importXlsm(file: Blob | ArrayBuffer, customPassword?: string): Promise<ProjetoA2> {
  const rawBuffer: ArrayBuffer = file instanceof Blob ? await file.arrayBuffer() : file;

  // 1. Descriptografa a planilha caso esteja protegida por senha padrão BNB (senhasBN, etc.)
  const buffer: ArrayBuffer = await decryptSpreadsheetIfNeeded(rawBuffer, customPassword);

  let reader: ((sheet: SheetName, cell: string) => string) | null = null;

  // 2. Se tem assinatura ZIP ('PK'), tenta primeiro o leitor nativo OpenXML/JSZip
  if (isZipSignature(buffer)) {
    try {
      reader = await createXlsmReader(buffer);
    } catch {
      // Fallback para SheetJS se houver particularidade no empacotamento ZIP
      reader = null;
    }
  }

  // 3. Se não for ZIP (ex: .xls binário do Excel 97-2003) ou se o leitor ZIP falhou:
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
