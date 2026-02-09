import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSV(text) {
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
      // skip possible \r\n
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
  // expected dd/mm/yyyy hh:mm:ss
  const m = v.trim();
  const parts = m.split(' ');
  const date = parts[0];
  const time = parts[1] || '00:00:00';
  const [dd, mm, yyyy] = date.split('/');
  if (!dd || !mm || !yyyy) return null;
  return `${yyyy.padStart(4,'0')}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}T${time}`;
}

function sqlEscape(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

const rawPath = path.join(__dirname, '..', 'data', 'raw_proposals.csv');
const outPath = path.join(__dirname, '..', 'data', 'import_proposals.sql');

if (!fs.existsSync(rawPath)) {
  console.error('Arquivo raw não encontrado:', rawPath);
  process.exit(1);
}

const raw = fs.readFileSync(rawPath, 'utf8');
const rows = parseCSV(raw);
if (rows.length < 2) {
  console.error('CSV vazio ou não reconhecido');
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
const iDataCentral = idxContains('data central') >= 0 ? idxContains('data central') : idxContains('data central') ;
const iPrograma = idxContains('programa') >= 0 ? idxContains('programa') : idxContains('programa');
const iTarefa = idxContains('tarefa');
const iEstado = idxContains('estado');

const inserts = [];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (row.length === 1 && row[0].trim() === '') continue;
  const get = (i) => (i >= 0 ? (row[i] || '').trim() : '');
  const producer_name = get(iNome) || get(0);
  const producer_cpf_raw = get(iCpf);
  const producer_cpf = (producer_cpf_raw || '').replace(/\D/g, '') || null;
  const requested_value = parseNumber(get(iValor));
  const pronaf_line = get(iPrograma) || '';
  const entry_date_raw = get(iDataCentral) || '';
  const entry_date = parseDateDMY(entry_date_raw) || new Date().toISOString();
  const notes = get(iTarefa) || '';
  const status = get(iEstado) || '';

  const id = crypto.randomUUID();
  const created_at = entry_date;
  const updated_at = entry_date;

  const vals = [];
  vals.push(sqlEscape(id));
  vals.push(sqlEscape(entry_date));
  vals.push(sqlEscape(created_at));
  vals.push(sqlEscape(updated_at));
  vals.push(sqlEscape(producer_name));
  vals.push(producer_cpf ? sqlEscape(producer_cpf) : 'NULL');
  vals.push(requested_value !== null ? requested_value : 'NULL');
  vals.push(sqlEscape(pronaf_line));
  vals.push(sqlEscape(notes));
  vals.push(sqlEscape(status));

  const stmt = `INSERT INTO public.proposals (id, entry_date, created_at, updated_at, producer_name, producer_cpf, requested_value, pronaf_line, notes, status) VALUES (${vals.join(', ')});`;
  inserts.push(stmt);
}

const out = [];
out.push('-- SQL gerado por scripts/generate_import_proposals.js');
out.push('BEGIN;');
out.push(...inserts);
out.push('COMMIT;');

fs.writeFileSync(outPath, out.join('\n') + '\n', 'utf8');
console.log('Gerado', inserts.length, 'INSERTs em', outPath);
