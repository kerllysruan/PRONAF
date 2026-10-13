/**
 * Tipos e Interfaces para o Módulo PRONAF A2
 * Fonte de verdade: PlanilhaPRONAF-A2.xlsm e arquivos CSV em data/
 */

// ============================================================================
// 1. CLIENTE (Aba Cliente / sheet13.xml)
// ============================================================================

export interface SocioData {
  cpfCnpj: string;
  nome: string;
  participacao: string;
  representaEmpresa: 'Sim' | 'Não' | '';
}

export interface ClienteData {
  // A. Dados Cadastrais
  tipoCliente: 'Pessoa Física' | 'Pessoa Jurídica' | ''; // E12
  nome: string; // E13 (Nome ou Razão Social)
  apelido: string; // E14 (Apelido ou Nome Fantasia)
  cpf: string; // E15 (CPF ou CNPJ)
  dataNascimento: string; // E16 (Data Nascimento ou Constituição)
  numDocumento: string; // E17 (Nº Documento ou Inscrição Estadual)
  dataEmissaoDoc: string; // E18 (Data Emissão ou Data Inscrição)
  tipoDocumento: string; // E20 (visaoDOC)
  orgaoEmissorDoc: string; // E21
  ufOrgaoEmissorDoc: string; // E22 (visaoUF)
  tituloEleitoral: string; // E23
  naturalidade: string; // E24 (VisaoNaturalidade)
  sexo: 'Masculino' | 'Feminino' | ''; // E25
  estadoCivil: string; // E26 (visaoCIVIL)
  grauInstrucao: string; // E27 (visaoESCOLA)
  profissao: string; // E28 (visaoPROF)
  atividade: string; // E29 (visaoATIV)
  rendaMensal: number; // E30 (Renda Mensal ou Capital Social)
  beneficiarioPoliticasPublicas: string; // E31 (Benef_Politica_Pub_Descr)
  nomePai: string; // E32
  nomeMae: string; // E33
  porte: string; // E35 (visaoPOR_PRONAF)
  numDap: string; // E36
  capitalIntegralizado: string; // E37

  // B. Endereço da Atividade
  ativTipoLogradouro: string; // E44 (visaoTP_LOG)
  ativEndereco: string; // E45
  ativNumero: string; // E46
  ativComplemento: string; // E47
  ativBairro: string; // E48
  ativCep: string; // E49
  ativMunicipio: string; // E50 (visaoMUNI)
  ativDddTelefone: string; // E51
  ativNumTelefone: string; // E52

  // C. Endereço para Correspondência
  corrTipoLogradouro: string; // E58 (visaoTP_LOG)
  corrEndereco: string; // E59
  corrNumero: string; // E60
  corrComplemento: string; // E61
  corrBairro: string; // E62
  corrCep: string; // E63
  corrMunicipio: string; // E64 (visaoMUNI)
  corrDddTelefone: string; // E65
  corrNumTelefone: string; // E66

  // D. Imóvel da Atividade
  imovelDenominacao: string; // F71
  imovelArea: number; // F72
  imovelTipoUso: string; // E73 (visaoPOSSE)
  imovelProprietario: string; // E74
  imovelCpfCnpjProprietario: string; // E75
  imovelItinerario: string; // E77

  // E. Cônjuge / Companheiro(a)
  conjugeNome: string; // E82
  conjugeCpf: string; // E83
  conjugeDataNascimento: string; // E84
  conjugeNumDocumento: string; // E85
  conjugeTipoDocumento: string; // E86 (visaoDOC)
  conjugeOrgaoEmissor: string; // E87
  conjugeUfOrgaoEmissor: string; // E88 (visaoUF)
  conjugeDataEmissao: string; // E89
  conjugeSexo: 'Masculino' | 'Feminino' | ''; // E90
  conjugeEstadoCivil: string; // E91 (visaoCIVIL)
  conjugeGrauInstrucao: string; // E92 (visaoESCOLA)
  conjugeProfissao: string; // E93 (visaoPROF)
  conjugeRendaMensal: number; // E94
  conjugeNaturalidade: string; // E95 (VisaoNaturalidade)
  conjugeNomePai: string; // E96
  conjugeNomeMae: string; // E97

  // F. Sócios / Participações (até 5)
  socios: SocioData[];

  // Células raw mapeadas diretamente para fácil serialização XML
  [key: `E${number}`]: unknown;
}

// ============================================================================
// 2. AVALIAÇÃO (Aba Avaliação / sheet14.xml)
// ============================================================================

