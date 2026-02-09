# Importação de Propostas PRONAF

Este diretório contém o pipeline de importação de dados de propostas para o banco de dados.

## Arquivos

- **`raw_proposals.csv`** – Arquivo CSV bruto com os dados originais (semicolon-delimited)
- **`import_proposals.sql`** – Script SQL gerado automaticamente com 26 INSERTs prontos para executar

## Como usar

### 1. Executar o script SQL no Supabase

Abra o [Supabase Manager](https://supabase.com) ou seu cliente SQL SQL (ex: DBeaver, pgAdmin) e execute:

```bash
# Copie e cole todo o conteúdo de import_proposals.sql
# Ou execute via CLI:
cat import_proposals.sql | psql -h [seu-host] -U [seu-user] -d [seu-banco]
```

### 2. Regenerar o SQL (caso os dados brutos mudem)

Se o arquivo `raw_proposals.csv` for atualizado, regere o SQL:

```bash
npm run import:generate
# ou
node scripts/generate_import_proposals.js
```

## Mapeamento de Colunas

| CSV | Campo | Tipo | Observação |
|-----|-------|------|-----------|
| Nome | producer_name | text | Nome do produtor |
| Cpf/Cnpj | producer_cpf | varchar | CPF (números apenas) |
| Valor | requested_value | numeric | Valor em brasileiro (virgula → ponto) |
| Programa | pronaf_line | text | Ex: "FNE/PRONAF A - RES.5.183/24 (699)" |
| Data Central | entry_date | timestamp | Data de entrada (dd/mm/yyyy hh:mm:ss) |
| Tarefa | notes | text | Descrição da tarefa atual |
| Estado | status | text | Status (ex: "Em execução") |

## Detalhes da Importação

- **Total de registros:** 26 propostas
- **ID gerado:** UUID v4 único por proposta
- **Timestamps:** Usam a data de entrada como `created_at` e `updated_at`
- **user_id:** Defina manualmente no SQL ou via app (não preenchido neste batch)

## Estrutura do SQL gerado

```sql
BEGIN;
  INSERT INTO public.proposals (...) VALUES (...);
  INSERT INTO public.proposals (...) VALUES (...);
  ...
COMMIT;
```

Usa transação para garantir consistência.

## Próximos passos

1. ✅ Executar `import_proposals.sql` no banco  
2. ✅ Verificar registros na tabela `proposals`  
3. ⚙️ Se necessário, atualizar `user_id` das propostas  
4. ✅ Visualizar no Dashboard

---

**Gerado por:** `scripts/generate_import_proposals.js`
