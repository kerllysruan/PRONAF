import { Buffer } from "buffer";
import officeCrypto from "officecrypto-tool";
import * as XLSX from "xlsx";
import { InversaoItem, InversaoReferencia } from "@/types/inversoes";

// Polyfills in browser if needed
if (typeof window !== "undefined") {
  if (!(window as any).Buffer) {
    (window as any).Buffer = Buffer;
  }
  if (!(window as any).global) {
    (window as any).global = window;
  }
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

export interface ExcelInversoesResult {
  success: boolean;
  items: InversaoItem[];
  custoAssessoria: number;
  totalItens: number;
  totalGeral: number;
  formatDetected?: string;
  error?: string;
}

export interface DadosProponenteData {
  tipoCliente?: string;
  nome?: string;
  apelido?: string;
  cpf?: string;
  rg?: string;
  dataEmissaoRg?: string;
  orgaoEmissor?: string;
  ufRg?: string;
  tipoDocumento?: string;
  dataNascimento?: string;
  naturalidade?: string;
  sexo?: string;
  estadoCivil?: string;
  grauInstrucao?: string;
  profissao?: string;
  atividadePrincipal?: string;
  rendaMensal?: number | string;
  nomeMae?: string;
  nomePai?: string;
  porte?: string;
  nomeConjuge?: string;
  cpfConjuge?: string;
  dataNascimentoConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  ufConjuge?: string;
  profissaoConjuge?: string;
  telefone?: string;
  email?: string;
  tipoLogradouro?: string;
  endereco?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  nomePropriedade?: string;
  localidade?: string;
  condicaoPosse?: string; // Proprietário, Assentado, Posseiro, Arrendatário, Parceiro, Comodatário, Anuência
  tipoProprietario?: string;
  nomeProprietario?: string;
  cpfProprietario?: string;
  areaTotalHa?: number;
  areaExploradaHa?: number;
  areaPastagemHa?: number;
  areaReservaHa?: number;
  dapCaf?: string;
  validadeDapCaf?: string;
  car?: string;
  nirf?: string;
  sncr?: string;
  ccir?: string;
  matricula?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  roteiroAcesso?: string;
  comentariosSolosAguada?: string;
  parecerTecnico?: string;
  elaborador?: string;
  cpfElaborador?: string;
  agenciaBnb?: string;
  objetivo?: string;
  linhaCredito?: string;
  custoAssessoria?: number;
}

export interface PastagemItem {
  tipo: string;
  especie?: string;
  areaHa: number;
  producaoMsTonHaAno?: number;
  producaoTotalTonAno?: number;
  estadoConservacao?: string;
}

export interface RebanhoItem {
  categoria: string;
  cabecas: number;
  fatorUa: number;
  totalUa: number;
}

export interface SuporteForrageiroData {
  temPecuaria: boolean;
  areaPastagemNativaHa: number;
  areaPastagemCultivadaHa: number;
  areaCapineiraHa: number;
  areaPalmaHa: number;
  areaOutrasForrageirasHa: number;
  areaTotalForrageiraHa: number;
  especiePastagem?: string;
  
  // Rebanho
  rebanhoCabecas: number;
  rebanhoTotalUa: number;
  taxaLotacaoUaHa: number; // UA / ha
  
  // Balanço de Matéria Seca (MS)
  producaoTotalMsAno?: number; // ton MS/ano
  consumoTotalMsAno?: number; // ton MS/ano
  saldoMsAno?: number; // producao - consumo
  periodoEstiagemMeses?: number; // meses de seca (ex: 6)
  estrategiaSuplementacao?: string; // Silagem, Feno, Palma, Concentrado
  parecerCapacidadeSuporte?: string; // Avaliação de adequação técnica
  
  pastagensDetalhadas?: PastagemItem[];
  rebanhoDetalhado?: RebanhoItem[];
}

export interface ExcelProposalParsed {
  success: boolean;
  producerName?: string;
  producerCpf?: string;
  producerPhone?: string;
  municipio?: string;
  localizacao?: string;
  dapCaf?: string;
  linhaCredito?: string;
  pronafLineId?: string;
  agenciaBnb?: string;
  atividade?: string;
  objetivo?: string;
  parecerTecnico?: string;
  roteiroAcesso?: string;
  elaborador?: string;
  cpfElaborador?: string;
  valorSolicitado?: number;

  // Dados completos extraídos
  dadosProponente?: DadosProponenteData;
  suporteForrageiro?: SuporteForrageiroData;

  items: InversaoItem[];
  custoAssessoria: number;
  totalItens: number;
  totalGeral: number;
  formatDetected?: string;
  error?: string;
}

function normalizeText(str: any): string {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function parseMoney(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const clean = String(val)
    .replace(/R\$\s?/gi, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

function mapUnidade(raw: any): string {
  const norm = normalizeText(raw);
  if (norm.startsWith("CAB")) return "CAB";
  if (norm.startsWith("HECT") || norm === "HA") return "HECT";
  if (norm.startsWith("KG") || norm.startsWith("QUIL")) return "KG";
  if (norm.startsWith("SC") || norm.startsWith("SAC")) return "SC";
  if (norm.startsWith("CX") || norm.startsWith("CAIX")) return "CX";
  if (norm === "T" || norm.startsWith("TON")) return "T";
  if (norm === "M") return "M";
  if (norm === "M2" || norm === "M²") return "M²";
  if (norm === "M3" || norm === "M³") return "M³";
  if (norm.startsWith("DZ") || norm.startsWith("DUZ")) return "DZ";
  if (norm.startsWith("LT") || norm.startsWith("LITR")) return "LT";
  if (norm.startsWith("DIA") || norm.startsWith("D/H")) return "DIA";
  return "UNID";
}

/**
 * Lê e extrai as inversões do plano de um arquivo Excel (.xlsx, .xlsm, .xls, .pronaf_a2, .csv).
 * Trata arquivos com criptografia / senha (senhasBNxI, senhasBN, etc.).
 */
export async function parseExcelInversoes(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options?: {
    findReferencia?: (nome: string) => InversaoReferencia | null;
    uf?: string;
    customPassword?: string;
  }
): Promise<ExcelInversoesResult> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Uint8Array) {
      arrayBuffer = fileOrBuffer.buffer as ArrayBuffer;
    } else {
      arrayBuffer = fileOrBuffer;
    }

    let fileBuffer = Buffer.from(arrayBuffer);

    // 1. Checa se o arquivo é protegido por senha
    let isEncrypted = false;
    try {
      isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
    } catch {
      isEncrypted = false;
    }

    let decryptedBuffer: Buffer | Uint8Array = fileBuffer;
    if (isEncrypted) {
      const passwords = [
        options?.customPassword,
        "senhasBN",
        "senhasBNxI",
        "senhasBNXI",
        "senhaBNxI",
        "senhaBNXI",
        "senhasbnxi",
        "senhasBNx1",
        "VelvetSweatshop",
      ].filter(Boolean) as string[];

      let decrypted = false;
      for (const pwd of passwords) {
        try {
          decryptedBuffer = await officeCrypto.decrypt(fileBuffer, { password: pwd });
          decrypted = true;
          break;
        } catch {
          // tenta a próxima senha
        }
      }

      if (!decrypted) {
        return {
          success: false,
          items: [],
          custoAssessoria: 0,
          totalItens: 0,
          totalGeral: 0,
          error: "O arquivo Excel está protegido com senha. Não foi possível descriptografar com a senha fornecida.",
        };
      }
    }

    // 2. Carrega o Workbook com XLSX
    const wb = XLSX.read(decryptedBuffer, { type: "buffer" });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      return {
        success: false,
        items: [],
        custoAssessoria: 0,
        totalItens: 0,
        totalGeral: 0,
        error: "Nenhuma planilha encontrada no arquivo enviado.",
      };
    }

    // 3. Estratégia 1: Formato SEAP / PRONAF-A (Aba BdPRONAF_C)
    if (wb.SheetNames.includes("BdPRONAF_C")) {
      const sheet = wb.Sheets["BdPRONAF_C"];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Detecta UF da proposta a partir do cabeçalho da linha 121 coluna 6 (ex: GOVERNADOR NUNES FREIRE-MA)
      let detectedUf = options?.uf;
      if (!detectedUf && rows[121] && rows[121][6]) {
        const matchUf = String(rows[121][6]).match(/[-/]\s*([A-Z]{2})$/i);
        if (matchUf) detectedUf = matchUf[1].toUpperCase();
      }

      const rawItems: any[] = [];
      let consecutiveEmpty = 0;
      for (let r = 121; r < Math.min(180, rows.length); r++) {
        const row = rows[r] || [];
        const desc = row[22];
        if (!desc || String(desc).trim() === "") {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 8) break;
          continue;
        }
        consecutiveEmpty = 0;

        const nome = String(desc).trim();
        const quant = Math.max(1, parseInt(row[24]) || 1);
        const unid = mapUnidade(row[25]);
        const valorUnit = parseMoney(row[27]);
        const valorTotal = Math.round(quant * valorUnit * 100) / 100;

        rawItems.push({
          quant,
          unid,
          nome: nome.toUpperCase(),
          valor_unitario: valorUnit,
          valor: valorTotal,
        });
      }

      let custoAssessoria = 0;
      const totalItens = rawItems.reduce((acc, i) => acc + i.valor, 0);
      const tipoAssessoria = rows[121] ? rows[121][68] : null;
      if (tipoAssessoria === 1 || tipoAssessoria === "1") {
        custoAssessoria = Math.round(totalItens * 0.05 * 100) / 100;
      }

      const finalItems = enrichItemsWithCatalog(rawItems, options?.findReferencia, detectedUf);

      return {
        success: true,
        formatDetected: "Projeto SEAP / PRONAF-A Oficial",
        items: finalItems,
        custoAssessoria,
        totalItens,
        totalGeral: totalItens + custoAssessoria,
      };
    }

    // 4. Estratégia 2: Varredura de tabelas orçamentárias padrão
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      for (let r = 0; r < Math.min(35, rows.length); r++) {
        const row = rows[r] || [];
        const colMap: Record<string, number> = {};

        row.forEach((cell, cIdx) => {
          const norm = normalizeText(cell);
          if (
            norm.includes("ITEM") ||
            norm.includes("DESCRIC") ||
            norm.includes("DISCRIMIN") ||
            norm.includes("ESPECIFIC") ||
            norm.includes("INVERS")
          ) {
            if (colMap.desc === undefined) colMap.desc = cIdx;
          } else if (norm.includes("QUANT") || norm === "QTD" || norm === "QTE") {
            colMap.quant = cIdx;
          } else if (norm.includes("UNID") || norm === "UND" || norm === "UN") {
            colMap.unid = cIdx;
          } else if (
            norm.includes("UNIT") ||
            norm.includes("VLR. UNIT") ||
            norm.includes("PRECO UNIT") ||
            norm.includes("PREÇO UNIT")
          ) {
            colMap.unit = cIdx;
          } else if (
            norm.includes("TOTAL") ||
            norm.includes("VALOR") ||
            norm.includes("SUBTOTAL")
          ) {
            colMap.total = cIdx;
          }
        });

        if (colMap.desc !== undefined && (colMap.total !== undefined || colMap.unit !== undefined)) {
          const rawItems: any[] = [];
          let custoAssessoria = 0;

          for (let rowIdx = r + 1; rowIdx < rows.length; rowIdx++) {
            const itemRow = rows[rowIdx] || [];
            const descRaw = itemRow[colMap.desc];
            if (!descRaw || String(descRaw).trim() === "") continue;

            const desc = String(descRaw).trim();
            const normDesc = normalizeText(desc);

            if (normDesc.startsWith("TOTAL") || normDesc.startsWith("SOMA")) break;

            const quant = colMap.quant !== undefined ? Math.max(1, parseInt(itemRow[colMap.quant]) || 1) : 1;
            const unid = colMap.unid !== undefined ? mapUnidade(itemRow[colMap.unid]) : "UNID";
            const unitRaw = colMap.unit !== undefined ? parseMoney(itemRow[colMap.unit]) : 0;
            const totalRaw = colMap.total !== undefined ? parseMoney(itemRow[colMap.total]) : 0;

            const valorUnit = unitRaw > 0 ? unitRaw : (totalRaw > 0 ? Math.round((totalRaw / quant) * 100) / 100 : 0);
            const valorTotal = totalRaw > 0 ? totalRaw : (valorUnit > 0 ? Math.round(quant * valorUnit * 100) / 100 : 0);

            if (normDesc.includes("ASSESSORIA") || normDesc.includes("ELABORACAO DO PROJETO") || normDesc.includes("ASSISTENCIA TECNICA")) {
              custoAssessoria = valorTotal;
              continue;
            }

            if (valorTotal > 0 || valorUnit > 0) {
              rawItems.push({
                quant,
                unid,
                nome: desc.toUpperCase(),
                valor_unitario: valorUnit,
                valor: valorTotal,
              });
            }
          }

          if (rawItems.length > 0) {
            const totalItens = rawItems.reduce((acc, i) => acc + i.valor, 0);
            const finalItems = enrichItemsWithCatalog(rawItems, options?.findReferencia, options?.uf);
            return {
              success: true,
              formatDetected: `Tabela Orçamentária (${sheetName})`,
              items: finalItems,
              custoAssessoria,
              totalItens,
              totalGeral: totalItens + custoAssessoria,
            };
          }
        }
      }
    }

    return {
      success: false,
      items: [],
      custoAssessoria: 0,
      totalItens: 0,
      totalGeral: 0,
      error: "Não foi possível encontrar colunas de itens/inversões válidas na planilha informada.",
    };
  } catch (err: any) {
    console.error("Erro ao processar planilha Excel:", err);
    return {
      success: false,
      items: [],
      custoAssessoria: 0,
      totalItens: 0,
      totalGeral: 0,
      error: err?.message || "Erro inesperado ao ler a planilha Excel.",
    };
  }
}

