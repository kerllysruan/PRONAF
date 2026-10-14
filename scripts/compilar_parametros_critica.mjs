import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const baseDir = 'C:\\Users\\Windows Lite BR\\Pictures\\PLANILHA PRONAF A LIMPA\\REF_ CRITICA PRONAF';
const outputFile = path.resolve('src/pages/PLANILHA PRONAF/data/parametros_critica_bnb.json');

function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

console.log('1. Carregando regras de CRITICA_PROPOSTA_SEAP.xlsx...');
const wbCritica = XLSX.readFile(path.join(baseDir, 'CRITICA_PROPOSTA_SEAP.xlsx'));
const regrasRaw = XLSX.utils.sheet_to_json(wbCritica.Sheets['CRITICA']);

const regrasCatalogo = regrasRaw.map(r => ({
  id: r['ID'],
  regra: r['Regra'],
  referencia: r['Referência'],
  statusDefault: r['Status'],
  confianca: r['Confiança'],
  fonte: r['Fonte da referência'],
  comoResolver: r['Comentário / ação sugerida'] || ''
}));

console.log(`Carregadas ${regrasCatalogo.length} regras.`);

// 2. Carregando F3_PARAMETROS (Zootécnicos)
console.log('2. Carregando F3_PARAMETROS...');
const f3Dir = path.join(baseDir, 'F3_PARAMETROS');
const f3Files = fs.readdirSync(f3Dir);
const parametrosZootecnicos = {};

f3Files.forEach(f => {
  if (!f.endsWith('.csv') || f.startsWith('00_')) return;
  const activityName = f.replace(/^\d+_/, '').replace('.csv', '');
  const content = fs.readFileSync(path.join(f3Dir, f), 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return;
  
  const headers = lines[1].split(',').map(h => h.trim());
  const ntRows = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols[0] && cols[0].startsWith('NT')) {
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx];
      });
      ntRows.push(rowObj);
    }
  }
  parametrosZootecnicos[activityName] = ntRows;
});

// 3. Carregando F1_CLASSIFICACAO dos Municípios
console.log('3. Carregando F1_CLASSIFICACAO...');
const f1Dir = path.join(baseDir, 'F1_CLASSIFICACAO');
const f1Files = fs.readdirSync(f1Dir);
const municipiosClassificacao = {};

f1Files.forEach(f => {
  if (!f.endsWith('.csv') || f.startsWith('00_') || f.startsWith('01_') || f.startsWith('25_') || f.startsWith('26_')) return;
  const isPronaf = f.includes('PRONAF') || f.includes('Pronaf');
  if (!isPronaf) return; // foca no PRONAF e Mini

  const ufMatch = f.match(/^\d+_([A-Z]{2})_/);
  const ufDefault = ufMatch ? ufMatch[1] : '';

  const content = fs.readFileSync(path.join(f1Dir, f), 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 3) return;

  // Linhas 2 em diante são dados
  for (let i = 2; i < lines.length; i++) {
    const parts = lines[i].split(',');
    // A estrutura tem colunas vazias iniciais
    const munIdx = parts.findIndex((p, idx) => idx >= 2 && p.trim().length > 2 && !p.includes('SEMIÁRIDO') && !p.includes('MA'));
    if (munIdx === -1) continue;
    const munNome = parts[munIdx]?.trim();
    if (!munNome || munNome === 'MUNICÍPIOS' || munNome.length < 3) continue;

    const loc = parts[munIdx + 1]?.trim() || '';
    const agencia = parts[munIdx + 2]?.trim() || '';
    const regiao = parts[munIdx + 3]?.trim() || '';

    // Vocações
    // Colunas: Apicultura, Avi corte, Avi postura, Bov corte cria, Bov corte recria, Bov leite, Capri, Carci, Ovi, Pisci, Suino
    const vocBovCorteCria = parts[munIdx + 10]?.trim() || '';
    const ntBovCorteCria = parts[munIdx + 11]?.trim() || '';
    const vocBovLeite = parts[munIdx + 14]?.trim() || '';
    const ntBovLeite = parts[munIdx + 15]?.trim() || '';
    const vocCapri = parts[munIdx + 16]?.trim() || '';
    const ntCapri = parts[munIdx + 17]?.trim() || '';
    const vocOvi = parts[munIdx + 20]?.trim() || '';
    const ntOvi = parts[munIdx + 21]?.trim() || '';

    const chave = normalizeStr(munNome);
    municipiosClassificacao[chave] = {
      municipio: munNome,
      uf: ufDefault,
      localizacao: loc.includes('FORA') ? 'FORA DO SEMIÁRIDO' : (loc.includes('SEMI') ? 'SEMIÁRIDO' : loc),
      agencia,
      regiao,
      vovacoes: {
        bovinoculturaCorteCria: { vocacao: vocBovCorteCria, nt: ntBovCorteCria },
        bovinoculturaLeite: { vocacao: vocBovLeite, nt: ntBovLeite },
        caprinocultura: { vocacao: vocCapri, nt: ntCapri },
        ovinocultura: { vocacao: vocOvi, nt: ntOvi },
      }
    };
  }
});
console.log(`Classificados ${Object.keys(municipiosClassificacao).length} municípios do PRONAF.`);

