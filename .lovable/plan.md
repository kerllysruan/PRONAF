

# 📋 Gerenciador de Propostas PRONAF

Aplicativo completo para gerenciar suas tarefas de cadastro de propostas PRONAF, com visual profissional/corporativo em tons de azul e cinza.

---

## 🏠 1. Dashboard Principal
- Visão geral com cards de resumo: total de propostas, pendentes, aprovadas, em análise
- Valor total de propostas cadastradas em destaque
- Gráfico de barras com propostas por status (em análise, aprovada, negada, pendente)
- Gráfico de linha mostrando evolução mensal de propostas cadastradas
- Gráfico de valores financeiros por mês
- Acesso rápido às tarefas do dia

## 📝 2. Cadastro de Propostas
- Formulário para registrar novas propostas com:
  - Dados do produtor rural (nome, CPF, endereço)
  - Tipo de linha PRONAF (Custeio, Investimento, etc.)
  - Valor solicitado
  - Status da proposta
  - Data de entrada
  - Observações
- Edição e exclusão de propostas existentes

## 📊 3. Quadro Kanban
- Visualização estilo Trello com colunas por status:
  - **Nova** → **Em Análise** → **Documentação Pendente** → **Aprovada** / **Negada**
- Arrastar e soltar propostas entre colunas para atualizar status
- Cards com resumo do produtor e valor

## 📑 4. Controle de Documentação
- Lista de documentos necessários por proposta
- Checklist de documentos entregues/pendentes
- Indicador visual de completude por proposta
- Filtro para ver rapidamente o que está faltando

## 📅 5. Agenda de Visitas
- Calendário mensal com visitas agendadas
- Cadastro de visitas com data, horário, produtor e objetivo
- Status da visita (agendada, realizada, cancelada)
- Lista das próximas visitas do dia/semana

## 🧭 6. Navegação e Layout
- Sidebar lateral profissional com menu de navegação
- Ícones claros para cada seção
- Design responsivo para uso em desktop e mobile
- Cores corporativas: tons de azul escuro, cinza e branco

## 💾 7. Backend (Lovable Cloud / Supabase)
- Banco de dados para salvar propostas, documentos, visitas e tarefas
- Autenticação com login para proteger seus dados
- Dados acessíveis de qualquer dispositivo

