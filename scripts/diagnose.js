import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostic() {
  try {
    console.log("=== Diagnóstico do Banco de Dados ===\n");

    // 1. Check if profiles table exists and list columns
    console.log("1. Verificando tabela 'profiles'...");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (error) {
        console.log(`❌ Erro ao acessar profiles: ${error.message}`);
      } else {
        console.log("✅ Tabela profiles existe e é acessível");
        if (data && data.length > 0) {
          console.log("Colunas disponíveis:", Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }

    // 2. Check user_roles table
    console.log("\n2. Verificando tabela 'user_roles'...");
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .limit(1);

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log("✅ Tabela user_roles existe");
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }

    // 3. Check user_permissions table
    console.log("\n3. Verificando tabela 'user_permissions'...");
    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .limit(1);

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log("✅ Tabela user_permissions existe");
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }

    // 4. List all tables in public schema
    console.log("\n4. Listando todas as tabelas no esquema 'public'...");
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log("✅ Tabelas encontradas:");
        data?.forEach((table) => {
          console.log(`  - ${table.table_name}`);
        });
      }
    } catch (err) {
      console.log(`❌ Erro ao listar tabelas: ${err.message}`);
    }

    // 5. Get current user info
    console.log("\n5. Informações do usuário autenticado...");
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.log(`❌ Não autenticado: ${error.message}`);
      } else {
        console.log(`✅ Usuário: ${user?.email}`);
        console.log(`   ID: ${user?.id}`);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }

    console.log("\n=== Fim do Diagnóstico ===");
  } catch (err) {
    console.error("Erro geral:", err);
    process.exit(1);
  }
}

diagnostic();
