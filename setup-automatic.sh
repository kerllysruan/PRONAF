#!/bin/bash

# Script de Setup Automático - Executa todas as migrations e configurações

echo "🚀 Iniciando setup automático do PRONAF Planner..."
echo ""

# Credenciais Supabase
SUPABASE_URL="https://ailmvtqnrltepobtwbhq.supabase.co"
PROJECT_ID="ailmvtqnrltepobtwbhq"

echo "📝 Executando migrations SQL no Supabase..."
echo ""

# SQL a ser executado
SQL_MIGRATIONS=$(cat << 'SQL'
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

-- 5. Criar função RPC para deletar proposta com seus documents
CREATE OR REPLACE FUNCTION public.delete_proposal_with_documents(proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.proposal_documents WHERE proposal_id = $1;
  DELETE FROM public.proposals WHERE id = $1;
END;
$function$;

-- 6. Verificar e corrigir estrutura de user_permissions
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

-- 7. Atualizar RLS para user_permissions (permitir delete de admin)
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

-- 8. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id 
ON public.user_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

SQL
)

# Salvar em arquivo temporário
TEMP_FILE="/tmp/pronaf_migrations.sql"
echo "$SQL_MIGRATIONS" > "$TEMP_FILE"

echo "✅ Migrations preparadas"
echo ""
echo "📋 Para executar as migrations, acesse:"
echo "   👉 https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
echo ""
echo "📋 Cole o conteúdo do arquivo:"
echo "   👉 cat $TEMP_FILE"
echo ""
echo "ou copie o SQL abaixo:"
echo ""
echo "=========================================="
cat "$TEMP_FILE"
echo "=========================================="
echo ""
echo "✨ Após executar o SQL, execute: npm run dev"