export interface ImovelVinculado {
  id: number;
  denominacao: string; // Coluna D (linhas 7, 8, 9)
  municipio: string; // Coluna E (visaoMUNI)
  tipoProprietario: 'P.Física' | 'P.Jurídica' | ''; // Coluna H
  nomeProprietario: string; // Coluna I
  cpfCnpjProprietario: string; // Coluna J
  areaLegal: number; // Coluna K
  realizaInversao: 'Sim' | 'Não' | ''; // Coluna L
  compoeGarantia: 'Sim' | 'Não' | ''; // Coluna M (visaoSIM_NAO)
}

export interface ItemExploracaoTerra {
  descricao: string; // lista_ANALISADOR_DESC_ATIVIDADE
  areaHa: number;
  idadeMeses: number;
  valorUnitario: number;
}

export interface BenfeitoriaAvaliada {
  descricao: string; // D
  idadeAnos: number; // E
  valorReposicao: number; // G
  estadoConservacao: string; // I (visaoCONS)
  depreciacaoPercent: number; // K
  valorAvaliado: number;
}

export interface InformacoesAdicionaisImovel {
  idImovel: number;
  nirf: string; // E (Alfanumérico 8)
  cei: string; // G (12 dígitos)
  sncr: string; // I (13 dígitos)
  registroCar: string; // J (41 caracteres)
  numeroOutorgaAgua: string; // P
  percentualPreservacaoAcimaLimite: number; // Q
  embargosIbama: 'Sim' | 'Não' | ''; // E302..E305
  unidadesConservacao: 'Sim' | 'Não' | ''; // G302..G305
  florestasPublicasNaoDestinadas: 'Sim' | 'Não' | ''; // I302..I305
  bonusCarPercent: number;
}

export interface SemoventeItem {
  especie: 'Bovino Leite' | 'Bovino Corte' | 'Ovino' | 'Caprino' | 'Outros';
  categoria: string;
  quantidadeCabecas: number;
  racaMesticagem: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface ImovelAvaliacaoDetalhe {
  exploracaoAgricola: ItemExploracaoTerra[]; // 10 itens
  exploracaoPecuaria: ItemExploracaoTerra[]; // 10 itens
  reservaFlorestalArea: number;
  reservaFlorestalValorUnit: number;
  terrasInaproveitaveisArea: number;
  terrasInaproveitaveisValorUnit: number;
  ocupadasBenfeitoriasArea: number;
  ocupadasBenfeitoriasValorUnit: number;
  terraNuaArea: number;
  terraNuaValorUnit: number;
  benfeitorias: BenfeitoriaAvaliada[]; // 20 itens
}

export interface AvaliacaoData {
  imoveis: ImovelVinculado[]; // 3 imóveis (linhas 7 a 9)
  detalhesImoveis: ImovelAvaliacaoDetalhe[]; // Detalhes para imóveis 1, 2 e 3
  maquinasEquipamentos: BenfeitoriaAvaliada[]; // Bens comuns (11 linhas: 192-202)
  veiculosEmbarcacoes: BenfeitoriaAvaliada[]; // Bens comuns (12 linhas: 205-216)
  moveisUtensilios: BenfeitoriaAvaliada[]; // Bens comuns (13 linhas: 218-230)
  semoventes: SemoventeItem[]; // Semoventes (linhas 242-290)
  informacoesAdicionais: InformacoesAdicionaisImovel[]; // 4 linhas: 296-299 e 302-305
  [cellCoord: string]: unknown;
}

// ============================================================================
// 3. PROPOSTA (Aba " Proposta" / sheet15.xml)
// ============================================================================

export interface InvestimentoItem {
  id: number;
  discriminacao: string; // D (≤ 70)
  compoeGarantia: 'Sim' | 'Não' | ''; // E (visaoSIM_NAO)
  quantidade: number; // F (≥ 0)
  unidade: string; // G (visaoUND)
  uso: string; // H (visaoUSO)
  numImovel: string; // I (Imoveis_Inversao)
  valorUnitario: number; // J
  recursosPropriosUnit: number; // L
  recursosPropriosTotal?: number; // M
  valorFinanciado?: number; // N
  investimentoTotal?: number; // O
}

export interface FinanciamentoExistente {
  id: number;
  discriminacao: string; // D
  agenteFinanc: 'BNB' | 'Outros' | ''; // F
  saldoDevedor: number; // G
  mesmaAtivConjuge: 'Sim' | 'Não' | ''; // I
  pertenceTitular: 'Sim' | 'Não' | ''; // J
  jurosPercentAa: number; // K
  carenciaMeses: number; // L
  prazoRestanteMeses: number; // N
  dataContratacao: string; // O
}

export interface GarantiaFidejussoria {
  cpf: string; // E137 / E139
  cnpj: string; // H137 / H139
  cpfConjuge: string; // M137 / M139
}

export interface OutraGarantia {
  id: number;
  denominacao: string; // D
  tipo: string; // J (padrão Hipoteca)
  valor: number; // N
}

export interface OperacaoDeclarada {
  id: number;
  bancoOuCooperativa: string;
  data: string;
  valor: number;
  fonteRecursos: string;
  comBonus200: 'Sim' | 'Não' | ''; // L
  bonus700: 'Sim' | 'Não' | ''; // N
  saldoDevedor: number;
}

export interface ParcelaInversaoProposta {
  id: number;
  parcela1Data: string; // G84..G124
  parcela2Data: string; // J84..J124
  parcela3Data: string; // M84..M124
  parcela4Data: string; // P84..P124
}

export interface PropostaData {
  // Cabeçalho (linhas 5-15)
  dataProposta: string; // E5 (dd/mm/aaaa)
  objetivoCredito: string; // J5 (visaoOBJ)
  programa: string; // E6 (visaoPRG)
  agencia: string; // E7 (visaoAGC)
  regiao: 'Semi-árido' | 'Fora do Semi-árido' | ''; // E8
  atividadePrincipal: string; // E9 (visaoATIV)
  finalidadeCredito: string; // E10 (padrão INVESTIMENTOS FIXOS)
  municipioDecretoEmergencia: 'Sim' | 'Não' | ''; // P9
  producaoAgroecologica: 'Sim' | 'Não' | ''; // P12
  propostaOrigemPlanosAcao: 'Sim' | 'Não' | ''; // P13
  empresaElaboradora: string; // E12
  cnpjEmpresaElaboradora: string; // E13
  elaborador: string; // E14
  cpfElaborador: string; // E15

