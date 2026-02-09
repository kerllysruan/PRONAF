#!/usr/bin/env node

/**
 * Script de setup completo do sistema PRONAF
 * Executa:
 * 1. Gera SQL de propostas
 * 2. Executa SQL de importação (se tiver service key)
 * 3. Cria usuário admin
 * 4. Inicia servidor
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { 
      stdio: 'inherit',
      ...options 
    });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Comando exited with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║    SETUP COMPLETO - SISTEMA PRONAF     ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 1. Gerar SQL de propostas
    console.log('📋 Passo 1: Gerando SQL de propostas...');
    await runCommand('npm', ['run', 'generate:proposals']);
    console.log('✅ Propostas geradas\n');

    // 2. Executar importação (se tiver service key)
    if (process.env.SUPABASE_SERVICE_KEY) {
      console.log('📋 Passo 2: Importando propostas para o banco...');
      try {
        await runCommand('npm', ['run', 'import:supabase']);
        console.log('✅ Propostas importadas\n');
      } catch (err) {
        console.log('⚠️  Não foi possível importar automaticamente');
        console.log('   Cole manualmente: data/import_proposals.sql\n');
      }
    } else {
      console.log('📋 Passo 2: Importação de propostas');
      console.log('   ⚠️  Service key não configurada');
      console.log('   Você pode fazer isso depois via Supabase Dashboard\n');
    }

    // 3. Criar usuário admin (se tiver service key)
    if (process.env.SUPABASE_SERVICE_KEY) {
      console.log('📋 Passo 3: Criando usuário admin...');
      try {
        await runCommand('npm', ['run', 'create:admin']);
        console.log('✅ Usuário admin criado\n');
      } catch (err) {
        console.log('⚠️  Não foi possível criar usuário admin automaticamente');
        console.log('   ' + err.message + '\n');
      }
    } else {
      console.log('📋 Passo 3: Criação de usuário admin');
      console.log('   ⚠️  Service key não configurada');
      console.log('   Você pode fazer isso depois via:\n');
      console.log('   export SUPABASE_SERVICE_KEY="sua-chave"');
      console.log('   npm run create:admin\n');
    }

    // 4. Iniciar servidor
    console.log('📋 Passo 4: Iniciando servidor de desenvolvimento...\n');
    await sleep(2000);
    await runCommand('npm', ['run', 'dev']);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
