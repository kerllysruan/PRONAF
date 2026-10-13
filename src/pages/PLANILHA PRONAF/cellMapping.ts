/**
 * cellMapping.ts - Mapeamento completo de campos e células do PRONAF A2 para todas as 8 abas.
 * Alinhado rigorosamente a types.ts, à especificação PRONAF-A2_SPEC_ANTIGRAVITY.md e aos CSVs em data/.
 */
import type {
  ProjetoA2,
  ClienteData,
  AvaliacaoData,
  PropostaData,
  CronogramaData,
  AtividadeAgricolaData,
  AtividadePecuariaData,
  OutrasAtividadesData,
  CalculoFinanceiroData,
} from "./types";
import { createInitialProjetoA2 } from "./types";

export type CellValueType = 'text' | 'number' | 'date' | 'integer';

export type SheetName =
  | 'Cliente'
  | 'Avaliação'
  | ' Proposta'
  | 'Cronograma'
  | 'Ativ. Agrícola'
  | 'Ativ. Pecuária'
  | 'Outras Ativ'
  | 'CalculoFinanceiro';

export interface CellWrite {
  sheet: SheetName;
  cell: string;
  value: string | number;
  type: CellValueType;
}

export interface CellRef {
  sheet: SheetName;
  cell: string;
  type: CellValueType;
}

export interface CellEntry {
  sheet: SheetName;
  cell: string;
  type: CellValueType;
  /** Função para extrair valor do projeto */
  get: (p: ProjetoA2) => unknown;
  /** Função para aplicar valor lido no projeto */
  set: (p: ProjetoA2, v: unknown) => void;
  /** Valor padrão no template/CSV (se diferente de 0/vazio) */
  defaultVal?: unknown;
  /** Se é célula secundária de uma mesclagem (não gravada por projetoToCells se false) */
  isSecondaryMerged?: boolean;
}