  // Imóvel das Inversões (linha 22)
  imovelDenominacao: string; // D22
  imovelMunicipio: string; // H22
  imovelRegiao: string; // M22
  imovelNum: string; // O22

  // Programa de Investimentos (linhas 27-62, 36 itens)
  itensInvestimento: InvestimentoItem[];

  // Custeios Vinculados (linhas 64-65) e Assessoria (linha 69)
  custeioAgricolaValorUnit: number; // J64
  custeioAgricolaRecursosProprios: number; // L64
  custeioPecuarioValorUnit: number; // J65
  custeioPecuarioRecursosProprios: number; // L65
  assessoriaEmpresarialValor: number; // H69
  assessoriaEmpresarialRecursosProprios: number; // L69

  // Bases do Financiamento (linhas 75-79)
  prazoMeses: number;
  carenciaMeses: number;
  jurosPercentAa: number;
  rebatePercentAa: number;
  delCrederePercentAa: number;
  periodicidadeReembolso: string;
  metodoCalculo: string;

  // Cronograma de Parcelas por Inversão na Proposta (linhas 84-124, 41 itens)
  cronogramaParcelas: ParcelaInversaoProposta[];
  cronogramaExtraM125?: string; // M125

  // Financiamentos Existentes (linhas 129-133)
  financiamentosExistentes: FinanciamentoExistente[];

  // Garantias Fidejussórias (linhas 137-139) e Outras (linhas 142-144)
  garantiasFidejussorias: GarantiaFidejussoria[];
  outrasGarantias: OutraGarantia[];

  // Indicadores de Emprego (linha 155)
  nrEmpregadosAtual: number; // D155
  nrEmpregadosAno1: number; // E155
  nrEmpregadosAno2: number; // F155
  nrEmpregadosAno3: number; // G155
  nrEmpregadosAno4: number; // H155
  nrEmpregadosAno5: number; // I155

  // Comentários e Parecer (linhas 157-160)
  comentariosJustificativas: string; // Q157
  parecerTecnico: string; // Q159

  // Declarações (linhas 166-191)
  operacoesDeclaradas: OperacaoDeclarada[];
  anoDeclaracao: number; // P185 (1900-2100)