function enrichItemsWithCatalog(
  rawItems: any[],
  findReferencia?: (nome: string) => InversaoReferencia | null,
  uf?: string
): InversaoItem[] {
  return rawItems.map((item) => {
    let item_referencia_id: string | null = null;
    let teto_maximo: number | null = null;
    let unid = item.unid;

    if (findReferencia) {
      const ref = findReferencia(item.nome);
      if (ref) {
        item_referencia_id = ref.id;
        unid = ref.unidade_padrao || unid;
        let teto = ref.valor_maximo;
        if (uf && ref.precos_por_uf && ref.precos_por_uf[uf]) {
          teto = ref.precos_por_uf[uf];
        }
        teto_maximo = teto;
      }
    }

    return {
      quant: item.quant,
      unid,
      nome: item.nome,
      valor_unitario: item.valor_unitario,
      valor: item.valor,
      item_referencia_id,
      teto_maximo,
    };
  });
}

export function matchPronafLineId(text: string): { id: string; label: string } {
  const norm = normalizeText(text);
  if (norm.includes("368") || norm.includes("669") || norm.includes("PRONAF A") || norm.includes("GRUPO A")) {
    return norm.includes("669")
      ? { id: "pronaf_a_669", label: "Pronaf Grupo A (Res. 669)" }
      : { id: "pronaf_a_368", label: "Pronaf Grupo A (Res. 368)" };
  }
  if (norm.includes("MAIS ALIMENTO")) {
    return { id: "pronaf_mais_alimento", label: "Pronaf Mais Alimentos" };
  }
  if (norm.includes("CARTAO") || norm.includes("CARTÃO")) {
    return { id: "cartao_bnb", label: "Cartão BNB Agro" };
  }
  if (norm.includes("JOVEM") || norm.includes("MULHER")) {
    return { id: "pronaf_jovem", label: "Pronaf Jovem / Mulher" };
  }
  if (norm.includes("RENOV")) {
    return { id: "custeio_renovacao", label: "Custeio Pecuário / Renovação" };
  }
  if (norm.includes("CUSTEIO")) {
    return { id: "custeio", label: "Custeio Agrícola" };
  }
  if (norm.includes("INVEST")) {
    return { id: "investimento", label: "Pronaf Investimento Geral" };
  }
  return { id: "custeio", label: "Custeio Agrícola" };
}