export function numberToColLetter(n: number): string {
  let s = '';
  let temp = n;
  while (temp > 0) {
    const m = (temp - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    temp = Math.floor((temp - m) / 26);
  }
  return s;
}

export function colLetterToNumber(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

/** Converte número serial do Excel (base 1900) para string dd/mm/aaaa. */
export function serialToDateStr(val: string): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
  const num = Number(trimmed);
  if (isNaN(num) || num <= 0) return trimmed;
  let s = Math.floor(num);
  if (s < 61) s += 1;
  const d = new Date(Date.UTC(1899, 11, 30) + s * 86400000);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

// ============================================================================
// CONSTRUÇÃO DECLARATIVA DOS MAPEAMENTOS
// ============================================================================

const ENTRIES: CellEntry[] = [];

function register(entry: CellEntry): void {
  ENTRIES.push(entry);
}

// ----------------------------------------------------------------------------
// 1. ABA: Cliente (sheet13.xml)
// ----------------------------------------------------------------------------
function buildClienteMappings(): void {
  const sheet: SheetName = 'Cliente';

  // A. Dados Cadastrais
  register({ sheet, cell: 'E12', type: 'text', get: p => p.Cliente.tipoCliente, set: (p, v) => (p.Cliente.tipoCliente = v) });
  register({ sheet, cell: 'E13', type: 'text', get: p => p.Cliente.nome, set: (p, v) => (p.Cliente.nome = v) });
  register({ sheet, cell: 'E14', type: 'text', get: p => p.Cliente.apelido, set: (p, v) => (p.Cliente.apelido = v) });
  register({ sheet, cell: 'E15', type: 'text', get: p => p.Cliente.cpf, set: (p, v) => (p.Cliente.cpf = v) });
  register({ sheet, cell: 'E16', type: 'date', get: p => p.Cliente.dataNascimento, set: (p, v) => (p.Cliente.dataNascimento = v) });
  register({ sheet, cell: 'E17', type: 'text', get: p => p.Cliente.numDocumento, set: (p, v) => (p.Cliente.numDocumento = v) });
  register({ sheet, cell: 'E18', type: 'date', get: p => p.Cliente.dataEmissaoDoc, set: (p, v) => (p.Cliente.dataEmissaoDoc = v) });
  register({ sheet, cell: 'E20', type: 'text', get: p => p.Cliente.tipoDocumento, set: (p, v) => (p.Cliente.tipoDocumento = v) });
  register({ sheet, cell: 'E21', type: 'text', get: p => p.Cliente.orgaoEmissorDoc, set: (p, v) => (p.Cliente.orgaoEmissorDoc = v) });
  register({ sheet, cell: 'E22', type: 'text', get: p => p.Cliente.ufOrgaoEmissorDoc, set: (p, v) => (p.Cliente.ufOrgaoEmissorDoc = v) });
  register({ sheet, cell: 'E23', type: 'text', get: p => p.Cliente.tituloEleitoral, set: (p, v) => (p.Cliente.tituloEleitoral = v) });
  register({ sheet, cell: 'E24', type: 'text', get: p => p.Cliente.naturalidade, set: (p, v) => (p.Cliente.naturalidade = v) });
  register({ sheet, cell: 'E25', type: 'text', get: p => p.Cliente.sexo, set: (p, v) => (p.Cliente.sexo = v) });
  register({ sheet, cell: 'E26', type: 'text', get: p => p.Cliente.estadoCivil, set: (p, v) => (p.Cliente.estadoCivil = v) });
  register({ sheet, cell: 'E27', type: 'text', get: p => p.Cliente.grauInstrucao, set: (p, v) => (p.Cliente.grauInstrucao = v) });
  register({ sheet, cell: 'E28', type: 'text', get: p => p.Cliente.profissao, set: (p, v) => (p.Cliente.profissao = v) });
  register({ sheet, cell: 'E29', type: 'text', get: p => p.Cliente.atividade, set: (p, v) => (p.Cliente.atividade = v) });
  register({ sheet, cell: 'E30', type: 'number', get: p => p.Cliente.rendaMensal, set: (p, v) => (p.Cliente.rendaMensal = v) });
  register({ sheet, cell: 'E31', type: 'text', get: p => p.Cliente.beneficiarioPoliticasPublicas, set: (p, v) => (p.Cliente.beneficiarioPoliticasPublicas = v) });
  register({ sheet, cell: 'E32', type: 'text', get: p => p.Cliente.nomePai, set: (p, v) => (p.Cliente.nomePai = v) });
  register({ sheet, cell: 'E33', type: 'text', get: p => p.Cliente.nomeMae, set: (p, v) => (p.Cliente.nomeMae = v) });
  register({ sheet, cell: 'E35', type: 'text', get: p => p.Cliente.porte, set: (p, v) => (p.Cliente.porte = v) });
  register({ sheet, cell: 'E36', type: 'text', get: p => p.Cliente.numDap, set: (p, v) => (p.Cliente.numDap = v) });
  register({ sheet, cell: 'E37', type: 'text', get: p => p.Cliente.capitalIntegralizado, set: (p, v) => (p.Cliente.capitalIntegralizado = v) });

  // B. Endereço da Atividade (E46 com type integer para compatibilidade com ISNUMBER da planilha)
  register({ sheet, cell: 'E44', type: 'text', get: p => p.Cliente.ativTipoLogradouro, set: (p, v) => (p.Cliente.ativTipoLogradouro = v) });
  register({ sheet, cell: 'E45', type: 'text', get: p => p.Cliente.ativEndereco, set: (p, v) => (p.Cliente.ativEndereco = v) });
  register({ sheet, cell: 'E46', type: 'integer', get: p => p.Cliente.ativNumero, set: (p, v) => (p.Cliente.ativNumero = v) });
  register({ sheet, cell: 'E47', type: 'text', get: p => p.Cliente.ativComplemento, set: (p, v) => (p.Cliente.ativComplemento = v) });
  register({ sheet, cell: 'E48', type: 'text', get: p => p.Cliente.ativBairro, set: (p, v) => (p.Cliente.ativBairro = v) });
  register({ sheet, cell: 'E49', type: 'integer', get: p => p.Cliente.ativCep, set: (p, v) => (p.Cliente.ativCep = v) });
  register({ sheet, cell: 'E50', type: 'text', get: p => p.Cliente.ativMunicipio, set: (p, v) => (p.Cliente.ativMunicipio = v) });
  register({ sheet, cell: 'E51', type: 'integer', get: p => p.Cliente.ativDddTelefone, set: (p, v) => (p.Cliente.ativDddTelefone = v) });
  register({ sheet, cell: 'E52', type: 'integer', get: p => p.Cliente.ativNumTelefone, set: (p, v) => (p.Cliente.ativNumTelefone = v) });

  // C. Endereço para Correspondência (E60 com type integer)
  register({ sheet, cell: 'E58', type: 'text', get: p => p.Cliente.corrTipoLogradouro, set: (p, v) => (p.Cliente.corrTipoLogradouro = v) });
  register({ sheet, cell: 'E59', type: 'text', get: p => p.Cliente.corrEndereco, set: (p, v) => (p.Cliente.corrEndereco = v) });
  register({ sheet, cell: 'E60', type: 'integer', get: p => p.Cliente.corrNumero, set: (p, v) => (p.Cliente.corrNumero = v) });
  register({ sheet, cell: 'E61', type: 'text', get: p => p.Cliente.corrComplemento, set: (p, v) => (p.Cliente.corrComplemento = v) });
  register({ sheet, cell: 'E62', type: 'text', get: p => p.Cliente.corrBairro, set: (p, v) => (p.Cliente.corrBairro = v) });
  register({ sheet, cell: 'E63', type: 'integer', get: p => p.Cliente.corrCep, set: (p, v) => (p.Cliente.corrCep = v) });
  register({ sheet, cell: 'E64', type: 'text', get: p => p.Cliente.corrMunicipio, set: (p, v) => (p.Cliente.corrMunicipio = v) });
  register({ sheet, cell: 'E65', type: 'integer', get: p => p.Cliente.corrDddTelefone, set: (p, v) => (p.Cliente.corrDddTelefone = v) });
  register({ sheet, cell: 'E66', type: 'integer', get: p => p.Cliente.corrNumTelefone, set: (p, v) => (p.Cliente.corrNumTelefone = v) });

  // D. Imóvel da Atividade
  register({ sheet, cell: 'F71', type: 'text', get: p => p.Cliente.imovelDenominacao, set: (p, v) => (p.Cliente.imovelDenominacao = v) });
  register({ sheet, cell: 'F72', type: 'number', get: p => p.Cliente.imovelArea, set: (p, v) => (p.Cliente.imovelArea = v) });
  register({ sheet, cell: 'E73', type: 'text', get: p => p.Cliente.imovelTipoUso, set: (p, v) => (p.Cliente.imovelTipoUso = v) });
  register({ sheet, cell: 'E74', type: 'text', get: p => p.Cliente.imovelProprietario, set: (p, v) => (p.Cliente.imovelProprietario = v) });
  register({ sheet, cell: 'E75', type: 'text', get: p => p.Cliente.imovelCpfCnpjProprietario, set: (p, v) => (p.Cliente.imovelCpfCnpjProprietario = v) });
  register({ sheet, cell: 'E77', type: 'text', get: p => p.Cliente.imovelItinerario, set: (p, v) => (p.Cliente.imovelItinerario = v) });

  // E. Cônjuge / Companheiro(a)
  register({ sheet, cell: 'E82', type: 'text', get: p => p.Cliente.conjugeNome, set: (p, v) => (p.Cliente.conjugeNome = v) });
  register({ sheet, cell: 'E83', type: 'text', get: p => p.Cliente.conjugeCpf, set: (p, v) => (p.Cliente.conjugeCpf = v) });
  register({ sheet, cell: 'E84', type: 'date', get: p => p.Cliente.conjugeDataNascimento, set: (p, v) => (p.Cliente.conjugeDataNascimento = v) });
  register({ sheet, cell: 'E85', type: 'text', get: p => p.Cliente.conjugeNumDocumento, set: (p, v) => (p.Cliente.conjugeNumDocumento = v) });
  register({ sheet, cell: 'E86', type: 'text', get: p => p.Cliente.conjugeTipoDocumento, set: (p, v) => (p.Cliente.conjugeTipoDocumento = v) });
  register({ sheet, cell: 'E87', type: 'text', get: p => p.Cliente.conjugeOrgaoEmissor, set: (p, v) => (p.Cliente.conjugeOrgaoEmissor = v) });
  register({ sheet, cell: 'E88', type: 'text', get: p => p.Cliente.conjugeUfOrgaoEmissor, set: (p, v) => (p.Cliente.conjugeUfOrgaoEmissor = v) });
  register({ sheet, cell: 'E89', type: 'date', get: p => p.Cliente.conjugeDataEmissao, set: (p, v) => (p.Cliente.conjugeDataEmissao = v) });
  register({ sheet, cell: 'E90', type: 'text', get: p => p.Cliente.conjugeSexo, set: (p, v) => (p.Cliente.conjugeSexo = v) });
  register({ sheet, cell: 'E91', type: 'text', get: p => p.Cliente.conjugeEstadoCivil, set: (p, v) => (p.Cliente.conjugeEstadoCivil = v) });
  register({ sheet, cell: 'E92', type: 'text', get: p => p.Cliente.conjugeGrauInstrucao, set: (p, v) => (p.Cliente.conjugeGrauInstrucao = v) });
  register({ sheet, cell: 'E93', type: 'text', get: p => p.Cliente.conjugeProfissao, set: (p, v) => (p.Cliente.conjugeProfissao = v) });
  register({ sheet, cell: 'E94', type: 'number', get: p => p.Cliente.conjugeRendaMensal, set: (p, v) => (p.Cliente.conjugeRendaMensal = v) });
  register({ sheet, cell: 'E95', type: 'text', get: p => p.Cliente.conjugeNaturalidade, set: (p, v) => (p.Cliente.conjugeNaturalidade = v) });
  register({ sheet, cell: 'E96', type: 'text', get: p => p.Cliente.conjugeNomePai, set: (p, v) => (p.Cliente.conjugeNomePai = v) });
  register({ sheet, cell: 'E97', type: 'text', get: p => p.Cliente.conjugeNomeMae, set: (p, v) => (p.Cliente.conjugeNomeMae = v) });

  // F. Sócios (5 slots)
  const socioRows = [106, 113, 120, 127, 134];
  socioRows.forEach((row, i) => {
    register({ sheet, cell: `E${row}`, type: 'text', get: p => p.Cliente.socios[i]?.cpfCnpj, set: (p, v) => { if (p.Cliente.socios[i]) p.Cliente.socios[i].cpfCnpj = v; } });
    register({ sheet, cell: `E${row + 1}`, type: 'text', get: p => p.Cliente.socios[i]?.nome, set: (p, v) => { if (p.Cliente.socios[i]) p.Cliente.socios[i].nome = v; } });
    register({ sheet, cell: `E${row + 2}`, type: 'text', get: p => p.Cliente.socios[i]?.participacao, set: (p, v) => { if (p.Cliente.socios[i]) p.Cliente.socios[i].participacao = v; } });
    register({ sheet, cell: `E${row + 3}`, type: 'text', get: p => p.Cliente.socios[i]?.representaEmpresa, set: (p, v) => { if (p.Cliente.socios[i]) p.Cliente.socios[i].representaEmpresa = v; } });
  });
}

// ----------------------------------------------------------------------------
// 2. ABA: CalculoFinanceiro (sheet25.xml)
// ----------------------------------------------------------------------------
function buildCalculoFinanceiroMappings(): void {
  const sheet: SheetName = 'CalculoFinanceiro';

  // Bloco 1 (D13..D17)
  register({ sheet, cell: 'D13', type: 'integer', get: p => p.CalculoFinanceiro.bloco1.prazoMeses, set: (p, v) => (p.CalculoFinanceiro.bloco1.prazoMeses = v) });
  register({ sheet, cell: 'D14', type: 'integer', get: p => p.CalculoFinanceiro.bloco1.carenciaMeses, set: (p, v) => (p.CalculoFinanceiro.bloco1.carenciaMeses = v) });
  register({ sheet, cell: 'D15', type: 'number', defaultVal: 4, get: p => p.CalculoFinanceiro.bloco1.jurosPercentAa, set: (p, v) => (p.CalculoFinanceiro.bloco1.jurosPercentAa = v) });
  register({ sheet, cell: 'D16', type: 'text', get: p => p.CalculoFinanceiro.bloco1.periodicidadeReembolso, set: (p, v) => (p.CalculoFinanceiro.bloco1.periodicidadeReembolso = v) });
  register({ sheet, cell: 'D17', type: 'text', get: p => p.CalculoFinanceiro.bloco1.amortizacoesIguais, set: (p, v) => (p.CalculoFinanceiro.bloco1.amortizacoesIguais = v) });

  // Bloco 2 (DD13..DD17)
  register({ sheet, cell: 'DD13', type: 'integer', get: p => p.CalculoFinanceiro.bloco2.prazoMeses, set: (p, v) => (p.CalculoFinanceiro.bloco2.prazoMeses = v) });
  register({ sheet, cell: 'DD14', type: 'integer', get: p => p.CalculoFinanceiro.bloco2.carenciaMeses, set: (p, v) => (p.CalculoFinanceiro.bloco2.carenciaMeses = v) });
  register({ sheet, cell: 'DD15', type: 'number', defaultVal: 4, get: p => p.CalculoFinanceiro.bloco2.jurosPercentAa, set: (p, v) => (p.CalculoFinanceiro.bloco2.jurosPercentAa = v) });
  register({ sheet, cell: 'DD16', type: 'text', get: p => p.CalculoFinanceiro.bloco2.periodicidadeReembolso, set: (p, v) => (p.CalculoFinanceiro.bloco2.periodicidadeReembolso = v) });
  register({ sheet, cell: 'DD17', type: 'text', get: p => p.CalculoFinanceiro.bloco2.amortizacoesIguais, set: (p, v) => (p.CalculoFinanceiro.bloco2.amortizacoesIguais = v) });
}

// ----------------------------------------------------------------------------
// 3. ABA: Outras Ativ (sheet22.xml)
// ----------------------------------------------------------------------------
function buildOutrasAtivMappings(): void {
  const sheet: SheetName = 'Outras Ativ';

  // Receitas Anuais (linhas 15 a 24, 10 itens)
  for (let i = 0; i < 10; i++) {
    const row = 15 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p['Outras Ativ'].receitasAnuais[idx]?.descricao, set: (p, v) => { if (p['Outras Ativ'].receitasAnuais[idx]) p['Outras Ativ'].receitasAnuais[idx].descricao = v; } });
    register({ sheet, cell: `E${row}`, type: 'text', get: p => p['Outras Ativ'].receitasAnuais[idx]?.setorAtividade, set: (p, v) => { if (p['Outras Ativ'].receitasAnuais[idx]) p['Outras Ativ'].receitasAnuais[idx].setorAtividade = v; } });
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p['Outras Ativ'].receitasAnuais[idx]?.atual, set: (p, v) => { if (p['Outras Ativ'].receitasAnuais[idx]) p['Outras Ativ'].receitasAnuais[idx].atual = v; } });

    // Anos 1 a 30 (colunas G a AJ)
    for (let ano = 1; ano <= 30; ano++) {
      const col = numberToColLetter(6 + ano); // 7='G'..36='AJ'
      const anoIdx = ano - 1;
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'number',
        get: p => p['Outras Ativ'].receitasAnuais[idx]?.anos?.[anoIdx],
        set: (p, v) => {
          const item = p['Outras Ativ'].receitasAnuais[idx];
          if (item) {
            if (!item.anos) item.anos = [];
            item.anos[anoIdx] = v;
          }
        }
      });
    }
  }

  // Receitas e Despesas Diversas
  register({ sheet, cell: 'F70', type: 'number', get: p => p['Outras Ativ'].receitasExtraRurais, set: (p, v) => (p['Outras Ativ'].receitasExtraRurais = v) });
  register({ sheet, cell: 'F77', type: 'number', get: p => p['Outras Ativ'].energiaEletrica, set: (p, v) => (p['Outras Ativ'].energiaEletrica = v) });
  register({ sheet, cell: 'F78', type: 'number', get: p => p['Outras Ativ'].combustiveisLubrificantes, set: (p, v) => (p['Outras Ativ'].combustiveisLubrificantes = v) });
  register({ sheet, cell: 'F79', type: 'number', get: p => p['Outras Ativ'].administrador, set: (p, v) => (p['Outras Ativ'].administrador = v) });
  register({ sheet, cell: 'F80', type: 'number', get: p => p['Outras Ativ'].subsistenciaFamilia, set: (p, v) => (p['Outras Ativ'].subsistenciaFamilia = v) });
  register({ sheet, cell: 'F81', type: 'number', get: p => p['Outras Ativ'].outrasDespesas1, set: (p, v) => (p['Outras Ativ'].outrasDespesas1 = v) });
  register({ sheet, cell: 'F82', type: 'number', get: p => p['Outras Ativ'].outrasDespesas2, set: (p, v) => (p['Outras Ativ'].outrasDespesas2 = v) });

  // Atividades Econômicas (linhas 93 a 102, 10 itens)
  for (let i = 0; i < 10; i++) {
    const row = 93 + i;
    const idx = i;
    register({ sheet, cell: `E${row}`, type: 'text', get: p => p['Outras Ativ'].atividadesEconomicas[idx], set: (p, v) => (p['Outras Ativ'].atividadesEconomicas[idx] = v) });
  }
}

