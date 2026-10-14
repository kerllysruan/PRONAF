/**
 * Definições e regras de Parâmetros de Cálculo Financeiro por Programa de Crédito.
 * Fonte de verdade: Tabela "programas_credito" (VISAO!$EK$12:$ET$26) de reference_tables.json
 * e regras da planilha PRONAF A2 (mdlAtualiza.bas, mdlCritica.bas, campos_CalculoFinanceiro.csv).
 */

export interface ParametrosPrograma {
  nome: string;
  codigo?: number | string;
  prazoMeses: number;
  carenciaMeses: number;
  jurosPercentAa: number;
  periodicidadeReembolso: string;
  amortizacoesIguais: 'Sim' | 'Não';
  limiteCredito?: number;
}

/** Tabela dos programas oficiais do PRONAF A2 com seus parâmetros padrão do BNB */
export const PROGRAMAS_CREDITO_PADRAO: Record<string, ParametrosPrograma> = {
  // 1. Resolução 5.183-24 (Código 699)
  'FNE/PRONAF GRUPO "A" -  Res. 5.183-24 (699)': {
    nome: 'FNE/PRONAF GRUPO "A" -  Res. 5.183-24 (699)',
    codigo: 699,
    prazoMeses: 120,
    carenciaMeses: 36,
    jurosPercentAa: 0.5,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 50000,
  },

  // 2. Pronaf Grupo A FNE Tradicional (Código 368)
  'FNE/PRONAF GRUPO "A" - FNE (368)': {
    nome: 'FNE/PRONAF GRUPO "A" - FNE (368)',
    codigo: 368,
    prazoMeses: 120,
    carenciaMeses: 36,
    jurosPercentAa: 0.5,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 58000,
  },

  // 3. Pronaf A Cooperativas (Código 980)
  'FNE/PRONAF-A - COOPERATIVAS (980)': {
    nome: 'FNE/PRONAF-A - COOPERATIVAS (980)',
    codigo: 980,
    prazoMeses: 96,
    carenciaMeses: 24,
    jurosPercentAa: 3.0,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 1000000,
  },

  // 4. Enchente 2010 AL/PE FNE (Código 483)
  'FNE/PRONAF ENCHENTE 2010-AL/PE': {
    nome: 'FNE/PRONAF ENCHENTE 2010-AL/PE',
    codigo: 483,
    prazoMeses: 24,
    carenciaMeses: 1,
    jurosPercentAa: 0.5,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 2000,
  },

  // 5. Enchente 2010 AL/PE STN (Código 484)
  'STN/PRONAF ENCHENTE 2010-AL/PE': {
    nome: 'STN/PRONAF ENCHENTE 2010-AL/PE',
    codigo: 484,
    prazoMeses: 24,
    carenciaMeses: 1,
    jurosPercentAa: 0.5,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 2000,
  },

  // 6. Programa FDNE (Código 533)
  'PROGRAMA FDNE': {
    nome: 'PROGRAMA FDNE',
    codigo: 533,
    prazoMeses: 240,
    carenciaMeses: 1,
    jurosPercentAa: 1.0,
    periodicidadeReembolso: 'Anual',
    amortizacoesIguais: 'Sim',
    limiteCredito: 130000,
  },
};

/** Padrão geral para operações do PRONAF A2 quando não identificado especificamente */
export const PARAMETROS_PRONAF_A_DEFAULT: ParametrosPrograma = {
  nome: 'FNE/PRONAF GRUPO "A"',
  codigo: 699,
  prazoMeses: 120,
  carenciaMeses: 36,
  jurosPercentAa: 0.5,
  periodicidadeReembolso: 'Anual',
  amortizacoesIguais: 'Sim',
  limiteCredito: 50000,
};

/**
 * Identifica e retorna os parâmetros de cálculo financeiro adequados
 * de forma automática a partir do nome ou código do programa de crédito.
 */