export function parseExcelDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) {
    return val.toLocaleDateString("pt-BR");
  }
  if (typeof val === "number" && val > 1000 && val < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR");
    }
  }
  const str = String(val).trim();
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, "0")}/${dmyMatch[2].padStart(2, "0")}/${dmyMatch[3]}`;
  }
  const ymdMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, "0")}/${ymdMatch[2].padStart(2, "0")}/${ymdMatch[1]}`;
  }
  return str;
}

export function parseHectares(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const str = String(val)
    .replace(/ha/gi, "")
    .replace(/hectares?/gi, "")
    .trim();
  return parseMoney(str);
}

export function extractDadosProponente(
  wb: XLSX.WorkBook,
  rowsBdPRONAF_C?: any[][]
): DadosProponenteData {
  const dados: DadosProponenteData = {};

  // 1. Tenta extrair de BdPRONAF_C se disponível (formato oficial SEAP / BNB)
  if (rowsBdPRONAF_C && rowsBdPRONAF_C.length > 11) {
    const r11 = rowsBdPRONAF_C[11] || []; // Linha 12: Cliente & Cônjuge
    const r21 = rowsBdPRONAF_C[21] || []; // Linha 22: Imóvel & Posse
    const r121 = rowsBdPRONAF_C[121] || []; // Linha 122: Operação & Parecer

    // Proponente (Linha 12)
    if (r11[4]) dados.tipoCliente = String(r11[4]).trim();
    if (r11[5]) dados.nome = String(r11[5]).trim().toUpperCase();
    if (r11[6]) dados.apelido = String(r11[6]).trim().toUpperCase();
    if (r11[7]) {
      const clean = String(r11[7]).replace(/\D/g, "");
      dados.cpf = clean.length === 11 ? clean : String(r11[7]).trim();
    }
    if (r11[8]) dados.dataNascimento = parseExcelDate(r11[8]);
    if (r11[9]) dados.rg = String(r11[9]).trim();
    if (r11[10]) dados.dataEmissaoRg = parseExcelDate(r11[10]);
    if (r11[12]) dados.tipoDocumento = String(r11[12]).trim();
    if (r11[13]) dados.orgaoEmissor = String(r11[13]).trim().toUpperCase();
    if (r11[14]) dados.ufRg = String(r11[14]).trim().toUpperCase();
    if (r11[16]) dados.naturalidade = String(r11[16]).trim().toUpperCase();
    if (r11[17]) dados.sexo = String(r11[17]).trim();
    if (r11[18]) dados.estadoCivil = String(r11[18]).trim();
    if (r11[19]) dados.grauInstrucao = String(r11[19]).trim();
    if (r11[20]) dados.profissao = String(r11[20]).trim();
    if (r11[21]) dados.atividadePrincipal = String(r11[21]).trim();
    if (r11[22]) dados.rendaMensal = parseMoney(r11[22]);
    if (r11[24]) dados.nomePai = String(r11[24]).trim().toUpperCase();
    if (r11[25]) dados.nomeMae = String(r11[25]).trim().toUpperCase();
    if (r11[27]) dados.porte = String(r11[27]).trim();
    if (r11[28]) dados.dapCaf = String(r11[28]).trim();

    // Endereço / Localização do Proponente (Linha 12)
    if (r11[34]) dados.tipoLogradouro = String(r11[34]).trim();
    if (r11[35]) dados.endereco = String(r11[35]).trim().toUpperCase();
    if (r11[37]) dados.complemento = String(r11[37]).trim();
    if (r11[38]) dados.bairro = String(r11[38]).trim().toUpperCase();
    if (r11[39]) dados.cep = String(r11[39]).trim();
    if (r11[40]) {
      const munStr = String(r11[40]).trim();
      if (munStr.includes("-")) {
        const parts = munStr.split(/[-/]/);
        dados.municipio = parts[0].trim().toUpperCase();
        dados.uf = parts[1].trim().toUpperCase();
      } else {
        dados.municipio = munStr.toUpperCase();
      }
    }

    // Telefone (Linha 12)
    const ddd = r11[41] ? String(r11[41]).replace(/\D/g, "") : "";
    const numTel = r11[42] ? String(r11[42]).replace(/\D/g, "") : "";
    if (numTel) {
      dados.telefone = ddd ? `(${ddd}) ${numTel}` : numTel;
    }

    // Posse & Roteiro de Acesso (Linha 12)
    if (r11[58]) dados.condicaoPosse = String(r11[58]).trim();
    if (r11[62]) dados.roteiroAcesso = String(r11[62]).trim();

    // Cônjuge (Linha 12)
    if (r11[63]) dados.nomeConjuge = String(r11[63]).trim().toUpperCase();
    if (r11[64]) {
      const cleanConj = String(r11[64]).replace(/\D/g, "");
      dados.cpfConjuge = cleanConj.length === 11 ? cleanConj : cleanConj.padStart(11, "0");
    }
    if (r11[65]) dados.dataNascimentoConjuge = parseExcelDate(r11[65]);
    if (r11[66]) dados.rgConjuge = String(r11[66]).trim();
    if (r11[68]) dados.orgaoEmissorConjuge = String(r11[68]).trim().toUpperCase();
    if (r11[69]) dados.ufConjuge = String(r11[69]).trim().toUpperCase();
    if (r11[74]) dados.profissaoConjuge = String(r11[74]).trim();

    // Imóvel & Posse (Linha 22)
    if (r21[4]) {
      dados.nomePropriedade = String(r21[4]).trim().toUpperCase();
      if (!dados.localidade) dados.localidade = dados.nomePropriedade;
    }
    if (r21[5] && !dados.municipio) {
      const munParts = String(r21[5]).split(/[-/]/);
      dados.municipio = munParts[0].trim().toUpperCase();
      if (munParts[1] && !dados.uf) dados.uf = munParts[1].trim().toUpperCase();
    }
    if (r21[6]) dados.areaTotalHa = parseHectares(r21[6]);
    if (r21[10]) dados.comentariosSolosAguada = String(r21[10]).trim();
    if (r21[55]) dados.nirf = String(r21[55]).trim();
    if (r21[57]) dados.sncr = String(r21[57]).trim();
    if (r21[58]) dados.car = String(r21[58]).trim().toUpperCase();
    if (r21[59]) dados.tipoProprietario = String(r21[59]).trim();
    if (r21[60]) dados.nomeProprietario = String(r21[60]).trim().toUpperCase();
    if (r21[61]) dados.cpfProprietario = String(r21[61]).trim();

    // Coberturas, Reserva e Pastagens (Linhas 21 a 55)
    for (let r = 21; r < Math.min(55, rowsBdPRONAF_C.length); r++) {
      const row = rowsBdPRONAF_C[r];
      if (!row) continue;
      const descCultura = row[13] ? String(row[13]).trim() : "";
      const areaCultura = parseHectares(row[14]);
      const normCultura = normalizeText(descCultura);

      if (normCultura.includes("RESERVA") || normCultura.includes("FLORESTAL") || normCultura.includes("PRESERV")) {
        if (areaCultura > 0) dados.areaReservaHa = areaCultura;
      } else if (normCultura.includes("PAST") || normCultura.includes("CAPIM") || normCultura.includes("BRACHIAR") || normCultura.includes("MOMBAC")) {
        if (areaCultura > 0) {
          dados.areaPastagemHa = (dados.areaPastagemHa || 0) + areaCultura;
        }
      } else if (areaCultura > 0 && !normCultura.includes("INAPROVEIT")) {
        dados.areaExploradaHa = (dados.areaExploradaHa || 0) + areaCultura;
      }
    }

    // Operação e Parecer Técnico (Linha 122)
    if (r121[5]) dados.linhaCredito = String(r121[5]).trim();
    if (r121[6]) dados.agenciaBnb = String(r121[6]).trim().toUpperCase();
    if (r121[8] && !dados.atividadePrincipal) dados.atividadePrincipal = String(r121[8]).trim();
    if (r121[13]) dados.elaborador = String(r121[13]).trim().toUpperCase();
    if (r121[14]) dados.cpfElaborador = String(r121[14]).trim();
    if (r121[15]) dados.objetivo = String(r121[15]).trim();
    if (r121[55]) dados.parecerTecnico = String(r121[55]).trim();
  }

  // 2. Varredura ampla em todas as abas
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) continue;

    for (let r = 0; r < Math.min(120, rows.length); r++) {
      const row = rows[r] || [];
      for (let c = 0; c < Math.min(30, row.length); c++) {
        const cell = row[c];
        if (cell === null || cell === undefined) continue;

        const strVal = String(cell).trim();
        const norm = normalizeText(strVal);

        const getNextVal = () => {
          const nextInRow =
            row[c + 1] !== undefined && row[c + 1] !== null && String(row[c + 1]).trim() !== ""
              ? row[c + 1]
              : row[c + 2];
          if (nextInRow !== undefined && nextInRow !== null && String(nextInRow).trim() !== "")
            return nextInRow;
          const nextInCol = rows[r + 1] ? rows[r + 1][c] : null;
          return nextInCol !== undefined && nextInCol !== null && String(nextInCol).trim() !== ""
            ? nextInCol
            : "";
        };

        // Nome / Produtor
        if (
          !dados.nome &&
          (norm === "NOME" ||
            norm === "NOME:" ||
            norm === "PRODUTOR" ||
            norm === "PRODUTOR:" ||
            norm === "PROPONENTE" ||
            norm === "PROPONENTE:" ||
            norm === "BENEFICIARIO" ||
            norm === "BENEFICIARIO:" ||
            norm === "CLIENTE" ||
            norm === "TITULAR")
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 3 && next.includes(" ") && !/\d/.test(next)) {
            dados.nome = next.toUpperCase();
          }
        }

        // CPF
        if (!dados.cpf) {
          const cpfMatch = strVal.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
          if (cpfMatch) {
            dados.cpf = cpfMatch[0].replace(/\D/g, "");
          } else if (norm === "CPF" || norm === "CPF:" || norm === "CPF/MF") {
            const next = String(getNextVal()).replace(/\D/g, "");
            if (next.length === 11) dados.cpf = next;
          }
        }

        // RG / Identidade
        if (
          !dados.rg &&
          (norm === "RG" ||
            norm === "RG:" ||
            norm === "IDENTIDADE" ||
            norm === "DOC. IDENTIDADE" ||
            norm === "DOC IDENTIDADE" ||
            norm === "DOCUMENTO IDENTIDADE")
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length >= 4) {
            dados.rg = next;
          }
        }

        // Órgão Emissor / SSP
        if (
          !dados.orgaoEmissor &&
          (norm.includes("ORGAO EMISSOR") ||
            norm.includes("ORG EMISSOR") ||
            norm.includes("EXPEDIDOR") ||
            norm === "SSP" ||
            norm === "ORG.")
        ) {
          const next = String(getNextVal()).trim();
          if (next) dados.orgaoEmissor = next.toUpperCase();
        }

        // Data de Nascimento
        if (
          !dados.dataNascimento &&
          (norm.includes("DATA NASC") ||
            norm.includes("DT NASC") ||
            norm.includes("NASCIMENTO") ||
            norm === "DT. NASC." ||
            norm === "DATA DE NASCIMENTO")
        ) {
          const next = getNextVal();
          const parsedD = parseExcelDate(next);
          if (parsedD) dados.dataNascimento = parsedD;
        }

        // Estado Civil
        if (
          !dados.estadoCivil &&
          (norm === "ESTADO CIVIL" || norm === "ESTADO CIVIL:" || norm === "EST. CIVIL")
        ) {
          const next = normalizeText(getNextVal());
          if (next.includes("CASAD")) dados.estadoCivil = "Casado(a)";
          else if (next.includes("SOLTEIR")) dados.estadoCivil = "Solteiro(a)";
          else if (next.includes("UNIAO") || next.includes("ESTAVEL")) dados.estadoCivil = "União Estável";
          else if (next.includes("DIVORC")) dados.estadoCivil = "Divorciado(a)";
          else if (next.includes("VIUV")) dados.estadoCivil = "Viúvo(a)";
        }

        // Cônjuge
        if (
          !dados.nomeConjuge &&
          (norm === "CONJUGE" ||
            norm === "CONJUGE:" ||
            norm === "ESPOSA" ||
            norm === "ESPOSO" ||
            norm === "NOME DO CONJUGE")
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 3 && !/\d/.test(next)) {
            dados.nomeConjuge = next.toUpperCase();
          }
        }
        if (
          !dados.cpfConjuge &&
          (norm.includes("CPF CONJUGE") ||
            norm.includes("CPF DO CONJUGE") ||
            norm.includes("CPF ESPOS"))
        ) {
          const next = String(getNextVal()).replace(/\D/g, "");
          if (next.length === 11) dados.cpfConjuge = next;
        }

        // Telefone
        if (
          !dados.telefone &&
          (norm.includes("TELEFONE") ||
            norm.includes("FONE") ||
            norm.includes("WHATSAPP") ||
            norm.includes("CELULAR"))
        ) {
          const next = String(getNextVal()).replace(/\D/g, "");
          if (next.length >= 10 && next.length <= 11) {
            dados.telefone = next;
          }
        }

        // Município / UF
        if (
          !dados.municipio &&
          (norm === "MUNICIPIO" ||
            norm === "MUNICIPIO:" ||
            norm === "CIDADE" ||
            norm === "CIDADE:")
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 2 && !/\d/.test(next)) {
            dados.municipio = next.toUpperCase();
          }
        }
        if (!dados.uf && (norm === "UF" || norm === "UF:" || norm === "ESTADO" || norm === "ESTADO:")) {
          const next = String(getNextVal()).trim().toUpperCase();
          if (next.length === 2) dados.uf = next;
        }

        // Propriedade / Imóvel / Localidade
        if (
          !dados.nomePropriedade &&
          (norm === "PROPRIEDADE" ||
            norm === "PROPRIEDADE:" ||
            norm === "IMOVEL" ||
            norm === "IMOVEL:" ||
            norm === "DENOMINACAO" ||
            norm === "NOME DO IMOVEL" ||
            norm === "FAZENDA / SITIO" ||
            norm === "LOCALIZACAO")
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 2) {
            dados.nomePropriedade = next.toUpperCase();
            if (!dados.localidade) dados.localidade = next.toUpperCase();
          }
        }

        // Condição de Posse
        if (
          !dados.condicaoPosse &&
          (norm.includes("CONDICAO") ||
            norm.includes("POSSE") ||
            norm.includes("VINCULO COM A TERRA") ||
            norm === "COND. POSSE")
        ) {
          const next = normalizeText(getNextVal());
          if (next.includes("PROPRIET")) dados.condicaoPosse = "Proprietário";
          else if (next.includes("ASSENT")) dados.condicaoPosse = "Assentado";
          else if (next.includes("POSSE")) dados.condicaoPosse = "Posseiro";
          else if (next.includes("ARREND")) dados.condicaoPosse = "Arrendatário";
          else if (next.includes("COMOD")) dados.condicaoPosse = "Comodatário";
          else if (next.includes("PARC")) dados.condicaoPosse = "Parceiro";
        }

        // Área Total (ha)
        if (
          !dados.areaTotalHa &&
          (norm === "AREA TOTAL" ||
            norm === "AREA TOTAL (HA)" ||
            norm === "AREA DO IMOVEL" ||
            norm === "AREA TOTAL:" ||
            norm === "SUPERFICIE TOTAL")
        ) {
          const next = getNextVal();
          const parsed = parseHectares(next);
          if (parsed > 0) dados.areaTotalHa = parsed;
        }

        // Área Explorada (ha)
        if (
          !dados.areaExploradaHa &&
          (norm.includes("AREA EXPLORADA") ||
            norm.includes("AREA PRODUTIVA") ||
            norm.includes("AREA AGRICOLA") ||
            norm.includes("AREA UTILIZADA"))
        ) {
          const next = getNextVal();
          const parsed = parseHectares(next);
          if (parsed > 0) dados.areaExploradaHa = parsed;
        }

        // DAP / CAF
        if (
          !dados.dapCaf &&
          (norm.includes("DAP") || norm.includes("CAF") || norm.includes("DECLARACAO DE APTIDAO"))
        ) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 3) dados.dapCaf = next;
        }

        // CAR
        if (!dados.car && (norm === "CAR" || norm === "CAR:" || norm.includes("CADASTRO AMBIENTAL"))) {
          const next = String(getNextVal()).trim();
          if (next && next.length > 5) dados.car = next;
        }

        // NIRF / CCIR
        if (!dados.nirf && (norm === "NIRF" || norm === "NIRF:")) {
          const next = String(getNextVal()).trim();
          if (next) dados.nirf = next;
        }
        if (!dados.ccir && (norm === "CCIR" || norm === "CCIR:")) {
          const next = String(getNextVal()).trim();
          if (next) dados.ccir = next;
        }

        // Agência / Conta
        if (!dados.agencia && (norm === "AGENCIA" || norm === "AGENCIA:" || norm === "AG.")) {
          const next = String(getNextVal()).trim();
          if (next) dados.agencia = next;
        }
        if (
          !dados.conta &&
          (norm === "CONTA" || norm === "CONTA:" || norm === "C/C" || norm === "CONTA CORRENTE")
        ) {
          const next = String(getNextVal()).trim();
          if (next) dados.conta = next;
        }
      }
    }
  }

  return dados;
}

