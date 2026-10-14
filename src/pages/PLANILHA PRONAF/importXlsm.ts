import { Buffer } from "buffer";
import * as XLSX from "xlsx";
import { createXlsmReader, normalizeSheetKey } from "./exportXlsm";
import { cellsToProjeto, serialToDateStr, type SheetName } from "./cellMapping";
import { createInitialProjetoA2, type ProjetoA2, type InvestimentoItem } from "./types";

// Polyfills para ambiente de navegador
function ensureBufferPolyfill() {
  if (typeof window !== "undefined") {
    if (!(window as unknown as { Buffer?: typeof Buffer }).Buffer) {
      (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
    }
    if (!(window as unknown as { global?: typeof window }).global) {
      (window as unknown as { global: typeof window }).global = window;
    }
    if (!(window as unknown as { process?: { env: Record<string, string> } }).process) {
      (window as unknown as { process: { env: Record<string, string> } }).process = { env: {} };
    }
  }
  if (typeof globalThis !== "undefined") {
    if (!(globalThis as unknown as { Buffer?: typeof Buffer }).Buffer) {
      (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
    }
    if (!(globalThis as unknown as { global?: typeof globalThis }).global) {
      (globalThis as unknown as { global: typeof globalThis }).global = globalThis;
    }
  }
}
ensureBufferPolyfill();

export const DEFAULT_SPREADSHEET_PASSWORDS = [
  "senhasBN",
  "senhasBNxI",
  "senhasBNXI",
  "senhaBNxI",
  "senhaBNXI",
  "senhasbnxi",
  "senhasBNx1",
  "VelvetSweatshop",
];

export async function decryptSpreadsheetIfNeeded(
  buffer: ArrayBuffer,
  customPassword?: string
): Promise<ArrayBuffer> {
  ensureBufferPolyfill();
  const fileBuffer = Buffer.from(buffer);

  // Import dinâmico do officecrypto-tool para garantir execução pós-polyfill do Buffer
  const officeCryptoMod = await import("officecrypto-tool");
  const officeCrypto = (officeCryptoMod as unknown as { default?: typeof officeCryptoMod }).default || officeCryptoMod;

  let isEncrypted = false;
  try {
    isEncrypted = await officeCrypto.isEncrypted(fileBuffer);
  } catch {
    isEncrypted = false;
  }

  if (!isEncrypted) {
    return buffer;
  }

  const passwords = [customPassword, ...DEFAULT_SPREADSHEET_PASSWORDS].filter(Boolean) as string[];

  for (const pwd of passwords) {
    try {
      const dec = await officeCrypto.decrypt(fileBuffer, { password: pwd });
      const uint8 = new Uint8Array(dec);
      return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
    } catch {
      // tenta próxima senha
    }
  }

  throw new Error("Planilha protegida com senha não reconhecida (tentou senhasBN e variações).");
}

function isZipSignature(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer, 0, 4);
  return bytes[0] === 0x50 && bytes[1] === 0x4B; // 'PK'
}

function createSheetJsReader(wb: XLSX.WorkBook): (sheet: SheetName, cell: string) => string {
  const sheetsMap = new Map<string, XLSX.WorkSheet>();
  const sheetsNormMap = new Map<string, XLSX.WorkSheet>();

  for (const name of wb.SheetNames) {
    const s = wb.Sheets[name];
    if (s) {
      sheetsMap.set(name, s);
      sheetsNormMap.set(normalizeSheetKey(name), s);
    }
  }

  return (sheet: SheetName, cell: string) => {
    const s = sheetsMap.get(sheet) || sheetsNormMap.get(normalizeSheetKey(sheet));
    if (!s) return "";
    const c = s[cell.toUpperCase()];
    if (!c) return "";
    if (c.v !== undefined && c.v !== null) {
      return String(c.v);
    }
    return c.w ? String(c.w) : "";
  };
}

function cleanStr(val: unknown): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function parseNum(val: unknown): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  const s = String(val).replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatMesAno(val: unknown): string {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{6}$/.test(s)) return `${s.slice(0, 2)}/${s.slice(2)}`;
  return s;
}

function formatCpf(val: unknown): string {
  if (!val) return "";
  const digits = String(val).replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return cleanStr(val);
}

function formatCnpj(val: unknown): string {
  if (!val) return "";
  const digits = String(val).replace(/\D/g, "");
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
  }
  return cleanStr(val);
}

