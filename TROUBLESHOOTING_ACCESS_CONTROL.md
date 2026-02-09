# Solução de Problemas - Controle de Acesso

## Erro: "Failed to send a request to the Edge Function"

Este erro ocorre quando a função Edge Function `admin-users` não está disponível ou retorna um erro.

### ✅ Soluções

#### 1️⃣ **Verifique as Tabelas do Banco de Dados**

Acesse o console do Supabase e execute este SQL para criar as tabelas necessárias:

```sql
-- Copie o conteúdo do arquivo:
-- supabase/migrations/20260209_create_roles_and_permissions.sql
```

Ou use o script de setup:

```bash
chmod +x scripts/setup_supabase.sh
./scripts/setup_supabase.sh
```

#### 2️⃣ **Verifique o Usuário Atual é Admin**

A função Edge Function verifica se você é admin. Certifique-se de:

1. Acessar o console do Supabase
2. Ir em **Table Editor** → `user_roles`
3. Verificar se existe uma linha com seu `user_id` e `role = 'admin'`
4. Se não existir, insira manualmente:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<seu-user-id>', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

#### 3️⃣ **Deploy da Função Edge Function**

Se você estiver usando Supabase localmente, a função precisa ser deployada:

```bash
# Instale o Supabase CLI (se não tiver)
npm install -g supabase

# Faça login no Supabase
supabase login

# Link seu projeto
supabase link --project-ref <seu-project-id>

# Deploy da função
supabase functions deploy admin-users
```

#### 4️⃣ **Verifique as Variáveis de Ambiente**

Seu arquivo `.env` deve ter:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

#### 5️⃣ **Reinstale as Dependências**

Se tudo acima não funcionar:

```bash
npm install
npm run dev
```

### 🔍 **Debug Avançado**

1. Abra o **DevTools** do navegador (F12)
2. Vá para a aba **Network**
3. Tente criar um usuário
4. Procure pela requisição para `admin-users`
5. Verifique a resposta exata do erro

### 📞 **Ainda Não Funciona?**

1. Verifique se todas as migrações foram aplicadas
2. Confirme que é admin consultando a tabela `user_roles`
3. Verifique os logs da função: Supabase Console → Edge Functions → Log
4. Tente fazer logout e login novamente

---

## Estrutura das Tabelas

### `user_roles`
```
- id (uuid)
- user_id (uuid) ← user_id do auth.users
- role (varchar) ← 'admin', 'gerente', 'usuario'
- created_at
- updated_at
```

### `user_permissions`
```
- id (uuid)
- user_id (uuid)
- can_view_dashboard (boolean)
- can_view_proposals (boolean)
- ... outras permissões
```

### `profiles`
```
- id (uuid)
- user_id (uuid)
- display_name (text)
- created_at
- updated_at
```