// ----------------------------------------------------------------------------
// 4. ABA: Ativ. Pecuária (sheet21.xml)
// ----------------------------------------------------------------------------
function buildAtivPecuariaMappings(): void {
  const sheet: SheetName = 'Ativ. Pecuária';

  // Seleção de Raças (linhas 7 a 10, colunas L:O mescladas)
  ['L', 'M', 'N', 'O'].forEach((col, i) => {
    register({ sheet, cell: `${col}7`, type: 'text', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].leite.racaAtividade, set: (p, v) => (p['Ativ. Pecuária'].leite.racaAtividade = v) });
    register({ sheet, cell: `${col}8`, type: 'text', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].corte.racaAtividade, set: (p, v) => (p['Ativ. Pecuária'].corte.racaAtividade = v) });
    register({ sheet, cell: `${col}9`, type: 'text', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].ovinos.racaAtividade, set: (p, v) => (p['Ativ. Pecuária'].ovinos.racaAtividade = v) });
    register({ sheet, cell: `${col}10`, type: 'text', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].caprinos.racaAtividade, set: (p, v) => (p['Ativ. Pecuária'].caprinos.racaAtividade = v) });
  });

  // Matrizes Estabilização (colunas Q:R mescladas)
  ['Q', 'R'].forEach((col, i) => {
    register({ sheet, cell: `${col}33`, type: 'integer', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].leite.matrizesEstabilizacaoCab, set: (p, v) => (p['Ativ. Pecuária'].leite.matrizesEstabilizacaoCab = v) });
    register({ sheet, cell: `${col}50`, type: 'integer', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].corte.matrizesEstabilizacaoCab, set: (p, v) => (p['Ativ. Pecuária'].corte.matrizesEstabilizacaoCab = v) });
    register({ sheet, cell: `${col}65`, type: 'integer', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].ovinos.matrizesEstabilizacaoCab, set: (p, v) => (p['Ativ. Pecuária'].ovinos.matrizesEstabilizacaoCab = v) });
    register({ sheet, cell: `${col}81`, type: 'integer', isSecondaryMerged: i > 0, get: p => p['Ativ. Pecuária'].caprinos.matrizesEstabilizacaoCab, set: (p, v) => (p['Ativ. Pecuária'].caprinos.matrizesEstabilizacaoCab = v) });
  });

  // Grade de Categorias Bovino de Leite (linhas 18 a 25, 8 categorias)
  for (let i = 0; i < 8; i++) {
    const row = 18 + i;
    const idx = i;
    register({ sheet, cell: `S${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.quantidadeAtual, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].quantidadeAtual = v; } });
    register({ sheet, cell: `T${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.aAdquirir, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].aAdquirir = v; } });
    register({ sheet, cell: `U${row}`, type: 'number', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.equivalenciaUa, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].equivalenciaUa = v; } });
    register({ sheet, cell: `V${row}`, type: 'number', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.descartePercentAno1, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].descartePercentAno1 = v; } });
    register({ sheet, cell: `W${row}`, type: 'number', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.descartePercentDemais, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].descartePercentDemais = v; } });
    register({ sheet, cell: `X${row}`, type: 'number', get: p => p['Ativ. Pecuária'].leite.categorias[idx]?.precoUnitarioVenda, set: (p, v) => { if (p['Ativ. Pecuária'].leite.categorias[idx]) p['Ativ. Pecuária'].leite.categorias[idx].precoUnitarioVenda = v; } });
  }

  // Grade de Categorias Bovino de Corte (linhas 39 a 46, 8 categorias; linha 46 contém valores padrão no CSV)
  for (let i = 0; i < 8; i++) {
    const row = 39 + i;
    const idx = i;
    register({ sheet, cell: `S${row}`, type: 'integer', defaultVal: row === 46 ? 6 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.quantidadeAtual, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].quantidadeAtual = v; } });
    register({ sheet, cell: `T${row}`, type: 'integer', defaultVal: row === 46 ? 10 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.aAdquirir, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].aAdquirir = v; } });
    register({ sheet, cell: `U${row}`, type: 'number', defaultVal: row === 46 ? 30 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.equivalenciaUa, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].equivalenciaUa = v; } });
    register({ sheet, cell: `V${row}`, type: 'number', defaultVal: row === 46 ? 15 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.descartePercentAno1, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].descartePercentAno1 = v; } });
    register({ sheet, cell: `W${row}`, type: 'number', defaultVal: row === 46 ? 1.2 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.descartePercentDemais, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].descartePercentDemais = v; } });
    register({ sheet, cell: `X${row}`, type: 'number', defaultVal: row === 46 ? 2 : undefined, get: p => p['Ativ. Pecuária'].corte.categorias[idx]?.precoUnitarioVenda, set: (p, v) => { if (p['Ativ. Pecuária'].corte.categorias[idx]) p['Ativ. Pecuária'].corte.categorias[idx].precoUnitarioVenda = v; } });
  }

  // Grade de Categorias Ovinos (linhas 56 a 61, 6 categorias)
  for (let i = 0; i < 6; i++) {
    const row = 56 + i;
    const idx = i;
    register({ sheet, cell: `S${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.quantidadeAtual, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].quantidadeAtual = v; } });
    register({ sheet, cell: `T${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.aAdquirir, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].aAdquirir = v; } });
    register({ sheet, cell: `U${row}`, type: 'number', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.equivalenciaUa, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].equivalenciaUa = v; } });
    register({ sheet, cell: `V${row}`, type: 'number', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.descartePercentAno1, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].descartePercentAno1 = v; } });
    register({ sheet, cell: `W${row}`, type: 'number', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.descartePercentDemais, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].descartePercentDemais = v; } });
    register({ sheet, cell: `X${row}`, type: 'number', get: p => p['Ativ. Pecuária'].ovinos.categorias[idx]?.precoUnitarioVenda, set: (p, v) => { if (p['Ativ. Pecuária'].ovinos.categorias[idx]) p['Ativ. Pecuária'].ovinos.categorias[idx].precoUnitarioVenda = v; } });
  }

  // Grade de Categorias Caprinos (linhas 72 a 77, 6 categorias)
  for (let i = 0; i < 6; i++) {
    const row = 72 + i;
    const idx = i;
    register({ sheet, cell: `S${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.quantidadeAtual, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].quantidadeAtual = v; } });
    register({ sheet, cell: `T${row}`, type: 'integer', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.aAdquirir, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].aAdquirir = v; } });
    register({ sheet, cell: `U${row}`, type: 'number', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.equivalenciaUa, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].equivalenciaUa = v; } });
    register({ sheet, cell: `V${row}`, type: 'number', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.descartePercentAno1, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].descartePercentAno1 = v; } });
    register({ sheet, cell: `W${row}`, type: 'number', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.descartePercentDemais, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].descartePercentDemais = v; } });
    register({ sheet, cell: `X${row}`, type: 'number', get: p => p['Ativ. Pecuária'].caprinos.categorias[idx]?.precoUnitarioVenda, set: (p, v) => { if (p['Ativ. Pecuária'].caprinos.categorias[idx]) p['Ativ. Pecuária'].caprinos.categorias[idx].precoUnitarioVenda = v; } });
  }

  // Indicadores Bovino Leite
  register({ sheet, cell: 'Q27', type: 'number', get: p => p['Ativ. Pecuária'].leite.leiteCabDiaLitros, set: (p, v) => (p['Ativ. Pecuária'].leite.leiteCabDiaLitros = v) });
  register({ sheet, cell: 'Q28', type: 'number', get: p => p['Ativ. Pecuária'].leite.leiteQueijoLitrosKg, set: (p, v) => (p['Ativ. Pecuária'].leite.leiteQueijoLitrosKg = v) });
  register({ sheet, cell: 'Q29', type: 'number', get: p => p['Ativ. Pecuária'].leite.mortalidadeAte1AnoPercent, set: (p, v) => (p['Ativ. Pecuária'].leite.mortalidadeAte1AnoPercent = v) });
  register({ sheet, cell: 'Q30', type: 'number', get: p => p['Ativ. Pecuária'].leite.vendaQueijoPercent, set: (p, v) => (p['Ativ. Pecuária'].leite.vendaQueijoPercent = v) });
  register({ sheet, cell: 'Q31', type: 'number', get: p => p['Ativ. Pecuária'].leite.precoQueijoKg, set: (p, v) => (p['Ativ. Pecuária'].leite.precoQueijoKg = v) });
  register({ sheet, cell: 'Q32', type: 'number', get: p => p['Ativ. Pecuária'].leite.precoLeiteLitro, set: (p, v) => (p['Ativ. Pecuária'].leite.precoLeiteLitro = v) });

  // Indicadores Bovino Corte
  register({ sheet, cell: 'Q48', type: 'number', get: p => p['Ativ. Pecuária'].corte.mortalidadeAdultoPercent, set: (p, v) => (p['Ativ. Pecuária'].corte.mortalidadeAdultoPercent = v) });
  register({ sheet, cell: 'Q49', type: 'number', get: p => p['Ativ. Pecuária'].corte.matrizesPorReprodutor, set: (p, v) => (p['Ativ. Pecuária'].corte.matrizesPorReprodutor = v) });

  // Indicadores Ovinos
  register({ sheet, cell: 'Q63', type: 'number', get: p => p['Ativ. Pecuária'].ovinos.mortalidadeAdultoPercent, set: (p, v) => (p['Ativ. Pecuária'].ovinos.mortalidadeAdultoPercent = v) });
  register({ sheet, cell: 'Q64', type: 'number', get: p => p['Ativ. Pecuária'].ovinos.matrizesPorReprodutor, set: (p, v) => (p['Ativ. Pecuária'].ovinos.matrizesPorReprodutor = v) });
  register({ sheet, cell: 'Q66', type: 'number', get: p => p['Ativ. Pecuária'].ovinos.mortalidade1a2AnosPercent, set: (p, v) => (p['Ativ. Pecuária'].ovinos.mortalidade1a2AnosPercent = v) });

  // Indicadores Caprinos
  register({ sheet, cell: 'Q79', type: 'number', get: p => p['Ativ. Pecuária'].caprinos.mortalidadeAdultoPercent, set: (p, v) => (p['Ativ. Pecuária'].caprinos.mortalidadeAdultoPercent = v) });
  register({ sheet, cell: 'Q80', type: 'number', get: p => p['Ativ. Pecuária'].caprinos.matrizesPorReprodutor, set: (p, v) => (p['Ativ. Pecuária'].caprinos.matrizesPorReprodutor = v) });
  register({ sheet, cell: 'Q82', type: 'number', get: p => p['Ativ. Pecuária'].caprinos.mortalidade1a2AnosPercent, set: (p, v) => (p['Ativ. Pecuária'].caprinos.mortalidade1a2AnosPercent = v) });

  // Custos e Salário Mínimo
  register({ sheet, cell: 'Q85', type: 'number', defaultVal: 1412, get: p => p['Ativ. Pecuária'].salarioMinimoReferencia, set: (p, v) => (p['Ativ. Pecuária'].salarioMinimoReferencia = v) });
  register({ sheet, cell: 'Q87', type: 'number', get: p => p['Ativ. Pecuária'].leite.custos.vacinasMedicamentosSaisMineraisCabecaAno, set: (p, v) => (p['Ativ. Pecuária'].leite.custos.vacinasMedicamentosSaisMineraisCabecaAno = v) });
  register({ sheet, cell: 'Q88', type: 'number', get: p => p['Ativ. Pecuária'].leite.custos.operarioCabecaAno, set: (p, v) => (p['Ativ. Pecuária'].leite.custos.operarioCabecaAno = v) });
}

// ----------------------------------------------------------------------------
// 5. ABA: Cronograma (sheet17.xml)
// ----------------------------------------------------------------------------
function buildCronogramaMappings(): void {
  const sheet: SheetName = 'Cronograma';

  // Inversões: 38 itens em blocos de 3 linhas (linhas 15 a 126: 15, 18, 21...) + extra linha 129
  const parcelasCols = ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q']; // 8 parcelas
  for (let i = 0; i < 38; i++) {
    const baseRow = 15 + i * 3;
    const dateRow = baseRow;
    const percRow = baseRow + 1;
    const invIdx = i;

    parcelasCols.forEach((col, pIdx) => {
      register({
        sheet,
        cell: `${col}${dateRow}`,
        type: 'text',
        get: p => p.Cronograma.inversoesParcelas[invIdx]?.parcelas[pIdx]?.mesAno,
        set: (p, v) => {
          const inv = p.Cronograma.inversoesParcelas[invIdx];
          if (inv?.parcelas[pIdx]) inv.parcelas[pIdx].mesAno = v;
        }
      });
      register({
        sheet,
        cell: `${col}${percRow}`,
        type: 'number',
        get: p => p.Cronograma.inversoesParcelas[invIdx]?.parcelas[pIdx]?.percentual,
        set: (p, v) => {
          const inv = p.Cronograma.inversoesParcelas[invIdx];
          if (inv?.parcelas[pIdx]) inv.parcelas[pIdx].percentual = v;
        }
      });
    });
  }

  // Extra inversão linha 129
  parcelasCols.forEach((col, pIdx) => {
    register({
      sheet,
      cell: `${col}129`,
      type: 'text',
      get: p => p.Cronograma.inversoesParcelas[38]?.parcelas[pIdx]?.mesAno,
      set: (p, v) => {
        const inv = p.Cronograma.inversoesParcelas[38];
        if (inv?.parcelas[pIdx]) inv.parcelas[pIdx].mesAno = v;
      }
    });
  });
  register({
    sheet,
    cell: 'P130',
    type: 'number',
    get: p => p.Cronograma.inversoesParcelas[38]?.parcelas[6]?.percentual,
    set: (p, v) => {
      const inv = p.Cronograma.inversoesParcelas[38];
      if (inv?.parcelas[6]) inv.parcelas[6].percentual = v;
    }
  });

  // Aplicação de Recursos (linhas 202 a 240, 39 itens)
  for (let i = 0; i < 39; i++) {
    const row = 202 + i;
    const idx = i;
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p.Cronograma.aplicacaoRecursos[idx]?.valor, set: (p, v) => { if (p.Cronograma.aplicacaoRecursos[idx]) p.Cronograma.aplicacaoRecursos[idx].valor = v; } });

    // Empreendimento: J202:M240 mesclado
    ['J', 'K', 'L', 'M'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Cronograma.aplicacaoRecursos[idx]?.empreendimento,
        set: (p, v) => { if (p.Cronograma.aplicacaoRecursos[idx]) p.Cronograma.aplicacaoRecursos[idx].empreendimento = v; }
      });
    });

    // Aplicação dos Recursos: P202:Q240 mesclado
    ['P', 'Q'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Cronograma.aplicacaoRecursos[idx]?.aplicacaoRecursos,
        set: (p, v) => { if (p.Cronograma.aplicacaoRecursos[idx]) p.Cronograma.aplicacaoRecursos[idx].aplicacaoRecursos = v; }
      });
    });
  }

  // Finalidade do Crédito (linhas 243 a 281, 39 itens)
  for (let i = 0; i < 39; i++) {
    const row = 243 + i;
    const idx = i;

    // Finalidade do Crédito: G243:K281 mesclado
    ['G', 'H', 'I', 'J', 'K'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Cronograma.finalidadesRecursos[idx]?.finalidadeCredito,
        set: (p, v) => { if (p.Cronograma.finalidadesRecursos[idx]) p.Cronograma.finalidadesRecursos[idx].finalidadeCredito = v; }
      });
    });

    // Código MDA: L243..L281
    register({ sheet, cell: `L${row}`, type: 'text', get: p => p.Cronograma.finalidadesRecursos[idx]?.codigoMda, set: (p, v) => { if (p.Cronograma.finalidadesRecursos[idx]) p.Cronograma.finalidadesRecursos[idx].codigoMda = v; } });

    // CFI do BNDES: M243:N281 mesclado
    ['M', 'N'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Cronograma.finalidadesRecursos[idx]?.cfiBndes,
        set: (p, v) => { if (p.Cronograma.finalidadesRecursos[idx]) p.Cronograma.finalidadesRecursos[idx].cfiBndes = v; }
      });
    });
  }
}

// ----------------------------------------------------------------------------
// 6. ABA: Proposta (sheet15.xml - ATENÇÃO: nome com espaço " Proposta")
// ----------------------------------------------------------------------------
function buildPropostaMappings(): void {
  const sheet: SheetName = ' Proposta';

  // Cabeçalho (linhas 5 a 15)
  ['E', 'F'].forEach((col, i) => {
    register({ sheet, cell: `${col}5`, type: 'date', isSecondaryMerged: i > 0, get: p => p[' Proposta'].dataProposta, set: (p, v) => (p[' Proposta'].dataProposta = v) });
  });
  ['J', 'K'].forEach((col, i) => {
    register({ sheet, cell: `${col}5`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].objetivoCredito, set: (p, v) => (p[' Proposta'].objetivoCredito = v) });
  });

  ['E', 'F', 'G', 'H', 'I', 'J'].forEach((col, i) => {
    register({ sheet, cell: `${col}6`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].programa, set: (p, v) => (p[' Proposta'].programa = v) });
    register({ sheet, cell: `${col}7`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].agencia, set: (p, v) => (p[' Proposta'].agencia = v) });
    register({ sheet, cell: `${col}8`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].regiao, set: (p, v) => (p[' Proposta'].regiao = v) });
    register({ sheet, cell: `${col}9`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].atividadePrincipal, set: (p, v) => (p[' Proposta'].atividadePrincipal = v) });
  });

  ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((col, i) => {
    register({ sheet, cell: `${col}10`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].finalidadeCredito, set: (p, v) => (p[' Proposta'].finalidadeCredito = v) });
  });

  register({ sheet, cell: 'P9', type: 'text', get: p => p[' Proposta'].municipioDecretoEmergencia, set: (p, v) => (p[' Proposta'].municipioDecretoEmergencia = v) });
  register({ sheet, cell: 'P12', type: 'text', get: p => p[' Proposta'].producaoAgroecologica, set: (p, v) => (p[' Proposta'].producaoAgroecologica = v) });
  register({ sheet, cell: 'P13', type: 'text', get: p => p[' Proposta'].propostaOrigemPlanosAcao, set: (p, v) => (p[' Proposta'].propostaOrigemPlanosAcao = v) });

  register({ sheet, cell: 'E12', type: 'text', get: p => p[' Proposta'].empresaElaboradora, set: (p, v) => (p[' Proposta'].empresaElaboradora = v) });
  register({ sheet, cell: 'E13', type: 'text', get: p => p[' Proposta'].cnpjEmpresaElaboradora, set: (p, v) => (p[' Proposta'].cnpjEmpresaElaboradora = v) });
  register({ sheet, cell: 'E14', type: 'text', get: p => p[' Proposta'].elaborador, set: (p, v) => (p[' Proposta'].elaborador = v) });
  register({ sheet, cell: 'E15', type: 'text', get: p => p[' Proposta'].cpfElaborador, set: (p, v) => (p[' Proposta'].cpfElaborador = v) });

  // Imóvel das Inversões (linha 22)
  register({ sheet, cell: 'D22', type: 'text', get: p => p[' Proposta'].imovelDenominacao, set: (p, v) => (p[' Proposta'].imovelDenominacao = v) });
  ['H', 'I', 'J', 'K', 'L'].forEach((col, i) => {
    register({ sheet, cell: `${col}22`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].imovelMunicipio, set: (p, v) => (p[' Proposta'].imovelMunicipio = v) });
  });
  register({ sheet, cell: 'M22', type: 'text', get: p => p[' Proposta'].imovelRegiao, set: (p, v) => (p[' Proposta'].imovelRegiao = v) });
  register({ sheet, cell: 'O22', type: 'text', get: p => p[' Proposta'].imovelNum, set: (p, v) => (p[' Proposta'].imovelNum = v) });

  // Programa de Investimentos (linhas 27 a 62, 36 itens)
  for (let i = 0; i < 36; i++) {
    const row = 27 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p[' Proposta'].itensInvestimento[idx]?.discriminacao, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].discriminacao = v; } });
    register({ sheet, cell: `E${row}`, type: 'text', get: p => p[' Proposta'].itensInvestimento[idx]?.compoeGarantia, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].compoeGarantia = v; } });
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p[' Proposta'].itensInvestimento[idx]?.quantidade, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].quantidade = v; } });
    register({ sheet, cell: `G${row}`, type: 'text', get: p => p[' Proposta'].itensInvestimento[idx]?.unidade, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].unidade = v; } });
    register({ sheet, cell: `H${row}`, type: 'text', get: p => p[' Proposta'].itensInvestimento[idx]?.uso, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].uso = v; } });
    register({ sheet, cell: `I${row}`, type: 'text', get: p => p[' Proposta'].itensInvestimento[idx]?.numImovel, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].numImovel = v; } });
    register({ sheet, cell: `J${row}`, type: 'number', get: p => p[' Proposta'].itensInvestimento[idx]?.valorUnitario, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].valorUnitario = v; } });
    register({ sheet, cell: `K${row}`, type: 'number', isSecondaryMerged: true, get: p => p[' Proposta'].itensInvestimento[idx]?.valorUnitario, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].valorUnitario = v; } });
    register({ sheet, cell: `L${row}`, type: 'number', get: p => p[' Proposta'].itensInvestimento[idx]?.recursosPropriosUnit, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].recursosPropriosUnit = v; } });
    register({ sheet, cell: `M${row}`, type: 'number', isSecondaryMerged: true, get: p => p[' Proposta'].itensInvestimento[idx]?.recursosPropriosTotal, set: (p, v) => { if (p[' Proposta'].itensInvestimento[idx]) p[' Proposta'].itensInvestimento[idx].recursosPropriosTotal = v; } });
  }

  // Custeios Vinculados e Assessoria
  ['J', 'K'].forEach((col, i) => {
    register({ sheet, cell: `${col}64`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].custeioAgricolaValorUnit, set: (p, v) => (p[' Proposta'].custeioAgricolaValorUnit = v) });
    register({ sheet, cell: `${col}65`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].custeioPecuarioValorUnit, set: (p, v) => (p[' Proposta'].custeioPecuarioValorUnit = v) });
  });
  ['L', 'M'].forEach((col, i) => {
    register({ sheet, cell: `${col}64`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].custeioAgricolaRecursosProprios, set: (p, v) => (p[' Proposta'].custeioAgricolaRecursosProprios = v) });
    register({ sheet, cell: `${col}65`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].custeioPecuarioRecursosProprios, set: (p, v) => (p[' Proposta'].custeioPecuarioRecursosProprios = v) });
  });
  ['H', 'I'].forEach((col, i) => {
    register({ sheet, cell: `${col}69`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].assessoriaEmpresarialValor, set: (p, v) => (p[' Proposta'].assessoriaEmpresarialValor = v) });
  });
  ['L', 'M'].forEach((col, i) => {
    register({ sheet, cell: `${col}69`, type: 'number', isSecondaryMerged: i > 0, get: p => p[' Proposta'].assessoriaEmpresarialRecursosProprios, set: (p, v) => (p[' Proposta'].assessoriaEmpresarialRecursosProprios = v) });
  });

  // Bases do Financiamento (linhas 75..79)
  register({ sheet, cell: 'D75', type: 'integer', get: p => p[' Proposta'].prazoMeses, set: (p, v) => (p[' Proposta'].prazoMeses = v) });
  register({ sheet, cell: 'D76', type: 'integer', get: p => p[' Proposta'].carenciaMeses, set: (p, v) => (p[' Proposta'].carenciaMeses = v) });
  register({ sheet, cell: 'D77', type: 'number', defaultVal: 4, get: p => p[' Proposta'].jurosPercentAa, set: (p, v) => (p[' Proposta'].jurosPercentAa = v) });
  register({ sheet, cell: 'D78', type: 'number', get: p => p[' Proposta'].rebatePercentAa, set: (p, v) => (p[' Proposta'].rebatePercentAa = v) });
  register({ sheet, cell: 'D79', type: 'number', get: p => p[' Proposta'].delCrederePercentAa, set: (p, v) => (p[' Proposta'].delCrederePercentAa = v) });

  // Cronograma de Parcelas na Proposta (linhas 84 a 124, 41 itens)
  for (let i = 0; i < 41; i++) {
    const row = 84 + i;
    const idx = i;
    register({ sheet, cell: `G${row}`, type: 'date', get: p => p[' Proposta'].cronogramaParcelas?.[idx]?.parcela1Data, set: (p, v) => { if (p[' Proposta'].cronogramaParcelas?.[idx]) p[' Proposta'].cronogramaParcelas[idx].parcela1Data = v; } });
    register({ sheet, cell: `J${row}`, type: 'date', get: p => p[' Proposta'].cronogramaParcelas?.[idx]?.parcela2Data, set: (p, v) => { if (p[' Proposta'].cronogramaParcelas?.[idx]) p[' Proposta'].cronogramaParcelas[idx].parcela2Data = v; } });
    register({ sheet, cell: `M${row}`, type: 'date', get: p => p[' Proposta'].cronogramaParcelas?.[idx]?.parcela3Data, set: (p, v) => { if (p[' Proposta'].cronogramaParcelas?.[idx]) p[' Proposta'].cronogramaParcelas[idx].parcela3Data = v; } });
    register({ sheet, cell: `P${row}`, type: 'date', get: p => p[' Proposta'].cronogramaParcelas?.[idx]?.parcela4Data, set: (p, v) => { if (p[' Proposta'].cronogramaParcelas?.[idx]) p[' Proposta'].cronogramaParcelas[idx].parcela4Data = v; } });
  }
  register({ sheet, cell: 'M125', type: 'text', get: p => p[' Proposta'].cronogramaExtraM125, set: (p, v) => (p[' Proposta'].cronogramaExtraM125 = v) });

  // Financiamentos Existentes (linhas 129 a 133, 5 itens)
  for (let i = 0; i < 5; i++) {
    const row = 129 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p[' Proposta'].financiamentosExistentes[idx]?.discriminacao, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].discriminacao = v; } });
    register({ sheet, cell: `F${row}`, type: 'text', get: p => p[' Proposta'].financiamentosExistentes[idx]?.agenteFinanc, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].agenteFinanc = v; } });
    register({ sheet, cell: `G${row}`, type: 'number', get: p => p[' Proposta'].financiamentosExistentes[idx]?.saldoDevedor, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].saldoDevedor = v; } });
    register({ sheet, cell: `I${row}`, type: 'text', get: p => p[' Proposta'].financiamentosExistentes[idx]?.mesmaAtivConjuge, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].mesmaAtivConjuge = v; } });
    register({ sheet, cell: `J${row}`, type: 'text', get: p => p[' Proposta'].financiamentosExistentes[idx]?.pertenceTitular, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].pertenceTitular = v; } });
    register({ sheet, cell: `K${row}`, type: 'number', get: p => p[' Proposta'].financiamentosExistentes[idx]?.jurosPercentAa, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].jurosPercentAa = v; } });
    register({ sheet, cell: `L${row}`, type: 'integer', get: p => p[' Proposta'].financiamentosExistentes[idx]?.carenciaMeses, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].carenciaMeses = v; } });
    register({ sheet, cell: `N${row}`, type: 'integer', get: p => p[' Proposta'].financiamentosExistentes[idx]?.prazoRestanteMeses, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].prazoRestanteMeses = v; } });
    register({ sheet, cell: `O${row}`, type: 'date', get: p => p[' Proposta'].financiamentosExistentes[idx]?.dataContratacao, set: (p, v) => { if (p[' Proposta'].financiamentosExistentes[idx]) p[' Proposta'].financiamentosExistentes[idx].dataContratacao = v; } });
  }

  // Garantias Fidejussórias (linhas 137 e 139)
  const fidejussoriaRows = [137, 139];
  fidejussoriaRows.forEach((row, idx) => {
    ['E', 'F'].forEach((col, i) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].garantiasFidejussorias[idx]?.cpf, set: (p, v) => { if (p[' Proposta'].garantiasFidejussorias[idx]) p[' Proposta'].garantiasFidejussorias[idx].cpf = v; } });
    });
    ['H', 'I'].forEach((col, i) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].garantiasFidejussorias[idx]?.cnpj, set: (p, v) => { if (p[' Proposta'].garantiasFidejussorias[idx]) p[' Proposta'].garantiasFidejussorias[idx].cnpj = v; } });
    });
    ['M', 'N', 'O', 'P'].forEach((col, i) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: i > 0, get: p => p[' Proposta'].garantiasFidejussorias[idx]?.cpfConjuge, set: (p, v) => { if (p[' Proposta'].garantiasFidejussorias[idx]) p[' Proposta'].garantiasFidejussorias[idx].cpfConjuge = v; } });
    });
  });

  // Outras Garantias (linhas 142 a 144)
  for (let i = 0; i < 3; i++) {
    const row = 142 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p[' Proposta'].outrasGarantias[idx]?.denominacao, set: (p, v) => { if (p[' Proposta'].outrasGarantias[idx]) p[' Proposta'].outrasGarantias[idx].denominacao = v; } });
    register({ sheet, cell: `J${row}`, type: 'text', get: p => p[' Proposta'].outrasGarantias[idx]?.tipo, set: (p, v) => { if (p[' Proposta'].outrasGarantias[idx]) p[' Proposta'].outrasGarantias[idx].tipo = v; } });
    register({ sheet, cell: `N${row}`, type: 'number', get: p => p[' Proposta'].outrasGarantias[idx]?.valor, set: (p, v) => { if (p[' Proposta'].outrasGarantias[idx]) p[' Proposta'].outrasGarantias[idx].valor = v; } });
  }

  // Indicadores de Emprego (linha 155)
  register({ sheet, cell: 'D155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAtual, set: (p, v) => (p[' Proposta'].nrEmpregadosAtual = v) });
  register({ sheet, cell: 'E155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAno1, set: (p, v) => (p[' Proposta'].nrEmpregadosAno1 = v) });
  register({ sheet, cell: 'F155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAno2, set: (p, v) => (p[' Proposta'].nrEmpregadosAno2 = v) });
  register({ sheet, cell: 'G155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAno3, set: (p, v) => (p[' Proposta'].nrEmpregadosAno3 = v) });
  register({ sheet, cell: 'H155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAno4, set: (p, v) => (p[' Proposta'].nrEmpregadosAno4 = v) });
  register({ sheet, cell: 'I155', type: 'integer', get: p => p[' Proposta'].nrEmpregadosAno5, set: (p, v) => (p[' Proposta'].nrEmpregadosAno5 = v) });

  // Comentários e Parecer Técnico
  register({ sheet, cell: 'Q157', type: 'text', get: p => p[' Proposta'].comentariosJustificativas, set: (p, v) => (p[' Proposta'].comentariosJustificativas = v) });
  register({ sheet, cell: 'Q159', type: 'text', get: p => p[' Proposta'].parecerTecnico, set: (p, v) => (p[' Proposta'].parecerTecnico = v) });

  // Operações de Crédito Declaradas (linhas 166 a 173, 8 itens)
  for (let i = 0; i < 8; i++) {
    const row = 166 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.bancoOuCooperativa, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].bancoOuCooperativa = v; } });
    register({ sheet, cell: `E${row}`, type: 'date', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.data, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].data = v; } });
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.valor, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].valor = v; } });
    register({ sheet, cell: `H${row}`, type: 'text', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.fonteRecursos, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].fonteRecursos = v; } });
    ['L', 'M'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p[' Proposta'].operacoesDeclaradas[idx]?.comBonus200, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].comBonus200 = v; } });
    });
    register({ sheet, cell: `N${row}`, type: 'text', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.bonus700, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].bonus700 = v; } });
    register({ sheet, cell: `P${row}`, type: 'number', get: p => p[' Proposta'].operacoesDeclaradas[idx]?.saldoDevedor, set: (p, v) => { if (p[' Proposta'].operacoesDeclaradas[idx]) p[' Proposta'].operacoesDeclaradas[idx].saldoDevedor = v; } });
  }

  // Ano da Declaração
  register({ sheet, cell: 'P185', type: 'integer', get: p => p[' Proposta'].anoDeclaracao, set: (p, v) => (p[' Proposta'].anoDeclaracao = v) });
}

// ----------------------------------------------------------------------------
// 7. ABA: Ativ. Agrícola (sheet20.xml)
// ----------------------------------------------------------------------------
function buildAtivAgricolaMappings(): void {
  const sheet: SheetName = 'Ativ. Agrícola';

  // Uso da Terra Agrícola (linhas 8 a 42, 35 itens)
  for (let i = 0; i < 35; i++) {
    const row = 8 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p['Ativ. Agrícola'].usoTerrasAgricola[idx]?.descricao, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasAgricola[idx]) p['Ativ. Agrícola'].usoTerrasAgricola[idx].descricao = v; } });
    register({ sheet, cell: `E${row}`, type: 'number', get: p => p['Ativ. Agrícola'].usoTerrasAgricola[idx]?.atualArea, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasAgricola[idx]) p['Ativ. Agrícola'].usoTerrasAgricola[idx].atualArea = v; } });
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p['Ativ. Agrícola'].usoTerrasAgricola[idx]?.atualUaHa, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasAgricola[idx]) p['Ativ. Agrícola'].usoTerrasAgricola[idx].atualUaHa = v; } });

    // Anos 1 a 30 (pares G:H, I:J, ... BM:BN)
    for (let ano = 1; ano <= 30; ano++) {
      const areaCol = numberToColLetter(5 + ano * 2); // 7='G'..65='BM'
      const uaCol = numberToColLetter(6 + ano * 2);   // 8='H'..66='BN'
      const anoIdx = ano - 1;
      register({
        sheet,
        cell: `${areaCol}${row}`,
        type: 'number',
        get: p => p['Ativ. Agrícola'].usoTerrasAgricola[idx]?.anos?.[anoIdx]?.area,
        set: (p, v) => {
          const item = p['Ativ. Agrícola'].usoTerrasAgricola[idx];
          if (item) {
            if (!item.anos) item.anos = [];
            if (!item.anos[anoIdx]) item.anos[anoIdx] = { ano, area: 0, uaHa: 0 };
            item.anos[anoIdx].area = v;
          }
        }
      });
      register({
        sheet,
        cell: `${uaCol}${row}`,
        type: 'number',
        get: p => p['Ativ. Agrícola'].usoTerrasAgricola[idx]?.anos?.[anoIdx]?.uaHa,
        set: (p, v) => {
          const item = p['Ativ. Agrícola'].usoTerrasAgricola[idx];
          if (item) {
            if (!item.anos) item.anos = [];
            if (!item.anos[anoIdx]) item.anos[anoIdx] = { ano, area: 0, uaHa: 0 };
            item.anos[anoIdx].uaHa = v;
          }
        }
      });
    }
  }

  // Uso da Terra Pecuária (linhas 44 a 78, 35 itens)
  for (let i = 0; i < 35; i++) {
    const row = 44 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p['Ativ. Agrícola'].usoTerrasPecuaria[idx]?.descricao, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasPecuaria[idx]) p['Ativ. Agrícola'].usoTerrasPecuaria[idx].descricao = v; } });
    register({ sheet, cell: `E${row}`, type: 'number', get: p => p['Ativ. Agrícola'].usoTerrasPecuaria[idx]?.atualArea, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasPecuaria[idx]) p['Ativ. Agrícola'].usoTerrasPecuaria[idx].atualArea = v; } });
    register({ sheet, cell: `F${row}`, type: 'number', get: p => p['Ativ. Agrícola'].usoTerrasPecuaria[idx]?.atualUaHa, set: (p, v) => { if (p['Ativ. Agrícola'].usoTerrasPecuaria[idx]) p['Ativ. Agrícola'].usoTerrasPecuaria[idx].atualUaHa = v; } });

    // Anos 1 a 30 (pares G:H, I:J, ... BM:BN)
    for (let ano = 1; ano <= 30; ano++) {
      const areaCol = numberToColLetter(5 + ano * 2);
      const uaCol = numberToColLetter(6 + ano * 2);
      const anoIdx = ano - 1;
      register({
        sheet,
        cell: `${areaCol}${row}`,
        type: 'number',
        get: p => p['Ativ. Agrícola'].usoTerrasPecuaria[idx]?.anos?.[anoIdx]?.area,
        set: (p, v) => {
          const item = p['Ativ. Agrícola'].usoTerrasPecuaria[idx];
          if (item) {
            if (!item.anos) item.anos = [];
            if (!item.anos[anoIdx]) item.anos[anoIdx] = { ano, area: 0, uaHa: 0 };
            item.anos[anoIdx].area = v;
          }
        }
      });
      register({
        sheet,
        cell: `${uaCol}${row}`,
        type: 'number',
        get: p => p['Ativ. Agrícola'].usoTerrasPecuaria[idx]?.anos?.[anoIdx]?.uaHa,
        set: (p, v) => {
          const item = p['Ativ. Agrícola'].usoTerrasPecuaria[idx];
          if (item) {
            if (!item.anos) item.anos = [];
            if (!item.anos[anoIdx]) item.anos[anoIdx] = { ano, area: 0, uaHa: 0 };
            item.anos[anoIdx].uaHa = v;
          }
        }
      });
    }
  }

  // Receitas Agrícolas (linhas 85 a 119, 35 itens)
  for (let i = 0; i < 35; i++) {
    const row = 85 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p['Ativ. Agrícola'].receitasAgricolas[idx]?.descricao, set: (p, v) => { if (p['Ativ. Agrícola'].receitasAgricolas[idx]) p['Ativ. Agrícola'].receitasAgricolas[idx].descricao = v; } });

    // Irrigação: E:F mesclado
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p['Ativ. Agrícola'].receitasAgricolas[idx]?.irrigacao, set: (p, v) => { if (p['Ativ. Agrícola'].receitasAgricolas[idx]) p['Ativ. Agrícola'].receitasAgricolas[idx].irrigacao = v; } });
    });

    // Unidade: G:H mesclado
    ['G', 'H'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p['Ativ. Agrícola'].receitasAgricolas[idx]?.unidade, set: (p, v) => { if (p['Ativ. Agrícola'].receitasAgricolas[idx]) p['Ativ. Agrícola'].receitasAgricolas[idx].unidade = v; } });
    });

    // Valor Unitário: I:J mesclado
    ['I', 'J'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p['Ativ. Agrícola'].receitasAgricolas[idx]?.valorUnitario, set: (p, v) => { if (p['Ativ. Agrícola'].receitasAgricolas[idx]) p['Ativ. Agrícola'].receitasAgricolas[idx].valorUnitario = v; } });
    });

    // Produtividade por Hectare: Anos 0 a 30 (colunas K a AO, 31 anos)
    for (let ano = 0; ano <= 30; ano++) {
      const col = numberToColLetter(11 + ano); // 11='K'..41='AO'
      const anoIdx = ano;
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'number',
        get: p => p['Ativ. Agrícola'].receitasAgricolas[idx]?.produtividadeAnos?.[anoIdx],
        set: (p, v) => {
          const item = p['Ativ. Agrícola'].receitasAgricolas[idx];
          if (item) {
            if (!item.produtividadeAnos) item.produtividadeAnos = [];
            item.produtividadeAnos[anoIdx] = v;
          }
        }
      });
    }
  }

  // Custos Agrícolas (linha 121)
  ['D', 'E'].forEach((col, cIdx) => {
    register({ sheet, cell: `${col}121`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p['Ativ. Agrícola'].utilizaCustoPadrao, set: (p, v) => (p['Ativ. Agrícola'].utilizaCustoPadrao = v) });
  });

  // Atividades Econômicas (linhas 166 a 200, 35 itens, colunas E:J mescladas)
  for (let i = 0; i < 35; i++) {
    const row = 166 + i;
    const idx = i;
    ['E', 'F', 'G', 'H', 'I', 'J'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p['Ativ. Agrícola'].atividadesEconomicas[idx],
        set: (p, v) => (p['Ativ. Agrícola'].atividadesEconomicas[idx] = v)
      });
    });
  }
}

// ----------------------------------------------------------------------------
// 8. ABA: Avaliação (sheet14.xml)
// ----------------------------------------------------------------------------
function buildAvaliacaoMappings(): void {
  const sheet: SheetName = 'Avaliação';

  // Imóveis Vinculados ao Plano (linhas 7, 8, 9, 3 imóveis)
  for (let i = 0; i < 3; i++) {
    const row = 7 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.denominacao, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].denominacao = v; } });
    register({ sheet, cell: `E${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.municipio, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].municipio = v; } });
    register({ sheet, cell: `H${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.tipoProprietario, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].tipoProprietario = v; } });
    register({ sheet, cell: `I${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.nomeProprietario, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].nomeProprietario = v; } });
    register({ sheet, cell: `J${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.cpfCnpjProprietario, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].cpfCnpjProprietario = v; } });
    register({ sheet, cell: `K${row}`, type: 'number', get: p => p.Avaliação.imoveis[idx]?.areaLegal, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].areaLegal = v; } });
    register({ sheet, cell: `L${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.realizaInversao, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].realizaInversao = v; } });
    register({ sheet, cell: `M${row}`, type: 'text', get: p => p.Avaliação.imoveis[idx]?.compoeGarantia, set: (p, v) => { if (p.Avaliação.imoveis[idx]) p.Avaliação.imoveis[idx].compoeGarantia = v; } });
  }

  // Detalhes por Imóvel (3 blocos de avaliação: Imóvel 1, 2, 3)
  // Cada imóvel tem: 12 linhas de Explor. Agrícola (10 de lista + 2 extras) e 12 de Explor. Pecuária,
  // depois Reserva Florestal / Inaproveitáveis / Ocupadas c/ Benfeitorias / Terra Nua e 20 linhas de Benfeitoria.
  // Imóvel 1: agricolaStart 17..28, pecuariaStart 29..40; reserva 41, inaprov 42, benfOcup 43, terraNua 46, benfStart 52
  // Imóvel 2: agricolaStart 77..88, pecuariaStart 89..100; reserva 101, inaprov 102, benfOcup 103, terraNua 106, benfStart 112
  // Imóvel 3: agricolaStart 137..148, pecuariaStart 149..160; reserva 161, inaprov 162, benfOcup 163, terraNua 166, benfStart 172
  // (CSV confirma: linhas 36,37 = extras agrícola im1; 96,97 = extras im2; 156,157 = extras im3)
  const imovelOffsets = [
    // imóvel 1: CSV confirma agricola linhas 17-28 (10 "lista" + 2 "extras"), pecuaria 29-40, terras 38-43, benf 49
    // Usando os offsets reais do CSV:
    { agricolaStart: 17, agricolaN: 12, pecuariaStart: 29, pecuariaN: 12,
      reservaRow: 38, inaprovRow: 39, benfOcupRow: 40, terraNuaRow: 43, benfStart: 49,
      hasExtraReservaCols: false },
    // imóvel 2: linhas 77-100, terras 98-103, benf 109
    { agricolaStart: 77, agricolaN: 12, pecuariaStart: 89, pecuariaN: 12,
      reservaRow: 98, inaprovRow: 99, benfOcupRow: 100, terraNuaRow: 103, benfStart: 109,
      hasExtraReservaCols: true },
    // imóvel 3: linhas 137-160, terras 158-163, benf 169
    { agricolaStart: 137, agricolaN: 12, pecuariaStart: 149, pecuariaN: 12,
      reservaRow: 158, inaprovRow: 159, benfOcupRow: 160, terraNuaRow: 163, benfStart: 169,
      hasExtraReservaCols: true },
  ];

  imovelOffsets.forEach((off, imovIdx) => {
    // Exploração Agrícola (12 linhas por imóvel)
    for (let i = 0; i < off.agricolaN; i++) {
      const row = off.agricolaStart + i;
      const idx = i;
      register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]?.descricao, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoAgricola[idx].descricao = v; } });
      ['E', 'F'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]?.areaHa, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoAgricola[idx].areaHa = v; } });
      });
      ['G', 'H', 'I'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]?.idadeMeses, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoAgricola[idx].idadeMeses = v; } });
      });
      ['J', 'K'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]?.valorUnitario, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoAgricola[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoAgricola[idx].valorUnitario = v; } });
      });
    }

    // Exploração Pecuária (12 linhas por imóvel)
    for (let i = 0; i < off.pecuariaN; i++) {
      const row = off.pecuariaStart + i;
      const idx = i;
      register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]?.descricao, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoPecuaria[idx].descricao = v; } });
      ['E', 'F'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]?.areaHa, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoPecuaria[idx].areaHa = v; } });
      });
      ['G', 'H', 'I'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]?.idadeMeses, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoPecuaria[idx].idadeMeses = v; } });
      });
      ['J', 'K'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]?.valorUnitario, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.exploracaoPecuaria[idx]) p.Avaliação.detalhesImoveis[imovIdx].exploracaoPecuaria[idx].valorUnitario = v; } });
      });
    }

    // Terras fixas: colunas E,F sempre; G-K presentes nos imóveis 2 e 3
    const reservaCols = off.hasExtraReservaCols ? ['E','F','G','H','I','J','K'] : ['E','F'];
    reservaCols.forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${off.reservaRow}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.reservaFlorestalArea, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]) p.Avaliação.detalhesImoveis[imovIdx].reservaFlorestalArea = v; } });
    });
    const inaprovCols = off.hasExtraReservaCols ? ['E','F','G','H','I','J','K'] : ['E','F'];
    inaprovCols.forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${off.inaprovRow}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.terrasInaproveitaveisArea, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]) p.Avaliação.detalhesImoveis[imovIdx].terrasInaproveitaveisArea = v; } });
    });
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${off.benfOcupRow}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.ocupadasBenfeitoriasArea, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]) p.Avaliação.detalhesImoveis[imovIdx].ocupadasBenfeitoriasArea = v; } });
    });
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${off.terraNuaRow}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.terraNuaArea, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]) p.Avaliação.detalhesImoveis[imovIdx].terraNuaArea = v; } });
    });
    ['J', 'K'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${off.terraNuaRow}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.terraNuaValorUnit, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]) p.Avaliação.detalhesImoveis[imovIdx].terraNuaValorUnit = v; } });
    });

    // Benfeitorias (20 linhas por imóvel)
    for (let i = 0; i < 20; i++) {
      const row = off.benfStart + i;
      const idx = i;
      register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]?.descricao, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]) p.Avaliação.detalhesImoveis[imovIdx].benfeitorias[idx].descricao = v; } });
      ['E', 'F'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]?.idadeAnos, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]) p.Avaliação.detalhesImoveis[imovIdx].benfeitorias[idx].idadeAnos = v; } });
      });
      ['G', 'H'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]?.valorReposicao, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]) p.Avaliação.detalhesImoveis[imovIdx].benfeitorias[idx].valorReposicao = v; } });
      });
      ['I', 'J'].forEach((col, cIdx) => {
        register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]?.estadoConservacao, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]) p.Avaliação.detalhesImoveis[imovIdx].benfeitorias[idx].estadoConservacao = v; } });
      });
      register({ sheet, cell: `K${row}`, type: 'number', get: p => p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]?.depreciacaoPercent, set: (p, v) => { if (p.Avaliação.detalhesImoveis[imovIdx]?.benfeitorias[idx]) p.Avaliação.detalhesImoveis[imovIdx].benfeitorias[idx].depreciacaoPercent = v; } });
    }
  });

  // Bens Comuns ao Plano:
  // Máquinas e Equipamentos (linhas 192 a 202, 11 itens)
  for (let i = 0; i < 11; i++) {
    const row = 192 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.maquinasEquipamentos[idx]?.descricao, set: (p, v) => { if (p.Avaliação.maquinasEquipamentos[idx]) p.Avaliação.maquinasEquipamentos[idx].descricao = v; } });
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.maquinasEquipamentos[idx]?.idadeAnos, set: (p, v) => { if (p.Avaliação.maquinasEquipamentos[idx]) p.Avaliação.maquinasEquipamentos[idx].idadeAnos = v; } });
    });
    ['G', 'H'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.maquinasEquipamentos[idx]?.valorReposicao, set: (p, v) => { if (p.Avaliação.maquinasEquipamentos[idx]) p.Avaliação.maquinasEquipamentos[idx].valorReposicao = v; } });
    });
    ['I', 'J'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.maquinasEquipamentos[idx]?.estadoConservacao, set: (p, v) => { if (p.Avaliação.maquinasEquipamentos[idx]) p.Avaliação.maquinasEquipamentos[idx].estadoConservacao = v; } });
    });
    register({ sheet, cell: `K${row}`, type: 'number', get: p => p.Avaliação.maquinasEquipamentos[idx]?.depreciacaoPercent, set: (p, v) => { if (p.Avaliação.maquinasEquipamentos[idx]) p.Avaliação.maquinasEquipamentos[idx].depreciacaoPercent = v; } });
  }

  // Veículos e Embarcações (linhas 205 a 216, 12 itens)
  // Nota: linhas 215 e 216 não têm colunas F e J no CSV (isSecondaryMerged cobre registro extra)
  for (let i = 0; i < 12; i++) {
    const row = 205 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.veiculosEmbarcacoes[idx]?.descricao, set: (p, v) => { if (p.Avaliação.veiculosEmbarcacoes[idx]) p.Avaliação.veiculosEmbarcacoes[idx].descricao = v; } });
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.veiculosEmbarcacoes[idx]?.idadeAnos, set: (p, v) => { if (p.Avaliação.veiculosEmbarcacoes[idx]) p.Avaliação.veiculosEmbarcacoes[idx].idadeAnos = v; } });
    });
    ['G', 'H'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.veiculosEmbarcacoes[idx]?.valorReposicao, set: (p, v) => { if (p.Avaliação.veiculosEmbarcacoes[idx]) p.Avaliação.veiculosEmbarcacoes[idx].valorReposicao = v; } });
    });
    ['I', 'J'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.veiculosEmbarcacoes[idx]?.estadoConservacao, set: (p, v) => { if (p.Avaliação.veiculosEmbarcacoes[idx]) p.Avaliação.veiculosEmbarcacoes[idx].estadoConservacao = v; } });
    });
    register({ sheet, cell: `K${row}`, type: 'number', get: p => p.Avaliação.veiculosEmbarcacoes[idx]?.depreciacaoPercent, set: (p, v) => { if (p.Avaliação.veiculosEmbarcacoes[idx]) p.Avaliação.veiculosEmbarcacoes[idx].depreciacaoPercent = v; } });
  }

  // Móveis e Utensílios (linhas 218 a 230, 13 itens)
  for (let i = 0; i < 13; i++) {
    const row = 218 + i;
    const idx = i;
    register({ sheet, cell: `D${row}`, type: 'text', get: p => p.Avaliação.moveisUtensilios[idx]?.descricao, set: (p, v) => { if (p.Avaliação.moveisUtensilios[idx]) p.Avaliação.moveisUtensilios[idx].descricao = v; } });
    ['E', 'F'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'integer', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.moveisUtensilios[idx]?.idadeAnos, set: (p, v) => { if (p.Avaliação.moveisUtensilios[idx]) p.Avaliação.moveisUtensilios[idx].idadeAnos = v; } });
    });
    ['G', 'H'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'number', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.moveisUtensilios[idx]?.valorReposicao, set: (p, v) => { if (p.Avaliação.moveisUtensilios[idx]) p.Avaliação.moveisUtensilios[idx].valorReposicao = v; } });
    });
    ['I', 'J'].forEach((col, cIdx) => {
      register({ sheet, cell: `${col}${row}`, type: 'text', isSecondaryMerged: cIdx > 0, get: p => p.Avaliação.moveisUtensilios[idx]?.estadoConservacao, set: (p, v) => { if (p.Avaliação.moveisUtensilios[idx]) p.Avaliação.moveisUtensilios[idx].estadoConservacao = v; } });
    });
    register({ sheet, cell: `K${row}`, type: 'number', get: p => p.Avaliação.moveisUtensilios[idx]?.depreciacaoPercent, set: (p, v) => { if (p.Avaliação.moveisUtensilios[idx]) p.Avaliação.moveisUtensilios[idx].depreciacaoPercent = v; } });
  }

  // Semoventes (linhas 245 a 289)
  // 245..252: Bovinos Leite (8)
  // 254..261: Bovinos Corte (8)
  // 263..268: Ovinos (6)
  // 270..275: Caprinos (6)
  // 277..289: Outros semoventes
  const semoventeRows: number[] = [];
  for (let r = 245; r <= 252; r++) semoventeRows.push(r);
  for (let r = 254; r <= 261; r++) semoventeRows.push(r);
  for (let r = 263; r <= 268; r++) semoventeRows.push(r);
  for (let r = 270; r <= 275; r++) semoventeRows.push(r);
  for (let r = 277; r <= 289; r++) semoventeRows.push(r);

  semoventeRows.forEach((row, i) => {
    const idx = i;
    ['E', 'F'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'integer',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Avaliação.semoventes[idx]?.quantidadeCabecas,
        set: (p, v) => {
          if (!p.Avaliação.semoventes[idx]) {
            p.Avaliação.semoventes[idx] = { especie: 'Outros', categoria: '', quantidadeCabecas: 0, racaMesticagem: '', valorUnitario: 0, valorTotal: 0 };
          }
          p.Avaliação.semoventes[idx].quantidadeCabecas = v;
        }
      });
    });
    ['G', 'H', 'I'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'text',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Avaliação.semoventes[idx]?.racaMesticagem,
        set: (p, v) => {
          if (!p.Avaliação.semoventes[idx]) {
            p.Avaliação.semoventes[idx] = { especie: 'Outros', categoria: '', quantidadeCabecas: 0, racaMesticagem: '', valorUnitario: 0, valorTotal: 0 };
          }
          p.Avaliação.semoventes[idx].racaMesticagem = v;
        }
      });
    });
    ['J', 'K'].forEach((col, cIdx) => {
      register({
        sheet,
        cell: `${col}${row}`,
        type: 'number',
        isSecondaryMerged: cIdx > 0,
        get: p => p.Avaliação.semoventes[idx]?.valorUnitario,
        set: (p, v) => {
          if (!p.Avaliação.semoventes[idx]) {
            p.Avaliação.semoventes[idx] = { especie: 'Outros', categoria: '', quantidadeCabecas: 0, racaMesticagem: '', valorUnitario: 0, valorTotal: 0 };
          }
          p.Avaliação.semoventes[idx].valorUnitario = v;
        }
      });
    });
  });

  // Informações Adicionais dos Imóveis (4 linhas de dados: 296..299 e 302..305; 294/295 são cabeçalhos)
  for (let i = 0; i < 4; i++) {
    const rowInfo = 296 + i;
    const rowComp = 302 + i;
    const idx = i;
    register({ sheet, cell: `E${rowInfo}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.nirf, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].nirf = v; } });
    register({ sheet, cell: `G${rowInfo}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.cei, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].cei = v; } });
    register({ sheet, cell: `I${rowInfo}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.sncr, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].sncr = v; } });
    register({ sheet, cell: `J${rowInfo}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.registroCar, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].registroCar = v; } });
    register({ sheet, cell: `P${rowInfo}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.numeroOutorgaAgua, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].numeroOutorgaAgua = v; } });
    register({ sheet, cell: `Q${rowInfo}`, type: 'number', get: p => p.Avaliação.informacoesAdicionais[idx]?.percentualPreservacaoAcimaLimite, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].percentualPreservacaoAcimaLimite = v; } });

    register({ sheet, cell: `E${rowComp}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.embargosIbama, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].embargosIbama = v; } });
    register({ sheet, cell: `G${rowComp}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.unidadesConservacao, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].unidadesConservacao = v; } });
    register({ sheet, cell: `I${rowComp}`, type: 'text', get: p => p.Avaliação.informacoesAdicionais[idx]?.florestasPublicasNaoDestinadas, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].florestasPublicasNaoDestinadas = v; } });
    register({ sheet, cell: `K${rowComp}`, type: 'number', get: p => p.Avaliação.informacoesAdicionais[idx]?.bonusCarPercent, set: (p, v) => { if (p.Avaliação.informacoesAdicionais[idx]) p.Avaliação.informacoesAdicionais[idx].bonusCarPercent = v; } });

    // Partes secundárias das células mescladas (E:F, G:H, J:K / E:F, G:H): validação aplicada
    // ao intervalo inteiro, mas só a célula superior esquerda recebe valor.
    const noop = () => undefined;
    const noset = () => { /* parte secundária de mesclagem */ };
    for (const c of ['F', 'H', 'K']) register({ sheet, cell: `${c}${rowInfo}`, type: 'text', isSecondaryMerged: true, get: noop, set: noset });
    for (const c of ['F', 'H']) register({ sheet, cell: `${c}${rowComp}`, type: 'text', isSecondaryMerged: true, get: noop, set: noset });
  }
}

// Inicializa todos os mapeamentos
buildClienteMappings();
buildCalculoFinanceiroMappings();
buildOutrasAtivMappings();
buildAtivPecuariaMappings();
buildCronogramaMappings();
buildPropostaMappings();
buildAtivAgricolaMappings();
buildAvaliacaoMappings();

// ============================================================================
// API PÚBLICA EXPORTADA
// ============================================================================

/**
 * Converte o projeto em lista de gravações para a exportação de .xlsm.
 * Ignora valores vazios ('' / null / undefined / NaN).
 * Números 0 que são default NÃO são gravados a menos que o CSV não tenha valor_padrao diferente de 0.
 */
export function projetoToCells(projeto: ProjetoA2): CellWrite[] {
  const writes: CellWrite[] = [];

  for (const entry of ENTRIES) {
    // Células secundárias de uma mesclagem não são gravadas individualmente;
    // o Excel armazena o valor na célula superior esquerda (primária).
    if (entry.isSecondaryMerged) continue;

    const val = entry.get(projeto);
    if (val === undefined || val === null || val === '') continue;

    if (typeof val === 'number') {
      if (Number.isNaN(val)) continue;
      // Regra de especificação:
      // Números 0 que são default NÃO devem ser gravados se o template/CSV já tiver
      // um valor_padrao diferente cadastrado. Se o padrão no CSV for diferente (ex: juros 4),
      // não sobrescrevemos com 0.
      if (val === 0 && entry.defaultVal !== undefined && entry.defaultVal !== 0) {
        continue;
      }
      writes.push({ sheet: entry.sheet, cell: entry.cell, value: val, type: entry.type });
    } else if (typeof val === 'string') {
      if (val.trim() === '') continue;
      writes.push({ sheet: entry.sheet, cell: entry.cell, value: val, type: entry.type });
    }
  }

  return writes;
}

/**
 * Reconstrói o projeto a partir de um leitor de células (para importação de .xlsm).
 * Começa de createInitialProjetoA2() e preenche o que o leitor retornar não-vazio.
 * Datas chegam como número serial do Excel em string: converte para dd/mm/aaaa.
 * Números: Number().
 */
export function cellsToProjeto(read: (sheet: SheetName, cell: string) => string): ProjetoA2 {
  const projeto: ProjetoA2 = createInitialProjetoA2();

  for (const entry of ENTRIES) {
    const raw = read(entry.sheet, entry.cell);
    if (raw === undefined || raw === null || raw === '') continue;

    if (entry.type === 'number' || entry.type === 'integer') {
      const num = Number(String(raw).replace(',', '.'));
      if (!Number.isNaN(num)) {
        entry.set(projeto, num);
      } else if (entry.type === 'integer' && typeof raw === 'string') {
        // Casos como Nº "S/N" no Cliente
        entry.set(projeto, raw);
      }
    } else if (entry.type === 'date') {
      const dateStr = serialToDateStr(raw);
      if (dateStr) {
        entry.set(projeto, dateStr);
      }
    } else {
      entry.set(projeto, raw);
    }
  }

  return projeto;
}

/**
 * Lista de TODAS as células de entrada mapeadas (para teste de cobertura).
 * Células duplicadas por mesclagem são deduplicadas por (sheet, cell).
 */
export function allMappedCells(): CellRef[] {
  const seen = new Set<string>();
  const result: CellRef[] = [];

  for (const entry of ENTRIES) {
    const key = `${entry.sheet}!${entry.cell}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ sheet: entry.sheet, cell: entry.cell, type: entry.type });
    }
  }

  return result;
}
