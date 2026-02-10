# ⚡ Setup Automático - PRONAF Planner

Escolha uma das opções abaixo para configurar o banco de dados:

---

## ✅ Opção 1: Automática (Recomendada)

### 1. Obter o Service Key do Supabase

1. Acesse: https://supabase.com/dashboard/project/ailmvtqnrltepobtwbhq/settings/api
2. Copie o **Service Role secret** (cuidado: não confunda com Token!)
3. Adicione ao arquivo `.env`:

```bash
echo 'SUPABASE_SERVICE_KEY="sua_chave_aqui"' >> .env
```

### 2. Executar o setup

```bash
npm run setup:db
```

O script executará todas as migrations automaticamente!

---

## ✅ Opção 2: Manual via Supabase Dashboard

### 1. Acesse o SQL Editor

👉 https://supabase.com/dashboard/project/ailmvtqnrltepobtwbhq/sql/new

### 2. Cole todo o SQL abaixo:

```sql
-- 1. Adicionar coluna user_id à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 2. Atualizar RLS policies para profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY IF NOT EXISTS "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- 3. Garantir que proposal_documents tem cascata de delete
ALTER TABLE public.proposal_documents
DROP CONSTRAINT IF EXISTS proposal_documents_proposal_id_fkey,
ADD CONSTRAINT proposal_documents_proposal_id_fkey 
  FOREIGN KEY (proposal_id) 
  REFERENCES public.proposals(id) 
  ON DELETE CASCADE;

-- 4. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_proposal_documents_proposal_id 
ON public.proposal_documents(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposals_user_id 
ON public.proposals(user_id);

-- 5. Corrigir estrutura de user_permissions
ALTER TABLE public.user_permissions
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
ADD COLUMN IF NOT EXISTS read_only boolean DEFAULT false;

-- 6. Atualizar RLS para user_permissions
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

CREATE POLICY IF NOT EXISTS "Admins can manage all permissions"
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
));

-- 7. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON public.user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);
```

### 3. Clique em **Run** ou **Executar**

---

## 🔧 Correções Implementadas

### AccessControl (Controle de Acesso)
- ✅ Normalizar dados de permissões antes de atualizar
- ✅ Evitar erros de tipo "uuid: null"
- ✅ Melhor tratamento de erros

### Proposals (Propostas)
- ✅ Deletar documents antes de deletar proposta
- ✅ Respeitar foreign keys
- ✅ Mensagens de erro melhoradas

### Banco de Dados
- ✅ Coluna `user_id` em profiles
- ✅ Foreign keys com DELETE CASCADE corretos
- ✅ RLS policies completas
- ✅ Índices para performance

---

## 🧪 Testar Depois

1. **Criar usuário**: Controle de Acesso → Novo Usuário
2. **Deletar usuário**: Menu de contexto → Deletar
3. **Deletar proposta**: Propostas → Ícone de lixeira
4. **Atualizar permissões**: Controle de Acesso → Abrir diálogo de permissões

Todos devem funcionar sem erros! ✅

---

## 📞 Se houver erros

Verifique:
1. ✅ Você está logado como admin?
2. ✅ As migrações foram executadas?
3. ✅ Abra o console do navegador (F12) para ver detalhes
4. ✅ Verifique os logs do Supabase: https://supabase.com/dashboard/project/ailmvtqnrltepobtwbhq/logs/edge-logs

---

**Status**: 🟢 Pronto para executar!
