# Prompt Master Completo: Plataforma Integral SuperGestão PRONAF para ServiceNow

Utilize este prompt no **Now Assist / Build Agent** do ServiceNow para gerar e estruturar a **plataforma completa**, abrangendo todos os módulos operacionais, gerenciais e de cadastro:

```markdown
Role: Lead ServiceNow Enterprise Solution Architect & Creator
Objective: Build the complete, full-scale Scoped Application "SuperGestão PRONAF - Gestão e Acompanhamento de Crédito Rural" (Scope: x_pronaf_gestao) capturing the ENTIRE platform from https://github.com/kerllysruan/PRONAF (including Management Dashboard, Proposals Conveyor, Stock, Technical Designers Management, Document Review, and the Technical Designer Origin Portal).

================================================================================
1. APPLICATION SCOPE & PERMISSIONS
================================================================================
- Application Name: SuperGestão PRONAF - Gestão e Acompanhamento de Crédito Rural
- Scope: x_pronaf_gestao
- Description: Solução empresarial integral para originação, análise técnica, esteira de concessão, suporte forrageiro pecuário e controle de desembolsos do crédito PRONAF (Banco do Nordeste - BNB).
- Roles:
  * x_pronaf.admin: Acesso administrativo integral a todos os módulos, configurações e aprovação de projetistas.
  * x_pronaf.analista: Analistas do banco para análise de propostas, apontamento de pendências, conferência de tetos e aprovação técnica.
  * x_pronaf.projetista: Projetistas rurais credenciados para envio de propostas, importação de planilhas SEAP/BNB e regularização de pendências.
  * x_pronaf.gerente: Gerentes de agência com acesso a dashboards executivos e relatórios de desembolso.

================================================================================
2. DATA MODEL & TABLES
================================================================================

TABLE 1: x_pronaf_proposta (Extends 'task') - Tabela Mestra de Propostas
- Dados do Beneficiário:
  * u_produtor_nome (String 150, Mandatory)
  * u_produtor_cpf (String 14, Mandatory)
  * u_apelido (String 100)
  * u_tipo_cliente (Choice: Pessoa Física, Pessoa Jurídica)
  * u_data_nascimento (Date)
  * u_rg (String 20), u_orgao_emissor (String 10), u_uf_rg (String 2), u_data_emissao_rg (Date)
  * u_naturalidade (String 100), u_sexo (Choice: Masculino, Feminino), u_estado_civil (Choice)
  * u_grau_instrucao (Choice), u_profissao (String 100), u_renda_mensal (Currency)
  * u_nome_mae (String 150), u_nome_pai (String 150)
  * u_dap_caf (String 50), u_porte (String 100, Default: PRONAFIANO GRUPO A)
  * u_endereco (String 200), u_complemento (String 100), u_bairro (String 100), u_municipio (String 100), u_uf (String 2), u_cep (String 10), u_telefone (String 20)

- Dados do Cônjuge (Visíveis quando casado/união estável):
  * u_nome_conjuge (String 150), u_cpf_conjuge (String 14), u_data_nascimento_conjuge (Date)
  * u_rg_conjuge (String 20), u_orgao_uf_conjuge (String 20), u_profissao_conjuge (String 100)

- Dados da Terra e Imóvel:
  * u_propriedade (String 150), u_condicao_posse (Choice: Anuência, Proprietário, Posseiro, Assentado, Arrendatário, Parceiro)
  * u_nome_titular_terra (String 150), u_cpf_titular_terra (String 14)
  * u_area_total_ha (Decimal 2), u_area_explorada_ha (Decimal 2), u_area_pastagem_ha (Decimal 2), u_area_reserva_ha (Decimal 2)
  * u_car (String 100), u_nirf (String 50), u_ccir (String 50)
  * u_roteiro_acesso (String 500), u_solos_aguada (String 500)

- Dados da Operação e Crédito:
  * u_linha_credito (Choice: FNE/PRONAF Grupo A, Pronaf A2, Pronaf C, Custeio Agrícola, Custeio Pecuário, Pronaf Mulher, Pronaf Jovem, Pronaf Investimento)
  * u_agencia_bnb (Reference to cmn_location or core_company)
  * u_atividade_principal (String 150), u_objetivo (Choice: Implantação, Expansão, Manutenção)
  * u_valor_solicitado (Currency, Mandatory)
  * u_custo_assessoria (Choice: Inclusa (5% ATER), Sem retenção (0%))
  * u_parecer_tecnico (String 2000)
  * u_projetista_responsavel (Reference to x_pronaf_projetista or sys_user)
  * u_status_esteira (Choice: Cadastrada, Em Análise, Com Pendência, Deferida, Em Contratação, Concluída/Paga, Cancelada)
  * u_pendencias (String 1000)

TABLE 2: x_pronaf_projetista (Cadastro e Credenciamento de Projetistas Técnicos)
- u_user (Reference to sys_user)
- u_nome (String 150, Mandatory), u_cpf (String 14, Mandatory)
- u_email (String 100, Mandatory), u_telefone (String 20, Mandatory)
- u_crea_cfta (String 50, Mandatory), u_uf_conselho (String 2, Mandatory)
- u_municipio_atuacao (String 100), u_uf_atuacao (String 2)
- u_status_credenciamento (Choice: Pendente de Validação, Ativo/Aprovado, Inativo/Bloqueado)
- u_data_aprovacao (Date), u_aprovado_por (Reference to sys_user)

TABLE 3: x_pronaf_inversao (Itens Orçados da Proposta)
- u_proposta (Reference to x_pronaf_proposta, Mandatory)
- u_item (String 150, Mandatory), u_categoria (String 50)
- u_unidade (String 20), u_quantidade (Decimal 2)
- u_valor_unitario (Currency), u_valor_total (Currency)
- u_teto_bnb (Currency), u_excesso_teto (Boolean)

TABLE 4: x_pronaf_suporte_forrageiro (Dimensionamento Pecuário 1:1)
- u_proposta (Reference to x_pronaf_proposta, Mandatory)
- u_tem_pecuaria (Boolean, Default: false)
- u_area_total_forrageira_ha (Decimal 2), u_rebanho_cabecas (Integer)
- u_rebanho_total_ua (Decimal 2), u_taxa_lotacao_ua_ha (Decimal 2)
- u_periodo_estiagem_meses (Integer, Default: 6)
- u_parecer_zootecnico (String 1000)

================================================================================
3. REGRAS DE NEGÓCIO (BUSINESS RULES)
================================================================================
1. "BR - Validar Teto Normativo PRONAF":
   Antes de inserir ou atualizar x_pronaf_proposta, valida se u_valor_solicitado ultrapassa o teto oficial:
   - Grupo A / A2: R$ 50.000,00
   - Grupo C: R$ 30.000,00
   - Custeio Agrícola / Pecuário: R$ 250.000,00
   - Pronaf Mulher: R$ 100.000,00
   - Pronaf Jovem: R$ 30.000,00
   - Pronaf Investimento: R$ 210.000,00
   Se ultrapassar, aborta com mensagem de erro clara.

2. "BR - Cálculo Automático de UA e Taxa de Lotação":
   Calcula automaticamente no suporte forrageiro:
   - UA = (rebanho_cabecas * 0.8)
   - Taxa de Lotação = (UA / area_total_forrageira_ha)

3. "BR - Ativação Automática de Usuário Projetista":
   Ao aprovar o credenciamento de um projetista (status -> 'Ativo'), cria ou atualiza a conta sys_user atribuindo a role 'x_pronaf.projetista'.

================================================================================
4. PÁGINAS DA INTERFACE (UI PAGES) - TODA A PLATAFORMA INTEGRADA
================================================================================
Crie os seguintes módulos e UI Pages vinculados ao menu "SuperGestão PRONAF":

1. UI Page: 'x_pronaf_dashboard' (Endpoint: 'x_pronaf_dashboard.do')
   - Título: "Dashboard Executivo e Analytics"
   - Conteúdo: https://supergestao.digital/dashboard
   - Exibe gráficos de desembolso mensal, distribuição por linha, volume por agência e KPIs.

2. UI Page: 'x_pronaf_painel_projetista' (Endpoint: 'x_pronaf_painel_projetista.do')
   - Título: "Painel do Projetista & Originação"
   - Conteúdo: https://supergestao.digital/painel-projetista
   - Exibe as 3 abas, os 9 blocos sincronizados com a planilha BNB, leitor de planilhas com senha senhasBN, cálculo de suporte forrageiro e catálogo de preços.

3. UI Page: 'x_pronaf_esteira_propostas' (Endpoint: 'x_pronaf_esteira_propostas.do')
   - Título: "Esteira de Análise de Propostas"
   - Conteúdo: https://supergestao.digital/propostas
   - Visão completa da esteira de crédito do banco, análise documental, filtros e pareceres.

4. UI Page: 'x_pronaf_estoque' (Endpoint: 'x_pronaf_estoque.do')
   - Título: "Banco & Estoque de Propostas"
   - Conteúdo: https://supergestao.digital/estoque
   - Repositório central de propostas recebidas, triagem e alocação por analista.

5. UI Page: 'x_pronaf_projetistas' (Endpoint: 'x_pronaf_projetistas.do')
   - Título: "Central de Gestão de Projetistas"
   - Conteúdo: https://supergestao.digital/projetistas
   - Gestão, conferência de documentos (CREA/CFTA, RG, Certidões) e ativação de credenciamento.

================================================================================
5. MENU DE NAVEGAÇÃO COMPLETO (Application Menu)
================================================================================
Menu Principal: "SuperGestão PRONAF"
- 📊 1. Dashboard Executivo (Abre x_pronaf_dashboard.do)
- 🚀 2. Painel do Projetista (Abre x_pronaf_painel_projetista.do)
- 📑 3. Esteira de Propostas (Abre x_pronaf_esteira_propostas.do)
- 📦 4. Estoque de Propostas (Abre x_pronaf_estoque.do)
- 🎓 5. Gestão de Projetistas (Abre x_pronaf_projetistas.do)
- ⚙️ 6. Todas as Propostas [Tabela Task] (Abre lista nativa x_pronaf_proposta)
```
