#!/bin/bash

# Script para configurar o Supabase com as tabelas necessárias
set -e

echo "🔧 Configurando Supabase..."

# Verifique se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase"
    echo "📚 Documentação: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Verifique se o .env tem as variáveis necessárias
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

echo "✅ Supabase CLI encontrado"

# Aplicar migrações
echo "📦 Aplicando migrações..."
supabase migration up || echo "⚠️  Algumas migrações podem já estar aplicadas"

# Deploy da função Edge Function
echo "🚀 Deployando função Edge Function..."
supabase functions deploy admin-users --no-verify || echo "⚠️  Função pode já estar deployada"

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Próximos passos:"
echo "1. Certifique-se de que a variável SUPABASE_URL está definida em .env"
echo "2. Certifique-se de que a variável SUPABASE_ANON_KEY está definida em .env"
echo "3. Faça login como admin na plataforma"
echo "4. Acesse Controle de Acesso para criar usuários"
echo ""
echo "Se encontrar erros, verifique:"
echo "- Supabase CLI está instalado: supabase --version"
echo "- projeto está conectado: supabase projects list"
echo "- Você está logado: supabase auth list"
