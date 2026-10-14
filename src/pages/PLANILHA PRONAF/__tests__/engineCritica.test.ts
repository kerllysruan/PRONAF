import { describe, it, expect, vi } from "vitest";
import jsPDF from "jspdf";
import { executarCriticaProjeto } from "../engineCritica";
import { createInitialProjetoA2 } from "../types";
import { gerarPdfParecerCritica } from "../gerarPdfCritica";

describe("Motor de Crítica e Conformidade Técnica BNB (engineCritica)", () => {
  it("avalia projeto inicial e retorna relatório com as 27 regras e estrutura completa", () => {
    const projeto = createInitialProjetoA2();
    const relatorio = executarCriticaProjeto(projeto);

    expect(relatorio).toBeDefined();
    expect(relatorio.totalRegras).toBe(27);
    expect(relatorio.itens.length).toBe(27);
    expect(["CONFORME", "ALERTA", "BLOQUEIA"]).toContain(relatorio.statusGeral);
    expect(relatorio.totalOk + relatorio.totalAlertas + relatorio.totalBloqueios + relatorio.totalNaoVerificaveis).toBe(27);

    // Todas as regras devem possuir texto de 'comoResolver'
    relatorio.itens.forEach((item) => {
      expect(item.id).toMatch(/^R\d{2}$/);
      expect(item.regra).toBeTruthy();
      expect(item.comoResolver).toBeTruthy();
      expect(["OK", "ALERTA", "BLOQUEIA", "NÃO VERIFICÁVEL"]).toContain(item.status);
    });
  });

  it("detecta inconformidade de lotação de pastagens (R15 - BLOQUEIA) e gera orientação de como resolver", () => {
    const projeto = createInitialProjetoA2();
    projeto.Cliente.nome = "MIGUEL PEREIRA DE ARAUJO";
    projeto.Cliente.cpf = "002.502.943-73";
    projeto[" Proposta"].imovelMunicipio = "GOVERNADOR NUNES FREIRE - MA";
    projeto[" Proposta"].regiao = "FORA DO SEMI-ÁRIDO";

    // Simula 10 ha de pastagem com 17 UA (lotação = 1.70 UA/ha, enquanto o suporte de Nunes Freire é 1.34 UA/ha)
    projeto["Ativ. Agrícola"].usoTerras = [
      {
        discriminacao: "Pastagem Braquiária",
        areaAtual: 10,
        uaAtual: 17,
        anos: [{ area: 10, ua: 17 }],
      },
    ];

    const relatorio = executarCriticaProjeto(projeto);
    const r15 = relatorio.itens.find((i) => i.id === "R15");

    expect(r15).toBeDefined();
    expect(r15?.status).toBe("BLOQUEIA");
    expect(r15?.comoResolver).toContain("Reduzir a lotação");
    expect(relatorio.statusGeral).toBe("BLOQUEIA");
    expect(relatorio.totalBloqueios).toBeGreaterThanOrEqual(1);
  });

  it("aprova projeto com parâmetros conformes (R15 - OK)", () => {
    const projeto = createInitialProjetoA2();
    projeto[" Proposta"].imovelMunicipio = "GOVERNADOR NUNES FREIRE - MA";
    projeto[" Proposta"].regiao = "FORA DO SEMI-ÁRIDO";

    // 10 ha com 10 UA = 1.0 UA/ha (abaixo do teto de 1.34 UA/ha)
    projeto["Ativ. Agrícola"].usoTerras = [
      {
        discriminacao: "Pastagem Braquiária",
        areaAtual: 10,
        uaAtual: 10,
        anos: [{ area: 10, ua: 10 }],
      },
    ];

    const relatorio = executarCriticaProjeto(projeto);
    const r15 = relatorio.itens.find((i) => i.id === "R15");

    expect(r15?.status).toBe("OK");
    expect(r15?.comoResolver).toContain("Conforme");
  });

  it("valida cronograma com parcelas somando 100% (R22 e R23)", () => {
    const projeto = createInitialProjetoA2();
    projeto.Cronograma.parcelas = [
      { ano: 1, mes: 1, participacaoPercent: 100 },
    ];

    const relatorio = executarCriticaProjeto(projeto);
    const r22 = relatorio.itens.find((i) => i.id === "R22");
    expect(r22?.status).toBe("OK");
  });

  it("gera o documento PDF do parecer técnico sem lançar exceções", () => {
    const projeto = createInitialProjetoA2();
    projeto.Cliente.nome = "MIGUEL PEREIRA DE ARAUJO";
    projeto.Cliente.cpf = "00250294373";
    projeto[" Proposta"].imovelMunicipio = "GOVERNADOR NUNES FREIRE - MA";

    const relatorio = executarCriticaProjeto(projeto);

    let doc: jsPDF | undefined;
    expect(() => {
      doc = gerarPdfParecerCritica(relatorio);
    }).not.toThrow();

    expect(doc).toBeDefined();
    expect(doc?.internal.pages.length).toBeGreaterThanOrEqual(1);
  });
});