  [cellCoord: string]: unknown;
}

// ============================================================================
// 4. CRONOGRAMA (Aba Cronograma / sheet17.xml)
// ============================================================================

export interface CronogramaInversaoParcela {
  inversaoNum: number;
  parcelas: Array<{
    numero: number;
    mesAno: string; // Ex: mm/aaaa
    percentual: number; // 0-100
  }>;
}

export interface AplicacaoRecursosItem {
  id: number;
  valor: number; // F
  empreendimento: string; // J..M
  aplicacaoRecursos: string; // P:Q (visaoAPLIC)
}

export interface FinalidadeRecursoItem {
  id: number;
  finalidadeCredito: string; // G:K (listaFINALIDADE_APL_REC)
  codigoMda: string; // L (≤ 10)
  cfiBndes: string; // M:N (≤ 10)
}

export interface CronogramaData {
  inversoesParcelas: CronogramaInversaoParcela[];
  aplicacaoRecursos: AplicacaoRecursosItem[]; // linhas 202-240
  finalidadesRecursos: FinalidadeRecursoItem[]; // linhas 243-281
  [cellCoord: string]: unknown;
}

// ============================================================================
// 5. ATIVIDADE AGRÍCOLA (Aba "Ativ. Agrícola" / sheet20.xml)
// ============================================================================

export interface ProjecaoAnoUsoTerra {
  ano: number;
  area: number;
  uaHa: number;
}

export interface UsoTerraAgricolaItem {
  id: number;
  descricao: string; // D
  atualArea: number;
  atualUaHa: number;
  anos: ProjecaoAnoUsoTerra[]; // Anos 1 a 30
}

export interface ReceitaAgricolaItem {
  id: number;
  descricao: string;
  irrigacao: 'Irrigada' | 'Não Irrigada' | ''; // E
  unidade: string; // G (visaoUND_S400)
  valorUnitario: number; // I
  produtividadeAnos: number[]; // Anos 0 a 30
}

export interface AtividadeAgricolaData {
  usoTerrasAgricola: UsoTerraAgricolaItem[]; // Linhas 8-42
  usoTerrasPecuaria: UsoTerraAgricolaItem[]; // Linhas 44-78
  receitasAgricolas: ReceitaAgricolaItem[]; // Linhas 85-119
  utilizaCustoPadrao: 'Sim' | 'Não' | ''; // Linha 121
  atividadesEconomicas: string[]; // Linhas 166-200 (E:J)
  [cellCoord: string]: unknown;
}

// ============================================================================
// 6. ATIVIDADE PECUÁRIA (Aba "Ativ. Pecuária" / sheet21.xml)
// ============================================================================

export interface CategoriaPecuariaItem {
  categoria: string;
  quantidadeAtual: number;
  aAdquirir: number;
  equivalenciaUa: number;
  descartePercentAno1: number;
  descartePercentDemais: number;
  precoUnitarioVenda: number;
}

export interface CustosPecuariaExploracao {
  racaoPeriodoDias: number;
  racaoQtdeCabecaKg: number;
  racaoValorUnitarioKg: number;
  vacinasMedicamentosSaisMineraisCabecaAno: number;
  operarioCabecaAno: number;
}

export interface ExploracaoBovinoLeite {
  racaAtividade: string;
  categorias: CategoriaPecuariaItem[];
  paricaoPercent: number;
  mortalidadeAte1AnoPercent: number;
  mortalidade1a2AnosPercent: number;
  mortalidadeAdultoPercent: number;
  matrizesPorReprodutor: number;
  periodoLactacaoDias: number;
  leiteCabDiaLitros: number;
  leiteQueijoLitrosKg: number;
  vendaQueijoPercent: number;
  precoQueijoKg: number;
  precoLeiteLitro: number;
  matrizesEstabilizacaoCab: number;
  custos: CustosPecuariaExploracao;
}

export interface ExploracaoBovinoCorte {
  racaAtividade: string;
  categorias: CategoriaPecuariaItem[];
  paricaoPercent: number;
  mortalidadeAte1AnoPercent: number;
  mortalidade1a2AnosPercent: number;
  mortalidadeAdultoPercent: number;
  matrizesPorReprodutor: number;
  matrizesEstabilizacaoCab: number;
  custos: CustosPecuariaExploracao;
}

export interface ExploracaoOvinocultura {
  racaAtividade: string;
  categorias: CategoriaPecuariaItem[];
  paricaoPercent: number;
  prolificidadePercent: number;
  mortalidadeAte1AnoPercent: number;
  mortalidade1a2AnosPercent: number;
  mortalidadeAdultoPercent: number;
  matrizesPorReprodutor: number;
  matrizesEstabilizacaoCab: number;
  custos: CustosPecuariaExploracao;
}

export interface ExploracaoCaprinocultura {
  racaAtividade: string;
  categorias: CategoriaPecuariaItem[];
  paricaoPercent: number;
  prolificidadePercent: number;
  mortalidadeAte1AnoPercent: number;
  mortalidade1a2AnosPercent: number;
  mortalidadeAdultoPercent: number;
  matrizesPorReprodutor: number;
  periodoLactacaoDias: number;
  leiteDiaLitros: number;
  precoLeiteLitro: number;
  matrizesEstabilizacaoCab: number;
  custos: CustosPecuariaExploracao;
}

export interface AtividadePecuariaData {
  salarioMinimoReferencia: number;
  leite: ExploracaoBovinoLeite;
  corte: ExploracaoBovinoCorte;
  ovinos: ExploracaoOvinocultura;
  caprinos: ExploracaoCaprinocultura;
  [cellCoord: string]: unknown;
}

// ============================================================================
// 7. OUTRAS ATIVIDADES (Aba "Outras Ativ" / sheet22.xml)
// ============================================================================

export interface OutraReceitaItem {
  id: number;
  descricao: string; // D (visaoATIV_REB_CLAS)
  setorAtividade: string; // E (visaoSETATIV)
  atual: number;
  anos: number[]; // Anos 1 a 30
}

export interface OutrasAtividadesData {
  receitasAnuais: OutraReceitaItem[]; // Linhas 15-24
  receitasExtraRurais: number; // F70
  energiaEletrica: number; // F77
  combustiveisLubrificantes: number; // F78
  administrador: number; // F79
  subsistenciaFamilia: number; // F80
  outrasDespesas1: number; // F81
  outrasDespesas2: number; // F82
  atividadesEconomicas: string[]; // Linhas 93-102 (E)
  [cellCoord: string]: unknown;
}

// ============================================================================
// 8. CÁLCULO FINANCEIRO (Aba CalculoFinanceiro / sheet25.xml)
// ============================================================================

export interface ParametrosCalculoBloco {
  prazoMeses: number; // D13 / DD13
  carenciaMeses: number; // D14 / DD14
  jurosPercentAa: number; // D15 / DD15
  periodicidadeReembolso: string; // D16 / DD16 (visaoPER)
  amortizacoesIguais: 'Sim' | 'Não' | ''; // D17 / DD17 (visaoSIM_NAO)
}

export interface CalculoFinanceiroData {
  bloco1: ParametrosCalculoBloco; // D13..D17
  bloco2: ParametrosCalculoBloco; // DD13..DD17
  [cellCoord: string]: unknown;
}

// ============================================================================
// 9. PROJETO A2 COMPLETO
// ============================================================================

export interface ProjetoA2 {
  Cliente: ClienteData;
  'Avaliação': AvaliacaoData;
  ' Proposta': PropostaData;
  Cronograma: CronogramaData;
  'Ativ. Agrícola': AtividadeAgricolaData;
  'Ativ. Pecuária': AtividadePecuariaData;
  'Outras Ativ': OutrasAtividadesData;
  CalculoFinanceiro: CalculoFinanceiroData;
}

// ============================================================================
// VALORES INICIAIS PADRÃO
// ============================================================================

export function createInitialClienteData(): ClienteData {
  return {
    tipoCliente: 'Pessoa Física',
    nome: '',
    apelido: '',
    cpf: '',
    dataNascimento: '',
    numDocumento: '',
    dataEmissaoDoc: '',
    tipoDocumento: '',
    orgaoEmissorDoc: '',
    ufOrgaoEmissorDoc: '',
    tituloEleitoral: '',
    naturalidade: '',
    sexo: '',
    estadoCivil: '',
    grauInstrucao: '',
    profissao: '',
    atividade: '',
    rendaMensal: 0,
    beneficiarioPoliticasPublicas: '',
    nomePai: '',
    nomeMae: '',
    porte: '',
    numDap: '',
    capitalIntegralizado: '',
    ativTipoLogradouro: '',
    ativEndereco: '',
    ativNumero: '',
    ativComplemento: '',
    ativBairro: '',
    ativCep: '',
    ativMunicipio: '',
    ativDddTelefone: '',
    ativNumTelefone: '',
    corrTipoLogradouro: '',
    corrEndereco: '',
    corrNumero: '',
    corrComplemento: '',
    corrBairro: '',
    corrCep: '',
    corrMunicipio: '',
    corrDddTelefone: '',
    corrNumTelefone: '',
    imovelDenominacao: '',
    imovelArea: 0,
    imovelTipoUso: '',
    imovelProprietario: '',
    imovelCpfCnpjProprietario: '',
    imovelItinerario: '',
    conjugeNome: '',
    conjugeCpf: '',
    conjugeDataNascimento: '',
    conjugeNumDocumento: '',
    conjugeTipoDocumento: '',
    conjugeOrgaoEmissor: '',
    conjugeUfOrgaoEmissor: '',
    conjugeDataEmissao: '',
    conjugeSexo: '',
    conjugeEstadoCivil: '',
    conjugeGrauInstrucao: '',
    conjugeProfissao: '',
    conjugeRendaMensal: 0,
    conjugeNaturalidade: '',
    conjugeNomePai: '',
    conjugeNomeMae: '',
    socios: [
      { cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' },
      { cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' },
      { cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' },
      { cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' },
      { cpfCnpj: '', nome: '', participacao: '', representaEmpresa: '' }
    ]
  };
}

export function createInitialAvaliacaoData(): AvaliacaoData {
  const imoveis: ImovelVinculado[] = [1, 2, 3].map(id => ({
    id,
    denominacao: '',
    municipio: '',
    tipoProprietario: '',
    nomeProprietario: '',
    cpfCnpjProprietario: '',
    areaLegal: 0,
    realizaInversao: 'Não',
    compoeGarantia: 'Não'
  }));

  const detalhesImoveis: ImovelAvaliacaoDetalhe[] = [1, 2, 3].map(() => ({
    exploracaoAgricola: Array.from({ length: 10 }, () => ({
      descricao: '',
      areaHa: 0,
      idadeMeses: 0,
      valorUnitario: 0
    })),
    exploracaoPecuaria: Array.from({ length: 10 }, () => ({
      descricao: '',
      areaHa: 0,
      idadeMeses: 0,
      valorUnitario: 0
    })),
    reservaFlorestalArea: 0,
    reservaFlorestalValorUnit: 0,
    terrasInaproveitaveisArea: 0,
    terrasInaproveitaveisValorUnit: 0,
    ocupadasBenfeitoriasArea: 0,
    ocupadasBenfeitoriasValorUnit: 0,
    terraNuaArea: 0,
    terraNuaValorUnit: 0,
    benfeitorias: Array.from({ length: 20 }, () => ({
      descricao: '',
      idadeAnos: 0,
      valorReposicao: 0,
      estadoConservacao: '',
      depreciacaoPercent: 0,
      valorAvaliado: 0
    }))
  }));

  const informacoesAdicionais: InformacoesAdicionaisImovel[] = [1, 2, 3, 4].map(id => ({
    idImovel: id,
    nirf: '',
    cei: '',
    sncr: '',
    registroCar: '',
    numeroOutorgaAgua: '',
    percentualPreservacaoAcimaLimite: 0,
    embargosIbama: 'Não',
    unidadesConservacao: 'Não',
    florestasPublicasNaoDestinadas: 'Não',
    bonusCarPercent: 0
  }));

  return {
    imoveis,
    detalhesImoveis,
    maquinasEquipamentos: Array.from({ length: 11 }, () => ({
      descricao: '',
      idadeAnos: 0,
      valorReposicao: 0,
      estadoConservacao: '',
      depreciacaoPercent: 0,
      valorAvaliado: 0
    })),
    veiculosEmbarcacoes: Array.from({ length: 12 }, () => ({
      descricao: '',
      idadeAnos: 0,
      valorReposicao: 0,
      estadoConservacao: '',
      depreciacaoPercent: 0,
      valorAvaliado: 0
    })),
    moveisUtensilios: Array.from({ length: 13 }, () => ({
      descricao: '',
      idadeAnos: 0,
      valorReposicao: 0,
      estadoConservacao: '',
      depreciacaoPercent: 0,
      valorAvaliado: 0
    })),
    semoventes: [],
    informacoesAdicionais
  };
}

export function createInitialPropostaData(): PropostaData {
  return {
    dataProposta: '',
    objetivoCredito: 'Implantação',
    programa: '',
    agencia: '',
    regiao: 'Semi-árido',
    atividadePrincipal: '',
    finalidadeCredito: 'INVESTIMENTOS FIXOS',
    municipioDecretoEmergencia: 'Não',
    producaoAgroecologica: 'Não',
    propostaOrigemPlanosAcao: 'Não',
    empresaElaboradora: '',
    cnpjEmpresaElaboradora: '',
    elaborador: '',
    cpfElaborador: '',
    imovelDenominacao: '',
    imovelMunicipio: '',
    imovelRegiao: '',
    imovelNum: '',
    itensInvestimento: Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      discriminacao: '',
      compoeGarantia: 'Não',
      quantidade: 0,
      unidade: '',
      uso: '',
      numImovel: '',
      valorUnitario: 0,
      recursosPropriosUnit: 0
    })),
    custeioAgricolaValorUnit: 0,
    custeioAgricolaRecursosProprios: 0,
    custeioPecuarioValorUnit: 0,
    custeioPecuarioRecursosProprios: 0,
    assessoriaEmpresarialValor: 0,
    assessoriaEmpresarialRecursosProprios: 0,
    prazoMeses: 0,
    carenciaMeses: 0,
    jurosPercentAa: 4,
    rebatePercentAa: 0,
    delCrederePercentAa: 0,
    periodicidadeReembolso: '',
    metodoCalculo: '',
    cronogramaParcelas: Array.from({ length: 41 }, (_, i) => ({
      id: i + 1,
      parcela1Data: '',
      parcela2Data: '',
      parcela3Data: '',
      parcela4Data: ''
    })),
    cronogramaExtraM125: '',
    financiamentosExistentes: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      discriminacao: '',
      agenteFinanc: 'BNB',
      saldoDevedor: 0,
      mesmaAtivConjuge: 'Não',
      pertenceTitular: 'Sim',
      jurosPercentAa: 0,
      carenciaMeses: 0,
      prazoRestanteMeses: 0,
      dataContratacao: ''
    })),
    garantiasFidejussorias: [
      { cpf: '', cnpj: '', cpfConjuge: '' },
      { cpf: '', cnpj: '', cpfConjuge: '' }
    ],
    outrasGarantias: [
      { id: 1, denominacao: '', tipo: 'Hipoteca', valor: 0 },
      { id: 2, denominacao: '', tipo: 'Hipoteca', valor: 0 },
      { id: 3, denominacao: '', tipo: 'Hipoteca', valor: 0 }
    ],
    nrEmpregadosAtual: 0,
    nrEmpregadosAno1: 0,
    nrEmpregadosAno2: 0,
    nrEmpregadosAno3: 0,
    nrEmpregadosAno4: 0,
    nrEmpregadosAno5: 0,
    comentariosJustificativas: '',
    parecerTecnico: '',
    operacoesDeclaradas: Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      bancoOuCooperativa: '',
      data: '',
      valor: 0,
      fonteRecursos: '',
      comBonus200: 'Não',
      bonus700: 'Não',
      saldoDevedor: 0
    })),
    anoDeclaracao: new Date().getFullYear()
  };
}