export function extractSuporteForrageiro(
  wb: XLSX.WorkBook,
  items: InversaoItem[],
  rowsBdPRONAF_C?: any[][]
): SuporteForrageiroData {
  let temPecuaria = false;
  let areaPastagemNativaHa = 0;
  let areaPastagemCultivadaHa = 0;
  let areaCapineiraHa = 0;
  let areaPalmaHa = 0;
  let areaOutrasForrageirasHa = 0;
  let especiePastagem = "";
  let rebanhoCabecas = 0;
  let rebanhoTotalUa = 0;
  let taxaLotacaoUaHa = 0;
  let producaoTotalMsAno = 0;
  let consumoTotalMsAno = 0;
  let saldoMsAno = 0;
  let periodoEstiagemMeses = 6;
  let estrategiaSuplementacao = "";
  let parecerCapacidadeSuporte = "";

  const pastagensDetalhadas: PastagemItem[] = [];
  const rebanhoDetalhado: RebanhoItem[] = [];

  const scanForageInSheet = (rows: any[][]) => {
    for (let r = 0; r < Math.min(150, rows.length); r++) {
      const row = rows[r] || [];
      for (let c = 0; c < Math.min(30, row.length); c++) {
        const cell = row[c];
        if (cell === null || cell === undefined) continue;

        const strVal = String(cell).trim();
        const norm = normalizeText(strVal);

        const getNextNum = (): number => {
          const nextInRow =
            row[c + 1] !== undefined && row[c + 1] !== null && String(row[c + 1]).trim() !== ""
              ? row[c + 1]
              : row[c + 2];
          let num = parseMoney(nextInRow);
          if (num === 0 && rows[r + 1]) {
            num = parseMoney(rows[r + 1][c]);
          }
          return num;
        };

        // Pastagem Nativa
        if (norm.includes("PASTO NATIV") || norm.includes("PASTAGEM NATIV") || norm.includes("CAMPO NATIV")) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && areaPastagemNativaHa === 0) areaPastagemNativaHa = val;
        }

        // Pastagem Cultivada / Formada
        if (
          norm.includes("PASTO CULTIVAD") ||
          norm.includes("PASTAGEM CULTIVAD") ||
          norm.includes("PASTO FORMAD") ||
          norm.includes("PASTAGEM FORMAD") ||
          norm.includes("BRACHIARIA") ||
          norm.includes("BRAQUIARIA") ||
          norm.includes("MOMBACA") ||
          norm.includes("MASSAI") ||
          norm.includes("TANZANIA") ||
          norm.includes("BUFFEL") ||
          norm.includes("ANDROPOGON")
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && areaPastagemCultivadaHa === 0) {
            areaPastagemCultivadaHa = val;
          }
          if (!especiePastagem) {
            if (norm.includes("BRACHIARIA") || norm.includes("BRAQUIARIA"))
              especiePastagem = "Brachiaria brizantha / decumbens";
            else if (norm.includes("MOMBACA")) especiePastagem = "Panicum maximum cv. Mombaça";
            else if (norm.includes("MASSAI")) especiePastagem = "Panicum maximum cv. Massai";
            else if (norm.includes("BUFFEL")) especiePastagem = "Cenchrus ciliaris (Capim Buffel)";
            else if (norm.includes("TANZANIA")) especiePastagem = "Panicum maximum cv. Tanzânia";
            else if (norm.includes("ANDROPOGON")) especiePastagem = "Andropogon gayanus";
          }
        }

        // Capineira / Canavial
        if (
          norm.includes("CAPINEIRA") ||
          norm.includes("CANAVIAL") ||
          norm.includes("CAPIACU") ||
          norm.includes("CAPIM ELEFANTE") ||
          norm.includes("CANA-DE-ACUCAR") ||
          norm.includes("CANA DE ACUCAR")
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && areaCapineiraHa === 0) areaCapineiraHa = val;
        }

        // Palma Forrageira
        if (
          norm.includes("PALMA") ||
          norm.includes("PALMA FORRAGEIRA") ||
          norm.includes("PALMA ADENSADA") ||
          norm.includes("ORELHA DE ELEFANTE")
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && areaPalmaHa === 0) areaPalmaHa = val;
        }

        // Rebanho / Cabeças
        if (
          norm.includes("TOTAL DE CABECAS") ||
          norm.includes("REBANHO TOTAL") ||
          norm.includes("TOTAL DO REBANHO") ||
          norm === "EFETIVO DO REBANHO" ||
          norm === "REBANHO (CAB)"
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && rebanhoCabecas === 0) rebanhoCabecas = Math.round(val);
        }

        // UA (Unidades Animais)
        if (
          norm === "TOTAL UA" ||
          norm === "UA TOTAL" ||
          norm === "UNIDADES ANIMAIS" ||
          norm === "UA" ||
          norm.includes("TOTAL DE UA")
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && rebanhoTotalUa === 0) rebanhoTotalUa = Math.round(val * 10) / 10;
        }

        // Taxa de Lotação
        if (
          norm.includes("TAXA DE LOTACAO") ||
          norm.includes("LOTACAO (UA/HA)") ||
          norm === "UA/HA" ||
          norm.includes("LOTACAO PROJETADA")
        ) {
          temPecuaria = true;
          const val = getNextNum();
          if (val > 0 && taxaLotacaoUaHa === 0) taxaLotacaoUaHa = Math.round(val * 100) / 100;
        }

        // Balanço MS
        if (
          norm.includes("PRODUCAO DE MS") ||
          norm.includes("PRODUCAO TOTAL MS") ||
          norm.includes("OFERTA DE MS")
        ) {
          const val = getNextNum();
          if (val > 0 && producaoTotalMsAno === 0) producaoTotalMsAno = Math.round(val * 10) / 10;
        }
        if (
          norm.includes("CONSUMO DE MS") ||
          norm.includes("DEMANDA DE MS") ||
          norm.includes("DEMANDA TOTAL MS")
        ) {
          const val = getNextNum();
          if (val > 0 && consumoTotalMsAno === 0) consumoTotalMsAno = Math.round(val * 10) / 10;
        }
        if (
          norm.includes("PERIODO DE ESTIAGEM") ||
          norm.includes("MESES DE SECA") ||
          norm.includes("PERIODO SECO")
        ) {
          const val = getNextNum();
          if (val > 0 && val <= 12) periodoEstiagemMeses = Math.round(val);
        }
      }
    }
  };

  // Prioriza abas que têm nome relacionado a forragem / pasto / rebanho
  const forageSheetNames = wb.SheetNames.filter((s) => {
    const norm = normalizeText(s);
    return (
      norm.includes("FORRAG") ||
      norm.includes("SUPORTE") ||
      norm.includes("BALANC") ||
      norm.includes("PAST") ||
      norm.includes("REBANHO") ||
      norm.includes("PECUAR") ||
      norm.includes("DIMENSION")
    );
  });

  for (const sName of forageSheetNames) {
    const sheet = wb.Sheets[sName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows && rows.length > 0) scanForageInSheet(rows);
  }

  // Se não achou tudo, varre as outras abas
  for (const sName of wb.SheetNames) {
    if (forageSheetNames.includes(sName)) continue;
    const sheet = wb.Sheets[sName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows && rows.length > 0) scanForageInSheet(rows);
  }

  // 3. Inspeção dos Itens de Inversão
  let animalItemsCount = 0;
  for (const item of items) {
    const normName = normalizeText(item.nome);

    // Animais
    if (
      normName.includes("MATRIZ") ||
      normName.includes("VACA") ||
      normName.includes("NOVILHA") ||
      normName.includes("BEZERRO") ||
      normName.includes("TOURO") ||
      normName.includes("REPRODUTOR") ||
      normName.includes("BOVINO") ||
      normName.includes("GARROTE") ||
      normName.includes("CABRA") ||
      normName.includes("OVELHA") ||
      normName.includes("OVINO") ||
      normName.includes("CAPRINO")
    ) {
      temPecuaria = true;
      animalItemsCount += item.quant || 1;
    }

    // Pastagem / Forragem em itens
    if (
      normName.includes("SEMENTE DE CAPIM") ||
      normName.includes("FORMACAO DE PAST") ||
      normName.includes("RECUPERACAO DE PAST") ||
      normName.includes("BRACHIARIA") ||
      normName.includes("MOMBACA") ||
      normName.includes("MASSAI") ||
      normName.includes("BUFFEL")
    ) {
      temPecuaria = true;
      if (!especiePastagem) {
        if (normName.includes("BRACHIARIA")) especiePastagem = "Brachiaria brizantha";
        else if (normName.includes("MOMBACA")) especiePastagem = "Panicum maximum cv. Mombaça";
        else if (normName.includes("MASSAI")) especiePastagem = "Panicum maximum cv. Massai";
        else if (normName.includes("BUFFEL")) especiePastagem = "Capim Buffel";
      }
      if (areaPastagemCultivadaHa === 0) {
        if (item.unid === "HECT" || item.unid === "HA") {
          areaPastagemCultivadaHa = item.quant;
        } else {
          const m = item.nome.match(/(\d+([.,]\d+)?)\s*(ha|hect)/i);
          if (m) areaPastagemCultivadaHa = parseMoney(m[1]);
        }
      }
    }

    // Capineira / Palma
    if (normName.includes("PALMA") || normName.includes("PALMA FORRAGEIRA")) {
      temPecuaria = true;
      if (areaPalmaHa === 0) {
        if (item.unid === "HECT" || item.unid === "HA") areaPalmaHa = item.quant;
        else {
          const m = item.nome.match(/(\d+([.,]\d+)?)\s*(ha|hect)/i);
          if (m) areaPalmaHa = parseMoney(m[1]);
        }
      }
    }

    if (
      normName.includes("CAPINEIRA") ||
      normName.includes("CAPIACU") ||
      normName.includes("CAPIM ELEFANTE")
    ) {
      temPecuaria = true;
      if (areaCapineiraHa === 0) {
        if (item.unid === "HECT" || item.unid === "HA") areaCapineiraHa = item.quant;
        else {
          const m = item.nome.match(/(\d+([.,]\d+)?)\s*(ha|hect)/i);
          if (m) areaCapineiraHa = parseMoney(m[1]);
        }
      }
    }

    if (
      normName.includes("SILAGEM") ||
      normName.includes("FENO") ||
      normName.includes("TRITURADOR") ||
      normName.includes("ENSILADEIRA") ||
      normName.includes("PICADEIRA")
    ) {
      temPecuaria = true;
      if (!estrategiaSuplementacao) {
        estrategiaSuplementacao = normName.includes("SILAGEM")
          ? "Silagem e Forragem Picada"
          : "Feno e Suplementação Volumosa";
      }
    }
  }

  if (rebanhoCabecas === 0 && animalItemsCount > 0) {
    rebanhoCabecas = animalItemsCount;
  }

  // 4. Cálculos Automáticos de Coerência
  const areaTotalForrageiraHa =
    Math.round(
      (areaPastagemNativaHa +
        areaPastagemCultivadaHa +
        areaCapineiraHa +
        areaPalmaHa +
        areaOutrasForrageirasHa) *
        100
    ) / 100;

  if (rebanhoCabecas > 0 && rebanhoTotalUa === 0) {
    rebanhoTotalUa = Math.round(rebanhoCabecas * 0.8 * 10) / 10;
  }

  if (areaTotalForrageiraHa > 0 && rebanhoTotalUa > 0 && taxaLotacaoUaHa === 0) {
    taxaLotacaoUaHa = Math.round((rebanhoTotalUa / areaTotalForrageiraHa) * 100) / 100;
  }

  if (producaoTotalMsAno === 0 && areaTotalForrageiraHa > 0) {
    producaoTotalMsAno =
      Math.round(
        (areaPastagemCultivadaHa * 5.5 +
          areaPastagemNativaHa * 2.0 +
          areaCapineiraHa * 25.0 +
          areaPalmaHa * 18.0) *
          10
      ) / 10;
  }

  if (consumoTotalMsAno === 0 && rebanhoTotalUa > 0) {
    consumoTotalMsAno = Math.round(rebanhoTotalUa * 3.65 * 10) / 10;
  }

  saldoMsAno = Math.round((producaoTotalMsAno - consumoTotalMsAno) * 10) / 10;

  if (!estrategiaSuplementacao) {
    if (areaPalmaHa > 0 || areaCapineiraHa > 0) {
      estrategiaSuplementacao = "Capineira / Palma Forrageira no período seco e suplementação mineral";
    } else {
      estrategiaSuplementacao = "Pastejo diferido e suplementação com volumoso / sal proteinado no período seco";
    }
  }

  if (temPecuaria || areaTotalForrageiraHa > 0 || rebanhoCabecas > 0) {
    if (taxaLotacaoUaHa > 0 && taxaLotacaoUaHa <= 1.2) {
      parecerCapacidadeSuporte =
        "Suporte Forrageiro Equilibrado: Capacidade de suporte adequada ao bioma local e taxa de lotação sustentável com folga de forragem.";
    } else if (
      taxaLotacaoUaHa <= 2.0 &&
      (areaCapineiraHa > 0 || areaPalmaHa > 0 || producaoTotalMsAno >= consumoTotalMsAno)
    ) {
      parecerCapacidadeSuporte =
        "Lotação Intensificada: Capacidade atendida com suporte de volumoso complementar (capineira/palma) dimensionado para a estiagem.";
    } else if (taxaLotacaoUaHa > 2.0) {
      parecerCapacidadeSuporte =
        "Alerta de Lotação Alta: Requer manejo rotacionado intensivo e fornecimento contínuo de suplementação forrageira externa durante a estiagem.";
    } else {
      parecerCapacidadeSuporte =
        "Capacidade de Suporte compatível com o plano técnico de produção pecuária do PRONAF.";
    }
  }

  return {
    temPecuaria,
    areaPastagemNativaHa,
    areaPastagemCultivadaHa,
    areaCapineiraHa,
    areaPalmaHa,
    areaOutrasForrageirasHa,
    areaTotalForrageiraHa,
    especiePastagem: especiePastagem || undefined,
    rebanhoCabecas,
    rebanhoTotalUa,
    taxaLotacaoUaHa,
    producaoTotalMsAno,
    consumoTotalMsAno,
    saldoMsAno,
    periodoEstiagemMeses,
    estrategiaSuplementacao,
    parecerCapacidadeSuporte,
    pastagensDetalhadas,
    rebanhoDetalhado,
  };
}

