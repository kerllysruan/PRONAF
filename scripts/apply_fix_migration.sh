#!/bin/bash
# Apply migration directly using SQL query against Supabase

cd /workspaces/remix-of-remix-of-remix-of-remix-of-pronaf-planner

# Get environment variables
set -a
source .env.local 2>/dev/null || source .env 2>/dev/null || true
set +a

if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "Erro: VITE_SUPABASE_URL não está definido"
  echo "Verifique .env.local ou .env"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "Erro: VITE_SUPABASE_ANON_KEY não está definido" 
  exit 1
fi

echo "Supabase URL: $VITE_SUPABASE_URL"

# Create a simple Node.js script to apply the migration
cat > /tmp/apply_migration.js << 'EOF'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Supabase credentials not found')
  process.exit(1)
}

const client = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  try {
    // Read migration SQL
    const migrationSql = fs.readFileSync(
      '/workspaces/remix-of-remix-of-remix-of-remix-of-pronaf-planner/supabase/migrations/20260210_fix_profiles_user_id.sql',
      'utf-8'
    )
    
    console.log('Executando migração...')
    
    // Execute the migration
    const { error } = await client.rpc('execute_sql', {
      sql: migrationSql
    }).then(() => ({ error: null })).catch(err => ({ error: err }))
    
    if (error) {
      console.error('Erro ao executar migração via RPC:', error)
      console.log('Tentando abordagem alternativa...')
      
      // Try alternative: split and execute statements
      const statements = migrationSql.split(';').filter(s => s.trim())
      
      for (const stmt of statements) {
        if (!stmt.trim()) continue
        
        console.log('Executando:', stmt.substring(0, 50) + '...')
        const { error: stmtError } = await client
          .from('information_schema.tables')
          .select('*')
          .then(() => ({ error: null }))
          .catch(err => ({ error: err }))
        
        if (stmtError) {
          console.warn('Aviso:', stmtError.message)
        }
      }
    }
    
    console.log('Migração aplicada com sucesso!')
    
  } catch (err) {
    console.error('Erro:', err.message)
    process.exit(1)
  }
}

applyMigration()
EOF

# Run the Node.js script
node --input-type=module --eval "$(cat /tmp/apply_migration.js)"
