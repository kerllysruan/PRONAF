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

  it("importa com sucesso arquivo oficial SEAP com aba BdPRONAF_C preenchendo as 8 abas", async () => {
    // Monta linhas simuladas do padrão oficial SEAP / BdPRONAF_C
    const rows: unknown[][] = [];
    for (let i = 0; i < 750; i++) rows.push([]);

    // Linha 11: Cliente
    rows[11] = [
      "", "", "", "",
      "Pessoa Física", // col 4
      "OSVALDO DE JESUS", // col 5 nome
      "OSVALDO", // col 6 apelido
      "460388843-00", // col 7 cpf
      "22644", // col 8 dataNascimento (serial Excel)
      "0000522145965", // col 9
      "42912", // col 10
      "",
      "Cédula de Identidade (RG)", // col 12
      "SSP", // col 13
      "MA", // col 14
      "", // col 15
      "TURIACU-MA", // col 16
      "Masculino", // col 17
      "Casado(a) comunhão parcial de bens", // col 18
      "Alfabetizado(a)", // col 19
      "Agricultor(a)", // col 20
      "Bovinocultura Extensiva/Corte", // col 21
      1621, // col 22 renda
      "Cliente não Beneficiário", // col 23
      "", // col 24
      "BENEDITA DE JESUS", // col 25
      "", // col 26
      "PRONAFIANO GRUPO A", // col 27 porte
      "", // col 28
      "", "", "", "", "",
      "COMUNIDADE", // col 34
      "COMUNIDADE TOROZINHO", // col 35 endereco ativ
      "", // col 36
      "PRINCIPAL", // col 37
      "ZONA RURAL", // col 38
      "65278000", // col 39
      "TURIACU-MA", // col 40
      "98", // col 41
      "985568293", // col 42
    ];
    // Linha 11 colunas de cônjuge
    rows[11][63] = "VALDENORA ANTONIA AMORIM DE JESUS";
    rows[11][64] = "3296072357";
    rows[11][65] = "23906";

    // Linha 21: Avaliação
    rows[21] = [
      "", "", "", "",
      " PA MIRA FLORES", // col 4
      "TURIACU-MA", // col 5
      20.2088, // col 6
      "Sim", // col 7
      "Não", // col 8
    ];
    rows[21][58] = "MA2112407CA5E0914A50C4059BEEED3A9CAF483D9"; // CAR

    // Linha 121: Proposta
    rows[121] = [
      "", "", "", "",
      46226, // col 4 data
      'FNE/PRONAF GRUPO "A" - FNE (368)', // col 5 programa
      "GOVERNADOR NUNES FREIRE-MA", // col 6 agencia
      "Fora do Semi-árido", // col 7 regiao
      "Bovinocultura Extensiva/Corte", // col 8
      "", "", "",
      "FRANCISCO DAS CHAGAS SOUSA OLIVEIRA", // col 13 elaborador
      "413590878-00", // col 14 cpf
    ];
    // Linha 121: Item 1 de investimento
    rows[121][22] = "AQUISIÃO DE MATRIZES BOVINAS";
    rows[121][23] = "Não";
    rows[121][24] = 4;
    rows[121][25] = "Unidade";
    rows[121][26] = "Semoventes";
    rows[121][27] = 4000;
    rows[121][28] = "1";

    // Linha 221: Cronograma
    rows[221] = [
      "", "", "", "",
      "082026", // col 4
      "092026", // col 5
      "", "", "", "", "", "",
      50, // col 12
      50, // col 13
    ];

    // Linha 521: Outras Atividades
    rows[521] = [
      "", "", "", "",
      "MEL E NATURA", // col 4
      "Pecuária", // col 5
      15000, // col 6
      4000, // col 7
    ];
    rows[543] = ["", "", "", "", "", "", 600]; // Subsistência

    // Linha 721: Financiamento
    rows[721] = [
      "", "", "", "",
      120, // col 4 prazo
      36, // col 5 carencia
      0.5, // col 6 juros
      "Anual", // col 7
      "Sim", // col 8
    ];

    const { parseBdPronafCToProjeto } = await import("../importXlsm");
    const p = parseBdPronafCToProjeto(rows);

    expect(p.Cliente.nome).toBe("OSVALDO DE JESUS");
    expect(p.Cliente.cpf).toBe("460.388.843-00");
    expect(p.Cliente.conjugeNome).toBe("VALDENORA ANTONIA AMORIM DE JESUS");
    expect(p["Avaliação"].imoveis[0].denominacao).toBe("PA MIRA FLORES");
    expect(p["Avaliação"].informacoesAdicionais[0].registroCar).toBe("MA2112407CA5E0914A50C4059BEEED3A9CAF483D9");
    expect(p[" Proposta"].programa).toBe('FNE/PRONAF GRUPO "A" - FNE (368)');
    expect(p[" Proposta"].itensInvestimento[0].discriminacao).toBe("AQUISIÃO DE MATRIZES BOVINAS");
    expect(p[" Proposta"].itensInvestimento[0].valorUnitario).toBe(4000);
    expect(p.Cronograma.inversoesParcelas[0].parcelas[0].mesAno).toBe("08/2026");
    expect(p.Cronograma.inversoesParcelas[0].parcelas[0].percentual).toBe(50);
    expect(p["Outras Ativ"].receitasAnuais[0].descricao).toBe("MEL E NATURA");
    expect(p["Outras Ativ"].subsistenciaFamilia).toBe(600);
    expect(p.CalculoFinanceiro.bloco1.prazoMeses).toBe(120);
    expect(p.CalculoFinanceiro.bloco1.carenciaMeses).toBe(36);
  });
});
