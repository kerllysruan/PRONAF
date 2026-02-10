#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL não definida. Exporte a variável e tente novamente.');
    process.exit(1);
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('Nenhuma migração encontrada em', MIGRATIONS_DIR);
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('Nenhuma migração .sql encontrada.');
    return;
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log('Executando migração:', file);
      await client.query(sql);
    }
    console.log('✅ Todas as migrações executadas com sucesso.');
  } catch (err) {
    console.error('Erro ao aplicar migração:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
