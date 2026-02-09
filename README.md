# PRONAF Planner - Sistema de Gestão de Propostas

## 📋 Descrição

Sistema moderno de gerenciamento de propostas com controle de acesso robusto, integrado ao Supabase e desenvolvido com React + TypeScript.

## ✨ Recursos Principais

- 📊 **Dashboard** - Visualização geral das propostas
- 📝 **Propostas** - Gerenciamento completo de propostas
- 📋 **Kanban** - Quadro visual de tarefas
- 🏛️ **Visitação** - Agendamento de visitas
- 🔐 **Controle de Acesso** - Gestão de permissões por usuário
- 📚 **Documentação** - Recursos e guias

# PRONAF Planner - Sistema de Gestão de Propostas

## 📋 Descrição

Sistema moderno de gerenciamento de propostas com controle de acesso robusto, integrado ao Supabase e desenvolvido com React + TypeScript.

## ✨ Recursos Principais

- 📊 **Dashboard** - Visualização geral das propostas
- 📝 **Propostas** - Gerenciamento completo de propostas
- 📋 **Kanban** - Quadro visual de tarefas
- 🏛️ **Visitação** - Agendamento de visitas
- 🔐 **Controle de Acesso** - Gestão de permissões por usuário
- 📚 **Documentação** - Recursos e guias

## 🚀 Início Rápido

```bash
# 1. Clone e navegue para o projeto
git clone <seu-repositório>
cd pronaf-planner

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env com:
# VITE_SUPABASE_URL=seu-url-aqui
# VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# 4. Configure o Supabase
chmod +x scripts/setup_supabase.sh
./scripts/setup_supabase.sh

# 5. Inicie o servidor
npm run dev
```

## 🔐 Controle de Acesso

### Funcionalidades

- ✅ Criar, editar e deletar usuários
- ✅ Atribuir perfis (Administrador, Gerente, Usuário)
- ✅ Controle granular de permissões
- ✅ Busca e filtros de usuários
- ✅ Visualização de permissões por usuário

### Como Usar

1. Acesse **Controle de Acesso** no menu principal
2. Clique em **Novo Usuário**
3. Preencha os dados do usuário
4. Selecione o perfil (Admin, Gerente ou Usuário)
5. Clique em **Criar Usuário**

### Permissões Disponíveis

#### 📊 Acesso às Páginas
- Dashboard
- Propostas
- Kanban
- Documentação
- Agenda de Visitas
- Gerenciamento
- Controle de Acesso

#### ✏️ Ações em Propostas
- Criar Propostas
- Editar Propostas
- Deletar Propostas
- Aprovar/Rejeitar Propostas

#### 🔒 Segurança
- Modo Somente Leitura

### Solução de Problemas

Se receber erro "Failed to send a request to the Edge Function":

1. Consulte [TROUBLESHOOTING_ACCESS_CONTROL.md](./TROUBLESHOOTING_ACCESS_CONTROL.md)
2. Verifique se as migrações foram aplicadas
3. Confirme se você é admin na tabela `user_roles`

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilo**: Tailwind CSS + shadcn-ui
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Functions**: Edge Functions (Deno)

## 📦 Estrutura do Projeto

```
src/
├── pages/          # Páginas principais
├── components/     # Componentes reutilizáveis
├── hooks/          # Custom React hooks
├── integrations/   # Integrações (Supabase)
├── assets/         # Imagens e ícones
└── types/          # Tipos TypeScript

supabase/
├── migrations/     # Migrações do banco de dados
└── functions/      # Edge Functions
```

## 🔧 Scripts

```bash
npm run dev         # Inicia servidor de desenvolvimento
npm run build       # Build para produção
npm run preview     # Preview do build
npm run test        # Execute testes
npm run lint        # Verifica o código
```

## 📚 Documentação Adicional

- [Setup Guide](./SETUP_GUIDE.md) - Guia completo de configuração
- [Troubleshooting](./TROUBLESHOOTING_ACCESS_CONTROL.md) - Solução de problemas com controle de acesso
- [Import Guide](./data/README_IMPORT.md) - Como importar dados

## 🤝 Contribuindo

Faça fork do projeto, crie uma branch para sua feature e envie um pull request.

## 📄 Licença

Este projeto está sob licença MIT.

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