export async function parseExcelProposalFull(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options?: {
    findReferencia?: (nome: string) => InversaoReferencia | null;
    uf?: string;
    customPassword?: string;
  }
): Promise<ExcelProposalParsed> {
  const inversoesResult = await parseExcelInversoes(fileOrBuffer, options);

  try {
    let arrayBuffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Uint8Array) {
      arrayBuffer = fileOrBuffer.buffer as ArrayBuffer;
    } else {
      arrayBuffer = fileOrBuffer;
    }

    let fileBuffer = Buffer.from(arrayBuffer);

    let isEncrypted = false;
    try {
      isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
    } catch {
      isEncrypted = false;
    }

    let decryptedBuffer: Buffer | Uint8Array = fileBuffer;
    if (isEncrypted) {
      const passwords = [
        options?.customPassword,
        "senhasBN",
        "senhasBNxI",
        "senhasBNXI",
        "senhaBNxI",
        "senhaBNXI",
        "senhasbnxi",
        "senhasBNx1",
        "VelvetSweatshop",
      ].filter(Boolean) as string[];

      for (const pwd of passwords) {
        try {
          decryptedBuffer = await officeCrypto.decrypt(fileBuffer, { password: pwd });
          break;
        } catch {}
      }
    }

    const wb = XLSX.read(decryptedBuffer, { type: "buffer" });

    const rowsBdPRONAF_C: any[][] | undefined = wb.SheetNames.includes("BdPRONAF_C")
      ? XLSX.utils.sheet_to_json(wb.Sheets["BdPRONAF_C"], { header: 1 })
      : undefined;

    const dadosProponente = extractDadosProponente(wb, rowsBdPRONAF_C);
    const suporteForrageiro = extractSuporteForrageiro(wb, inversoesResult.items, rowsBdPRONAF_C);

    let producerName = dadosProponente.nome || "";
    let producerCpf = dadosProponente.cpf || "";
    let producerPhone = dadosProponente.telefone || "";
    let municipio = dadosProponente.municipio || "";
    let localizacao = dadosProponente.nomePropriedade || dadosProponente.localidade || dadosProponente.endereco || "";
    let dapCaf = dadosProponente.dapCaf || "";
    let linhaCredito = dadosProponente.linhaCredito || "";
    let pronafLineId = "";
    let agenciaBnb = dadosProponente.agenciaBnb || "";
    let atividade = dadosProponente.atividadePrincipal || "";
    let objetivo = dadosProponente.objetivo || "";
    let parecerTecnico = dadosProponente.parecerTecnico || "";
    let roteiroAcesso = dadosProponente.roteiroAcesso || "";
    let elaborador = dadosProponente.elaborador || "";
    let cpfElaborador = dadosProponente.cpfElaborador || "";
    let valorSolicitado = 0;

    // Se tiver BdPRONAF_C, captura linha de crédito e agência diretamente da linha 122 se ainda não definido
    if (rowsBdPRONAF_C && rowsBdPRONAF_C[121]) {
      const r121 = rowsBdPRONAF_C[121];
      if (!linhaCredito && r121[5]) linhaCredito = String(r121[5]).trim();
      if (!agenciaBnb && r121[6]) agenciaBnb = String(r121[6]).trim();
      if (!atividade && r121[8]) atividade = String(r121[8]).trim();
      if (!elaborador && r121[13]) elaborador = String(r121[13]).trim();
      if (!cpfElaborador && r121[14]) cpfElaborador = String(r121[14]).trim();
      if (!objetivo && r121[15]) objetivo = String(r121[15]).trim();
      if (!parecerTecnico && r121[55]) parecerTecnico = String(r121[55]).trim();
    }

    if (linhaCredito) {
      const matched = matchPronafLineId(linhaCredito);
      pronafLineId = matched.id;
    }

    // Varredura de parâmetros adicionais em outras planilhas genéricas caso não seja SEAP
    if (!producerName || !producerCpf) {
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rows || rows.length === 0) continue;

        for (let r = 0; r < Math.min(100, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < Math.min(25, row.length); c++) {
            const cell = row[c];
            if (cell === null || cell === undefined) continue;

            const strVal = String(cell).trim();
            const norm = normalizeText(strVal);

            // Linha de Crédito
            if (
              !linhaCredito &&
              (norm.includes("LINHA") ||
                norm.includes("PROGRAMA") ||
                norm.includes("ENQUADRAMENTO"))
            ) {
              const nextVal = String(row[c + 1] || "").trim();
              if (nextVal && nextVal.length > 2) {
                const matched = matchPronafLineId(nextVal);
                linhaCredito = matched.label;
                pronafLineId = matched.id;
              }
            }

            // Atividade
            if (
              !atividade &&
              (norm.includes("ATIVIDADE") ||
                norm.includes("FINALIDADE") ||
                norm.includes("CULTURA") ||
                norm.includes("EXPLORACAO"))
            ) {
              const nextVal = String(row[c + 1] || "").trim();
              if (nextVal && nextVal.length > 2) {
                atividade = nextVal;
              }
            }

            // Valor Solicitado
            if (
              valorSolicitado === 0 &&
              (norm.includes("VALOR SOLICITADO") ||
                norm.includes("VALOR FINANCIADO") ||
                norm.includes("VALOR DO PROJETO") ||
                norm.includes("VALOR TOTAL"))
            ) {
              const nextVal = row[c + 1];
              const parsed = parseMoney(nextVal);
              if (parsed > 0) {
                valorSolicitado = parsed;
              }
            }
          }
        }
      }
    }

    if (!valorSolicitado || valorSolicitado === 0) {
      valorSolicitado = inversoesResult.totalGeral || inversoesResult.totalItens || 0;
    }

    if (!pronafLineId && inversoesResult.formatDetected?.includes("PRONAF-A")) {
      pronafLineId = "pronaf_a_368";
      linhaCredito = "Pronaf Grupo A (Res. 368)";
    }

    if (!atividade && suporteForrageiro.temPecuaria) {
      atividade = "Bovinocultura / Pecuária Familiar";
    }

    return {
      success: inversoesResult.success,
      producerName: producerName.toUpperCase() || undefined,
      producerCpf: producerCpf || undefined,
      producerPhone: producerPhone || undefined,
      municipio: municipio.toUpperCase() || undefined,
      localizacao: localizacao.toUpperCase() || undefined,
      dapCaf: dapCaf || undefined,
      linhaCredito: linhaCredito || undefined,
      pronafLineId: pronafLineId || undefined,
      agenciaBnb: agenciaBnb || undefined,
      atividade: atividade || undefined,
      objetivo: objetivo || undefined,
      parecerTecnico: parecerTecnico || undefined,
      roteiroAcesso: roteiroAcesso || undefined,
      elaborador: elaborador || undefined,
      cpfElaborador: cpfElaborador || undefined,
      valorSolicitado: valorSolicitado > 0 ? valorSolicitado : undefined,
      dadosProponente,
      suporteForrageiro,
      items: inversoesResult.items,
      custoAssessoria: inversoesResult.custoAssessoria,
      totalItens: inversoesResult.totalItens,
      totalGeral: inversoesResult.totalGeral,
      formatDetected: inversoesResult.formatDetected,
      error: inversoesResult.error,
    };
  } catch (err: any) {
    return {
      success: inversoesResult.success,
      items: inversoesResult.items,
      custoAssessoria: inversoesResult.custoAssessoria,
      totalItens: inversoesResult.totalItens,
      totalGeral: inversoesResult.totalGeral,
      formatDetected: inversoesResult.formatDetected,
      error: inversoesResult.error,
    };
  }
}