/**
 * Converte as linhas da aba oficial "BdPRONAF_C" (padrão SEAP / BNB)
 * para a estrutura de dados completa do ProjetoA2 cobrindo todas as 8 abas.
 */
export function parseBdPronafCToProjeto(rows: unknown[][]): ProjetoA2 {
  const projeto = createInitialProjetoA2();

  // 1. CLIENTE (Linha 11 = índice 11)
  if (rows.length > 11 && rows[11]) {
    const r = rows[11];
    const c = projeto.Cliente;
    if (r[4]) c.tipoCliente = cleanStr(r[4]);
    if (r[5]) c.nome = cleanStr(r[5]);
    if (r[6]) c.apelido = cleanStr(r[6]);
    if (r[7]) c.cpf = formatCpf(r[7]);
    if (r[8]) c.dataNascimento = serialToDateStr(String(r[8]));
    if (r[9]) c.numDocumento = cleanStr(r[9]);
    if (r[10]) c.dataEmissaoDoc = serialToDateStr(String(r[10]));
    if (r[12]) c.tipoDocumento = cleanStr(r[12]);
    if (r[13]) c.orgaoEmissorDoc = cleanStr(r[13]);
    if (r[14]) c.ufOrgaoEmissorDoc = cleanStr(r[14]);
    if (r[15]) c.tituloEleitoral = cleanStr(r[15]);
    if (r[16]) c.naturalidade = cleanStr(r[16]);
    if (r[17]) c.sexo = cleanStr(r[17]);
    if (r[18]) c.estadoCivil = cleanStr(r[18]);
    if (r[19]) c.grauInstrucao = cleanStr(r[19]);
    if (r[20]) c.profissao = cleanStr(r[20]);
    if (r[21]) c.atividade = cleanStr(r[21]);
    if (r[22]) c.rendaMensal = parseNum(r[22]);
    if (r[23]) c.beneficiarioPoliticasPublicas = cleanStr(r[23]);
    if (r[24]) c.nomePai = cleanStr(r[24]);
    if (r[25]) c.nomeMae = cleanStr(r[25]);
    if (r[27]) c.porte = cleanStr(r[27]);
    if (r[28]) c.numDap = cleanStr(r[28]);

    // Endereço da Atividade
    if (r[34]) c.ativTipoLogradouro = cleanStr(r[34]);
    if (r[35]) c.ativEndereco = cleanStr(r[35]);
    if (r[36]) c.ativNumero = cleanStr(r[36]);
    if (r[37]) c.ativComplemento = cleanStr(r[37]);
    if (r[38]) c.ativBairro = cleanStr(r[38]);
    if (r[39]) c.ativCep = cleanStr(r[39]);
    if (r[40]) c.ativMunicipio = cleanStr(r[40]);
    if (r[41]) c.ativDddTelefone = cleanStr(r[41]);
    if (r[42]) c.ativNumTelefone = cleanStr(r[42]);

    // Endereço de Correspondência (colunas 47-55 ou fallback 43-51)
    const corrTipo = r[47] || r[43];
    const corrEnd = r[48] || r[44];
    const corrNum = r[49] || r[45];
    const corrComp = r[50] || r[46];
    const corrBairro = r[51] || r[47];
    const corrCep = r[52] || r[48];
    const corrMuni = r[53] || r[49];
    const corrDdd = r[54] || r[50];
    const corrTel = r[55] || r[51];

    if (corrTipo) c.corrTipoLogradouro = cleanStr(corrTipo);
    if (corrEnd) c.corrEndereco = cleanStr(corrEnd);
    if (corrNum) c.corrNumero = cleanStr(corrNum);
    if (corrComp) c.corrComplemento = cleanStr(corrComp);
    if (corrBairro) c.corrBairro = cleanStr(corrBairro);
    if (corrCep) c.corrCep = cleanStr(corrCep);
    if (corrMuni) c.corrMunicipio = cleanStr(corrMuni);
    if (corrDdd) c.corrDddTelefone = cleanStr(corrDdd);
    if (corrTel) c.corrNumTelefone = cleanStr(corrTel);

    // Imóvel da Atividade (se colunas vazias na linha 11, busca da Avaliação linha 21)
    c.imovelDenominacao = cleanStr(r[56]) || cleanStr(rows[21]?.[4]);
    c.imovelArea = parseNum(r[57]) || parseNum(rows[21]?.[6]);
    c.imovelTipoUso = cleanStr(r[58]) || "Proprietário(a)";
    c.imovelProprietario = cleanStr(r[59]) || c.nome;
    c.imovelCpfCnpjProprietario = formatCpf(r[60]) || c.cpf;

    // Cônjuge
    if (r[63]) c.conjugeNome = cleanStr(r[63]);
    if (r[64]) c.conjugeCpf = formatCpf(r[64]);
    if (r[65]) c.conjugeDataNascimento = serialToDateStr(String(r[65]));
    if (r[66]) c.conjugeNumDocumento = cleanStr(r[66]);
    if (r[67]) c.conjugeTipoDocumento = cleanStr(r[67]);
    if (r[68]) c.conjugeOrgaoEmissor = cleanStr(r[68]);
    if (r[69]) c.conjugeUfOrgaoEmissor = cleanStr(r[69]);
    if (r[70]) c.conjugeDataEmissao = serialToDateStr(String(r[70]));
    if (r[71]) c.conjugeSexo = cleanStr(r[71]);
    if (r[72]) c.conjugeEstadoCivil = cleanStr(r[72]);
    if (r[73]) c.conjugeGrauInstrucao = cleanStr(r[73]);
    if (r[74]) c.conjugeProfissao = cleanStr(r[74]);
    if (r[75]) c.conjugeRendaMensal = parseNum(r[75]);
    if (r[76]) c.conjugeNaturalidade = cleanStr(r[76]);
    if (r[77]) c.conjugeNomePai = cleanStr(r[77]);
    if (r[78]) c.conjugeNomeMae = cleanStr(r[78]);
  }

  // 2. AVALIAÇÃO (Linha 21 = índice 21)
  if (rows.length > 21 && rows[21]) {
    const r21 = rows[21];
    const a = projeto["Avaliação"];
    if (a.imoveis && a.imoveis[0]) {
      if (r21[4]) a.imoveis[0].denominacao = cleanStr(r21[4]);
      if (r21[5]) a.imoveis[0].municipio = cleanStr(r21[5]);
      if (r21[6]) a.imoveis[0].areaLegal = parseNum(r21[6]);
      if (r21[7]) a.imoveis[0].realizaInversao = cleanStr(r21[7]);
      if (r21[8]) a.imoveis[0].compoeGarantia = cleanStr(r21[8]);
      if (r21[59]) a.imoveis[0].tipoProprietario = cleanStr(r21[59]);
      if (r21[60]) a.imoveis[0].nomeProprietario = cleanStr(r21[60]);
      if (r21[61]) a.imoveis[0].cpfCnpjProprietario = formatCpf(r21[61]);
    }
    if (a.informacoesAdicionais && a.informacoesAdicionais[0]) {
      if (r21[55]) a.informacoesAdicionais[0].nirf = cleanStr(r21[55]);
      if (r21[57]) a.informacoesAdicionais[0].sncr = cleanStr(r21[57]);
      if (r21[58]) a.informacoesAdicionais[0].registroCar = cleanStr(r21[58]);
      if (r21[62]) a.informacoesAdicionais[0].numeroOutorgaAgua = cleanStr(r21[62]);
      if (r21[63]) a.informacoesAdicionais[0].percentualPreservacaoAcimaLimite = parseNum(r21[63]);
      if (r21[64]) a.informacoesAdicionais[0].embargosIbama = cleanStr(r21[64]);
      if (r21[65]) a.informacoesAdicionais[0].unidadesConservacao = cleanStr(r21[65]);
    }

    // Terras e Coberturas (Linhas 21..35)
    if (a.detalhesImoveis && a.detalhesImoveis[0]) {
      for (let i = 0; i < Math.min(10, rows.length - 21); i++) {
        const row = rows[21 + i];
        if (!row || !row[13]) continue;
        if (a.detalhesImoveis[0].exploracaoAgricola[i]) {
          a.detalhesImoveis[0].exploracaoAgricola[i] = {
            descricao: cleanStr(row[13]),
            areaHa: parseNum(row[14]),
            idadeMeses: parseNum(row[15]),
            valorUnitario: parseNum(row[16]),
          };
        }
      }

      // Edificações (Linhas 21..35)
      for (let i = 0; i < Math.min(20, rows.length - 21); i++) {
        const row = rows[21 + i];
        if (!row || !row[19]) continue;
        if (a.detalhesImoveis[0].benfeitorias[i]) {
          a.detalhesImoveis[0].benfeitorias[i] = {
            descricao: cleanStr(row[19]),
            idadeAnos: parseNum(row[20]),
            valorReposicao: parseNum(row[21]),
            estadoConservacao: cleanStr(row[22]),
            depreciacaoPercent: parseNum(row[23]),
            valorAvaliado: parseNum(row[21]),
          };
        }
      }
    }

    // Máquinas (Linhas 21..31)
    if (a.maquinasEquipamentos) {
      for (let i = 0; i < Math.min(11, rows.length - 21); i++) {
        const row = rows[21 + i];
        if (!row) continue;
        const desc = row[26] || row[33];
        if (!desc) continue;
        if (a.maquinasEquipamentos[i]) {
          a.maquinasEquipamentos[i] = {
            descricao: cleanStr(desc),
            idadeAnos: parseNum(row[27] || row[34]),
            valorReposicao: parseNum(row[28] || row[35]),
            estadoConservacao: cleanStr(row[29] || row[36]),
            depreciacaoPercent: parseNum(row[30] || row[37]),
            valorAvaliado: parseNum(row[28] || row[35]),
          };
        }
      }
    }

    // Implementos / Veículos (Linhas 21..31)
    if (a.veiculosEmbarcacoes) {
      for (let i = 0; i < Math.min(12, rows.length - 21); i++) {
        const row = rows[21 + i];
        if (!row) continue;
        const desc = row[33] || row[40];
        if (!desc) continue;
        if (a.veiculosEmbarcacoes[i]) {
          a.veiculosEmbarcacoes[i] = {
            descricao: cleanStr(desc),
            idadeAnos: parseNum(row[34] || row[41]),
            valorReposicao: parseNum(row[35] || row[42]),
            estadoConservacao: cleanStr(row[36] || row[43]),
            depreciacaoPercent: parseNum(row[37] || row[44]),
            valorAvaliado: parseNum(row[35] || row[42]),
          };
        }
      }
    }

    // Semoventes (Linhas 21..50)
    if (a.semoventes) {
      for (let i = 0; i < Math.min(30, rows.length - 21); i++) {
        const row = rows[21 + i];
        if (!row || !row[49]) continue;
        const cat = cleanStr(row[49]);
        const qtd = parseNum(row[50]);
        const raca = cleanStr(row[51]);
        const val = parseNum(row[52]);
        if (qtd > 0 || val > 0 || raca) {
          const sem = a.semoventes.find((s) => s.categoria.toLowerCase() === cat.toLowerCase());
          if (sem) {
            sem.quantidadeCabecas = qtd;
            sem.racaMesticagem = raca;
            sem.valorUnitario = val;
            sem.valorTotal = qtd * val;
          }
        }
      }
    }
  }

  // 3. PROPOSTA (Linhas 120 e 121+)
  if (rows.length > 121 && rows[121]) {
    const r121 = rows[121];
    const p = projeto[" Proposta"];
    if (r121[4]) p.dataProposta = serialToDateStr(String(r121[4]));
    if (r121[5]) p.programa = cleanStr(r121[5]);
    if (r121[6]) p.agencia = cleanStr(r121[6]);
    if (r121[7]) p.regiao = (cleanStr(r121[7]) as "Semi-árido" | "Fora do Semi-árido") || "";
    if (r121[8]) p.atividadePrincipal = cleanStr(r121[8]);
    if (r121[11]) p.empresaElaboradora = cleanStr(r121[11]);
    if (r121[12]) p.cnpjEmpresaElaboradora = formatCnpj(r121[12]);
    if (r121[13]) p.elaborador = cleanStr(r121[13]);
    if (r121[14]) p.cpfElaborador = formatCpf(r121[14]);
    if (r121[15]) p.objetivoCredito = cleanStr(r121[15]);
    if (r121[16]) p.municipioDecretoEmergencia = (cleanStr(r121[16]) as "Sim" | "Não") || "";
    if (r121[17]) p.producaoAgroecologica = (cleanStr(r121[17]) as "Sim" | "Não") || "";
    if (r121[18]) p.imovelDenominacao = cleanStr(r121[18]);
    if (r121[19]) p.imovelMunicipio = cleanStr(r121[19]);
    if (r121[20]) p.propostaOrigemPlanosAcao = (cleanStr(r121[20]) as "Sim" | "Não") || "";
    if (r121[55]) {
      p.parecerTecnico = cleanStr(r121[55]);
      p.comentariosJustificativas = cleanStr(r121[55]);
    }

    // Se o imóvel da proposta estiver vazio, herda da Avaliação
    if (!p.imovelDenominacao && projeto["Avaliação"].imoveis?.[0]?.denominacao) {
      p.imovelDenominacao = projeto["Avaliação"].imoveis[0].denominacao;
    }
    if (!p.imovelMunicipio && projeto["Avaliação"].imoveis?.[0]?.municipio) {
      p.imovelMunicipio = projeto["Avaliação"].imoveis[0].municipio;
    }
    p.imovelRegiao = p.regiao || "Semi-árido";
    p.imovelNum = "1";

    // Programa de Investimentos (Linhas 121 a 156 = até 36 itens)
    const itensInvestimento: InvestimentoItem[] = [];
    for (let i = 0; i < 36; i++) {
      const rIdx = 121 + i;
      if (rIdx >= rows.length) break;
      const row = rows[rIdx];
      if (!row || !row[22]) continue;
      const disc = cleanStr(row[22]);
      if (!disc) continue;
      itensInvestimento.push({
        id: itensInvestimento.length + 1,
        discriminacao: disc,
        compoeGarantia: (cleanStr(row[23]) as "Sim" | "Não") || "Não",
        quantidade: parseNum(row[24]) || 1,
        unidade: cleanStr(row[25]) || "Unidade",
        uso: cleanStr(row[26]) || "",
        numImovel: cleanStr(row[28]) || "1",
        valorUnitario: parseNum(row[27]),
        recursosPropriosUnit: parseNum(row[29]),
      });
    }
    if (itensInvestimento.length > 0) {
      p.itensInvestimento = itensInvestimento;
    }
  }

  // 4. CRONOGRAMA (Linhas 221+)
  if (rows.length > 221 && rows[221]) {
    const cr = projeto.Cronograma;
    for (let i = 0; i < Math.min(41, rows.length - 221); i++) {
      const r = rows[221 + i];
      if (!r || !cr.inversoesParcelas[i]) continue;
      const inv = cr.inversoesParcelas[i];
      if (r[4]) inv.parcelas[0].mesAno = formatMesAno(r[4]);
      if (r[12]) inv.parcelas[0].percentual = parseNum(r[12]);
      if (r[5]) inv.parcelas[1].mesAno = formatMesAno(r[5]);
      if (r[13]) inv.parcelas[1].percentual = parseNum(r[13]);
      if (r[6]) inv.parcelas[2].mesAno = formatMesAno(r[6]);
      if (r[14]) inv.parcelas[2].percentual = parseNum(r[14]);
      if (r[7]) inv.parcelas[3].mesAno = formatMesAno(r[7]);
      if (r[15]) inv.parcelas[3].percentual = parseNum(r[15]);

      if (r[21] && cr.aplicacaoRecursos[i]) {
        cr.aplicacaoRecursos[i].empreendimento = cleanStr(r[21]);
      }
    }
  }

  // 5. ATIVIDADE AGRÍCOLA (Linhas 321+)
  if (rows.length > 321 && rows[321]) {
    const ag = projeto["Ativ. Agrícola"];
    for (let i = 0; i < Math.min(35, rows.length - 321); i++) {
      const r = rows[321 + i];
      if (!r || !r[3]) continue;
      const desc = cleanStr(r[3]);
      if (ag.usoTerrasAgricola[i]) {
        ag.usoTerrasAgricola[i].descricao = desc;
        ag.usoTerrasAgricola[i].atualArea = parseNum(r[4]);
        ag.usoTerrasAgricola[i].atualUaHa = parseNum(r[5]);
      }
      if (ag.receitasAgricolas[i]) {
        ag.receitasAgricolas[i].descricao = desc;
        ag.receitasAgricolas[i].irrigacao = (cleanStr(r[52]) as "Irrigada" | "Não Irrigada") || "Não Irrigada";
        ag.receitasAgricolas[i].unidade = cleanStr(r[53]);
        ag.receitasAgricolas[i].valorUnitario = parseNum(r[54]);
      }
    }

    // Uso de terras pecuária pastejo (linhas 356..390)
    for (let i = 0; i < 35; i++) {
      const rIdx = 356 + i;
      if (rIdx >= rows.length) break;
      const r = rows[rIdx];
      if (!r || !r[3]) continue;
      if (ag.usoTerrasPecuaria[i]) {
        ag.usoTerrasPecuaria[i].descricao = cleanStr(r[3]);
        ag.usoTerrasPecuaria[i].atualArea = parseNum(r[4]);
        ag.usoTerrasPecuaria[i].atualUaHa = parseNum(r[5]);
      }
    }

    // Atividades econômicas (linhas 361..395)
    for (let i = 0; i < 35; i++) {
      const rIdx = 361 + i;
      if (rIdx >= rows.length) break;
      const r = rows[rIdx];
      if (r && r[76]) {
        ag.atividadesEconomicas[i] = cleanStr(r[76]);
      }
    }
  }

  // 6. ATIVIDADE PECUÁRIA (Linhas 421..436)
  if (rows.length > 429 && rows[429]) {
    const pec = projeto["Ativ. Pecuária"];
    // Bovinos de Corte (linhas 429 a 436 = 8 categorias)
    for (let i = 0; i < Math.min(8, rows.length - 429); i++) {
      const r = rows[429 + i];
      if (!r || !pec.corte.categorias[i]) continue;
      const cat = pec.corte.categorias[i];
      if (r[7] !== undefined) cat.quantidadeAtual = parseNum(r[7]);
      if (r[8] !== undefined) cat.aAdquirir = parseNum(r[8]);
      if (r[9] !== undefined) cat.descartePercentAno1 = parseNum(r[9]);
      if (r[10] !== undefined) cat.descartePercentDemais = parseNum(r[10]);
      if (r[12] !== undefined) cat.precoUnitarioVenda = parseNum(r[12]);
    }
    // Indicadores técnicos de corte
    const r429 = rows[429];
    if (r429) {
      if (r429[13]) pec.corte.paricaoPercent = parseNum(r429[13]);
      if (r429[14]) pec.corte.mortalidadeAte1AnoPercent = parseNum(r429[14]);
      if (r429[15]) pec.corte.mortalidade1a2AnosPercent = parseNum(r429[15]);
      if (r429[16]) pec.corte.mortalidadeAdultoPercent = parseNum(r429[16]);
      if (r429[17]) pec.corte.matrizesPorReprodutor = parseNum(r429[17]);
    }
  }

  // 7. OUTRAS ATIVIDADES (Linhas 521+)
  if (rows.length > 521 && rows[521]) {
    const o = projeto["Outras Ativ"];
    for (let i = 0; i < 10; i++) {
      const row = rows[521 + i];
      if (!row || !row[4]) continue;
      if (o.receitasAnuais[i]) {
        o.receitasAnuais[i].descricao = cleanStr(row[4]);
        o.receitasAnuais[i].setorAtividade = cleanStr(row[5]);
        o.receitasAnuais[i].atual = parseNum(row[6]);
        if (row[8]) o.receitasAnuais[i].ano1 = parseNum(row[8]);
        if (row[10]) o.receitasAnuais[i].ano2 = parseNum(row[10]);
        if (row[12]) o.receitasAnuais[i].ano3 = parseNum(row[12]);
        if (row[14]) o.receitasAnuais[i].ano4 = parseNum(row[14]);
        if (row[16]) o.receitasAnuais[i].ano5 = parseNum(row[16]);
      }
    }
    if (rows[540]) o.energiaEletrica = parseNum(rows[540][6]);
    if (rows[541]) o.combustiveisLubrificantes = parseNum(rows[541][6]);
    if (rows[542]) o.administrador = parseNum(rows[542][6]);
    if (rows[543]) o.subsistenciaFamilia = parseNum(rows[543][6]);
  }

  // 8. FINANCIAMENTO / CÁLCULO FINANCEIRO (Linha 721)
  if (rows.length > 721 && rows[721]) {
    const r721 = rows[721];
    const fin = projeto.CalculoFinanceiro;
    if (fin.bloco1) {
      if (r721[4]) fin.bloco1.prazoMeses = parseNum(r721[4]);
      if (r721[5]) fin.bloco1.carenciaMeses = parseNum(r721[5]);
      if (r721[6]) fin.bloco1.jurosPercentAa = parseNum(r721[6]);
      if (r721[7]) fin.bloco1.periodicidadeReembolso = cleanStr(r721[7]);
      if (r721[8]) fin.bloco1.amortizacoesIguais = cleanStr(r721[8]);
    }
  }

  return projeto;
}

