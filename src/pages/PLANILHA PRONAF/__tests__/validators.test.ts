import { describe, it, expect } from "vitest";
import { validateCPF, cleanCPF } from "../validators/cpf";
import { validateCNPJ, cleanCNPJ } from "../validators/cnpj";
import { validateNomePF, validateNomeEndereco } from "../validators/nome";
import { validateDate, validateDateAfter, excelSerialDate } from "../validators/data";

// ──────────────────────────────────────────────────────────────
// CPF
// ──────────────────────────────────────────────────────────────
describe("validateCPF", () => {
  it("aceita CPF válido", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCPF("52998224725")).toBe(true);
  });

  it("rejeita sequência de dígitos repetidos", () => {
    for (let d = 0; d <= 9; d++) {
      expect(validateCPF(String(d).repeat(11))).toBe(false);
    }
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(validateCPF("529.982.247-26")).toBe(false);
    expect(validateCPF("000.000.000-01")).toBe(false);
  });

  it("rejeita CPF vazio", () => {
    expect(validateCPF("")).toBe(false);
  });

  it("cleanCPF completa com zeros à esquerda", () => {
    expect(cleanCPF("1234567")).toHaveLength(11);
    expect(cleanCPF("1234567").startsWith("0000")).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// CNPJ
// ──────────────────────────────────────────────────────────────
describe("validateCNPJ", () => {
  it("aceita CNPJ numérico válido", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validateCNPJ("11222333000181")).toBe(true);
  });

  it("rejeita sequência repetida", () => {
    expect(validateCNPJ("00000000000000")).toBe(false);
    expect(validateCNPJ("11111111111111")).toBe(false);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(validateCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(validateCNPJ("")).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Validação de Nome (PF)
// ──────────────────────────────────────────────────────────────
describe("validateNomePF", () => {
  it("aceita nome válido com 2 nomes", () => {
    expect(validateNomePF("João Silva")).toBe(true);
    expect(validateNomePF("Maria de Fátima Santos")).toBe(true);
  });

  it("rejeita nome com abreviação (ponto)", () => {
    expect(validateNomePF("João A. Silva")).toBe(false);
  });

  it("rejeita nome com 3 caracteres idênticos consecutivos", () => {
    expect(validateNomePF("Joaaao Silva")).toBe(false);
  });

  it("rejeita nome que começa com espaço", () => {
    expect(validateNomePF(" João Silva")).toBe(false);
  });

  it("rejeita nome único (menos de 2 nomes) quando < 30 chars", () => {
    expect(validateNomePF("João")).toBe(false);
  });

  it("rejeita nome que termina com ponto", () => {
    expect(validateNomePF("João Silva.")).toBe(false);
  });

  it("rejeita nome iniciando com NAO/NÃO", () => {
    expect(validateNomePF("NAO INFORMADO")).toBe(false);
    expect(validateNomePF("NÃO INFORMADO")).toBe(false);
  });

  it("rejeita nome com inicial de 1 letra no meio", () => {
    expect(validateNomePF("João A Silva")).toBe(false);
  });
});

describe("validateNomeEndereco", () => {
  it("aceita endereço válido", () => {
    expect(validateNomeEndereco("Rua das Flores")).toBe(true);
  });

  it("rejeita endereço com 3 chars idênticos", () => {
    expect(validateNomeEndereco("Ruaaa das Flores")).toBe(false);
  });

  it("aceita endereço com ponto (modo J)", () => {
    // modo J não tem a restrição de ponto
    expect(validateNomeEndereco("Av. Presidente")).toBe(true);
  });

  it("rejeita endereço que começa com espaço", () => {
    expect(validateNomeEndereco(" Rua das Flores")).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// Datas
// ──────────────────────────────────────────────────────────────
describe("validateDate", () => {
  it("aceita data válida no passado", () => {
    expect(validateDate("01/01/2000")).toBe(true);
  });

  it("rejeita data futura", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const str = `${String(future.getDate()).padStart(2, "0")}/${String(future.getMonth() + 1).padStart(2, "0")}/${future.getFullYear()}`;
    expect(validateDate(str)).toBe(false);
  });

  it("rejeita formato inválido", () => {
    expect(validateDate("2000-01-01")).toBe(false);
    expect(validateDate("32/01/2000")).toBe(false);
    expect(validateDate("")).toBe(false);
  });

  it("rejeita mês inválido", () => {
    expect(validateDate("01/13/2000")).toBe(false);
  });
});

describe("validateDateAfter", () => {
  it("aceita quando data1 >= data2", () => {
    expect(validateDateAfter("15/06/2010", "01/01/2000")).toBe(true);
    expect(validateDateAfter("01/01/2000", "01/01/2000")).toBe(true);
  });

  it("rejeita quando data1 < data2", () => {
    expect(validateDateAfter("01/01/1999", "01/01/2000")).toBe(false);
  });
});

describe("excelSerialDate", () => {
  it("converte 01/01/1900 para serial 1", () => {
    expect(excelSerialDate("01/01/1900")).toBe(1);
  });

  it("converte 01/01/2000 para serial 36526", () => {
    // Excel: 01/01/2000 = 36526
    expect(excelSerialDate("01/01/2000")).toBe(36526);
  });

  it("retorna 0 para data inválida", () => {
    expect(excelSerialDate("")).toBe(0);
    expect(excelSerialDate("abc")).toBe(0);
  });
});
