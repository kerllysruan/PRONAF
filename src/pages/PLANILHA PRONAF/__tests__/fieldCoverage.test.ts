import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  allMappedCells,
  projetoToCells,
  cellsToProjeto,
  colLetterToNumber,
  SheetName,
} from '../cellMapping';
import { createInitialProjetoA2, ProjetoA2 } from '../types';

/**
 * Parser de CSV compatível com RFC 4180 (aspas com vírgulas e aspas duplicadas).
 */
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && content[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentCell);
      currentCell = '';
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += ch;
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.length > 1 || currentRow[0] !== '') {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Regra de exclusão de colunas e células auxiliares que NÃO são entradas do usuário:
 * - Colunas >= Y (Y, Z, AA, AB, AC...) em abas onde representam fórmulas de crítica, parâmetros SEAP ou tabelas de apoio.
 *   (EXCEÇÃO: na aba "Ativ. Agrícola", as colunas Y a BN são colunas de projeção dos Anos 1 a 30, e na aba "CalculoFinanceiro", DD é o Bloco 2).
 * - Células marcadas com cabeçalho "Validações" ou "Parâmetros" (ex: Y12, X18, DX18).
 * - Coluna A em abas de dados (usada internamente pelo Excel/VBA para flags booleanas).
 * - Coluna B quando usada como contador fixo de linha (ex: Avaliação B7..B67).
 * - Células fixas de parâmetros/metadados do modelo.
 */
function isAuxiliaryCell(
  sheet: string,
  cell: string,
  col: string,
  _rotulo: string,
  cabecalho: string
): boolean {
  // 1. Marcações explícitas de validações ou parâmetros auxiliares
  if (cabecalho === 'Validações' || cabecalho === 'Parâmetros') return true;
  if (['Y12', 'X18', 'DX18'].includes(cell)) return true;

  // 2. Coluna A em abas de dados (flags de controle VBA)
  if (col === 'A') return true;

  // 3. Coluna B quando usada para numeração sequencial fixa (ex: Avaliação B7..B201, Ativ. Agrícola B9, B165)
  if (col === 'B' && (sheet === 'Avaliação' || sheet === 'Ativ. Agrícola')) return true;

  // 4. Colunas auxiliares de crítica e parâmetros SEAP à direita (colunas Y, Z, AA, AB, AC, AF, AK, etc.)
  if (sheet !== 'Ativ. Agrícola' && sheet !== 'CalculoFinanceiro') {
    const colNum = colLetterToNumber(col);
    if (colNum >= 25) return true; // 25 = Y
  }

  // 5. Células de metadados / constantes em Avaliação (imóveis e estrutura)
  if (
    sheet === 'Avaliação' &&
    ['O7', 'O8', 'O9', 'N10', 'O10', 'P10', 'S10', 'V10', 'Q13', 'Q14', 'P15', 'P38', 'P39', 'P40', 'P47', 'P48', 'P75'].includes(cell)
  ) {
    return true;
  }

  // 5b. Avaliação: rótulo de cabeçalho S6 ("Vr. Terra Nua")
  if (sheet === 'Avaliação' && cell === 'S6') return true;

  // 5c. Avaliação: células P* com constantes internas de índices de imóvel (imóveis 2 e 3) e semoventes
  //     P98-P100, P107-P108, P135 = constantes de índices/rótulos dos imóveis 2 e 3
  //     P158-P160, P167-P168      = constantes de índices/rótulos do imóvel 3
  //     P244-P275                 = constantes de categorias de semoventes (cd_cat_ani + números)
  if (sheet === 'Avaliação' && col === 'P') {
    const row = Number(cell.slice(1));
    if (
      (row >= 98 && row <= 100) ||
      (row >= 107 && row <= 108) ||
      row === 135 ||
      (row >= 158 && row <= 160) ||
      (row >= 167 && row <= 168) ||
      (row >= 244 && row <= 275)
    ) return true;
  }

  // 5d. Avaliação: Q244 (cd_rca — código interno de raça/categoria)
  if (sheet === 'Avaliação' && cell === 'Q244') return true;

  // 5e. Avaliação: T293 e U293 — valor_padrao é uma fórmula =SE(...) de validação SEAP
  if (sheet === 'Avaliação' && (cell === 'T293' || cell === 'U293')) return true;

  // 5f. Avaliação: linha 294 colunas P-V e linha 295 coluna V — rótulos de cabeçalho das Informações Adicionais
  //     (P294=Outorga, Q294=Preservação, R294=NIRF, S294=CEI, T294=SNCR, U294=CAR, V294=Bioma, V295=Bioma)
  if (sheet === 'Avaliação') {
    const row = Number(cell.replace(/^[A-Z]+/, ''));
    const colNum = colLetterToNumber(col);
    if (row === 294 && colNum >= 16 && colNum <= 22) return true; // P=16 a V=22
    if (row === 295 && col === 'V') return true;
  }

  // 6. Células de controle / constantes em Proposta
  if (
    (sheet === ' Proposta' || sheet === 'Proposta') &&
    ['Q4', 'Q5', 'Q10', 'Q69', 'Q179', 'R26', 'S26', 'R128', 'T128', 'R129', 'K136', 'K138'].includes(cell)
  ) {
    return true;
  }
  // Proposta: rótulos fixos e constantes internas (não são entradas do usuário)
  //   D69 = "Custo de Assessoria Empresarial e Técnica" (rótulo)
  //   D71 = "1", H71 = "1" (constantes de linha única de assessoria)
  //   G137 = "CNPJ:", K137 = "C.P.F.:", G139 = "CNPJ:", K139 = "C.P.F.:" (rótulos de campos)
  if (
    (sheet === ' Proposta' || sheet === 'Proposta') &&
    ['D69', 'D71', 'H71', 'G137', 'K137', 'G139', 'K139'].includes(cell)
  ) {
    return true;
  }
  // Parâmetro 0 interno da coluna W no Programa de Investimentos
  if (
    (sheet === ' Proposta' || sheet === 'Proposta') &&
    cell.startsWith('W') &&
    Number(cell.slice(1)) >= 27 &&
    Number(cell.slice(1)) <= 69
  ) {
    return true;
  }

  // 7. Cronograma: colunas remotas de códigos SEAP
  if (
    sheet === 'Cronograma' &&
    ['BT', 'BU', 'AD', 'AC', 'AB', 'Z', 'N'].includes(col) &&
    Number(cell.replace(/^[A-Z]+/, '')) >= 200
  ) {
    return true;
  }

  // 8. Ativ. Agrícola: colunas BV e BW são auxiliares de controle interno (não entradas do usuário)
  if (sheet === 'Ativ. Agrícola' && (col === 'BV' || col === 'BW')) return true;

  return false;
}

describe('PRONAF A2 - Cobertura de Campos e Mapeamento Célula-Campo', () => {
  const mapped = allMappedCells();
  const mappedSet = new Set(mapped.map(m => `${m.sheet}!${m.cell}`));

  describe('1. Cobertura da Aba Cliente (campos_Cliente.csv)', () => {
    it('deve mapear TODAS as 82 células de dados de campos_Cliente.csv', () => {
      const csvPath = path.resolve(__dirname, '../data/campos_Cliente.csv');
      const content = fs.readFileSync(csvPath, 'utf-8');
      const rows = parseCsv(content);
      const header = rows[0];
      const cellIdx = header.indexOf('cell');

      expect(cellIdx).toBeGreaterThanOrEqual(0);

      const unmapped: string[] = [];
      let totalChecked = 0;

      for (let i = 1; i < rows.length; i++) {
        const cell = (rows[i][cellIdx] || '').trim();
        if (!cell) continue;
        totalChecked++;

        const key = `Cliente!${cell}`;
        if (!mappedSet.has(key)) {
          unmapped.push(cell);
        }
      }

      expect(totalChecked).toBe(82);
      expect(unmapped).toEqual([]);
    });
  });

  describe('2. Cobertura das Demais Abas (campos_*.csv)', () => {
    const csvFiles = [
      'campos_CalculoFinanceiro.csv',
      'campos_Outras_Ativ.csv',
      'campos_Ativ_Pecuaria.csv',
      'campos_Cronograma.csv',
      'campos_Proposta.csv',
      'campos_Ativ_Agricola.csv',
      'campos_Avaliacao.csv',
    ];

    for (const fileName of csvFiles) {
      it(`deve mapear todas as células de entrada não-auxiliares de ${fileName}`, () => {
        const csvPath = path.resolve(__dirname, `../data/${fileName}`);
        const content = fs.readFileSync(csvPath, 'utf-8');
        const rows = parseCsv(content);
        const header = rows[0];

        const abaIdx = header.indexOf('aba');
        const celulaIdx = header.indexOf('celula');
        const colIdx = header.indexOf('coluna');
        const rotuloIdx = header.indexOf('rotulo_linha');
        const cabecalhoIdx = header.indexOf('cabecalho_coluna');
        const vtIdx = header.indexOf('validacao_tipo');
        const vpIdx = header.indexOf('valor_padrao');

        const unmapped: Array<{ sheet: string; cell: string; vt: string; vp: string }> = [];
        let checkedCount = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const rawAba = (row[abaIdx] || '').trim();
          const cell = (row[celulaIdx] || '').trim();
          const col = (row[colIdx] || '').trim();
          const rotulo = (row[rotuloIdx] || '').trim();
          const cabecalho = (row[cabecalhoIdx] || '').trim();
          const vt = (row[vtIdx] || '').trim();
          const vp = (row[vpIdx] || '').trim();

          if (!cell) continue;

          // Candidato: validacao_tipo não vazio OU valor_padrao não vazio
          if (vt === '' && vp === '') continue;

          // Normaliza nome da aba para a chave correspondente em SheetName
          const sheetName: SheetName = rawAba === 'Proposta' ? ' Proposta' : (rawAba as SheetName);

          // Verifica se é coluna/célula auxiliar
          if (isAuxiliaryCell(sheetName, cell, col, rotulo, cabecalho)) {
            continue;
          }

          checkedCount++;
          const key = `${sheetName}!${cell}`;
          if (!mappedSet.has(key)) {
            unmapped.push({ sheet: sheetName, cell, vt, vp });
          }
        }

        expect(checkedCount).toBeGreaterThan(0);
        expect(unmapped).toEqual([]);
      });
    }
  });

  describe('3. Teste de Round-Trip (projetoToCells -> cellsToProjeto)', () => {
    it('deve reproduzir com fidelidade os valores preenchidos em cada uma das 8 abas', () => {
      const p = createInitialProjetoA2();

      // Cliente
      p.Cliente.tipoCliente = 'Pessoa Física';
      p.Cliente.nome = 'MARIA DAS DORES SILVA';
      p.Cliente.cpf = '12345678901';
      p.Cliente.dataNascimento = '15/08/1985';
      p.Cliente.rendaMensal = 4500;
      p.Cliente.ativEndereco = 'RUA DAS FLORES';
      p.Cliente.ativNumero = '120';
      p.Cliente.ativCep = '60000000';
      p.Cliente.conjugeNome = 'JOSE DA SILVA';
      p.Cliente.conjugeCpf = '98765432100';

      // CalculoFinanceiro
      p.CalculoFinanceiro.bloco1.prazoMeses = 120;
      p.CalculoFinanceiro.bloco1.carenciaMeses = 36;
      p.CalculoFinanceiro.bloco1.jurosPercentAa = 4;
      p.CalculoFinanceiro.bloco1.periodicidadeReembolso = 'Anual';
      p.CalculoFinanceiro.bloco1.amortizacoesIguais = 'Sim';

      // Outras Ativ
      p['Outras Ativ'].receitasAnuais[0].descricao = 'Artesanato Regional';
      p['Outras Ativ'].receitasAnuais[0].setorAtividade = 'Artesanato';
      p['Outras Ativ'].receitasAnuais[0].atual = 15000;
      p['Outras Ativ'].energiaEletrica = 850;
      p['Outras Ativ'].atividadesEconomicas[0] = 'Artesanato têxtil';

      // Ativ. Pecuária
      p['Ativ. Pecuária'].salarioMinimoReferencia = 1412;
      p['Ativ. Pecuária'].leite.racaAtividade = 'Gir Leiteiro';
      p['Ativ. Pecuária'].leite.matrizesEstabilizacaoCab = 20;
      p['Ativ. Pecuária'].leite.leiteCabDiaLitros = 12;
      p['Ativ. Pecuária'].corte.racaAtividade = 'Nelore';
      p['Ativ. Pecuária'].corte.matrizesEstabilizacaoCab = 30;

      // Cronograma
      p.Cronograma.inversoesParcelas[0].parcelas[0].mesAno = '05/2026';
      p.Cronograma.inversoesParcelas[0].parcelas[0].percentual = 50;
      p.Cronograma.aplicacaoRecursos[0].valor = 80000;
      p.Cronograma.aplicacaoRecursos[0].empreendimento = 'Construção de Aviário';
      p.Cronograma.aplicacaoRecursos[0].aplicacaoRecursos = 'Obras e instalações';
      p.Cronograma.finalidadesRecursos[0].codigoMda = 'MDA999';

      // Proposta
      p[' Proposta'].dataProposta = '10/10/2026';
      p[' Proposta'].programa = 'FNE/PRONAF GRUPO "A" - FNE (368)';
      p[' Proposta'].itensInvestimento[0].discriminacao = 'TRATOR AGRICOLA 75CV';
      p[' Proposta'].itensInvestimento[0].quantidade = 1;
      p[' Proposta'].itensInvestimento[0].valorUnitario = 180000;
      p[' Proposta'].itensInvestimento[0].recursosPropriosUnit = 20000;
      p[' Proposta'].custeioAgricolaValorUnit = 15000;
      p[' Proposta'].nrEmpregadosAtual = 3;
      p[' Proposta'].operacoesDeclaradas[0].bancoOuCooperativa = 'BANCO DO NORDESTE';
      p[' Proposta'].operacoesDeclaradas[0].valor = 50000;

      // Ativ. Agrícola
      p['Ativ. Agrícola'].usoTerrasAgricola[0].descricao = 'Milho Grão';
      p['Ativ. Agrícola'].usoTerrasAgricola[0].atualArea = 15;
      p['Ativ. Agrícola'].receitasAgricolas[0].descricao = 'Milho Grão';
      p['Ativ. Agrícola'].receitasAgricolas[0].irrigacao = 'Não Irrigada';
      p['Ativ. Agrícola'].receitasAgricolas[0].valorUnitario = 75.5;

      // Avaliação
      p.Avaliação.imoveis[0].denominacao = 'Sítio Primavera';
      p.Avaliação.imoveis[0].municipio = 'FORTALEZA-CE';
      p.Avaliação.imoveis[0].areaLegal = 45.2;
      p.Avaliação.detalhesImoveis[0].exploracaoAgricola[0].descricao = 'Milho';
      p.Avaliação.detalhesImoveis[0].exploracaoAgricola[0].areaHa = 10;
      p.Avaliação.detalhesImoveis[0].exploracaoAgricola[0].valorUnitario = 3500;
      p.Avaliação.detalhesImoveis[0].benfeitorias[0].descricao = 'Cerca de Arame Farpado';
      p.Avaliação.detalhesImoveis[0].benfeitorias[0].valorReposicao = 12000;
      p.Avaliação.informacoesAdicionais[0].nirf = '12345678';
      p.Avaliação.informacoesAdicionais[0].registroCar = 'CE-2304400-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

      // 1. Gera writes
      const writes = projetoToCells(p);
      expect(writes.length).toBeGreaterThan(0);

      // 2. Monta mapa de células escritas
      const cellMap = new Map<string, string>();
      for (const w of writes) {
        cellMap.set(`${w.sheet}!${w.cell}`, String(w.value));
      }

      // 3. Lê de volta reconstruindo o projeto
      const reader = (sheet: SheetName, cell: string) => cellMap.get(`${sheet}!${cell}`) ?? '';
      const imported = cellsToProjeto(reader);

      // 4. Asserções de round-trip
      expect(imported.Cliente.nome).toBe('MARIA DAS DORES SILVA');
      expect(imported.Cliente.cpf).toBe('12345678901');
      expect(imported.Cliente.dataNascimento).toBe('15/08/1985');
      expect(imported.Cliente.rendaMensal).toBe(4500);
      expect(imported.Cliente.ativNumero).toBe(120);

      expect(imported.CalculoFinanceiro.bloco1.prazoMeses).toBe(120);
      expect(imported.CalculoFinanceiro.bloco1.carenciaMeses).toBe(36);
      expect(imported.CalculoFinanceiro.bloco1.jurosPercentAa).toBe(4);

      expect(imported['Outras Ativ'].receitasAnuais[0].descricao).toBe('Artesanato Regional');
      expect(imported['Outras Ativ'].energiaEletrica).toBe(850);

      expect(imported['Ativ. Pecuária'].salarioMinimoReferencia).toBe(1412);
      expect(imported['Ativ. Pecuária'].leite.racaAtividade).toBe('Gir Leiteiro');
      expect(imported['Ativ. Pecuária'].leite.matrizesEstabilizacaoCab).toBe(20);

      expect(imported.Cronograma.inversoesParcelas[0].parcelas[0].mesAno).toBe('05/2026');
      expect(imported.Cronograma.inversoesParcelas[0].parcelas[0].percentual).toBe(50);
      expect(imported.Cronograma.aplicacaoRecursos[0].valor).toBe(80000);
      expect(imported.Cronograma.finalidadesRecursos[0].codigoMda).toBe('MDA999');

      expect(imported[' Proposta'].dataProposta).toBe('10/10/2026');
      expect(imported[' Proposta'].itensInvestimento[0].discriminacao).toBe('TRATOR AGRICOLA 75CV');
      expect(imported[' Proposta'].itensInvestimento[0].valorUnitario).toBe(180000);
      expect(imported[' Proposta'].nrEmpregadosAtual).toBe(3);

      expect(imported['Ativ. Agrícola'].usoTerrasAgricola[0].descricao).toBe('Milho Grão');
      expect(imported['Ativ. Agrícola'].usoTerrasAgricola[0].atualArea).toBe(15);
      expect(imported['Ativ. Agrícola'].receitasAgricolas[0].valorUnitario).toBe(75.5);

      expect(imported.Avaliação.imoveis[0].denominacao).toBe('Sítio Primavera');
      expect(imported.Avaliação.imoveis[0].areaLegal).toBe(45.2);
      expect(imported.Avaliação.informacoesAdicionais[0].nirf).toBe('12345678');
    });
  });
});
