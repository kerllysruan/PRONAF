import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ailmvtqnrltepobtwbhq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida');
  console.log('\n📋 Para criar o usuário MIERCIO, execute:');
  console.log('  $env:SUPABASE_SERVICE_KEY="sua-service-key"');
  console.log('  node scripts/create_miercio.mjs\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createMiercio() {
  console.log('👤 CRIANDO USUÁRIO MIERCIO');
  console.log('==========================\n');

  const MATRICULA = 'MIERCIO';
  const PASSWORD = '123456';
  const EMAIL = `miercio@pronaf.local`;
  const DISPLAY_NAME = 'MIERCIO';

  try {
    // 1. Criar usuário no Auth
    console.log('📝 Criando usuário no Auth...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        matricula: MATRICULA,
        display_name: DISPLAY_NAME,
      },
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe no Auth.');
      } else {
        throw createError;
      }
    } else {
      console.log('✅ Usuário criado no Auth:', user.id);
    }

    const userId = user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === EMAIL)?.id;

    if (!userId) throw new Error("Não foi possível determinar o ID do usuário.");

    // 2. Criar Profile
    console.log('📊 Configurando perfil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        display_name: DISPLAY_NAME,
        full_name: DISPLAY_NAME,
        email: EMAIL,
        updated_at: new Date().toISOString(),
      });

    if (profileError) console.warn('⚠️ Erro no Profile:', profileError.message);
    else console.log('✅ Profile configurado.');

    // 3. Atribuir Role (Analyst)
    console.log('🔑 Atribuindo papel de Analista...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'analyst' });

    if (roleError) console.warn('⚠️ Erro na Role:', roleError.message);
    else console.log('✅ Papel atribuído.');

    // 4. Configurar Permissões (Padrão Analista)
    console.log('🔐 Configurando permissões...');
    const { error: permError } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        can_view_dashboard: true,
        can_view_proposals: true,
        can_view_kanban: true,
        can_view_documentation: true,
        can_view_visits: true,
        can_create_proposals: true,
        can_edit_proposals: true,
        can_view_tasks: true,
        can_manage_tasks: true,
        can_view_management: false,
        can_view_access_control: false,
        read_only: false,
      });

    if (permError) console.warn('⚠️ Erro nas permissões:', permError.message);
    else console.log('✅ Permissões configuradas.');

    console.log('\n🚀 USUÁRIO MIERCIO PRONTO PARA USO!');
    console.log('-----------------------------------');
    console.log(`Login (Matrícula): ${MATRICULA}`);
    console.log(`Senha: ${PASSWORD}`);
    console.log('-----------------------------------\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

createMiercio();
