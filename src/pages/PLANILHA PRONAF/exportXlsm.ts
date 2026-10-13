/**
 * Motor de exportação/importação do .xlsm do PRONAF A2.
 *
 * Regras (AGENTS.md / spec §8):
 * - Edita SOMENTE o XML das abas dentro do ZIP (JSZip). Proibido SheetJS/openpyxl.
 * - Não grava em células com fórmula (<f>) e não grava em abas ocultas.
 * - Preserva o atributo de estilo (s) e todos os demais arquivos do pacote
 *   (vbaProject.bin, ctrlProps, drawings, comments, calcChain etc.).
 * - Força recálculo ao abrir (calcPr fullCalcOnLoad="1").
 * - Nenhum dado do cliente é registrado em console ou enviado à rede.
 */
import JSZip from "jszip";
import type { CellValueType, CellWrite, SheetName } from "./cellMapping";

// ──────────────────────────────────────────────────────────────
// Utilitários
// ──────────────────────────────────────────────────────────────

/** dd/mm/aaaa → número serial do Excel (sistema 1900). Retorna NaN se inválida. */
export function toExcelSerial(dateStr: string): number {
  const m = String(dateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return NaN;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return NaN;
  }
  // 30/12/1899 é o "dia 0" efetivo do Excel para datas a partir de 01/03/1900.
  let serial = Math.round((utc - Date.UTC(1899, 11, 30)) / 86400000);
  // Antes de 01/03/1900 o Excel não tem o dia fictício 29/02/1900.
  if (serial < 61) serial -= 1;
  return serial;
}