// 4. Carregando F4_FORRAGEIRO (Suporte Forrageiro por Município)
console.log('4. Carregando F4_FORRAGEIRO...');
const f4File = path.join(baseDir, 'F4_FORRAGEIRO', '00_Municípios_e_Cultivares.csv');
const f4Content = fs.readFileSync(f4File, 'utf8');
const f4Lines = f4Content.split(/\r?\n/).filter(l => l.trim().length > 0);
const suporteForrageiroMunicipios = {};

// Linhas de dados de F4
for (let i = 3; i < f4Lines.length; i++) {
  const parts = f4Lines[i].split(',');
  if (parts.length < 8) continue;
  const munNome = parts[1]?.trim();
  const uf = parts[2]?.trim();
  if (!munNome || munNome.length < 3) continue;

  const chuva = parseFloat(parts[3]) || 0;
  const koppen = parts[4]?.trim() || '';
  const capimBuffelNt1 = parseFloat(parts[5]) || 0;
  const capimAndropogonNt1 = parseFloat(parts[6]) || 0;
  const capimAndropogonNt2 = parseFloat(parts[7]) || 0;
  const capimBraquiariaNt1 = parseFloat(parts[8]) || 0;
  const capimBraquiariaNt2 = parseFloat(parts[9]) || 0;
  const capimIrrigadoNt3 = parseFloat(parts[10]) || 0;
  const capimIrrigadoNt4 = parseFloat(parts[11]) || 0;

  const chave = normalizeStr(munNome);
  suporteForrageiroMunicipios[chave] = {
    municipio: munNome,
    uf,
    chuvaMmAno: chuva,
    classeKoppen: koppen,
    suporteUaHa: {
      buffelSequeiroNt1: capimBuffelNt1,
      andropogonSequeiroNt1: capimAndropogonNt1,
      andropogonSequeiroNt2: capimAndropogonNt2,
      braquiariaSequeiroNt1: capimBraquiariaNt1,
      braquiariaSequeiroNt2: capimBraquiariaNt2,
      irrigadoNt3: capimIrrigadoNt3,
      irrigadoNt4: capimIrrigadoNt4,
      maximoSequeiroBraquiaria: Math.max(capimBraquiariaNt1, capimBraquiariaNt2),
    }
  };
}
console.log(`Carregado suporte forrageiro para ${Object.keys(suporteForrageiroMunicipios).length} municípios.`);

// 5. Carregando F5_VMIC (Tetos de Investimento e Preços de Referência)
console.log('5. Carregando F5_VMIC...');
const vmicFile = path.join(baseDir, 'F5_VMIC', '02_VMIC.csv');
const vmicContent = fs.readFileSync(vmicFile, 'utf8');
const vmicLines = vmicContent.split(/\r?\n/).filter(l => l.trim().length > 0);
const vmicTetosPorUf = {
  MA: {
    reprodutorPo: 14000,
    reprodutorMesticoAltaMesticagem: 9000,
    matrizPo: 10000,
    matrizMesticaCorte: 3200,
    matrizMesticaLeiteNt1: 7000,
    matrizMesticaLeiteNt2: 8000,
    reprodutorOvinoPo: 3500,
    matrizOvinaMestica: 600,
    reprodutorCaprinoPo: 3500,
    matrizCaprinaMestica: 600,
  },
  BA: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 10000,
    matrizPo: 13000,
    matrizMesticaCorte: 3300,
  },
  CE: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 10000,
    matrizMesticaCorte: 3000,
  },
  PI: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 8000,
    matrizPo: 12000,
    matrizMesticaCorte: 3000,
  },
  PE: {
    reprodutorPo: 12000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 9000,
    matrizMesticaCorte: 3100,
  },
  PB: {
    reprodutorPo: 14000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 11000,
    matrizMesticaCorte: 3000,
  },
  RN: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 13000,
    matrizMesticaCorte: 3000,
  },
  AL: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 6500,
    matrizPo: 12500,
    matrizMesticaCorte: 3200,
  },
  SE: {
    reprodutorPo: 16000,
    reprodutorMesticoAltaMesticagem: 6000,
    matrizPo: 12000,
    matrizMesticaCorte: 3200,
  },
  MG: {
    reprodutorPo: 18000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 10000,
    matrizMesticaCorte: 3300,
  },
  ES: {
    reprodutorPo: 15000,
    reprodutorMesticoAltaMesticagem: 7000,
    matrizPo: 12000,
    matrizMesticaCorte: 3300,
  }
};

// Preços de referência de venda no modelo (08_Base_de_Preços-Bovinos.csv)
const precosReferenciaVendaModelo = {
  MA: {
    novilhoArroba: 330,
    vacasDescarteCabeca: 3861,
    novilhasCabeca: 3762,
    novilhosCabeca: 5610,
    garrotesCabeca: 3993,
    bezerrosCabeca: 2574,
  }
};

// 6. Montando o arquivo consolidado de parâmetros
const dadosConsolidados = {
  geradoEm: new Date().toISOString(),
  versao: '2.0.0',
  descricao: 'Base Consolidada de Parâmetros e Crítica BNB / SEAP para o PRONAF A2',
  regrasCatalogo,
  parametrosZootecnicos,
  municipiosClassificacao,
  suporteForrageiroMunicipios,
  vmicTetosPorUf,
  precosReferenciaVendaModelo
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(dadosConsolidados, null, 2), 'utf8');

console.log(`Parâmetros compilados com sucesso em ${outputFile}`);
console.log(`Tamanho do arquivo: ${(fs.statSync(outputFile).size / (1024*1024)).toFixed(2)} MB`);
