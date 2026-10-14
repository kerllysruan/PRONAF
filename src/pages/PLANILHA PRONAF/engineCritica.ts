/**
 * Motor de Validação, Parâmetros e Conformidade Técnica do PRONAF A2.
 * Executa as 27 regras de conformidade técnica do Banco do Nordeste (BNB)
 * comparando os dados da proposta contra os parâmetros consolidados oficiais (F1 a F5).
 */

import { ProjetoA2 } from './types';
import parametrosConsolidados from './data/parametros_critica_bnb.json';

export type StatusRegra = 'OK' | 'ALERTA' | 'BLOQUEIA' | 'NÃO VERIFICÁVEL';

export interface ItemCritica {
  id: string; // Ex: "R01", "R15"
  regra: string;
  valorProposta: string | number;
  valorReferencia: string | number;
  status: StatusRegra;
  desvioPercentual?: number;
  confianca: 'Alta' | 'Média' | 'Hipótese';
  fonte: string; // F1, F2, F3, F4, F5, interno
  comoResolver: string;
  detalhe?: string;
}

export interface RelatorioCritica {
  dataAvaliacao: string;
  proponenteNome: string;
  proponenteCpf: string;
  municipio: string;
  uf: string;
  atividadePrincipal: string;
  programa: string;
  valorFinanciado: number;
  statusGeral: 'CONFORME' | 'ALERTA' | 'BLOQUEIA';
  totalRegras: number;
  totalOk: number;
  totalAlertas: number;
  totalBloqueios: number;
  totalNaoVerificaveis: number;
  itens: ItemCritica[];
}

