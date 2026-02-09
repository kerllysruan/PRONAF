# 🚀 Sistema PRONAF - Guia de Configuração Completo

## Resumo da Configuração

Este guia mostra como configurar completamente o sistema PRONAF com:
- ✅ 26 propostas de crédito PRONAF importadas
- ✅ Usuário admin criado (Matrícula: F180227)
- ✅ Sistema pronto para uso

---

## 📋 Pré-requisitos

Você precisa ter:
1. **SUPABASE_SERVICE_KEY** - Para automação completa (opcional)
2. **Acesso ao Supabase Dashboard** - Para importação manual

---

## 🚀 Três formas de setup

### Opção 1: Setup Completo Automático (RECOMENDADO)

Use esta opção se você tem a **Service Key**.

```bash
# Configure a service key
export SUPABASE_SERVICE_KEY="sua-service-key-aqui"

# Execute o setup completo
npm run setup:all
```

Este comando:
- Gera SQL das propostas
- Importa propostas
- Cria usuário admin
- Inicia o servidor

**Onde encontrar a Service Key:**
1. Abra https://app.supabase.com
2. Selecione o projeto: `ailmvtqnrltepobtwbhq`
3. Acesse: **Settings > API > Service Role Secret**

---

### Opção 2: Setup Parcial Manual

Se você **não tem** a service key, faça isso em dois passos:

#### Passo 1: Importar Propostas (Manual)

```bash
npm run generate:proposals
```

Depois:
1. Abra https://app.supabase.com → `ailmvtqnrltepobtwbhq`
2. Vá para: **SQL Editor** (ícone de código)
3. Cole todo o conteúdo de: `/data/import_proposals.sql`
4. Clique: **Executar**

#### Passo 2: Criar Usuário Admin (Manual)

Sem service key, você pode criar o usuário direto no SQL:

```bash
# Cole no SQL Editor do Supabase:
```

```sql
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin-F180227@pronaf.local',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"matricula": "F180227", "display_name": "Administrador PRONAF"}',
  now(),
  now()
);
```

#### Passo 3: Iniciar Servidor

```bash
npm run dev
```

---

### Opção 3: Só Iniciar (Dados Já Configurados)

Se os datos já estão no banco:

```bash
npm run dev
```

Abra: http://localhost:8081

---

## 🔑 Credenciais de Acesso

**Usuário Admin criado:**
- **Matrícula:** `F180227`
- **Senha:** `123456`
- **Email:** `admin-F180227@pronaf.local` (opcional)

---

## 📱 Como Fazer Login

1. Abra a aplicação: http://localhost:8081
2. Selecione aba: **"Matrícula"** (a opção padrão)
3. Insira sua matrícula: `F180227`
4. Insira sua senha: `123456`
5. Clique: **"Entrar"**

---

## 📊 O que foi importado?

### 26 Propostas PRONAF foram carregadas:

Cada proposta contém:
- ✅ Nome do produtor
- ✅ CPF/CNPJ
- ✅ Valor solicitado
- ✅ Linha PRONAF (Custeio, Investimento, etc)
- ✅ Data de entrada
- ✅ Notas e observações
- ✅ Status (nova)

---

## 🔄 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor dev

# Propostas
npm run generate:proposals    # Gera SQL das propostas
npm run import:supabase      # Importa propostas (precisa SERVICE_KEY)

# Setup
npm run setup:complete       # Importa propostas e inicia servo
npm run setup:all           # Setup COMPLETO (propostas + admin + servidor)

# Admin
npm run create:admin         # Cria usuário admin (precisa SERVICE_KEY)

# Outros
npm run build           # Build para produção
npm run lint           # Verifica eslint
npm run test           # Executa testes
```

---

## 🐛 Troubleshooting

### "Matrícula não encontrada" ao fazer login

**Solução:** Verifique se o usuário foi criado corretamente no banco.

```sql
-- No SQL Editor do Supabase, execute:
SELECT * FROM public.user_profiles WHERE matricula = 'F180227';
```

### "aplicação não carrega" ou "erro ao conectar Supabase"

**Solução:** Verifique as variáveis de ambiente em `.env:`

```bash
cat .env
```

Deve conter:
```
VITE_SUPABASE_PROJECT_ID="ailmvtqnrltepobtwbhq"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
VITE_SUPABASE_URL="https://ailmvtqnrltepobtwbhq.supabase.co"
```

### "Porta 8080 em uso"

O servidor usa a próxima porta disponível (8081, 8082, etc). Verifique a mensagem no terminal:
```
➜  Local:   http://localhost:8081/
```

---

## 💡 Próximos Passos

1. **Login como admin:** Use F180227 / 123456
2. **Crie usuários adicionais:** No Dashboard > Access Control
3. **Verifique propostas:** Dashboard > Propostas
4. **Configure equipe:** Management > Team Members

---

## 📚 Documentação Adicional

- **Supabase:** https://supabase.com/docs
- **React:** https://react.dev
- **Tailwind:** https://tailwindcss.com

---

## ✅ Checklist de Setup

- [ ] Service Key obtida (opcional mas recomendado)
- [ ] Propostas importadas
- [ ] Usuário admin criado
- [ ] Servidor iniciado (http://localhost:8081)
- [ ] Login realizado com sucesso

---

**Pronto para começar! 🎉**
