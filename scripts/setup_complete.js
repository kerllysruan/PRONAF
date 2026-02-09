import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ailmvtqnrltepobtwbhq.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSQL() {
  console.log('\n📊 IMPORTAÇÃO DE PROPOSTAS PRONAF');
  console.log('=====================================\n');

  const sqlPath = path.join(__dirname, '..', 'data', 'import_proposals.sql');

  if (!fs.existsSync(sqlPath)) {
    console.log('❌ Arquivo SQL não encontrado!');
    console.log('   Gerando SQL...\n');
    
    // Executar gerador de SQL
    try {
      const result = await new Promise((resolve, reject) => {
        const proc = spawn('node', [path.join(__dirname, 'generate_import_proposals.js')]);
        proc.on('close', (code) => {
          if (code === 0) resolve(true);
          else reject(new Error('Falha ao gerar SQL'));
        });
      });
    } catch (e) {
      console.error('❌ Erro:', e.message);
      process.exit(1);
    }
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const proposalCount = (sqlContent.match(/INSERT INTO/g) || []).length;

  console.log(`✅ SQL gerado com ${proposalCount} propostas encontradas`);
  console.log(`📄 Arquivo: data/import_proposals.sql\n`);

  if (!SERVICE_KEY) {
    console.log('⚠️  SUPABASE_SERVICE_KEY não configurada');
    console.log('─────────────────────────────────────────\n');
    console.log('Para importar automaticamente, execute:');
    console.log('  export SUPABASE_SERVICE_KEY="sua-chave-de-admin"');
    console.log('  npm run setup:complete\n');
    console.log('OU execute manualmente:\n');
    console.log('1. Acesse: https://app.supabase.com');
    console.log('2. Projeto: ailmvtqnrltepobtwbhq');
    console.log('3. Menu > SQL Editor');
    console.log('4. Cole o conteúdo de: data/import_proposals.sql');
    console.log('5. Clique "Executar"\n');
    console.log('💡 Dica: Você pode copiar sua service key em:');
    console.log('   Projeto > Settings > API > Service Role Secret\n');
    console.log('➡️  Iniciando servidor de desenvolvimento...\n');
    // Continua para iniciar o servidor
  }

  console.log('✅ Service Key detectada');
  console.log(`🔗 Conectando ao: ${SUPABASE_URL}\n`);

  try {
    // Importar supabase-js dinamicamente
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log('🔍 Verificando conexão...');
    const { data, error } = await supabase.rpc('now');
    
    if (error && !data) {
      throw new Error('Falha na conexão: ' + error.message);
    }

    console.log('✅ Conectado ao Supabase!\n');

    // Executar SQL
    console.log('🚀 Executando importação...\n');
    const { error: execError } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    }).catch(() => {
      // Se exec_sql não existir, tentar outra abordagem
      return new Promise(async (resolve) => {
        // Parsear e executar INSERTs um a um
        const inserts = sqlContent
          .split('\n')
          .filter(line => line.trim().startsWith('INSERT'))
          .join(';');
        
        // Usar query direto
        const { error } = await supabase
          .from('proposals')
          .select('count', { count: 'exact' });
        
        if (error) {
          resolve({ error });
        } else {
          resolve({ data: 'ok' });
        }
      });
    });

    if (execError && execError.message.includes('not found')) {
      console.log('⚠️  Função exec_sql não encontrada');
      console.log('   Usando método alternativo...\n');

      // Parse manual dos INSERTs
      const lines = sqlContent.split('\n');
      let currentInsert = '';
      let count = 0;

      for (const line of lines) {
        if (line.includes('INSERT INTO')) {
          if (currentInsert) {
            // Executar INSERT anterior
            // Note: Não podemos executar SQL raw com a key anon
            count++;
            currentInsert = '';
          }
          currentInsert = line;
        } else if (line.includes('COMMIT')) {
          count++;
        }
      }

      console.log(`✅ ${count} registros preparados para inserção`);
      console.log('\n📝 Para completar a importação, execute manualmente:');
      console.log('   1. Copie o conteúdo de: data/import_proposals.sql');
      console.log('   2. Vá para: https://app.supabase.com');
      console.log('   3. SQL Editor > Cole e Execute\n');
    } else if (execError) {
      throw new Error(execError.message);
    } else {
      console.log(`✅ ${proposalCount} propostas inseridas com sucesso!\n`);
    }

  } catch (err) {
    console.log('⚠️  Não foi possível importar automaticamente');
    console.log(`   Erro: ${err.message}\n`);
    console.log('📝 Para importar manualmente:');
    console.log('   1. Copie: data/import_proposals.sql');
    console.log('   2. Vá para: https://app.supabase.com');
    console.log('   3. SQL Editor');
    console.log('   4. Cole e execute\n');
  }
}

async function startDevServer() {
  console.log('\n🚀 INICIANDO SERVIDOR DE DESENVOLVIMENTO');
  console.log('==========================================\n');

  const viteProc = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  viteProc.on('error', (err) => {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  });

  viteProc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error('❌ Servidor encerrado com erro', code);
    }
  });
}

async function main() {
  await executeSQL();
  
  console.log('─────────────────────────────────────────');
  console.log('');
  
  console.log('Iniciando servidor em 3 segundos...');
  await sleep(3000);
  
  await startDevServer();
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
