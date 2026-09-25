# Prompt Oficial para ServiceNow Build Agent (Now Assist / App Engine Studio)

Utilize este prompt no **Build Agent / App Engine Studio** (compatível com as famílias **Xanadu**, **Yokohama** e **Zurich** do ServiceNow, conforme documentação oficial do repositório `ServiceNowDocs` / `llms.txt`):

```markdown
Role: Lead ServiceNow Solution Architect & Creator
Objective: Build a complete Scoped Application called "PRONAF Gestão de Propostas BNB" (Scope: x_pronaf_gestao) to manage the origination, analysis, forage dimensioning, and credit approval for agricultural projects financed by Banco do Nordeste (BNB).

1. Application Scope:
- Name: PRONAF Gestão de Propostas BNB
- Scope Identifier: x_pronaf_gestao
- Description: Sistema integrado de análise de crédito rural, importação de planilhas SEAP/BNB, suporte forrageiro pecuário e controle de propostas de crédito.

2. Data Model (Tables & Fields):
Table 1: x_pronaf_proposta (Extends 'task')
- u_produtor_nome (String, 150, Mandatory)
- u_produtor_cpf (String, 14, Mandatory)
- u_apelido (String, 100)
- u_tipo_cliente (Choice: Pessoa Física, Pessoa Jurídica)
- u_data_nascimento (Date)
- u_rg (String, 20)
- u_orgao_emissor (String, 10)
- u_uf_rg (String, 2)
- u_data_emissao_rg (Date)
- u_naturalidade (String, 100)
- u_sexo (Choice: Masculino, Feminino, Outro)
- u_estado_civil (Choice: Solteiro(a), Casado(a) comunhão parcial, Casado(a) comunhão universal, União Estável, Divorciado(a), Viúvo(a))
- u_grau_instrucao (Choice: Não alfabetizado(a), Alfabetizado(a), Ensino Fundamental, Ensino Médio, Ensino Superior)
- u_profissao (String, 100, Default: Agricultor(a))
- u_renda_mensal (Currency)
- u_nome_mae (String, 150)
- u_nome_pai (String, 150)
- u_porte (String, 100, Default: PRONAFIANO GRUPO A)
- u_dap_caf (String, 50)
- u_endereco (String, 200)
- u_complemento (String, 100)
- u_bairro (String, 100)
- u_municipio (String, 100)
- u_uf (String, 2)
- u_cep (String, 10)
- u_telefone (String, 20)

Spouse Fields (Displayed when u_estado_civil is Casado or União Estável):
- u_nome_conjuge (String, 150)
- u_cpf_conjuge (String, 14)
- u_data_nascimento_conjuge (Date)
- u_rg_conjuge (String, 20)
- u_profissao_conjuge (String, 100)

Property & Land Fields:
- u_propriedade (String, 150)
- u_condicao_posse (Choice: Anuência, Proprietário, Posseiro, Assentado, Arrendatário, Parceiro)
- u_nome_proprietario_terra (String, 150)
- u_cpf_proprietario_terra (String, 14)
- u_area_total_ha (Decimal, 2 places)
- u_area_explorada_ha (Decimal, 2 places)
- u_area_pastagem_ha (Decimal, 2 places)
- u_area_reserva_ha (Decimal, 2 places)
- u_car (String, 100)
- u_nirf (String, 50)
- u_ccir (String, 50)
- u_roteiro_acesso (String, 500)
- u_solos_aguada (String, 500)

Credit & Operation Fields:
- u_linha_credito (Choice: FNE/PRONAF Grupo A, Pronaf A2, Pronaf C, Custeio Agrícola, Custeio Pecuário, Pronaf Mulher, Pronaf Jovem, Pronaf Investimento)
- u_agencia_bnb (String, 100)
- u_atividade_principal (String, 150)
- u_objetivo (Choice: Implantação, Expansão, Manutenção)
- u_valor_solicitado (Currency, Mandatory)
- u_custo_assessoria (Choice: Inclusa (5% ATER), Sem retenção (0%))
- u_parecer_tecnico (String, 1500)

Table 2: x_pronaf_inversao (Child of x_pronaf_proposta)
- u_proposta (Reference to x_pronaf_proposta, Mandatory)
- u_item (String, 150, Mandatory)
- u_unidade (String, 20)
- u_quantidade (Decimal, 2 places)
- u_valor_unitario (Currency)
- u_valor_total (Currency)
- u_teto_referencia_bnb (Currency)
- u_excesso_teto (Boolean)

Table 3: x_pronaf_suporte_forrageiro (Child of x_pronaf_proposta, 1:1)
- u_proposta (Reference to x_pronaf_proposta)
- u_tem_pecuaria (Boolean)
- u_area_total_forrageira_ha (Decimal, 2 places)
- u_rebanho_cabecas (Integer)
- u_rebanho_total_ua (Decimal, 2 places)
- u_taxa_lotacao_ua_ha (Decimal, 2 places)
- u_periodo_estiagem_meses (Integer, Default: 6)
- u_parecer_suporte (String, 1000)

3. Business Rules:
- BR 1: "Validar Teto PRONAF" (Before Insert/Update): Block save if u_valor_solicitado exceeds official limit of u_linha_credito.
- BR 2: "Cálculo Zootécnico UA" (Before Insert/Update): Compute UA = (rebanho_cabecas * 0.8) and Taxa Lotação = (UA / area_total_forrageira_ha).

4. User Roles:
- x_pronaf.projetista: Can submit and view own proposals.
- x_pronaf.analista: Can review, request clarifications, and approve proposals.
- x_pronaf.admin: Full administration.

5. Portal & Experience:
- Create Configurable Workspace and Service Portal page embedding the modern React Dashboard.
```
