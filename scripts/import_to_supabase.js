import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_KEY não configurados');
  console.error('   Defina a variável SUPABASE_SERVICE_KEY antes de executar este script');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function parseCSV(text) {
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
      }
      cur = '';
      row = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
      continue;
    }
    if (!inQuotes && ch === ';') {
      row.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(h) {
  return h
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseNumber(v) {
  if (!v) return null;
  const s = v.replace(/\./g, '').replace(/,/g, '.').replace(/\s/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseDateDMY(v) {
  if (!v) return null;
  const m = v.trim();
  const parts = m.split(' ');
  const date = parts[0];
  const [dd, mm, yyyy] = date.split('/');
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy.padStart(4,'0')}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T00:00:00`;
}

async function importProposals() {
  try {
    console.log('\n📂 Lendo arquivo CSV...');
    const rawPath = path.join(__dirname, '..', 'data', 'raw_proposals.csv');
    
    if (!fs.existsSync(rawPath)) {
      console.error('❌ Arquivo raw_proposals.csv não encontrado');
      process.exit(1);
    }

    const raw = fs.readFileSync(rawPath, 'utf8');
    const rows = await parseCSV(raw);
    
    if (rows.length < 2) {
      console.error('❌ CSV vazio ou não reconhecido');
      process.exit(1);
    }

    const headers = rows[0].map(normalizeHeader);
    
    function idxContains(substr) {
      substr = substr.toLowerCase();
      return headers.findIndex(h => h.includes(substr));
    }

    const iNome = idxContains('nome');
    const iCpf = idxContains('cpf');
    const iValor = idxContains('valor');
    const iDataCentral = idxContains('data central');
    const iPrograma = idxContains('programa');
    const iTarefa = idxContains('tarefa');
    const iEstado = idxContains('estado');

    const proposals = [];
    
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 1 && row[0].trim() === '') continue;
      
      const get = (i) => (i >= 0 ? (row[i] || '').trim() : '');
      const producer_name = get(iNome) || get(0);
      const producer_cpf = (get(iCpf) || '').replace(/\D/g, '') || null;
      const requested_value = parseNumber(get(iValor));
      const pronaf_line = get(iPrograma) || '';
      const entry_date_raw = get(iDataCentral) || '';
      const entry_date = parseDateDMY(entry_date_raw) || new Date().toISOString();
      const notes = get(iTarefa) || '';
      const status = get(iEstado) || 'Em execução';

      proposals.push({
        producer_name,
        producer_cpf,
        requested_value: requested_value || 0,
        pronaf_line,
        entry_date,
        notes,
        status,
        user_id: '00000000-0000-0000-0000-000000000000' // ID padrão
      });
    }

    console.log(`✅ ${proposals.length} propostas lidas do CSV`);
    
    console.log('\n🔄 Inserindo no banco de dados...');
    
    // Inserir em lotes de 10
    for (let i = 0; i < proposals.length; i += 10) {
      const batch = proposals.slice(i, i + 10);
      const { error, data } = await supabase
        .from('proposals')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${i/10 + 1}:`, error.message);
        // Continue mesmo com erro para tentar inserir o resto
      } else {
        console.log(`✅ Lote ${i/10 + 1} inserido (${batch.length} registros)`);
      }
    }

    // Verificar total de registros
    console.log('\n🔍 Verificando dados inseridos...');
    const { count, error: countError } = await supabase
      .from('proposals')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
    } else {
      console.log(`✅ Total de propostas no banco: ${count}`);
    }

    console.log('\n✨ Importação concluída com sucesso!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

importProposals();
