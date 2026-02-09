#!/usr/bin/env node

/**
 * Resumo do setup - exibe informações sobre a configuração do sistema
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   SISTEMA PRONAF - SETUP                     ║
║                  Status de Configuração                       ║
╚═══════════════════════════════════════════════════════════════╝

📊 BANCO DE DADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📍 Project URL: https://ailmvtqnrltepobtwbhq.supabase.co
  🔑 Project ID: ailmvtqnrltepobtwbhq
  ✅ Configurado em: .env

📝 DADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ 26 Propostas PRONAF (preparadas em data/import_proposals.sql)
  📄 Status: Aguardando importação para o banco

👤 USUÁRIO ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 Matrícula: F180227
  🔐 Senha: 123456
  📧 Email: admin-F180227@pronaf.local (opcional)
  ⚠️  Status: Aguardando criação no banco

🚀 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  OPÇÃO 1: Setup Completo Automático (RECOMENDADO)
  ───────────────────────────────────────────────
  Se você tem a Service Key do Supabase:

    export SUPABASE_SERVICE_KEY="sua-chave-aqui"
    npm run setup:all

  Esta opção:
    • Importa as 26 propostas
    • Cria o usuário admin
    • Inicia o servidor


  OPÇÃO 2: Setup Manual Passo a Passo
  ────────────────────────────────────
  Se não tem a Service Key:

    1️⃣  Importar Propostas (Manual):
        npm run generate:proposals
        
        Depois:
        • Acesse: https://app.supabase.com
        • Projeto: ailmvtqnrltepobtwbhq
        • SQL Editor → Cole /data/import_proposals.sql → Executar

    2️⃣  Criar Usuário Admin (Manual):
        • SQL Editor → Cole o SQL de criação de usuário
        • Ou: npm run create:admin (precisa SERVICE_KEY)

    3️⃣  Iniciar Servidor:
        npm run dev


  OPÇÃO 3: Só Iniciar o Servidor
  ───────────────────────────────
  Se já fez os passos acima:

    npm run dev
    
    Acesse: http://localhost:8081


📚 DOCUMENTAÇÃO COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📖 Veja: SETUP_GUIDE.md (no diretório raiz)

🔑 COMO ENCONTRAR A SERVICE KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Abra: https://app.supabase.com
  2. Selecione: ailmvtqnrltepobtwbhq
  3. Vá para: Settings > API > Service Role Secret
  4. Copie a chave
  5. Execute:
     export SUPABASE_SERVICE_KEY="chave-copiada"


💡 DICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • A matrícula F180227 será seu usuário admin
  • Login padrão usa a aba "Matrícula"
  • Sem email confirmação necessária


✅ RESUMO RÁPIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] Service Key obtida
  [ ] Propostas importadas
  [ ] Usuário admin criado
  [ ] Servidor iniciado
  [ ] Login realizado com F180227 / 123456

╔═══════════════════════════════════════════════════════════════╗
║                  PRONTO PARA COMEÇAR! 🎉                     ║
╚═══════════════════════════════════════════════════════════════╝
`);
