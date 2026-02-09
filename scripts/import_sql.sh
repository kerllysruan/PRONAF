#!/bin/bash

set -e

echo "🔧 Script de Importação - PRONAF Planner"
echo "=========================================="
echo ""

SQL_FILE="data/import_proposals.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Arquivo $SQL_FILE não encontrado!"
    echo "   Execute: npm run generate:proposals"
    exit 1
fi

echo "📊 SQL a importar: $SQL_FILE"
echo ""

# Opção 1: Tentar usar Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI encontrada"
    echo "🔄 Executando migração..."
    supabase db push
    echo "✅ Migração concluída!"
elif [ -n "$SUPABASE_SERVICE_KEY" ] && [ -n "$VITE_SUPABASE_URL" ]; then
    echo "✅ Credenciais Supabase encontradas"
    echo "🔄 Executando SQL..."
    # Usar psql se disponível
    if command -v psql &> /dev/null; then
        # Extrair dados de conexão
        DB_HOST=$(echo $VITE_SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
        DB_NAME="postgres"
        PGPASSWORD=$SUPABASE_SERVICE_KEY psql -h "$DB_HOST.supabase.co" -U postgres -d $DB_NAME -f "$SQL_FILE"
        echo "✅ SQL executado com sucesso!"
    else
        echo "⚠️  psql não encontrado. Use uma das opções abaixo:"
        echo ""
        echo "Opção 1: Instale supabase-cli"
        echo "  npm install -g @supabase/cli"
        echo "  supabase link --project-ref ailmvtqnrltepobtwbhq"
        echo "  supabase db push"
        echo ""
        echo "Opção 2: Execute manualmente no Supabase"
        echo "  1. Acesse: https://app.supabase.com"
        echo "  2. Vá para SQL Editor"
        echo "  3. Cole o conteúdo de: data/import_proposals.sql"
        echo "  4. Clique em 'Executar'"
    fi
else
    echo "⚠️  Não foi possível detectar creditenciais do Supabase"
    echo ""
    echo "Para importar os dados automaticamente, configure:"
    echo "  export SUPABASE_SERVICE_KEY='sua-chave-de-servico'"
    echo ""
    echo "Ou execute manualmente:"
    echo "  1. Acesse: https://app.supabase.com"
    echo "  2. Projeto: ailmvtqnrltepobtwbhq"
    echo "  3. Vá para SQL Editor"
    echo "  4. Cole o conteúdo de: data/import_proposals.sql"
    echo "  5. Clique em 'Executar'"
    echo ""
    exit 1
fi
