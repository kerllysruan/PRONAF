#!/usr/bin/env node
/*
 Script para detectar e corrigir perfis sem user_id no Supabase.
 Uso:
  SUPABASE_SERVICE_KEY="..." node scripts/fix_profiles_user_id.js    # dry-run
  SUPABASE_SERVICE_KEY="..." FIX_PROFILES_APPLY=true node scripts/fix_profiles_user_id.js  # aplica mudanças

 O script faz backup dos perfis afetados em data/fix_profiles_backup.json
*/

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ailmvtqnrltepobtwbhq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APPLY = process.env.FIX_PROFILES_APPLY === 'true';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida. Exporte a variável e tente novamente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔎 Buscando perfis...');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  if (pErr) {
    console.error('Erro ao buscar profiles:', pErr.message || pErr);
    process.exit(1);
  }

  console.log('🔎 Buscando usuários no Auth (admin)...');
  const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) {
    console.error('Erro ao listar usuários auth:', uErr.message || uErr);
    process.exit(1);
  }
  const users = usersData?.users || [];

  const orphanProfiles = [];
  const fixes = [];

  for (const profile of profiles) {
    const hasUserId = profile.user_id && profile.user_id !== '';
    let matchedUser = null;

    if (hasUserId) {
      matchedUser = users.find((u) => u.id === profile.user_id);
      if (!matchedUser) {
        console.warn('Profile tem user_id mas usuário não existe:', profile);
      }
    }

    // tente casar por email (se o profile tiver campo email)
    if (!matchedUser && profile.email) {
      matchedUser = users.find((u) => u.email === profile.email);
    }

    // tente casar por display_name nos metadados
    if (!matchedUser && profile.display_name) {
      matchedUser = users.find((u) => (u.user_metadata && u.user_metadata.display_name && u.user_metadata.display_name === profile.display_name));
    }

    if (matchedUser) {
      if (!hasUserId || profile.user_id !== matchedUser.id) {
        fixes.push({ profile, user_id: matchedUser.id });
      }
    } else {
      // sem match
      orphanProfiles.push(profile);
    }
  }

  const outDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const backupPath = path.join(outDir, `fix_profiles_backup_${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ fixes, orphanProfiles }, null, 2));
  console.log(`📦 Backup salvo em ${backupPath}`);

  console.log(`
✅ Encontrados ${fixes.length} perfis a atualizar e ${orphanProfiles.length} perfis órfãos.`);

  if (!APPLY) {
    console.log('\n🤖 Modo dry-run. Para aplicar as mudanças, execute com FIX_PROFILES_APPLY=true');
    if (fixes.length > 0) console.log('Exemplo de atualização: update profiles set user_id=... where id=...');
    process.exit(0);
  }

  console.log('\n⚙️ Aplicando correções...');
  for (const f of fixes) {
    const profile = f.profile;
    const updatePayload = { user_id: f.user_id };
    // tentar atualizar por primary key `id` se existir, caso contrário por display_name
    let filter = null;
    if (profile.id) filter = { column: 'id', value: profile.id };
    else if (profile.user_id) filter = { column: 'user_id', value: profile.user_id };
    else if (profile.display_name) filter = { column: 'display_name', value: profile.display_name };

    if (!filter) {
      console.warn('Não foi possível identificar filtro para atualizar profile:', profile);
      continue;
    }

    const { error: upErr } = await supabase.from('profiles').update(updatePayload).eq(filter.column, filter.value);
    if (upErr) {
      console.error('Erro ao atualizar profile', profile, upErr.message || upErr);
    } else {
      console.log('Atualizado profile', filter, '-> user_id=', f.user_id);
    }
  }

  console.log('\n🧹 Removendo perfis órfãos (sem match)...');
  for (const p of orphanProfiles) {
    if (!p.id && !p.display_name) {
      console.warn('Perfil sem identificador seguro, pulando:', p);
      continue;
    }
    const filterCol = p.id ? 'id' : 'display_name';
    const filterVal = p.id ? p.id : p.display_name;
    const { error: delErr } = await supabase.from('profiles').delete().eq(filterCol, filterVal);
    if (delErr) {
      console.error('Erro ao deletar profile', p, delErr.message || delErr);
    } else {
      console.log('Deletado profile', filterCol, '=', filterVal);
    }
  }

  console.log('\n✅ Correções aplicadas. Recomendo verificar no painel do Supabase e reiniciar a aplicação se necessário.');
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
