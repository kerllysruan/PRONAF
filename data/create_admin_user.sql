-- ============================================
-- Script para criar usuário ADMIN manualmente
-- ============================================
-- 
-- Este script deve ser executado no SQL Editor do Supabase
-- 1. Vá para: https://app.supabase.com
-- 2. Projeto: ailmvtqnrltepobtwbhq
-- 3. SQL Editor (ícone de código)
-- 4. Cole este conteúdo e clique "Executar"
--
-- ============================================

-- Criar usuário no Auth (este é um exemplo simplificado)
-- Nota: Para criar usuários em produção, use a service role key via admin API

-- Inserir profile do usuário (após a criação do usuário no auth)
-- Você precisará primeiro obter o UUID do usuário criado no Auth

-- Para um usuário já existente com UUID = 'SEU_UUID_AQUI', execute:
-- Substitua 'SEU_UUID_AQUI' pelo UUID real do usuário

-- Exemplo de como criar via Admin API (usando service key):
/*
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change_token_confirm,
  email_changed_at
)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin-F180227@pronaf.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"matricula": "F180227", "display_name": "Administrador PRONAF"}',
  now(),
  now(),
  now(),
  '',
  now(),
  '',
  now(),
  '',
  '',
  null
) ON CONFLICT DO NOTHING
RETURNING id;
*/

-- Maneira mais simples: Use o script Node.js fornecido
-- Execute no terminal:
--   export SUPABASE_SERVICE_KEY="sua-service-key"
--   npm run create:admin

-- Instruções passo a passo:
-- 1. Obtenha a Service Key em Settings > API > Service Role Secret
-- 2. Execute o comando acima
-- 3. O usuário será criado com:
--    - Matrícula: F180227
--    - Senha: 123456
--    - Email: admin-F180227@pronaf.local
--    - Role: admin
--    - Permissões: Total acesso

-- Após a criação, faça login na aplicação:
-- 1. Abra http://localhost:8081
-- 2. Selecione a aba "Matrícula"
-- 3. Insira: F180227
-- 4. Insira a senha: 123456
-- 5. Clique "Entrar"
