# Regras para o módulo PRONAF A2 (página nova)

## Contexto
- Este projeto já usa React 18 + TypeScript + Vite, Tailwind + shadcn/ui (componentes em src/components/ui),
  react-router-dom v6, react-hook-form + zod, Supabase (auth e permissões), vitest, jszip.
- O módulo PRONAF A2 é UMA PÁGINA NOVA dentro deste projeto. Fica em src/pages/pronaf-a2/.

## Regras obrigatórias
1. Fonte de verdade: src/pages/pronaf-a2/PRONAF-A2_SPEC_ANTIGRAVITY.md e a pasta src/pages/pronaf-a2/data/.
   NUNCA inventar campo, NUNCA omitir campo, NUNCA digitar lista suspensa à mão (carregar de data/reference_tables.json).
2. Reaproveitar o que o projeto já tem: componentes shadcn/ui, layout, tema, roteador, hooks.
   NÃO criar novo scaffold, NÃO trocar bibliotecas, NÃO mexer em outras páginas sem eu pedir.
3. Formulários com react-hook-form + zod. Regras de validação da seção 6 da spec.
4. Registrar a rota e o item de menu seguindo EXATAMENTE o jeito que as outras páginas já usam.
   Descobrir como o "Controle de Acesso" libera páginas por usuário e incluir esta página nesse sistema.
5. Exportar o .xlsm EDITANDO O XML dentro do ZIP com jszip (já instalado). PROIBIDO usar xlsx/SheetJS,
   openpyxl ou qualquer biblioteca que regrave a planilha inteira (perderia macros e botões).
6. NÃO gravar em células com fórmula e NÃO gravar em abas ocultas.
7. O arquivo-modelo .xlsm NÃO fica no repositório nem em public/. A página pede para o usuário
   ESCOLHER o arquivo .xlsm no computador (input type=file) e usa esse arquivo como modelo na exportação.
8. Privacidade: dados do cliente (CPF, nomes, renda) ficam SÓ no navegador (memória/IndexedDB e arquivo .json baixado).
   NÃO enviar ao Supabase, NÃO registrar em console.log, NÃO usar analytics. Só avisar se eu pedir o contrário.
9. Carregar data/reference_tables.json sob demanda (import dinâmico/lazy), é grande (~1,1 MB).
10. Cada tarefa termina com: testes (npm run test) e lint (npm run lint) passando. Não declarar "pronto" sem rodar.
11. Mensagens e rótulos em português (pt-BR), iguais aos da planilha.
12. Trabalhar direto na main. Fazer commit local a cada tarefa concluída. NUNCA fazer git push sem eu pedir.