export function createInitialCronogramaData(): CronogramaData {
  return {
    inversoesParcelas: Array.from({ length: 41 }, (_, i) => ({
      inversaoNum: i + 1,
      parcelas: Array.from({ length: 8 }, (_, p) => ({
        numero: p + 1,
        mesAno: '',
        percentual: 0
      }))
    })),
    aplicacaoRecursos: Array.from({ length: 39 }, (_, i) => ({
      id: i + 1,
      valor: 0,
      empreendimento: '',
      aplicacaoRecursos: ''
    })),
    finalidadesRecursos: Array.from({ length: 39 }, (_, i) => ({
      id: i + 1,
      finalidadeCredito: '',
      codigoMda: '',
      cfiBndes: ''
    }))
  };
}

export function createInitialAtividadeAgricolaData(): AtividadeAgricolaData {
  return {
    usoTerrasAgricola: Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      descricao: '',
      atualArea: 0,
      atualUaHa: 0,
      anos: []
    })),
    usoTerrasPecuaria: Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      descricao: '',
      atualArea: 0,
      atualUaHa: 0,
      anos: []
    })),
    receitasAgricolas: Array.from({ length: 35 }, (_, i) => ({
      id: i + 1,
      descricao: '',
      irrigacao: 'Não Irrigada',
      unidade: '',
      valorUnitario: 0,
      produtividadeAnos: []
    })),
    utilizaCustoPadrao: 'Não',
    atividadesEconomicas: Array.from({ length: 35 }, () => '')
  };
}