/** Número serial do Excel → dd/mm/aaaa. */
export function fromExcelSerial(serial: number): string {
  if (!Number.isFinite(serial) || serial <= 0) return "";
  let s = Math.floor(serial);
  if (s < 61) s += 1;
  const d = new Date(Date.UTC(1899, 11, 30) + s * 86400000);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Escapa texto para conteúdo XML e remove caracteres de controle inválidos em XML 1.0. */
export function escapeXml(str: string): string {
  return str
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeXml(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** "AB" → 28 */
export function colLetterToNumber(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function parseCellRef(ref: string): { col: string; row: number } {
  const m = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`Referência de célula inválida: ${ref}`);
  return { col: m[1], row: Number(m[2]) };
}

/** Aceita "1.234,56", "1234,56", "1234.56". Retorna NaN se não for número. */
function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const s = String(value).trim();
  if (s === "") return NaN;
  let normalized = s;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) normalized = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(s)) normalized = s.replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

// ──────────────────────────────────────────────────────────────
// Localização de elementos no XML (sem re-serializar o documento)
// ──────────────────────────────────────────────────────────────

interface ElementMatch {
  start: number;
  end: number;
  attrs: string;          // texto dos atributos (sem o nome da tag)
  inner: string | null;   // null quando autofechado (<c .../>)
}

/** Encontra <tag ... attr="value" ...> (autofechado ou com conteúdo). */
function findElement(xml: string, tag: string, attr: string, value: string, from = 0, to = xml.length): ElementMatch | null {
  const re = new RegExp(
    `<${tag}(\\s[^>]*?)?\\s${attr}="${escapeRegex(value)}"([^>]*?)(\\/>|>([\\s\\S]*?)<\\/${tag}>)`,
    "g"
  );
  re.lastIndex = from;
  const m = re.exec(xml);
  if (!m || m.index >= to) return null;
  const selfClosing = m[3] === "/>";
  return {
    start: m.index,
    end: m.index + m[0].length,
    attrs: `${m[1] ?? ""} ${attr}="${value}"${m[2] ?? ""}`.replace(/\/$/, ""),
    inner: selfClosing ? null : m[4] ?? "",
  };
}

/** Remove um atributo da string de atributos. */
function dropAttr(attrs: string, name: string): string {
  return attrs.replace(new RegExp(`\\s${name}="[^"]*"`, "g"), "");
}

function buildCellXml(attrs: string, value: string | number, type: CellValueType): string | null {
  let base = dropAttr(attrs, "t").trim();
  if (!base.startsWith("r=")) {
    // garante que r venha primeiro (convenção do Excel)
    const r = base.match(/\br="[^"]*"/)?.[0] ?? "";
    base = `${r} ${base.replace(r, "")}`.replace(/\s+/g, " ").trim();
  }

  if (type === "date") {
    const serial = typeof value === "number" ? value : toExcelSerial(String(value));
    if (!Number.isFinite(serial)) return null;
    return `<c ${base}><v>${serial}</v></c>`;
  }

  if (type === "number" || type === "integer") {
    const n = parseNumber(value);
    if (Number.isFinite(n)) return `<c ${base}><v>${n}</v></c>`;
    // Ex.: "S/N" no campo Nº — grava como texto
  }

  const text = String(value);
  if (text === "") return null;
  return `<c ${base} t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

/**
 * Grava um valor na célula do XML da aba.
 * - Preserva o estilo (s) e demais atributos.
 * - Não altera células com fórmula.
 * - Cria a célula/linha na posição correta se não existir.
 * Retorna o XML (inalterado se a célula tiver fórmula ou o valor for inválido).
 */
export function setCellValue(xml: string, cellRef: string, value: string | number, type: CellValueType): string {
  const ref = cellRef.toUpperCase();
  const { col, row } = parseCellRef(ref);

  const sdOpen = xml.search(/<sheetData\b/);
  if (sdOpen < 0) throw new Error("XML da aba sem <sheetData>");

  // <sheetData/> autofechado → abre
  const sdSelf = xml.slice(sdOpen).match(/^<sheetData\b[^>]*?\/>/);
  if (sdSelf) {
    const openTag = sdSelf[0].replace(/\/>$/, ">");
    xml = xml.slice(0, sdOpen) + openTag + "</sheetData>" + xml.slice(sdOpen + sdSelf[0].length);
  }
  const sdStart = xml.indexOf(">", sdOpen) + 1;
  const sdEnd = xml.indexOf("</sheetData>", sdStart);

  // Célula existente
  const cell = findElement(xml, "c", "r", ref, sdStart, sdEnd);
  if (cell) {
    if (cell.inner !== null && /<f[\s>/]/.test(cell.inner)) return xml; // fórmula: não grava
    const newCell = buildCellXml(cell.attrs, value, type);
    if (newCell === null) return xml;
    return xml.slice(0, cell.start) + newCell + xml.slice(cell.end);
  }

  const newCell = buildCellXml(`r="${ref}"`, value, type);
  if (newCell === null) return xml;

  // Linha existente
  const rowEl = findElement(xml, "row", "r", String(row), sdStart, sdEnd);
  if (rowEl) {
    const openTag = `<row${rowEl.attrs}>`;
    const inner = rowEl.inner ?? "";
    const colNum = colLetterToNumber(col);
    const cellRe = /<c\b[^>]*?\br="([A-Z]+)\d+"/g;
    let insertAt = inner.length;
    let m: RegExpExecArray | null;
    while ((m = cellRe.exec(inner)) !== null) {
      if (colLetterToNumber(m[1]) > colNum) {
        insertAt = m.index;
        break;
      }
    }
    const newInner = inner.slice(0, insertAt) + newCell + inner.slice(insertAt);
    return xml.slice(0, rowEl.start) + openTag + newInner + "</row>" + xml.slice(rowEl.end);
  }

  // Linha inexistente: insere em ordem crescente de número de linha
  const rowRe = /<row\b[^>]*?\br="(\d+)"/g;
  rowRe.lastIndex = sdStart;
  let insertPos = sdEnd;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml)) !== null && rm.index < sdEnd) {
    if (Number(rm[1]) > row) {
      insertPos = rm.index;
      break;
    }
  }
  return xml.slice(0, insertPos) + `<row r="${row}">${newCell}</row>` + xml.slice(insertPos);
}

/**
 * Lê o valor (em cache) de uma célula. Suporta inlineStr, sharedStrings (t="s"),
 * texto de fórmula (t="str"), booleano e número. Retorna "" se vazia/inexistente.
 */
export function readCellValue(xml: string, cellRef: string, sharedStrings: string[] = []): string {
  const cell = findElement(xml, "c", "r", cellRef.toUpperCase());
  if (!cell || cell.inner === null) return "";
  const t = cell.attrs.match(/\bt="([^"]*)"/)?.[1];

  if (t === "inlineStr") {
    const texts = [...cell.inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]);
    return unescapeXml(texts.join(""));
  }
  const v = cell.inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
  if (v === undefined) return "";
  if (t === "s") return sharedStrings[Number(v)] ?? "";
  return unescapeXml(v);
}

/** Lê xl/sharedStrings.xml (inclui rich text <r><t>). */
export function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    // ignora textos fonéticos (<rPh>)
    const body = si[1].replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
    const texts = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]);
    out.push(unescapeXml(texts.join("")));
  }
  return out;
}

// ──────────────────────────────────────────────────────────────
// Resolução nome da aba → arquivo XML (workbook.xml + rels)
// ──────────────────────────────────────────────────────────────

export interface SheetInfo {
  name: string;
  path: string;   // ex.: xl/worksheets/sheet13.xml
  hidden: boolean;
}

export function resolveSheets(workbookXml: string, relsXml: string): SheetInfo[] {
  const rels = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const id = m[1].match(/\bId="([^"]*)"/)?.[1];
    const target = m[1].match(/\bTarget="([^"]*)"/)?.[1];
    if (id && target) rels.set(id, target);
  }
  const sheets: SheetInfo[] = [];
  for (const m of workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const name = unescapeXml(attrs.match(/\bname="([^"]*)"/)?.[1] ?? "");
    const rid = attrs.match(/\br:id="([^"]*)"/)?.[1] ?? attrs.match(/\b\w+:id="([^"]*)"/)?.[1];
    const state = attrs.match(/\bstate="([^"]*)"/)?.[1];
    const target = rid ? rels.get(rid) : undefined;
    if (!target) continue;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
    sheets.push({ name, path, hidden: state === "hidden" || state === "veryHidden" });
  }
  return sheets;
}

/** Garante <calcPr fullCalcOnLoad="1"/> no workbook.xml. */
export function ensureFullCalcOnLoad(workbookXml: string): string {
  const calc = workbookXml.match(/<calcPr\b[^>]*?\/?>/);
  if (calc) {
    let tag = calc[0];
    if (/\bfullCalcOnLoad="/.test(tag)) tag = tag.replace(/\bfullCalcOnLoad="[^"]*"/, 'fullCalcOnLoad="1"');
    else tag = tag.replace(/^<calcPr\b/, '<calcPr fullCalcOnLoad="1"');
    return workbookXml.replace(calc[0], tag);
  }
  // Ordem do CT_Workbook: ... sheets, functionGroups, externalReferences, definedNames, calcPr ...
  for (const anchor of ["</definedNames>", "</externalReferences>", "</functionGroups>", "</sheets>"]) {
    const i = workbookXml.indexOf(anchor);
    if (i >= 0) {
      const at = i + anchor.length;
      return workbookXml.slice(0, at) + '<calcPr fullCalcOnLoad="1"/>' + workbookXml.slice(at);
    }
  }
  return workbookXml;
}

async function loadWorkbook(zip: JSZip): Promise<{ workbookXml: string; sheets: SheetInfo[] }> {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!workbookXml || !relsXml) {
    throw new Error("O arquivo escolhido não parece ser uma planilha .xlsm válida (workbook.xml ausente).");
  }
  return { workbookXml, sheets: resolveSheets(workbookXml, relsXml) };
}

// ──────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────

export interface ExportResult {
  blob: Blob;
  /** Gravações ignoradas (célula com fórmula, aba oculta/inexistente ou valor inválido). */
  skipped: Array<{ sheet: string; cell: string; reason: string }>;
}

/**
 * Aplica as gravações no modelo .xlsm escolhido pelo usuário e devolve o arquivo preenchido.
 */
export async function exportXlsm(modelo: Blob | ArrayBuffer, writes: CellWrite[]): Promise<ExportResult> {
  const zip = await JSZip.loadAsync(modelo);
  const { workbookXml, sheets } = await loadWorkbook(zip);
  const byName = new Map(sheets.map((s) => [s.name, s]));
  const skipped: ExportResult["skipped"] = [];

  const grouped = new Map<SheetName, CellWrite[]>();
  for (const w of writes) {
    const list = grouped.get(w.sheet) ?? [];
    list.push(w);
    grouped.set(w.sheet, list);
  }

  for (const [sheetName, list] of grouped) {
    const info = byName.get(sheetName);
    if (!info) {
      list.forEach((w) => skipped.push({ sheet: w.sheet, cell: w.cell, reason: "aba não encontrada no modelo" }));
      continue;
    }
    if (info.hidden) {
      list.forEach((w) => skipped.push({ sheet: w.sheet, cell: w.cell, reason: "aba oculta" }));
      continue;
    }
    const file = zip.file(info.path);
    if (!file) {
      list.forEach((w) => skipped.push({ sheet: w.sheet, cell: w.cell, reason: "XML da aba ausente" }));
      continue;
    }
    let xml = await file.async("string");
    for (const w of list) {
      const before = xml;
      xml = setCellValue(xml, w.cell, w.value, w.type);
      if (xml === before) skipped.push({ sheet: w.sheet, cell: w.cell, reason: "fórmula ou valor inválido" });
    }
    zip.file(info.path, xml);
  }

  zip.file("xl/workbook.xml", ensureFullCalcOnLoad(workbookXml));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.ms-excel.sheet.macroEnabled.12",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { blob, skipped };
}

/**
 * Cria um leitor de células para um .xlsm já preenchido (importação, spec §9).
 * Somente leitura; não lê abas ocultas.
 */
export async function createXlsmReader(file: Blob | ArrayBuffer): Promise<(sheet: SheetName, cell: string) => string> {
  const zip = await JSZip.loadAsync(file);
  const { sheets } = await loadWorkbook(zip);
  const ssXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const shared = ssXml ? parseSharedStrings(ssXml) : [];

  const xmlByName = new Map<string, string>();
  await Promise.all(
    sheets
      .filter((s) => !s.hidden)
      .map(async (s) => {
        const f = zip.file(s.path);
        if (f) xmlByName.set(s.name, await f.async("string"));
      })
  );

  return (sheet, cell) => {
    const xml = xmlByName.get(sheet);
    return xml ? readCellValue(xml, cell, shared) : "";
  };
}