function mergeProjetos(base: ProjetoA2, overlay: ProjetoA2): ProjetoA2 {
  const result = { ...base };
  for (const key of Object.keys(overlay) as Array<keyof ProjetoA2>) {
    const oVal = overlay[key];
    const bVal = base[key];
    if (typeof oVal === "object" && oVal !== null && !Array.isArray(oVal)) {
      const mergedSection = { ...(bVal as Record<string, unknown>) };
      for (const [prop, val] of Object.entries(oVal as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          // Só sobrescreve se o array do overlay tiver itens com conteúdo preenchido
          const hasContent = val.some((item) => {
            if (typeof item === "object" && item !== null) {
              return Object.values(item).some(
                (v) => v !== "" && v !== null && v !== undefined && v !== 0 && v !== "Não"
              );
            }
            return item !== "" && item !== null && item !== undefined && item !== 0;
          });
          if (hasContent) {
            mergedSection[prop] = val;
          }
        } else if (val !== "" && val !== null && val !== undefined && val !== 0) {
          mergedSection[prop] = val;
        }
      }
      result[key] = mergedSection as never;
    }
  }
  return result;
}

/**
 * Importa um arquivo de planilha (.xlsm, .xlsx ou .xls legada/binária).
 * Descriptografa automaticamente se estiver protegido por senha (ex: senhasBN).
 * Lê os valores das células de entrada das 8 abas e reconstrói o projeto.
 * Suporta tanto o formato oficial SEAP (BdPRONAF_C) quanto arquivos com as 8 abas tradicionais.
 * Tudo acontece no navegador; nenhum dado é enviado à rede (LGPD).
 */