export function createInitialAtividadePecuariaData(): AtividadePecuariaData {
  const defaultCustos: CustosPecuariaExploracao = {
    racaoPeriodoDias: 0,
    racaoQtdeCabecaKg: 0,
    racaoValorUnitarioKg: 0,
    vacinasMedicamentosSaisMineraisCabecaAno: 0,
    operarioCabecaAno: 0
  };

  const categoriasBovino = [
    { categoria: 'Touro', equivalenciaUa: 1.5 },
    { categoria: 'Vacas', equivalenciaUa: 1.0 },
    { categoria: 'Novilhas', equivalenciaUa: 0.7 },
    { categoria: 'Novilhos', equivalenciaUa: 0.7 },
    { categoria: 'Garrotas', equivalenciaUa: 0.5 },
    { categoria: 'Garrotes', equivalenciaUa: 0.5 },
    { categoria: 'Bezerras', equivalenciaUa: 0.3 },
    { categoria: 'Bezerros', equivalenciaUa: 0.3 }
  ];

  const categoriasOvinosCaprinos = [
    { categoria: 'Reprodutor', equivalenciaUa: 0.16 },
    { categoria: 'Matrizes', equivalenciaUa: 0.14 },
    { categoria: 'Fêmeas 1 a 2 anos', equivalenciaUa: 0.10 },
    { categoria: 'Machos 1 a 2 anos', equivalenciaUa: 0.10 },
    { categoria: 'Fêmeas 0 a 1 ano', equivalenciaUa: 0.04 },
    { categoria: 'Machos 0 a 1 ano', equivalenciaUa: 0.04 }
  ];

  return {
    salarioMinimoReferencia: 1412,
    leite: {
      racaAtividade: '',
      categorias: categoriasBovino.map(c => ({
        categoria: c.categoria,
        quantidadeAtual: 0,
        aAdquirir: 0,
        equivalenciaUa: c.equivalenciaUa,
        descartePercentAno1: 0,
        descartePercentDemais: 0,
        precoUnitarioVenda: 0
      })),
      paricaoPercent: 0,
      mortalidadeAte1AnoPercent: 0,
      mortalidade1a2AnosPercent: 0,
      mortalidadeAdultoPercent: 0,
      matrizesPorReprodutor: 0,
      periodoLactacaoDias: 0,
      leiteCabDiaLitros: 0,
      leiteQueijoLitrosKg: 0,
      vendaQueijoPercent: 0,
      precoQueijoKg: 0,
      precoLeiteLitro: 0,
      matrizesEstabilizacaoCab: 0,
      custos: { ...defaultCustos }
    },
    corte: {
      racaAtividade: '',
      categorias: categoriasBovino.map(c => ({
        categoria: c.categoria,
        quantidadeAtual: 0,
        aAdquirir: 0,
        equivalenciaUa: c.equivalenciaUa,
        descartePercentAno1: 0,
        descartePercentDemais: 0,
        precoUnitarioVenda: 0
      })),
      paricaoPercent: 0,
      mortalidadeAte1AnoPercent: 0,
      mortalidade1a2AnosPercent: 0,
      mortalidadeAdultoPercent: 0,
      matrizesPorReprodutor: 0,
      matrizesEstabilizacaoCab: 0,
      custos: { ...defaultCustos }
    },
    ovinos: {
      racaAtividade: '',
      categorias: categoriasOvinosCaprinos.map(c => ({
        categoria: c.categoria,
        quantidadeAtual: 0,
        aAdquirir: 0,
        equivalenciaUa: c.equivalenciaUa,
        descartePercentAno1: 0,
        descartePercentDemais: 0,
        precoUnitarioVenda: 0
      })),
      paricaoPercent: 0,
      prolificidadePercent: 0,
      mortalidadeAte1AnoPercent: 0,
      mortalidade1a2AnosPercent: 0,
      mortalidadeAdultoPercent: 0,
      matrizesPorReprodutor: 0,
      matrizesEstabilizacaoCab: 0,
      custos: { ...defaultCustos }
    },
    caprinos: {
      racaAtividade: '',
      categorias: categoriasOvinosCaprinos.map(c => ({
        categoria: c.categoria,
        quantidadeAtual: 0,
        aAdquirir: 0,
        equivalenciaUa: c.equivalenciaUa,
        descartePercentAno1: 0,
        descartePercentDemais: 0,
        precoUnitarioVenda: 0
      })),
      paricaoPercent: 0,
      prolificidadePercent: 0,
      mortalidadeAte1AnoPercent: 0,
      mortalidade1a2AnosPercent: 0,
      mortalidadeAdultoPercent: 0,
      matrizesPorReprodutor: 0,
      periodoLactacaoDias: 0,
      leiteDiaLitros: 0,
      precoLeiteLitro: 0,
      matrizesEstabilizacaoCab: 0,
      custos: { ...defaultCustos }
    }
  };
}