export function identificarParametrosPorPrograma(programaNome?: string | null): ParametrosPrograma {
  if (!programaNome || !programaNome.trim()) {
    return { ...PARAMETROS_PRONAF_A_DEFAULT };
  }

  const nomeLimpo = programaNome.trim();

  // 1. Busca por correspondência exata
  if (PROGRAMAS_CREDITO_PADRAO[nomeLimpo]) {
    return { ...PROGRAMAS_CREDITO_PADRAO[nomeLimpo] };
  }

  // 2. Busca por código numérico entre parênteses (ex: "(699)", "(368)", "(980)")
  const matchCodigo = nomeLimpo.match(/\((\d{3,4})\)/);
  if (matchCodigo) {
    const cod = parseInt(matchCodigo[1], 10);
    const encontrado = Object.values(PROGRAMAS_CREDITO_PADRAO).find((p) => p.codigo === cod);
    if (encontrado) {
      return { ...encontrado, nome: nomeLimpo };
    }
  }

  // 3. Busca por substring nos nomes conhecidos
  const lower = nomeLimpo.toLowerCase();
  if (lower.includes('5.183') || lower.includes('699')) {
    return { ...PROGRAMAS_CREDITO_PADRAO['FNE/PRONAF GRUPO "A" -  Res. 5.183-24 (699)'], nome: nomeLimpo };
  }
  if (lower.includes('368') || (lower.includes('grupo') && lower.includes('a') && lower.includes('fne'))) {
    return { ...PROGRAMAS_CREDITO_PADRAO['FNE/PRONAF GRUPO "A" - FNE (368)'], nome: nomeLimpo };
  }
  if (lower.includes('980') || lower.includes('cooperativa')) {
    return { ...PROGRAMAS_CREDITO_PADRAO['FNE/PRONAF-A - COOPERATIVAS (980)'], nome: nomeLimpo };
  }
  if (lower.includes('483') || lower.includes('enchente')) {
    return { ...PROGRAMAS_CREDITO_PADRAO['FNE/PRONAF ENCHENTE 2010-AL/PE'], nome: nomeLimpo };
  }
  if (lower.includes('533') || lower.includes('fdne')) {
    return { ...PROGRAMAS_CREDITO_PADRAO['PROGRAMA FDNE'], nome: nomeLimpo };
  }

  // 4. Fallback padrão seguro para o PRONAF A2
  return { ...PARAMETROS_PRONAF_A_DEFAULT, nome: nomeLimpo };
}

/**
 * Validação dos parâmetros de financiamento com base nas regras do Excel da planilha PRONAF A2:
 * - Prazo em meses deve ser múltiplo de 12 (fórmula Y13: MOD(prazo, 12) = 0)
 * - Prazo não pode exceder o limite do programa
 * - Carência não pode exceder o limite do programa nem o prazo total
 */
export function validarParametrosCalculo(
  prazoMeses: number,
  carenciaMeses: number,
  programaNome?: string
): { valido: boolean; erros: string[]; avisos: string[] } {
  const erros: string[] = [];
  const avisos: string[] = [];
  const ref = identificarParametrosPorPrograma(programaNome);

  if (!prazoMeses || prazoMeses <= 0) {
    erros.push('Prazo em meses é obrigatório e deve ser maior que zero.');
  } else {
    if (prazoMeses % 12 !== 0) {
      avisos.push(`O prazo (${prazoMeses} meses) deve preferencialmente ser múltiplo de 12 meses (anos completos).`);
    }
    if (prazoMeses > ref.prazoMeses) {
      erros.push(`Prazo incompatível com o Programa de Crédito: máximo permitido é de ${ref.prazoMeses} meses (${ref.prazoMeses / 12} anos).`);
    }
  }

  if (carenciaMeses < 0) {
    erros.push('Carência não pode ser negativa.');
  } else {
    if (carenciaMeses > prazoMeses) {
      erros.push('A carência não pode ser superior ao prazo total do financiamento.');
    }
    if (carenciaMeses > ref.carenciaMeses) {
      erros.push(`Carência incompatível com o Programa de Crédito: máxima recomendada é de ${ref.carenciaMeses} meses (${ref.carenciaMeses / 12} anos).`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
  };
}
