import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  setCellValue,
  readCellValue,
  parseSharedStrings,
  resolveSheets,
  ensureFullCalcOnLoad,
  toExcelSerial,
  fromExcelSerial,
  exportXlsm,
  createXlsmReader,
} from "../exportXlsm";

const SHEET = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="13" spans="4:6"><c r="D13" s="5"><v>0</v></c><c r="E13" s="2" t="inlineStr"><is><t>Texto original</t></is></c><c r="F13" s="3"><f>SUM(A1:A10)</f><v>42</v></c></row><row r="15"><c r="E15" s="7"/></row></sheetData></worksheet>`;

describe("setCellValue", () => {
  it("substitui texto preservando o estilo", () => {
    const out = setCellValue(SHEET, "E13", "Novo Texto", "text");
    expect(out).toContain('<c r="E13" s="2" t="inlineStr"><is><t xml:space="preserve">Novo Texto</t></is></c>');
    expect(out).not.toContain("Texto original");
  });

  it("grava número", () => {
    expect(setCellValue(SHEET, "D13", 240, "integer")).toContain('<c r="D13" s="5"><v>240</v></c>');
  });

  it("aceita decimal com vírgula (pt-BR)", () => {
    expect(setCellValue(SHEET, "D13", "1.234,56", "number")).toContain("<v>1234.56</v>");
  });

  it("número inválido em campo numérico vira texto (ex.: S/N)", () => {
    expect(setCellValue(SHEET, "D13", "S/N", "integer")).toContain('<c r="D13" s="5" t="inlineStr"><is><t xml:space="preserve">S/N</t></is></c>');
  });

  it("NÃO altera célula com fórmula", () => {
    expect(setCellValue(SHEET, "F13", 99, "number")).toBe(SHEET);
  });

  it("trata célula autofechada sem corromper as vizinhas", () => {
    const out = setCellValue(SHEET, "E15", "Maria", "text");
    expect(out).toContain('<row r="15"><c r="E15" s="7" t="inlineStr"><is><t xml:space="preserve">Maria</t></is></c></row>');
    expect(out).toContain("<f>SUM(A1:A10)</f>");
  });

  it("cria célula na ordem correta de colunas", () => {
    const out = setCellValue(SHEET, "E13".replace("E", "C"), "x", "text");
    expect(out.indexOf('r="C13"')).toBeLessThan(out.indexOf('r="D13"'));
  });

  it("cria linha na ordem correta", () => {
    const out = setCellValue(SHEET, "E14", "y", "text");
    const i13 = out.indexOf('<row r="13"');
    const i14 = out.indexOf('<row r="14"');
    const i15 = out.indexOf('<row r="15"');
    expect(i13).toBeLessThan(i14);
    expect(i14).toBeLessThan(i15);
  });

  it("não confunde E1 com E13", () => {
    const out = setCellValue(SHEET, "E1", "z", "text");
    expect(out).toContain("Texto original");
    expect(out.indexOf('<row r="1">')).toBeLessThan(out.indexOf('<row r="13"'));
  });

  it("escapa caracteres especiais", () => {
    expect(setCellValue(SHEET, "E13", "João & Maria <teste>", "text")).toContain("João &amp; Maria &lt;teste&gt;");
  });

  it("converte data para serial do Excel", () => {
    expect(setCellValue(SHEET, "D13", "01/01/2000", "date")).toContain("<v>36526</v>");
  });

  it("trata <sheetData/> vazio", () => {
    const empty = `<worksheet><sheetData/></worksheet>`;
    expect(setCellValue(empty, "B2", 5, "number")).toBe(`<worksheet><sheetData><row r="2"><c r="B2"><v>5</v></c></row></sheetData></worksheet>`);
  });
});

describe("datas seriais", () => {
  it("ida e volta", () => {
    for (const d of ["01/01/1900", "28/02/1900", "01/03/1900", "01/01/2000", "29/02/2024", "31/12/2026"]) {
      expect(fromExcelSerial(toExcelSerial(d))).toBe(d);
    }
    expect(toExcelSerial("01/03/1900")).toBe(61);
    expect(toExcelSerial("31/02/2020")).toBeNaN();
  });
});

describe("readCellValue / sharedStrings", () => {
  const shared = parseSharedStrings(`<sst><si><t>Fortaleza</t></si><si><r><t>João </t></r><r><t>Silva</t></r></si></sst>`);
  const xml = `<sheetData><row r="1"><c r="A1" t="s"><v>1</v></c><c r="B1" t="inlineStr"><is><t xml:space="preserve">a &amp; b</t></is></c><c r="C1"><v>36526</v></c><c r="D1" s="1"/></row></sheetData>`;

  it("lê sharedString com rich text", () => expect(readCellValue(xml, "A1", shared)).toBe("João Silva"));
  it("lê inlineStr", () => expect(readCellValue(xml, "B1")).toBe("a & b"));
  it("lê número", () => expect(readCellValue(xml, "C1")).toBe("36526"));
  it("célula vazia/inexistente", () => {
    expect(readCellValue(xml, "D1")).toBe("");
    expect(readCellValue(xml, "Z9")).toBe("");
  });
});

describe("workbook", () => {
  const wb = `<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Cliente" sheetId="1" r:id="rId1"/><sheet name="SEAP" sheetId="2" state="hidden" r:id="rId2"/><sheet name=" Proposta" sheetId="3" r:id="rId3"/></sheets><definedNames><definedName name="x">A!$A$1</definedName></definedNames></workbook>`;
  const rels = `<Relationships><Relationship Id="rId1" Type="ws" Target="worksheets/sheet13.xml"/><Relationship Id="rId2" Type="ws" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="ws" Target="/xl/worksheets/sheet15.xml"/></Relationships>`;

  it("resolve abas e marca ocultas", () => {
    expect(resolveSheets(wb, rels)).toEqual([
      { name: "Cliente", path: "xl/worksheets/sheet13.xml", hidden: false },
      { name: "SEAP", path: "xl/worksheets/sheet2.xml", hidden: true },
      { name: " Proposta", path: "xl/worksheets/sheet15.xml", hidden: false },
    ]);
  });

  it("insere calcPr após definedNames", () => {
    expect(ensureFullCalcOnLoad(wb)).toContain('</definedNames><calcPr fullCalcOnLoad="1"/></workbook>');
  });

  it("atualiza calcPr existente", () => {
    expect(ensureFullCalcOnLoad(`<workbook><calcPr calcId="191029"/></workbook>`)).toBe(`<workbook><calcPr fullCalcOnLoad="1" calcId="191029"/></workbook>`);
    expect(ensureFullCalcOnLoad(`<workbook><calcPr fullCalcOnLoad="0"/></workbook>`)).toBe(`<workbook><calcPr fullCalcOnLoad="1"/></workbook>`);
  });
});

