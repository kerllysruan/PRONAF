# Manutenção e automações do PRONAF

Este documento descreve as automações adicionadas para corrigir perfis sem `user_id` e como executar as tarefas.

## Scripts adicionados

- `scripts/fix_profiles_user_id.js` — detecta perfis sem `user_id`, tenta casar com usuários do Auth e gera backup em `data/`.
- NPM script `fix:profiles` para executar o script.

## GitHub Actions

Adicionado workflow `.github/workflows/maintenance.yml` que pode ser disparado manualmente (`workflow_dispatch`) e executa o script `fix:profiles`.

### Como usar o workflow

1. Vá para a aba `Actions` do repositório no GitHub.
2. Escolha `Supabase Maintenance` e clique em `Run workflow`.
3. Configure o input `apply` para `true` para aplicar as mudanças, ou use `false` para dry-run.

O workflow usa as secrets do repositório:

- `SUPABASE_SERVICE_KEY` — service role key do Supabase (obrigatório)
- `SUPABASE_URL` — URL do projeto Supabase (opcional, padrão embutido no script)

## Uso local (recomendado primeiro)

1. Dry-run (gera backup):

```bash
export SUPABASE_SERVICE_KEY="sua_service_role_key"
npm run fix:profiles
```

2. Aplicar correções:

```bash
export SUPABASE_SERVICE_KEY="sua_service_role_key"
export FIX_PROFILES_APPLY=true
npm run fix:profiles
```

## Observações

- O script tenta casar perfis por `user_id`, `email` ou `display_name`.
- Perfis órfãos (sem correspondência) serão deletados somente quando `FIX_PROFILES_APPLY=true`.
- Sempre revise o backup gerado em `data/fix_profiles_backup_<timestamp>.json` antes de aplicar.
