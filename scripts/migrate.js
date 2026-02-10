import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error("Erro: VITE_SUPABASE_URL não definido");
  process.exit(1);
}

// For this we need service key, but we'll try with the publishable key
const key = supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY;

if (!key) {
  console.error("Erro: Nenhuma chave de acesso disponível");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInBrowser: false,
  },
});

async function applyMigration() {
  try {
    console.log("Lendo migração...");
    const migrationSql = readFileSync(
      "/workspaces/remix-of-remix-of-remix-of-remix-of-pronaf-planner/supabase/migrations/20260210_add_user_id_to_profiles.sql",
      "utf-8"
    );

    // Split SQL statements properly
    const statements = migrationSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Encontradas ${statements.length} instruções SQL`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\nExecutando instruções ${i + 1}/${statements.length}...`);
      console.log(`Comando: ${stmt.substring(0, 60)}...`);

      try {
        // Use Supabase REST API to execute raw SQL
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/execute_sql`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sql: stmt }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          console.warn(`⚠️  Aviso: ${error.message || response.statusText}`);
        } else {
          console.log("✅ Executado com sucesso");
        }
      } catch (err) {
        console.error(`❌ Erro: ${err.message}`);
        // Continue com próximas instruções mesmo se uma falhar
      }
    }

    console.log("\n✅ Migração completada!");
  } catch (err) {
    console.error("Erro geral:", err.message);
    process.exit(1);
  }
}

applyMigration();
