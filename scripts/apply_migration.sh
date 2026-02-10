#!/bin/bash
# Script para aplicar a migração de fix do profiles.user_id

SUPABASE_URL=$(grep "api_url" ~/.supabase/config.json | head -1 | cut -d'"' -f4)
SUPABASE_KEY=$(grep "anon_key" ~/.supabase/config.json | head -1 | cut -d'"' -f4)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Erro: Supabase não está configurado. Execute 'supabase login' e 'supabase link'"
  exit 1
fi

echo "Aplicando migração de fix para profiles.user_id..."
echo "URL: $SUPABASE_URL"

# Read the migration file
MIGRATION_SQL=$(cat /workspaces/remix-of-remix-of-remix-of-remix-of-pronaf-planner/supabase/migrations/20260210_fix_profiles_user_id.sql)

# Try to execute using supabase CLI
cd /workspaces/remix-of-remix-of-remix-of-remix-of-pronaf-planner

# Try push migrations
echo "Tentando aplicar via supabase push..."
supabase db push 2>&1 || echo "supabase push falhou"