export function createInitialOutrasAtividadesData(): OutrasAtividadesData {
  return {
    receitasAnuais: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      descricao: '',
      setorAtividade: '',
      atual: 0,
      anos: []
    })),
    receitasExtraRurais: 0,
    energiaEletrica: 0,
    combustiveisLubrificantes: 0,
    administrador: 0,
    subsistenciaFamilia: 0,
    outrasDespesas1: 0,
    outrasDespesas2: 0,
    atividadesEconomicas: Array.from({ length: 10 }, () => '')
  };
}

export function createInitialCalculoFinanceiroData(): CalculoFinanceiroData {
  return {
    bloco1: {
      prazoMeses: 0,
      carenciaMeses: 0,
      jurosPercentAa: 4,
      periodicidadeReembolso: 'Anual',
      amortizacoesIguais: 'Sim'
    },
    bloco2: {
      prazoMeses: 0,
      carenciaMeses: 0,
      jurosPercentAa: 4,
      periodicidadeReembolso: 'Anual',
      amortizacoesIguais: 'Sim'
    }
  };
}

export function createInitialProjetoA2(): ProjetoA2 {
  return {
    Cliente: createInitialClienteData(),
    'Avaliação': createInitialAvaliacaoData(),
    ' Proposta': createInitialPropostaData(),
    Cronograma: createInitialCronogramaData(),
    'Ativ. Agrícola': createInitialAtividadeAgricolaData(),
    'Ativ. Pecuária': createInitialAtividadePecuariaData(),
    'Outras Ativ': createInitialOutrasAtividadesData(),
    CalculoFinanceiro: createInitialCalculoFinanceiroData()
  };
}