describe("exportXlsm (round-trip em ZIP)", () => {
  async function buildModelo(): Promise<ArrayBuffer> {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", "<Types/>");
    zip.file("xl/workbook.xml", `<workbook xmlns:r="r"><sheets><sheet name="Cliente" sheetId="1" r:id="rId1"/><sheet name="SEAP" sheetId="2" state="hidden" r:id="rId2"/></sheets><calcPr calcId="1"/></workbook>`);
    zip.file("xl/_rels/workbook.xml.rels", `<Relationships><Relationship Id="rId1" Target="worksheets/sheet13.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>`);
    zip.file("xl/worksheets/sheet13.xml", SHEET);
    zip.file("xl/worksheets/sheet2.xml", `<worksheet><sheetData/></worksheet>`);
    zip.file("xl/vbaProject.bin", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3, 4]));
    return zip.generateAsync({ type: "arraybuffer" });
  }

  it("grava valores, preserva arquivos e macros, recusa fórmula e aba oculta", async () => {
    const modelo = await buildModelo();
    const { blob, skipped } = await exportXlsm(modelo, [
      { sheet: "Cliente", cell: "E13", value: "José da Silva", type: "text" },
      { sheet: "Cliente", cell: "E16", value: "15/03/1980", type: "date" },
      { sheet: "Cliente", cell: "F13", value: 1, type: "number" },
      { sheet: "SEAP" as never, cell: "A1", value: "x", type: "text" },
    ]);

    expect(skipped.map((s) => s.cell).sort()).toEqual(["A1", "F13"]);

    // JSZip.loadAsync e createXlsmReader aceitam Blob diretamente — sem .arrayBuffer() (Node.js compat)
    const out = await JSZip.loadAsync(blob);
    const inFiles = Object.keys((await JSZip.loadAsync(modelo)).files).sort();
    expect(Object.keys(out.files).sort()).toEqual(inFiles);

    const bin = await out.file("xl/vbaProject.bin")!.async("uint8array");
    expect(Array.from(bin)).toEqual([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3, 4]);
    expect(await out.file("xl/worksheets/sheet2.xml")!.async("string")).toBe(`<worksheet><sheetData/></worksheet>`);
    expect(await out.file("xl/workbook.xml")!.async("string")).toContain('fullCalcOnLoad="1"');

    const read = await createXlsmReader(blob);
    expect(read("Cliente", "E13")).toBe("José da Silva");
    expect(fromExcelSerial(Number(read("Cliente", "E16")))).toBe("15/03/1980");
    expect(read("Cliente", "F13")).toBe("42");
  });
});