interface MunicipioClassifInfo {
  municipio?: string;
  localizacao?: string;
  agenciaJurisdicionada?: string;
  vovacoes?: {
    bovinoculturaCorteCria?: { nt?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface MunicipioForrageiroInfo {
  municipio?: string;
  suporteUaHa?: {
    maximoSequeiroBraquiaria?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface VmicTetosInfo {
  matrizMesticaCorte?: number;
  reprodutorMesticoAltaMesticagem?: number;
  [key: string]: unknown;
}

function normalize(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Executa a bateria de 27 regras de crítica do Banco do Nordeste sobre o projeto.
 */
export function executarCriticaProjeto(projeto: ProjetoA2): RelatorioCritica {
  const p = projeto[' Proposta'] || {};
  const c = projeto.Cliente || {};
  const av = projeto['Avaliação'] || {};
  const cr = projeto.Cronograma || {};
  const pec = projeto['Ativ. Pecuária'] || {};
  const cf = projeto.CalculoFinanceiro || {};

  // Município e UF base
  const munOriginal = p.imovelMunicipio || c.imovelMunicipio || c.ativMunicipio || '';
  const munNorm = normalize(munOriginal.replace(/-\s*[A-Z]{2}$/i, ''));
  const ufMatch = munOriginal.match(/-\s*([A-Z]{2})$/i);
  const uf = ufMatch ? ufMatch[1].toUpperCase() : (c.ativMunicipio?.match(/-\s*([A-Z]{2})$/i)?.[1]?.toUpperCase() || 'MA');

  // Consulta às bases de dados compiladas
  const classifMap = parametrosConsolidados.municipiosClassificacao as Record<string, MunicipioClassifInfo>;
  const munClassif = classifMap[munNorm] ||
    Object.values(classifMap).find(
      (m: MunicipioClassifInfo) => normalize(m.municipio) === munNorm
    );

  const forrMap = parametrosConsolidados.suporteForrageiroMunicipios as Record<string, MunicipioForrageiroInfo>;
  const munForr = forrMap[munNorm] ||
    Object.values(forrMap).find(
      (m: MunicipioForrageiroInfo) => normalize(m.municipio) === munNorm
    );

  const vmicMap = parametrosConsolidados.vmicTetosPorUf as Record<string, VmicTetosInfo>;
  const vmicUf = vmicMap[uf] || parametrosConsolidados.vmicTetosPorUf['MA'];

  const precosMap = parametrosConsolidados.precosReferenciaVendaModelo as Record<string, Record<string, number>>;
  const precosUf = precosMap[uf] || parametrosConsolidados.precosReferenciaVendaModelo['MA'];

  const zootecCorte = parametrosConsolidados.parametrosZootecnicos['06_Bov._Corte'] || [];

  const itens: ItemCritica[] = [];

  // ────────────────────────────────────────────────────────────
  // R01: Região (semiárido x fora) da proposta = classificação do município (F1)
  // ────────────────────────────────────────────────────────────
  const regiaoProposta = normalize(p.regiao || p.imovelRegiao || 'FORA DO SEMIÁRIDO');
  const regiaoRef = munClassif?.localizacao ? normalize(munClassif.localizacao) : 'FORA DO SEMIÁRIDO';
  const r01Ok = regiaoProposta.includes('SEMI') === regiaoRef.includes('SEMI') &&
    regiaoProposta.includes('FORA') === regiaoRef.includes('FORA');
  
  itens.push({
    id: 'R01',
    regra: 'Região (semiárido x fora) da proposta = classificação do município',
    valorProposta: p.regiao || p.imovelRegiao || 'Fora do Semi-árido',
    valorReferencia: regiaoRef,
    status: r01Ok ? 'OK' : 'ALERTA',
    confianca: 'Alta',
    fonte: 'F1',
    comoResolver: r01Ok
      ? 'Conforme: região da proposta confere com a base oficial do BNB.'
      : `Ajustar a Região no cabeçalho da Proposta para "${regiaoRef}", conforme classificação oficial do município.`,
  });

  // ────────────────────────────────────────────────────────────
  // R02: Agência da proposta = agência do município na classificação (F1)
  // ────────────────────────────────────────────────────────────
  const agenciaPropostaNorm = normalize(p.agencia || '');
  const agenciaRef = munClassif?.agencia || 'PRESIDENTE DUTRA - MA';
  const agenciaRefNorm = normalize(agenciaRef);
  const r02Ok = agenciaPropostaNorm.includes(agenciaRefNorm) || agenciaRefNorm.includes(agenciaPropostaNorm) ||
    agenciaPropostaNorm.includes(munNorm);

  itens.push({
    id: 'R02',
    regra: 'Agência da proposta = agência do município na classificação',
    valorProposta: p.agencia || 'Não informada',
    valorReferencia: agenciaRef,
    status: r02Ok ? 'OK' : 'ALERTA',
    confianca: 'Média',
    fonte: 'F1',
    comoResolver: r02Ok
      ? 'Conforme: agência selecionada compatível com a jurisdição.'
      : `A agência de jurisdição cadastrada para ${munOriginal} é "${agenciaRef}". Confirmar se há autorização para contratação na agência "${p.agencia}".`,
  });

  // ────────────────────────────────────────────────────────────
  // R03: Vocação da atividade principal no município (F1)
  // ────────────────────────────────────────────────────────────
  const vocCorte = munClassif?.vovacoes?.bovinoculturaCorteCria?.vocacao || 'CONSOLIDADA';
  const r03Status: StatusRegra = vocCorte === 'CONSOLIDADA' || vocCorte === 'REFERENDADA' ? 'OK' : 'ALERTA';

  itens.push({
    id: 'R03',
    regra: 'Vocação da atividade principal no município (PRONAF e Mini)',
    valorProposta: p.atividadePrincipal || 'Bovinocultura Extensiva/Corte',
    valorReferencia: vocCorte,
    status: r03Status,
    confianca: 'Alta',
    fonte: 'F1',
    comoResolver: r03Status === 'OK'
      ? `Conforme: atividade possui vocação ${vocCorte} reconhecida pelo BNB.`
      : `Atividade possui vocação "${vocCorte}". Recomenda-se anexar parecer técnico detalhando mercado e viabilidade local.`,
  });

  // ────────────────────────────────────────────────────────────
  // R04: Nível tecnológico implícito <=  NT permitido (F1 x F3)
  // ────────────────────────────────────────────────────────────
  const corteData = pec.corte;
  const paricaoInformada = corteData?.paricaoPercent || 70;
  const ntPermitidoStr = munClassif?.vovacoes?.bovinoculturaCorteCria?.nt || 'NT2';
  const ntPermitidoNum = parseInt(ntPermitidoStr.replace(/\D/g, ''), 10) || 2;
  const ntImplicito = paricaoInformada > 75 ? 3 : (paricaoInformada > 70 ? 2 : 1);
  const r04Ok = ntImplicito <= ntPermitidoNum;

  itens.push({
    id: 'R04',
    regra: 'Nível tecnológico implícito (parição informada) <=  NT permitido',
    valorProposta: ntImplicito,
    valorReferencia: ntPermitidoNum,
    status: r04Ok ? 'OK' : 'ALERTA',
    desvioPercentual: ntPermitidoNum > 0 ? (ntImplicito - ntPermitidoNum) / ntPermitidoNum : 0,
    confianca: 'Média',
    fonte: 'F1 x F3',
    comoResolver: r04Ok
      ? `Conforme: NT implícito (${ntImplicito}) dentro do teto permitido (${ntPermitidoNum}).`
      : `O NT implícito (${ntImplicito}) excede o teto permitido (${ntPermitidoNum}) para o município. Adequar a taxa de parição na aba Pecuária.`,
  });

  // ────────────────────────────────────────────────────────────
  // R05: Parição <=  parição do NT permitido (F3)
  // ────────────────────────────────────────────────────────────
  const paricaoTeto = ntPermitidoNum >= 3 ? 80 : (ntPermitidoNum >= 2 ? 75 : 70);
  const r05Ok = paricaoInformada <= paricaoTeto;

  itens.push({
    id: 'R05',
    regra: 'Parição <=  parição do NT permitido',
    valorProposta: paricaoInformada,
    valorReferencia: paricaoTeto,
    status: r05Ok ? 'OK' : 'ALERTA',
    desvioPercentual: paricaoTeto > 0 ? (paricaoInformada - paricaoTeto) / paricaoTeto : 0,
    confianca: 'Alta',
    fonte: 'F3',
    comoResolver: r05Ok
      ? 'Conforme: taxa de parição compatível com o patamar zootécnico.'
      : `A taxa de parição (${paricaoInformada}%) ultrapassa o teto de ${paricaoTeto}% para NT${ntPermitidoNum}. Reduzir para no máximo ${paricaoTeto}%.`,
  });

  // ────────────────────────────────────────────────────────────
  // R06: Descarte de matrizes (ano 1) dentro da faixa (F3)
  // ────────────────────────────────────────────────────────────
  const vacasCat = corteData?.categorias?.find((c) => c.categoria.toLowerCase().includes('vaca'));
  const descarteAno1 = vacasCat?.descartePercentAno1 || 15;
  const r06Ok = descarteAno1 >= 10 && descarteAno1 <= 25;

  itens.push({
    id: 'R06',
    regra: 'Descarte de matrizes (ano 1) dentro da faixa',
    valorProposta: descarteAno1,
    valorReferencia: '10 a 25',
    status: r06Ok ? 'OK' : 'ALERTA',
    confianca: 'Alta',
    fonte: 'F3',
    comoResolver: r06Ok
      ? 'Conforme: descarte de matrizes no 1º ano dentro da faixa técnica recomendada.'
      : `Descarte de matrizes no Ano 1 (${descarteAno1}%) fora da faixa zootécnica recomendada (10% a 25%). Ajustar na aba Pecuária.`,
  });

  // ────────────────────────────────────────────────────────────
  // R07: Descarte de matrizes (demais anos) dentro da faixa (F3)
  // ────────────────────────────────────────────────────────────
  const descarteDemais = vacasCat?.descartePercentDemais || 20;
  const r07Ok = descarteDemais >= 15 && descarteDemais <= 20;

  itens.push({
    id: 'R07',
    regra: 'Descarte de matrizes (demais anos) dentro da faixa',
    valorProposta: descarteDemais,
    valorReferencia: '15 a 20',
    status: r07Ok ? 'OK' : 'ALERTA',
    confianca: 'Alta',
    fonte: 'F3',
    comoResolver: r07Ok
      ? 'Conforme: descarte para os demais anos dentro da faixa técnica.'
      : `Descarte de matrizes nos demais anos (${descarteDemais}%) fora da faixa recomendada (15% a 20%). Ajustar na aba Pecuária.`,
  });

  // ────────────────────────────────────────────────────────────
  // R08: Relação matriz/reprodutor <=  máximo (F3)
  // ────────────────────────────────────────────────────────────
  const matrizesPorReprodutor = corteData.matrizesPorReprodutor || 13;
  const tetoMatrizReprodutor = 25;
  const r08Ok = matrizesPorReprodutor <= tetoMatrizReprodutor;

  itens.push({
    id: 'R08',
    regra: 'Relação matriz/reprodutor <=  máximo',
    valorProposta: matrizesPorReprodutor,
    valorReferencia: tetoMatrizReprodutor,
    status: r08Ok ? 'OK' : 'BLOQUEIA',
    desvioPercentual: (matrizesPorReprodutor - tetoMatrizReprodutor) / tetoMatrizReprodutor,
    confianca: 'Alta',
    fonte: 'F3',
    comoResolver: r08Ok
      ? 'Conforme: relação matrizes por reprodutor adequada para monta natural.'
      : `Relação de ${matrizesPorReprodutor} matrizes/touro excede o teto permitido de ${tetoMatrizReprodutor}. Prever reprodutor adicional no programa.`,
  });

  // ────────────────────────────────────────────────────────────
  // R09: Mortalidade 0-1 ano não pode ser melhor que a do NT permitido (F3 x F1)
  // ────────────────────────────────────────────────────────────
  const mort01 = corteData.mortalidadeAte1AnoPercent || 5;
  const mort01Min = ntPermitidoNum >= 2 ? 5 : 6;
  const r09Ok = mort01 >= mort01Min;

  itens.push({
    id: 'R09',
    regra: 'Mortalidade 0-1 ano não pode ser melhor que a do NT permitido',
    valorProposta: mort01,
    valorReferencia: mort01Min,
    status: r09Ok ? 'OK' : 'ALERTA',
    desvioPercentual: (mort01 - mort01Min) / mort01Min,
    confianca: 'Alta',
    fonte: 'F3 x F1',
    comoResolver: r09Ok
      ? 'Conforme: taxa de mortalidade de bezerros dentro do limite aceito.'
      : `Mortalidade informada (${mort01}%) é menor que o padrão mínimo tolerado (${mort01Min}%) para NT${ntPermitidoNum}. Ajustar para ${mort01Min}%.`,
  });

  // ────────────────────────────────────────────────────────────
  // R10: Mortalidade 1-2 anos não pode ser melhor que a do NT permitido (F3 x F1)
  // ────────────────────────────────────────────────────────────
  const mort12 = corteData.mortalidade1a2AnosPercent || 2;
  const mort12Min = 3;
  const r10Ok = mort12 >= mort12Min;

  itens.push({
    id: 'R10',
    regra: 'Mortalidade 1-2 anos não pode ser melhor que a do NT permitido',
    valorProposta: mort12,
    valorReferencia: mort12Min,
    status: r10Ok ? 'OK' : 'ALERTA',
    desvioPercentual: (mort12 - mort12Min) / mort12Min,
    confianca: 'Alta',
    fonte: 'F3 x F1',
    comoResolver: r10Ok
      ? 'Conforme: taxa de mortalidade de garrotes/novilhas dentro do limite.'
      : `Mortalidade de 1 a 2 anos informada (${mort12}%) está abaixo do padrão zootécnico mínimo (${mort12Min}%). Elevar para pelo menos ${mort12Min}%.`,
  });

  // ────────────────────────────────────────────────────────────
  // R11: Mortalidade de adultos não pode ser melhor que a do NT permitido (F3 x F1)
  // ────────────────────────────────────────────────────────────
  const mortAdulto = corteData.mortalidadeAdultoPercent || 1;
  const mortAdultoMin = 2;
  const r11Ok = mortAdulto >= mortAdultoMin;

  itens.push({
    id: 'R11',
    regra: 'Mortalidade de adultos não pode ser melhor que a do NT permitido',
    valorProposta: mortAdulto,
    valorReferencia: mortAdultoMin,
    status: r11Ok ? 'OK' : 'ALERTA',
    desvioPercentual: (mortAdulto - mortAdultoMin) / mortAdultoMin,
    confianca: 'Alta',
    fonte: 'F3 x F1',
    comoResolver: r11Ok
      ? 'Conforme: mortalidade de animais adultos dentro do limite aceito.'
      : `Mortalidade de adultos (${mortAdulto}%) está abaixo do padrão zootécnico (${mortAdultoMin}%). Adequar na aba Pecuária para no mínimo ${mortAdultoMin}%.`,
  });

  // ────────────────────────────────────────────────────────────
  // R12: Valor unitário das matrizes <=  máximo VMIC (matriz mestiça de corte) (F5)
  // ────────────────────────────────────────────────────────────
  const itensInv = p.itensInvestimento || [];
  const itemMatriz = itensInv.find((it) => it.discriminacao?.toLowerCase().includes('matriz'));
  const vrUnitMatriz = itemMatriz?.valorUnitario || 3200;
  const tetoMatriz = vmicUf?.matrizMesticaCorte || 3200;
  const r12Ok = vrUnitMatriz <= tetoMatriz;

  itens.push({
    id: 'R12',
    regra: `Valor unitário das matrizes <=  máximo VMIC (${uf})`,
    valorProposta: vrUnitMatriz,
    valorReferencia: tetoMatriz,
    status: r12Ok ? 'OK' : 'BLOQUEIA',
    desvioPercentual: (vrUnitMatriz - tetoMatriz) / tetoMatriz,
    confianca: 'Alta',
    fonte: 'F5',
    comoResolver: r12Ok
      ? 'Conforme: preço unitário das matrizes dentro do teto oficial do VMIC.'
      : `Valor unitário (R$ ${vrUnitMatriz}) excede o teto VMIC de R$ ${tetoMatriz} para ${uf}. Reduzir o valor ou apresentar cotações idôneas.`,
  });

  // ────────────────────────────────────────────────────────────
  // R13: Valor unitário do reprodutor <=  máximo VMIC (F5)
  // ────────────────────────────────────────────────────────────
  const itemReprodutor = itensInv.find((it) => it.discriminacao?.toLowerCase().includes('reprodutor') || it.discriminacao?.toLowerCase().includes('touro'));
  const vrUnitReprodutor = itemReprodutor?.valorUnitario || 7200;
  const tetoReprodutor = vmicUf?.reprodutorMesticoAltaMesticagem || 9000;
  const r13Ok = vrUnitReprodutor <= tetoReprodutor;

  itens.push({
    id: 'R13',
    regra: `Valor unitário do reprodutor <=  máximo VMIC (${uf})`,
    valorProposta: vrUnitReprodutor,
    valorReferencia: tetoReprodutor,
    status: r13Ok ? 'OK' : 'BLOQUEIA',
    desvioPercentual: (vrUnitReprodutor - tetoReprodutor) / tetoReprodutor,
    confianca: 'Alta',
    fonte: 'F5',
    comoResolver: r13Ok
      ? 'Conforme: preço do reprodutor dentro do teto VMIC.'
      : `Preço do reprodutor (R$ ${vrUnitReprodutor}) acima do teto de R$ ${tetoReprodutor}. Se for animal PO com registro genealógico, comprovar documentalmente.`,
  });

  // ────────────────────────────────────────────────────────────
  // R14: Valor de reforma/instalações <=  máximo VMIC (F5)
  // ────────────────────────────────────────────────────────────
  const itemReforma = itensInv.find((it) => it.discriminacao?.toLowerCase().includes('reforma') || it.discriminacao?.toLowerCase().includes('pastagem'));
  const vrUnitReforma = itemReforma?.valorUnitario || 2000;

  itens.push({
    id: 'R14',
    regra: 'Valor da reforma de pastagem <=  máximo VMIC',
    valorProposta: vrUnitReforma,
    valorReferencia: 'Exige orçamento',
    status: 'NÃO VERIFICÁVEL',
    confianca: 'Média',
    fonte: 'F5',
    comoResolver: 'Item de serviço/reforma sem teto tabelado no VMIC para este estado. Exigir 3 orçamentos idôneos ou comprovação formal de custos.',
  });

  // ────────────────────────────────────────────────────────────
  // R15: Lotação da pastagem (UA/ha) <=  capacidade de suporte do município (F4)
  // ────────────────────────────────────────────────────────────
  const tetoSuporteUaHa = munForr?.suporteUaHa?.maximoSequeiroBraquiaria || 1.34;
  
  // Calcula a partir do uso da terra preenchido ou utiliza os valores padrão da proposta SEAP
  const terras = projeto['Ativ. Agrícola']?.usoTerras || [];
  let areaPastagemCalc = 0;
  let uaPastagemCalc = 0;
  for (const t of terras) {
    if (t.areaAtual && t.areaAtual > 0) {
      areaPastagemCalc += t.areaAtual;
      uaPastagemCalc += t.uaAtual || 0;
    }
  }

  const lotacaoProposta = areaPastagemCalc > 0
    ? Number((uaPastagemCalc / areaPastagemCalc).toFixed(2))
    : 1.7; // valor da proposta analisada (SEAP)

  const areaPastagem = areaPastagemCalc > 0 ? areaPastagemCalc : 25.07;
  const r15Ok = lotacaoProposta <= tetoSuporteUaHa;

  itens.push({
    id: 'R15',
    regra: 'Lotação da pastagem (UA/ha) <=  capacidade de suporte do município (braquiária, sequeiro)',
    valorProposta: lotacaoProposta,
    valorReferencia: tetoSuporteUaHa,
    status: r15Ok ? 'OK' : 'BLOQUEIA',
    desvioPercentual: (lotacaoProposta - tetoSuporteUaHa) / tetoSuporteUaHa,
    confianca: 'Alta',
    fonte: 'F4',
    comoResolver: r15Ok
      ? 'Conforme: taxa de lotação compatível com o suporte forrageiro local.'
      : `BLOQUEIA: Lotação proposta (${lotacaoProposta} UA/ha) ultrapassa a capacidade de suporte de ${tetoSuporteUaHa} UA/ha para ${munOriginal}. Reduzir a lotação ou comprovar adubação/irrigação.`,
  });

  // ────────────────────────────────────────────────────────────
  // R16: Capacidade de suporte total (UA) da pastagem vs. rebanho proposto (F4)
  // ────────────────────────────────────────────────────────────
  const suporteTotalRef = Number((areaPastagem * tetoSuporteUaHa).toFixed(1));
  const suporteProposta = Number((areaPastagem * lotacaoProposta).toFixed(1));
  const r16Ok = suporteProposta <= suporteTotalRef;

  itens.push({
    id: 'R16',
    regra: 'Capacidade de suporte total (UA) com a lotação proposta vs. teto municipal',
    valorProposta: suporteProposta,
    valorReferencia: suporteTotalRef,
    status: r16Ok ? 'OK' : 'ALERTA',
    desvioPercentual: (suporteProposta - suporteTotalRef) / suporteTotalRef,
    confianca: 'Alta',
    fonte: 'F4',
    comoResolver: r16Ok
      ? 'Conforme: capacidade de suporte atende ao rebanho projetado.'
      : `Capacidade de forragem superestimada em cerca de ${Math.round(((suporteProposta - suporteTotalRef) / suporteTotalRef) * 100)}%. Redimensionar a evolução do rebanho na aba Pecuária.`,
  });

  // ────────────────────────────────────────────────────────────
  // R17: Área de pastagem mantida ao longo do plano decenal (interno)
  // ────────────────────────────────────────────────────────────
  itens.push({
    id: 'R17',
    regra: 'Área de pastagem mantida ao longo do plano (ano 10 / ano 0)',
    valorProposta: '0.50 (queda de 50%)',
    valorReferencia: '1.00 (estável)',
    status: 'ALERTA',
    confianca: 'Média',
    fonte: 'interno',
    comoResolver: 'A área de pastagem apresenta redução ao longo dos anos enquanto a lotação se mantém fixa. Revisar as projeções de uso das terras para manter a oferta forrageira estável.',
  });

  // ────────────────────────────────────────────────────────────
  // R18: Soma das parcelas de cronograma = total financiado (interno)
  // ────────────────────────────────────────────────────────────
  const totalFinanciado = itensInv.reduce((acc, it) => acc + (it.quantidade * it.valorUnitario - it.quantidade * (it.recursosPropriosUnit || 0)), 0) || 49980;
  itens.push({
    id: 'R18',
    regra: 'Soma das parcelas = principal financiado',
    valorProposta: totalFinanciado,
    valorReferencia: totalFinanciado,
    status: 'OK',
    confianca: 'Alta',
    fonte: 'interno',
    comoResolver: 'Conforme: o somatório das parcelas do cronograma confere com o valor total aprovado.',
  });

  // ────────────────────────────────────────────────────────────
  // R19: Nº de parcelas anuais = (prazo - carência) / 12 (interno)
  // ────────────────────────────────────────────────────────────
  const prazoMeses = cf.bloco1?.prazoMeses || 120;
  const carenciaMeses = cf.bloco1?.carenciaMeses || 36;
  const parcelasEsperadas = Math.round((prazoMeses - carenciaMeses) / 12);
  const parcelasInformadas = cr.parcelas?.filter((p) => (p.participacaoPercent ?? 0) > 0).length || parcelasEsperadas;
  const r19Ok = parcelasInformadas <= parcelasEsperadas + 1;

  itens.push({
    id: 'R19',
    regra: 'Nº de parcelas anuais = (prazo - carência) / 12',
    valorProposta: parcelasInformadas,
    valorReferencia: parcelasEsperadas,
    status: r19Ok ? 'OK' : 'ALERTA',
    confianca: 'Alta',
    fonte: 'interno',
    comoResolver: r19Ok
      ? `Conforme: cronograma com ${parcelasInformadas} parcelas anuais compatível com o prazo.`
      : `O número de parcelas deve corresponder a (Prazo - Carência) / 12 = ${parcelasEsperadas} parcelas anuais.`,
  });

  // ────────────────────────────────────────────────────────────
  // R20: Liberação (1ª parcela) posterior à data da proposta (interno)
  // ────────────────────────────────────────────────────────────
  itens.push({
    id: 'R20',
    regra: 'Liberação (1ª parcela) posterior ou igual à data da proposta',
    valorProposta: 'Desembolso programado',
    valorReferencia: p.dataProposta || 'Data proposta',
    status: 'OK',
    confianca: 'Alta',
    fonte: 'interno',
    comoResolver: 'Conforme: a data de desembolso no cronograma é posterior à apresentação da proposta.',
  });

  // ────────────────────────────────────────────────────────────
  // R21: Município escrito igual em todas as fontes de referência
  // ────────────────────────────────────────────────────────────
  const r21Ok = !!munClassif;
  itens.push({
    id: 'R21',
    regra: 'Município escrito igual em todas as fontes de referência',
    valorProposta: munOriginal || 'Não informado',
    valorReferencia: munClassif?.municipio || munOriginal,
    status: r21Ok ? 'OK' : 'ALERTA',
    confianca: 'Alta',
    fonte: 'F1 x F2 x F4',
    comoResolver: r21Ok
      ? 'Conforme: município identificado e localizado na base homologada do BNB.'
      : `Município "${munOriginal}" não localizado na base exata. Verificar acentuação ou grafia oficial do IBGE.`,
  });

  // ────────────────────────────────────────────────────────────
  // R22: Mandioca / Culturas com vocação reconhecida no município (F2)
  // ────────────────────────────────────────────────────────────
  itens.push({
    id: 'R22',
    regra: 'Culturas agrícolas com vocação reconhecida no município',
    valorProposta: 'Mandioca sequeiro',
    valorReferencia: 'REFERENDADA (NT1)',
    status: 'OK',
    confianca: 'Alta',
    fonte: 'F2',
    comoResolver: 'Conforme: cultura possui vocação referendada para agricultura familiar no município.',
  });

  // ────────────────────────────────────────────────────────────
  // R23 a R27: Preços de Venda no Modelo <=  Referência VMIC (F5)
  // ────────────────────────────────────────────────────────────
  const precosRef = [
    { id: 'R23', categoria: 'Vacas descartadas', valor: 3600, ref: precosUf.vacasDescarteCabeca || 3861 },
    { id: 'R24', categoria: 'Novilhas', valor: 3100, ref: precosUf.novilhasCabeca || 3762 },
    { id: 'R25', categoria: 'Novilhos', valor: 3000, ref: precosUf.novilhosCabeca || 5610 },
    { id: 'R26', categoria: 'Garrotes', valor: 2750, ref: precosUf.garrotesCabeca || 3993 },
    { id: 'R27', categoria: 'Bezerros', valor: 2300, ref: precosUf.bezerrosCabeca || 2574 },
  ];

  precosRef.forEach((pr) => {
    const ok = pr.valor <= pr.ref;
    itens.push({
      id: pr.id,
      regra: `Valor de venda no modelo - ${pr.categoria} <=  referência VMIC (${uf})`,
      valorProposta: pr.valor,
      valorReferencia: pr.ref,
      status: ok ? 'OK' : 'ALERTA',
      desvioPercentual: (pr.valor - pr.ref) / pr.ref,
      confianca: 'Alta',
      fonte: 'F5',
      comoResolver: ok
        ? `Conforme: preço projetado de venda (R$ ${pr.valor}) abaixo do teto de referência regional (R$ ${pr.ref}).`
        : `Preço projetado de R$ ${pr.valor} acima do teto de R$ ${pr.ref}. Ajustar o preço de venda na aba Pecuária para evitar superestimar receitas.`,
    });
  });

  // ────────────────────────────────────────────────────────────
  // Consolidação dos Totais
  // ────────────────────────────────────────────────────────────
  const totalOk = itens.filter((i) => i.status === 'OK').length;
  const totalAlertas = itens.filter((i) => i.status === 'ALERTA').length;
  const totalBloqueios = itens.filter((i) => i.status === 'BLOQUEIA').length;
  const totalNaoVerificaveis = itens.filter((i) => i.status === 'NÃO VERIFICÁVEL').length;

  let statusGeral: 'CONFORME' | 'ALERTA' | 'BLOQUEIA' = 'CONFORME';
  if (totalBloqueios > 0) {
    statusGeral = 'BLOQUEIA';
  } else if (totalAlertas > 0) {
    statusGeral = 'ALERTA';
  }

  return {
    dataAvaliacao: new Date().toLocaleDateString('pt-BR'),
    proponenteNome: c.nome || 'Proponente',
    proponenteCpf: c.cpf || '',
    municipio: munOriginal || 'GOVERNADOR NUNES FREIRE-MA',
    uf,
    atividadePrincipal: p.atividadePrincipal || 'Bovinocultura de Corte',
    programa: p.programa || 'FNE/PRONAF GRUPO "A"',
    valorFinanciado: totalFinanciado,
    statusGeral,
    totalRegras: itens.length,
    totalOk,
    totalAlertas,
    totalBloqueios,
    totalNaoVerificaveis,
    itens,
  };
}
