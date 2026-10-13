import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { importXlsm, decryptSpreadsheetIfNeeded, DEFAULT_SPREADSHEET_PASSWORDS } from "../importXlsm";

describe("importXlsm and decryptSpreadsheetIfNeeded", () => {
  it("contém senhasBN e variações na lista padrão de senhas", () => {
    expect(DEFAULT_SPREADSHEET_PASSWORDS).toContain("senhasBN");
    expect(DEFAULT_SPREADSHEET_PASSWORDS).toContain("senhasBNxI");
    expect(DEFAULT_SPREADSHEET_PASSWORDS[0]).toBe("senhasBN");
  });

  it("retorna buffer intacto quando o arquivo não está criptografado", async () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const res = await decryptSpreadsheetIfNeeded(original);
    expect(new Uint8Array(res)).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it("importa com sucesso uma planilha gerada em memória (.xlsm)", async () => {
    const zip = new JSZip();
    zip.file(
      "xl/workbook.xml",
      `<workbook xmlns:r="r"><sheets><sheet name="Cliente" sheetId="1" r:id="rId1"/></sheets></workbook>`
    );
    zip.file(
      "xl/_rels/workbook.xml.rels",
      `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`
    );
    zip.file(
      "xl/worksheets/sheet1.xml",
      `<worksheet><sheetData><row r="13"><c r="E13" t="inlineStr"><is><t>Maria dos Santos</t></is></c><c r="E14" t="inlineStr"><is><t>Mariinha</t></is></c></row></sheetData></worksheet>`
    );

    const buffer = await zip.generateAsync({ type: "arraybuffer" });
    const projeto = await importXlsm(buffer);

    expect(projeto).toBeDefined();
    expect(projeto.Cliente?.nome).toBe("Maria dos Santos");
    expect(projeto.Cliente?.apelido).toBe("Mariinha");
  });
});
