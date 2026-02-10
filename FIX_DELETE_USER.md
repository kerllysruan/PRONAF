# 🔧 FIX: Adicionar coluna user_id à tabela profiles

## Problema
A função de deleção de usuários está falhando com erro:
```
column profiles.user_id does not exist
```

## Causa
A ta tabela `profiles` não possui a coluna `user_id` que é necessária para identificar qual usuário deletar.

## Solução

### 1️⃣  Executar SQL no Supabase Dashboard

Acesse: **https://supabase.com/dashboard/project/ailmvtqnrltepobtwbhq/sql/new**

Copie e cole o SQL abaixo:

```sql
-- Add user_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));
```

Clique em **Run** ou **Executar**.

### 2️⃣ Atualizar dados existentes (se necessário)

Se houver usuários já criados, você pode relacioná-los assim:

```sql
-- Relacionar perfis com usuários existentes
-- CUIDADO: Adapte conforme sua lógica de negócio
UPDATE public.profiles
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = profiles.email
  LIMIT 1
)
WHERE user_id IS NULL;
```

### 3️⃣ Verificar se funcionou

Tente deletar um usuário novamente na página de Controle de Acesso. O erro deve desaparecer.

## Checksum
- ✅ Coluna `user_id` adicionada à tabela `profiles`
- ✅ Index criado para performance
- ✅ RLS policy atualizada para permitir delete de admin

## Próximas steps
- [ ] Executar SQL acima
- [ ] Testar deleção de usuário
- [ ] Confirmar sucesso
