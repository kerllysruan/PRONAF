import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, serviceRoleKey);
async function run() {
  const { data, error } = await adminClient.auth.admin.updateUserById('5e23ba77-1f68-47ca-82db-c9e5b929af5e', {
    email: 'projetista.neymedeiros@pronaf.local',
    email_confirm: true,
    user_metadata: { display_name: 'NEY MEDEIROS', matricula: 'f000001' }
  });
  console.log('Result:', data, error);
}
run();
