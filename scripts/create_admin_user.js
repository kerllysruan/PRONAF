import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://ailmvtqnrltepobtwbhq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida');
  console.log('\n📋 Para criar o usuário admin, execute:');
  console.log('  export SUPABASE_SERVICE_KEY="sua-service-key"');
  console.log('  npm run create:admin\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdminUser() {
  console.log('👤 CRIANDO USUÁRIO ADMIN');
  console.log('========================\n');

  const MATRICULA = 'F180227';
  const PASSWORD = '123456';
  const EMAIL = `admin-${MATRICULA}@pronaf.local`;

  try {
    // Verificar se usuário já existe
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Erro ao verificar usuários:', checkError.message);
      process.exit(1);
    }

    const userExists = existingUser.users.some(u => 
      u.user_metadata?.matricula === MATRICULA || u.email === EMAIL
    );

    if (userExists) {
      console.log('⚠️  Usuário com matrícula F180227 já existe!\n');
      return;
    }

    // Criar novo usuário
    console.log('📝 Criando usuário...');
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        matricula: MATRICULA,
        display_name: 'Administrador PRONAF',
      },
    });

    if (createError) {
      console.error('❌ Erro ao criar usuário:', createError.message);
      process.exit(1);
    }

    console.log('✅ Usuário criado no Auth');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);

    // Aguardar um pouco para o trigger criar o profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Atualizar profile para admin
    console.log('\n📊 Configurando perfil...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: 'Administrador PRONAF',
        is_admin: true,
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.warn('⚠️  Erro ao atualizar profile:', profileError.message);
    } else {
      console.log('✅ Profile atualizado');
    }

    // Atribuir role de admin
    console.log('\n🔑 Atribuindo role de admin...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
      })
      .select();

    if (roleError && !roleError.message.includes('duplicate')) {
      console.warn('⚠️  Erro ao atribuir role:', roleError.message);
    } else {
      console.log('✅ Role de admin atribuído');
    }

    // Configurar permissões
    console.log('\n🔐 Configurando permissões...');
    const { error: permError } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: user.id,
        can_view_dashboard: true,
        can_view_proposals: true,
        can_view_kanban: true,
        can_view_documentation: true,
        can_view_visits: true,
        can_view_management: true,
        can_view_access_control: true,
        can_create_proposals: true,
        can_edit_proposals: true,
        can_delete_proposals: true,
        can_approve_proposals: true,
        read_only: false,
      })
      .select();

    if (permError) {
      console.warn('⚠️  Erro ao configurar permissões:', permError.message);
    } else {
      console.log('✅ Permissões configuradas (total acesso)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ USUÁRIO ADMIN CRIADO COM SUCESSO!\n');
    console.log('Credenciais de acesso:');
    console.log('─────────────────────');
    console.log(`  Matrícula: ${MATRICULA}`);
    console.log(`  Senha: ${PASSWORD}`);
    console.log(`  Email: ${EMAIL}`);
    console.log('\n💡 Dica: Na tela de login, use a opção de login com matrícula');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

createAdminUser();
