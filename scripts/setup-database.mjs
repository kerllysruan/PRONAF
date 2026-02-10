import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://ailmvtqnrltepobtwbhq.supabase.co";
const PROJECT_ID = "ailmvtqnrltepobtwbhq";

// Load .env
const envPath = path.join(__dirname, "..", ".env");
let SUPABASE_SERVICE_KEY = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const serviceKeyMatch = envContent.match(
    /SUPABASE_SERVICE_KEY="?([^"]+)"?/
  );
  if (serviceKeyMatch) {
    SUPABASE_SERVICE_KEY = serviceKeyMatch[1];
  }
}

if (!SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_SERVICE_KEY não encontrada em .env");
  console.log(
    "   Por favor, adicione SUPABASE_SERVICE_KEY ao arquivo .env"
  );
  process.exit(1);
}

const MIGRATIONS = [
  `ALTER TABLE public.profiles
   ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;`,

  `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);`,

  `DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;`,

  `CREATE POLICY IF NOT EXISTS "Admins can delete profiles"
   ON public.profiles
   FOR DELETE
   TO authenticated
   USING (EXISTS (
     SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'admin'
   ));`,

  `ALTER TABLE public.proposal_documents
   DROP CONSTRAINT IF EXISTS proposal_documents_proposal_id_fkey,
   ADD CONSTRAINT proposal_documents_proposal_id_fkey 
     FOREIGN KEY (proposal_id) 
     REFERENCES public.proposals(id) 
     ON DELETE CASCADE;`,

  `CREATE INDEX IF NOT EXISTS idx_proposal_documents_proposal_id 
   ON public.proposal_documents(proposal_id);`,

  `CREATE INDEX IF NOT EXISTS idx_proposals_user_id 
   ON public.proposals(user_id);`,

  `ALTER TABLE public.user_permissions
   ADD COLUMN IF NOT EXISTS can_view_dashboard boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_proposals boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_kanban boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_documentation boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_visits boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_management boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_view_access_control boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_create_proposals boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_edit_proposals boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_delete_proposals boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS can_approve_proposals boolean DEFAULT false,
   ADD COLUMN IF NOT EXISTS read_only boolean DEFAULT false;`,

  `DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;`,

  `CREATE POLICY IF NOT EXISTS "Admins can manage all permissions"
   ON public.user_permissions
   FOR ALL
   TO authenticated
   USING (EXISTS (
     SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'admin'
   ))
   WITH CHECK (EXISTS (
     SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'admin'
   ));`,

  `CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
   ON public.user_permissions(user_id);`,

  `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
   ON public.user_roles(user_id);`,
];

async function executeMigration(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || response.statusText,
      };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function runMigrations() {
  console.log("🚀 Iniciando setup automático do PRONAF Planner...\n");
  console.log(`📝 URL do Supabase: ${SUPABASE_URL}`);
  console.log(`📋 Número de migrations: ${MIGRATIONS.length}\n`);

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < MIGRATIONS.length; i++) {
    const sql = MIGRATIONS[i];
    const shortSql = sql.substring(0, 50).replace(/\n/g, " ") + "...";

    process.stdout.write(`[${i + 1}/${MIGRATIONS.length}] ${shortSql}`);

    const result = await executeMigration(sql);

    if (result.success) {
      console.log(" ✅");
      successful++;
    } else {
      console.log(` ❌ ${result.error}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\n📊 Resultado:\n`);
  console.log(`   ✅ Sucesso: ${successful}/${MIGRATIONS.length}`);
  if (failed > 0) {
    console.log(`   ⚠️  Erros: ${failed}/${MIGRATIONS.length}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✨ Setup completo! Agora execute:\n");
  console.log("   npm run dev\n");
}

runMigrations().catch(console.error);