export async function importXlsm(file: Blob | ArrayBuffer, customPassword?: string): Promise<ProjetoA2> {
  const rawBuffer: ArrayBuffer = file instanceof Blob ? await file.arrayBuffer() : file;

  // 1. Descriptografa a planilha caso esteja protegida por senha padrão BNB (senhasBN, etc.)
  const buffer: ArrayBuffer = await decryptSpreadsheetIfNeeded(rawBuffer, customPassword);

  // 2. Tenta carregar pasta com SheetJS
  let wb: XLSX.WorkBook | null = null;
  try {
    wb = XLSX.read(buffer, { type: "array", cellDates: false });
  } catch {
    wb = null;
  }

  // 3. Verifica se contém a aba oficial "BdPRONAF_C" (padrão oficial SEAP / BNB)
  const hasBdPronaf = !!(wb && wb.SheetNames.includes("BdPRONAF_C"));
  let projeto: ProjetoA2 = createInitialProjetoA2();

  if (hasBdPronaf && wb) {
    const sheet = wb.Sheets["BdPRONAF_C"];
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      projeto = parseBdPronafCToProjeto(rows);
    }
  }

  // 4. Só devemos ler abas individuais se o arquivo REALMENTE tiver abas individuais!
  const hasIndividualSheets = !!(
    wb &&
    wb.SheetNames.some((name) => {
      const norm = normalizeSheetKey(name);
      return norm === "cliente" || norm === "avaliacao" || norm === "proposta";
    })
  );

  if (hasIndividualSheets) {
    let reader: ((sheet: SheetName, cell: string) => string) | null = null;
    if (isZipSignature(buffer)) {
      try {
        reader = await createXlsmReader(buffer);
      } catch {
        reader = null;
      }
    }
    if (!reader && wb) {
      reader = createSheetJsReader(wb);
    }
    if (reader) {
      try {
        const fromCells = cellsToProjeto(reader);
        if (hasBdPronaf) {
          projeto = mergeProjetos(projeto, fromCells);
        } else {
          projeto = fromCells;
        }
      } catch {
        // mantém projeto
      }
    }
  } else if (!hasBdPronaf) {
    let reader: ((sheet: SheetName, cell: string) => string) | null = null;
    if (isZipSignature(buffer)) {
      try {
        reader = await createXlsmReader(buffer);
      } catch {
        reader = null;
      }
    }
    if (!reader && wb) {
      reader = createSheetJsReader(wb);
    }
    if (reader) {
      projeto = cellsToProjeto(reader);
    }
  }

  return projeto;
}
