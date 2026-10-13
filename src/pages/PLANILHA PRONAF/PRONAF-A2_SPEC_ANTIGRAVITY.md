# PRONAF A2 Web — Especificação para o Antigravity

> **Origem:** `PlanilhaPRONAF-A2.xlsm` (BNB, "PLANILHA PRONAF A – Versão 2.0 – Procedimento Simplificado", versão da planilha 14/08/2026). Esta especificação foi extraída do próprio arquivo: células de entrada (destravadas, sem fórmula), validações de dados, nomes definidos, tabelas de domínio da aba `VISAO`, layout da aba `SEAP` e código VBA.
> **Regra nº 1:** fidelidade. O formulário web deve ter **os mesmos campos, rótulos, ordem, listas, limites e mensagens de erro** da planilha. Nada de campo inventado, nada de campo omitido. Em caso de dúvida, o arquivo em `data/` manda, não esta prosa.

---

## 1. Objetivo

Permitir que o técnico **preencha o projeto online** (no navegador) e, ao final, **baixe a própria planilha `.xlsm` preenchida**. Depois, no Excel com macros habilitadas, o técnico usa os botões da planilha para calcular, imprimir relatórios e gerar o `.SEAP` como hoje.

**Fase 1 (esta especificação):** formulário web fiel + exportação do `.xlsm` preenchido.
**Fase 2 (opcional, não faz parte desta entrega):** cálculo nativo na web e geração do `.SEAP` sem Excel (veja §10).

### O que NÃO fazer
- **Não** usar `openpyxl`, `xlsx`/SheetJS ou qualquer biblioteca que regrave a planilha inteira. A planilha tem macros (VBA), formulários, botões (`ctrlProps`), desenhos e comentários que seriam perdidos. A exportação deve **editar o XML dentro do .xlsm** (ver §8).
- **Não** reescrever fórmulas nem criar fórmulas novas. O Excel recalcula tudo ao abrir.
- **Não** gravar nada em células com fórmula, nem em abas ocultas.

---

## 2. Pacote de dados (fonte de verdade)

Tudo está na pasta `data/`. Carregue de lá; **não digite listas à mão**.

| Arquivo | Conteúdo |
|---|---|
| `reference_tables.json` | **40 tabelas de domínio** da aba `VISAO` (municípios ≈5.600, atividades ≈1.650, empreendimentos BACEN ≈980, agências ≈300, tipos de logradouro ≈240, programas, profissões, estado civil, documentos, portes, raças, usos, unidades, finalidades, críticas do sistema etc.). Cada tabela traz `colunas` (letras na `VISAO`), `cabecalho`, `titulo_grupo` e `linhas` com `linha` de origem. |
| `named_ranges.json` | Nomes definidos globais (ex.: `visaoDOC`, `visaoMUNI`, `visaoPRG`) com o intervalo na `VISAO`. É o elo entre cada lista suspensa e a tabela. |
| `data_validations.json` | **Todas** as validações de dados (tipo, intervalo `sqref`, fórmula 1/2, mensagem de erro) das abas de entrada. |
| `campos_Cliente.csv` | Inventário completo do Cliente: célula, rótulo, obrigatório (coluna Z), validação, fórmula de crítica (coluna Y). |
| `campos_Avaliacao.csv`, `campos_Proposta.csv`, `campos_Cronograma.csv`, `campos_Ativ_Agricola.csv`, `campos_Ativ_Pecuaria.csv`, `campos_Outras_Ativ.csv`, `campos_CalculoFinanceiro.csv` | Inventário célula a célula das demais abas (células de entrada com validação ou valor padrão), com `rotulo_linha` e `cabecalho_coluna` inferidos. |
| `seap_layout.json` | Layout do arquivo SEAP: 209 campos, com tabela (`T033…`), nome do campo, tipo (N/C), tamanho, obrigatório (S/N) e a fórmula da primeira linha de dados. |
| `../vba_referencia/*.bas` | Código VBA de apoio (críticas, amortização, exportação SEAP) para consulta. **Referência, não para portar nesta fase.** |

### Como ligar lista suspensa → tabela
1. Em `data_validations.json`, o campo `f1` traz o nome da lista (ex.: `visaoDOC`) ou uma lista literal entre aspas (ex.: `"Masculino,Feminino"`).
2. Em `named_ranges.json`, o nome aponta para colunas da `VISAO` (ex.: `visaoDOC` → `VISAO!$W$12:$W$28`).
3. Em `reference_tables.json`, localize a tabela cuja `colunas` contém essa coluna e use as linhas indicadas. Para listas que são `OFFSET(...COUNTA...)` (dinâmicas, como `visaoATIV`, `visaoAGC`), use **todas as linhas não vazias** da coluna a partir da linha inicial.
4. Muitas listas são pares **descrição + código** (ex.: `visaoDOC_COD`, `visaoMUNI_COD`). O usuário vê a descrição; a exportação guarda **o texto exatamente como na lista** (a planilha faz o VLOOKUP do código).

Dica: o texto das listas tem acentos e formatos específicos (ex.: município `ABADIA DE GOIAS-GO`, atividade `Ovinocultura (Pecuaria/Pecuaria)`). Preserve **exatamente**.

---

## 3. Arquitetura sugerida

- **Front-end:** React + Vite + TypeScript. UI em português (pt-BR).
- **Estado:** um objeto único `Projeto` com uma chave por aba; persistência local (IndexedDB) e opção de salvar/abrir o projeto como `.json`.
- **Validação:** esquema por campo gerado a partir de `data_validations.json` + regras das colunas `Y/Z` (§6).
- **Exportação:** `JSZip` no navegador. Sem servidor, sem envio de dados pessoais para a rede.
- **Modelo da planilha:** o `PlanilhaPRONAF-A2.xlsm` original, fornecido pelo usuário (colocar em `public/modelo/`). O app **não** deve embutir nem redistribuir o modelo sem autorização do BNB.
- **Campos pessoais (CPF, nomes, renda):** tratar como dados sensíveis (LGPD). Não registrar em log, não enviar a terceiros, não usar analytics.

---

## 4. Telas e campos

Para cada tela: **mesma ordem e agrupamento da aba**. Os endereços (`E13` etc.) são as células de destino na exportação.

### 4.1 Menu (aba `Menu`)
Navegação entre telas. Relatórios existem só no Excel (fase 1). Campo `T11` (Município, lista `visaoNATURALIDADE_BUSCA`) é uma busca auxiliar; não vai para a exportação.

### 4.2 Cliente (aba `Cliente`, XML `sheet13.xml`)

**Comportamento:**
- `E12` "Tipo Cliente" (`Pessoa Física` / `Pessoa Jurídica`) **troca rótulos**: Nome ↔ *Razão Social*; Apelido ↔ *Nome de Fantasia*; C.P.F. ↔ *C.N.P.J.*; Data de Nascimento ↔ *Data de Constituição*; Nº do Documento ↔ *Inscrição Estadual*; Data de Emissão ↔ *Data da Inscrição*; Renda Mensal ↔ *Capital Social*.
- `E34` "Categoria" é calculada pela planilha (não é entrada). `E35` "Porte" é entrada.
- Município (`E50`) define se está no **Semiárido** (informativo).
- A coluna **Obrigatório** abaixo vem da coluna `Z` da aba; a regra de crítica vem da coluna `Y` (1 = ok, −1 = erro).

#### A. Dados cadastrais do(a) cliente

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E12` | Tipo Cliente: | — | lista: Pessoa Física,Pessoa Jurídica | `IF(E12="Pessoa Física",1,IF(E12="Pessoa Jurídica",2,1))` |
| `E13` | Nome: | sim | texto livre | `IF(OR(TRIM(E13)="",LEN(E13)>55),-1,IF(ValidaNome(E13,"F"),1,-1))` |
| `E14` | Apelido: | não | texto ≤ 20 | — |
| `E15` | C.P.F.: | sim | texto livre | `IF(E15<>"",1,-1)` |
| `E16` | Data de Nascimento: | sim | data | `IF(E16="",-1,1)` |
| `E17` | Nº do Documento: | sim | texto livre | `IF(E17="",-1,1)` |
| `E18` | Data de Emissão Docum.: | — | data | — |
| `E20` | Tipo de Documento: | sim | lista: visaoDOC | `IF(OR(E20="",ISERROR(VLOOKUP(E20,visaoDOC_COD,2,0))),-1,VLOOKUP(E20,visaoDOC_COD,2,0))` |
| `E21` | Órgão Emissor Docum.: | sim | texto livre | `IF(E21="",-1,1)` |
| `E22` | UF Órgão Emissor Docum.: | sim | lista: visaoUF | `IF(OR(E22="",ISERROR(VLOOKUP(E22,visaoUF,1,0))),-1,VLOOKUP(E22,visaoUF,1,0))` |
| `E23` | Título Eleitoral: | não | texto livre | — |
| `E24` | Naturalidade: | sim | lista: VisaoNaturalidade | `IF(ISERROR(VLOOKUP(E24,visaoMUNI_COD,3,0)),-1,RIGHT(E24,2))` |
| `E25` | Sexo: | sim | lista: Masculino,Feminino | `IF(E25="",-1,1)` |
| `E26` | Estado Civil: | sim | lista: visaoCIVIL | `IF(ISERROR(VLOOKUP(E26,visaoCIVIL_COD,2,0)),-1,VLOOKUP(E26,visaoCIVIL_COD,2,0))` |
| `E27` | Grau de Instrução: | não | lista: visaoESCOLA | — |
| `E28` | Profissão: | não | lista: visaoPROF | `IF(OR(E28="",ISERROR(VLOOKUP(E28,visaoPROF_COD,2,0))),-1,VLOOKUP(E28,visaoPROF_COD,2,0))` |
| `E29` | Atividade: | sim | lista: visaoATIV | `IF(ISERROR(VLOOKUP(E29,visaoATIV_COD,2,0)),-1,VLOOKUP(E29,visaoATIV_COD,2,0))` |
| `E30` | Renda Mensal: | sim | decimal ≥ 0 | `IF(E30="",-1,1)` |
| `E31` | Beneficiário Políticas Públicas: | sim | lista: Benef_Politica_Pub_Descr | `IF(ISERROR(VLOOKUP(E31,Benef_Politica_Pub_COD,2,0)),-1,VLOOKUP(E31,Benef_Politica_Pub_COD,2,0))` |
| `E32` | Nome do Pai: | não | texto livre | `IF(OR(TRIM(E32)="",LEN(E32)>55),-1,IF(ValidaNome(E32,"F"),1,-1))` |
| `E33` | Nome da Mãe: | sim | texto livre | `IF(OR(TRIM(E33)="",LEN(E33)>55),-1,IF(ValidaNome(E33,"F"),1,-1))` |
| `E35` | Porte: | sim | lista: visaoPOR_PRONAF | `IF(ISERROR(VLOOKUP(E35,visaoPOR_PRONAF_COD,2,0)),-1,VLOOKUP(E35,visaoPOR_PRONAF_COD,2,0))` |
| `E36` | Nº da DAP: | sim | texto livre | `IF(TRIM(E36)="",-1,1)` |
| `E37` | Capital Integralizado: | — | texto livre | — |

#### B. Endereço da atividade

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E44` | Tipo de Logradouro: | sim | lista: visaoTP_LOG | `IF(ISERROR(VLOOKUP(E44,visaoTP_LOG_COD,2,0)),-1,VLOOKUP(E44,visaoTP_LOG_COD,2,0))` |
| `E45` | Endereço: | sim | texto livre | `IF(OR(E45="",LEN(E45)>45),-1,IF(ValidaNome(E45,"J"),1,-1))` |
| `E46` | Nº: | sim | regra: Y46=1 | `IF(OR(UPPER(TRIM(E46))="S/N",ISNUMBER(E46)),1,-1)` |
| `E47` | Complemento: | não | texto livre | — |
| `E48` | Bairro: | sim | texto livre | `IF(E48="",-1,1)` |
| `E49` | CEP: | sim | inteiro | `IF(E49="",-1,1)` |
| `E50` | Município: | sim | lista: visaoMUNI | `IF(OR(E50="",ISERROR(VLOOKUP(E50,visaoMUNI_COD,2,0))),-1,VLOOKUP(E50,visaoMUNI_COD,2,0))` |
| `E51` | DDD Telefone: | não | inteiro | — |
| `E52` | Nº Telefone: | não | inteiro | — |

#### C. Endereço para correspondência

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E58` | Tipo de Logradouro: | sim | lista: visaoTP_LOG | `IF(ISERROR(VLOOKUP(E58,visaoTP_LOG_COD,2,0)),-1,VLOOKUP(E58,visaoTP_LOG_COD,2,0))` |
| `E59` | Endereço: | sim | texto livre | `IF(OR(E59="",LEN(E59)>45),-1,IF(ValidaNome(E59,"J"),1,-1))` |
| `E60` | Nº: | sim | regra: Y46=1 | `IF(OR(UPPER(TRIM(E60))="S/N",ISNUMBER(E60)),1,-1)` |
| `E61` | Complemento: | não | texto livre | — |
| `E62` | Bairro: | sim | texto livre | `IF(E62="",-1,1)` |
| `E63` | CEP: | sim | inteiro | `IF(E63="",-1,1)` |
| `E64` | Município: | sim | lista: visaoMUNI | `IF(OR(E64="",ISERROR(VLOOKUP(E64,visaoMUNI_COD,2,0))),-1,VLOOKUP(E64,visaoMUNI_COD,2,0))` |
| `E65` | DDD Telefone: | não | inteiro | — |
| `E66` | Nº Telefone: | não | inteiro | — |

#### D. Imóvel da atividade

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E73` | Tipo de Uso do imóvel: | sim | lista: visaoPOSSE | `IF(ISERROR(VLOOKUP(E73,visaoPOSSE,1,0)),-1,VLOOKUP(E73,visaoPOSSE,1,0))` |
| `E74` | Proprietário do imóvel: | sim | texto ≤ 55 | `IF(E74="",-1,IF(ValidaNome(E74,"J"),1,-1))` |
| `E75` | CPF/CNPJ do Proprietário: | sim | texto livre | `IF(OR(TRIM(E75)="",ISERROR(VALUE(E75))),-1,IF(Verifica_CPF(E75),1,IF(Verifica_CGC(E75),1,-1)))` |
| `E77` | Itinerário: | — | texto livre | — |

#### E. Cônjuge / companheiro(a)

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E82` | Nome: | não | regra: Y70=1 | `IF(OR(TRIM(E82)="",LEN(E82)>55),-1,IF(ValidaNome(E82,"F"),1,-1))` |
| `E83` | C.P.F. Cônjuge/Comp.: | não | texto livre | `IF(OR(TRIM(E83)="",E83=E15,ISERROR(VALUE(E83))),-1,IF(Verifica_CPF(E83),1,-1))` |
| `E84` | Data de Nascimento: | não | data | `IF(E84="",-1,1)` |
| `E85` | Nº do Documento: | não | texto livre | `IF(E85="",-1,1)` |
| `E86` | Tipo de Documento: | não | lista: visaoDOC | `IF(OR(E86="",ISERROR(VLOOKUP(E86,visaoDOC_COD,2,0))),-1,VLOOKUP(E86,visaoDOC_COD,2,0))` |
| `E87` | Órgão Emissor: | não | texto livre | `IF(TRIM(E87)="",-1,1)` |
| `E88` | UF Órgão Emissor: | não | lista: visaoUF | `IF(OR(E88="",ISERROR(VLOOKUP(E88,visaoUF,1,0))),-1,VLOOKUP(E88,visaoUF,1,0))` |
| `E89` | Data de Emissão: | não | data | `IF(E89="",-1,1)` |
| `E90` | Sexo: | não | lista: Masculino,Feminino | `IF(E90="",-1,1)` |
| `E91` | Estado Civil: | não | lista: visaoCIVIL | `IF(OR(TRIM(E91)="",ISERROR(VLOOKUP(E91,visaoCIVIL_COD,2,0))),-1,VLOOKUP(E91,visaoCIVIL_COD,2,0))` |
| `E92` | Grau de Instrução: | não | lista: visaoESCOLA | — |
| `E93` | Profissão: | não | lista: visaoPROF | `IF(OR(E93="",ISERROR(VLOOKUP(E93,visaoPROF_COD,2,0))),-1,VLOOKUP(E93,visaoPROF_COD,2,0))` |
| `E94` | Renda Mensal: | não | decimal ≥ 0 | — |
| `E95` | Naturalidade: | não | lista: VisaoNaturalidade | `IF(ISERROR(VLOOKUP(E95,visaoMUNI_COD,3,0)),-1,RIGHT(E95,2))` |
| `E96` | Nome do Pai: | não | regra: Y70=1 | `IF(OR(TRIM(E96)="",LEN(E96)>55),-1,IF(ValidaNome(E96,"F"),1,-1))` |
| `E97` | Nome da Mãe: | não | regra: Y70=1 | `IF(OR(TRIM(E97)="",LEN(E97)>55),-1,IF(ValidaNome(E97,"F"),1,-1))` |

#### F. Sócios / participações (até 5)

| Célula | Rótulo | Obrigatório | Tipo / validação | Regra de crítica (coluna Y) |
|---|---|---|---|---|
| `E106` | CPF / CNPJ: | — | texto livre | — |
| `E107` | Nome / Razão Social: | — | texto livre | — |
| `E108` | Participação (%): | — | texto livre | — |
| `E109` | Representa a Empresa? (S/N): | — | lista: Sim,Não | — |
| `E113` | CPF / CNPJ: | — | texto livre | — |
| `E114` | Nome / Razão Social: | — | texto livre | — |
| `E115` | Participação (%): | — | texto livre | — |
| `E116` | Representa a Empresa? (S/N): | — | lista: Sim,Não | — |
| `E120` | CPF / CNPJ: | — | texto livre | — |
| `E121` | Nome / Razão Social: | — | texto livre | — |
| `E122` | Participação (%): | — | texto livre | — |
| `E123` | Representa a Empresa? (S/N): | — | lista: Sim,Não | — |
| `E127` | CPF / CNPJ: | — | texto livre | — |
| `E128` | Nome / Razão Social: | — | texto livre | — |
| `E129` | Participação (%): | — | texto livre | — |
| `E130` | Representa a Empresa? (S/N): | — | lista: Sim,Não | — |
| `E134` | CPF / CNPJ: | — | texto livre | — |
| `E135` | Nome / Razão Social: | — | texto livre | — |
| `E136` | Participação (%): | — | texto livre | — |
| `E137` | Representa a Empresa? (S/N): | — | lista: Sim,Não | — |

> Observações: `E19`, `E38:E41`, `E53:E55`, `E57`, `E67`, `E70:E72`, `E78:E81`, `E98:E103`, `E105`, `E110:E112`, `E117:E119`, `E124:E126`, `E131:E133`, `E138:E147` são células destravadas **sem rótulo próprio** (espaçadores/campos auxiliares). Consulte o `.xlsm` antes de exibi-las. As linhas 71–72 (`F71`, `F72`: Denominação e Área do imóvel) e `E77` (Itinerário) também são entradas do bloco "Imóvel da atividade".

### 4.3 Avaliação (aba `Avaliação`, `sheet14.xml`)
Inventário célula a célula em `campos_Avaliacao.csv` (≈1.680 células).

**A. Imóveis vinculados ao plano (linhas 7–9, até 3 imóveis)** — `D` Denominação (≤40), `E` Município (lista `visaoMUNI`), `H` Tipo de Proprietário (`P.Física`/`P.Jurídica`), `I` Nome do Proprietário, `J` CPF/CNPJ do Proprietário, `K` Área Legal (ha, ≥0), `L` Realiza Inversão? (`Sim`/`Não`), `M` Compõe Garantia? (lista `visaoSIM_NAO`).

**B. Bloco de avaliação por imóvel** — repetido 3 vezes (imóvel 1: linhas ~11–129; imóvel 2: ~49–…; imóvel 3: ~134–…; use o CSV para os intervalos exatos):
- *Terra:* **Exploração Agrícola** (10 linhas) e **Exploração Pecuária** (10 linhas), cada uma com `Descrição` (lista `lista_ANALISADOR_DESC_ATIVIDADE`, ≤50), `Área (ha)`, `Idade (meses)`, `Valor Unit. (R$)`; linhas fixas **Reserva Florestal**, **Terras Inaproveitáveis**, **Ocupadas com Benfeitorias**; `Terra Nua` (Área, Vr.Unit.). `Valor Total` = Área × Valor Unitário (fórmula, não é entrada).
- *Benfeitorias — Descrição (Quantificada):* 20 linhas com `Descrição` (≤40), `Idade do Bem (anos)`, `Valor de Reposição`, `Estado Conserv.` (lista `visaoCONS`), `Deprec. (%)`, `Valor Avaliado`.

**C. Bens comuns ao plano** — **Máquinas/Equipamentos** (10 linhas), **Veículos/Embarcações** (10 linhas), **Móveis e Utensílios** (10 linhas): mesmas colunas da benfeitoria.

**D. Semoventes (linhas 242–290)** — `Categorias dos Animais`, `Quant. Cabeças`, `Raça/Mestiçagem` (listas `visaoRACA_BOV_LEIT`, `visaoRACA_BOV_CORT`, `visaoRACA_OVIN`, `visaoRACA_CAPRIN`), `Valor Unit.`, `Valor Total`. Categorias fixas: Bovinos de Leite e de Corte (Touro, Vacas, Novilhas, Novilhos, Garrotas, Garrotes, Bezerras, Bezerros), Ovinos e Caprinos (Reprodutor, Matrizes, Fêmeas 1 a 2 anos, Machos 1 a 2 anos, Fêmeas 0 a 1 ano, Machos 0 a 1 ano) e **Outros**.

**E. Informações adicionais dos imóveis (linhas 294–305)** — por imóvel: `NIRF`, `CEI`, `SNCR`, `Registro CAR` (alfanumérico de 8 posições, ex.: `AC234083`), `Número de Outorga de Água`, `% de Preservação acima do Limite Legal`; e *Complemento Imóvel Catálogo 5.08*: `Embargos do IBAMA`, `Unidades de Conservação`, `Florestas públicas não destinadas` (`Sim`/`Não`) e `Bônus-CAR (%)`.

### 4.4 Proposta / Plano de Negócio (aba ` Proposta` — **atenção: o nome tem um espaço no início**; `sheet15.xml`)

**Cabeçalho (linhas 5–13):** `E5` Data da Proposta (dd/mm/aaaa, ≥ 01/01/2003); `J5` Objetivo do Crédito (lista `visaoOBJ`; padrão *Implantação*); `E6` **Programa** (lista `visaoPRG`); `E7` **Agência** (lista `visaoAGC`); `E8` Região (`Semi-árido`/`Fora do Semi-árido`); `E9` **Atividade Principal** (lista `visaoATIV`); `E10` Finalidade do Crédito (padrão *INVESTIMENTOS FIXOS*); `P9` Município com Decreto de Emergência? (`Sim`/`Não`); `P12` Produção de Base Agroecológica/Orgânica? (`Sim`/`Não`); `P13` Proposta com origem nos planos de ação territorial? (`Sim`/`Não`); `E12`/`E13`/`E14`/`E15` Empresa Elaboradora, CNPJ, Elaborador, CPF.

**Imóvel das inversões (linha 22):** `D22` Denominação, `H22` Município (lista `visaoMUNI`), `M22` Região, `O22` Nº do Imóvel.

**Programa de Investimentos (linhas 27–62, 36 linhas):** `D` Discriminação (≤70), `E` Compõe Garantia? (`Sim`/`Não`), `F` Quant. (≥0), `G` Unid. (lista `visaoUND`), `H` Uso (lista `visaoUSO`), `I` Nº Imóvel (lista `Imoveis_Inversao`), `J` Valor Unitário (≥0), `L`/`M` Recursos Próprios (unitário), e colunas `K`, `M` conforme CSV (**colunas sem cabeçalho próprio — confirmar no .xlsm**). `N` (Valor Financiado) e `O` (Investimento Total) são fórmulas.
- **Linhas 64–65:** Custeio Agrícola / Pecuário vinculados ao investimento (`J:M`).
- **Linha 69:** Custo de Assessoria Empresarial e Técnica (`H69:M69`; limite depende do programa — vide fórmula na validação).

**Bases do Financiamento (linhas 75–79):** Prazo em meses, Carência em meses, Juros % a.a., Rebate % a.a., Del Credere % a.a.; `Period.Reembolso`, `Period.Juros Carência`, `Period.Juros Prestação`, `Método de Cálculo`. **São calculados/derivados do programa e do cálculo financeiro; exiba como leitura**, salvo célula destravada no CSV.

**Cronograma de parcelas por inversão (linhas 84–124, colunas `G:P`):** datas e valores/percentuais de parcelas, com críticas de período (datas ≥ data prevista do contrato; crescentes).

**Financiamentos existentes (linhas 129–133):** `D` Denominação, `F` Agente Financ. (`BNB`/`Outros`), `G` Saldo Devedor, `I` Mesma Ativ. Cônjuge? (`Sim`/`Não`), `J` Pertence à Titular? (`Sim`/`Não`), `K` Juros % a.a., `L` Carência (meses), `N` Prazo Restante (meses), `O` Data de Contratação.

**Garantias fidejussórias (linhas 137–139):** CPF (`E`), CNPJ (`H`), CPF do cônjuge (`K`) — validação de CPF/CNPJ. **Outras garantias (linhas 142–144):** `D` Denominação, `J` Tipo (padrão *Hipoteca*; lista de garantias), `N` Valor.

**Indicadores (linha 155):** `D155` Nr. de Empregados – Atual, `E155:I155` Empregados – Ano Estab. (inteiros ≥ 0).
**Comentários / Objetivos / Justificativas** e **Parecer Técnico** (texto livre; células de texto grandes, linhas ~157–160).
**Declarações (linhas 161–191):** operações de crédito declaradas (linhas 166–173: banco/cooperativa, data, valor, fonte, bônus R$ 200 / R$ 700, saldo) e opções de bônus (ver CSV). `P185` Ano (1900–2100).

Todos os intervalos exatos e mensagens de erro estão em `campos_Proposta.csv` e `data_validations.json`.

### 4.5 Cronograma (aba `Cronograma`, `sheet17.xml`)
Por inversão, em blocos de **3 linhas**, de 15 a 127 (e extras 129–130): datas e percentuais das **Parc. 1 a 8** (`J:Q`), com a crítica "Período informado é inválido" e percentuais 0–100. Abaixo (linhas 202–240): `F` Valor (≥0), `J`…`M` Empreendimento, `P:Q` Aplicação dos Recursos (lista `visaoAPLIC`). Linhas 243–281: `G:K` Finalidade do Crédito (lista `listaFINALIDADE_APL_REC`), `L` código MDA (≤10), `M:N` CFI do BNDES (≤10). Detalhe em `campos_Cronograma.csv`.

### 4.6 Atividade Agrícola (`Ativ. Agrícola`, `sheet20.xml`)
- **Uso atual e projetado das terras** (linhas 8–42 agrícola e 44–78 pecuária): `D` Descrição (lista `lista_ANALISADOR_DESC_ATIVIDADE` nas linhas 38–42 e 74–78) e pares **Área / UA-ha** para *Atual* e *Ano 1 … Ano 30* (`E:BN`), todos decimais ≥ 0.
- **Receitas agrícolas** (linhas 85–119): `E` Irrigação (`Irrigada`/`Não Irrigada`), `G` Unid (lista `visaoUND_S400`), `I` Valor Unitário, e produtividade por hectare *Ano 0 … Ano N* (`I:AO`).
- **Custos agrícolas** (a partir da linha 121): "Utiliza Custo Padrão?".
- **Atividades econômicas** (linhas 166–200): `E:J` Atividade Econômica (lista `visaoATIV`).
São ≈5.860 células de entrada; use componente de **grade** com virtualização.

### 4.7 Atividade Pecuária (`Ativ. Pecuária`, `sheet21.xml`)
Quatro explorações, cada uma com **Categoria Animal | Quantidade (Atual, A Adquirir) | Equivalência UA | Descarte/Venda % (Ano 1, Demais) | Preço Unitário de Venda**, mais **Indicadores Técnicos e de Vendas** e **Custos da Pecuária**:
- Bovinocultura de **Leite** (categorias: Touro, Vacas, Novilhas, Novilhos, Garrotas, Garrotes, Bezerras, Bezerros). Indicadores: Parição %, Mortalidade até 1 ano %, de 1 a 2 anos %, Adulto %, Matrizes por Reprodutor, Período de Lactação (dias), Leite/cab/dia (L), Leite/Queijo (L/Kg), Venda Queijo %, Preço Queijo/Kg, Preço Leite/L, Matrizes Estabilização.
- Bovinocultura de **Corte** (mesmas categorias). Indicadores: Parição, mortalidades, Matrizes/Reprodutor, Matrizes Estabilização.
- **Ovinocultura** (Reprodutor, Matrizes, Fêmeas 1 a 2 anos, Machos 1 a 2 anos, Fêmeas 0 a 1 ano, Machos 0 a 1 ano). Indicadores: Parição, Prolificidade, mortalidades, Matrizes/Reprodutor, Matrizes Estabilização.
- **Caprinocultura** (mesmas categorias de ovinos). Indicadores: os de ovinos + Período de Lactação, Leite por dia, Preço Leite/L.
- **Custos da pecuária** por exploração: Ração (Período em dias, Qtde. por cabeça em Kg, Valor unitário R$/Kg), Vacinas/Medicamentos/Sais Minerais (custo por cabeça/ano), Operário/Cabeça-Ano; e `Salário Mínimo-Referência`.
- Seleção de raças/atividades: `L7:O10` (listas `listaBOV_LEITE`, `listaBOV_CORTE`, `listaOVI`, `listaCAPRI`). Os valores de **Equivalência UA** já vêm preenchidos (ex.: Touro 1,5; Garrotas/Garrotes 0,5; Bezerros 0,3; ovinos/caprinos 0,16 / 0,10 / 0,08 / 0,04) — **mantenha como padrão editável apenas se a célula estiver destravada** (veja CSV).

### 4.8 Outras Atividades (`Outras Ativ`, `sheet22.xml`)
- **Receitas anuais** (linhas 15–24): `D` Descrição (lista `visaoATIV_REB_CLAS`), `E` Setor da Atividade (lista `visaoSETATIV`), e valores *Atual, Ano 1 … Ano N*.
- **Receitas extra-rurais** e **Despesas Diversas/Ano** (linhas 70–82): Conservação, Impostos, Energia Elétrica, Combustíveis e Lubrificantes, Administrador, Subsistência da Família (`F70`, `F77:F82`, decimais ≥ 0).
- **Atividades econômicas** (linhas 93–102): `E` (lista `visaoATIV`).

### 4.9 Cálculo Financeiro — parâmetros (`CalculoFinanceiro`, `sheet25.xml`)
Entradas: `D13` Prazo (meses), `D14` Carência (meses), `D15` Juros % a.a., `D16` Periodicidade (`visaoPER`), `D17` Amortizações iguais? (`Sim`/`Não`); idem no 2º bloco (`DD13:DD17`). Críticas: "Prazo incompatível com o Programa" e "Carência incompatível com o Programa" (limites na tabela de programas). O restante da aba é calculado pelo Excel.

### 4.10 Abas somente leitura / resultado
`Cap.Pgto` (capacidade de pagamento), `Sup.Forrageiro`, `Rel_Receitas`, `Rel_Custos`, `Rel`: **sem entradas**; ficam para o Excel (fase 1).

---

## 5. Listas suspensas e tabelas

A tabela abaixo resume as listas usadas nas telas. O intervalo exato está em `named_ranges.json`.

| Lista (nome) | Onde aparece | Tabela em `reference_tables.json` |
|---|---|---|
| `visaoDOC` (+`visaoDOC_COD`) | Cliente: Tipo de Documento | `tipos_documento` |
| `visaoUF` | UF órgão emissor | `uf` |
| `VisaoNaturalidade` | Naturalidade | `inconsistencia_cadastro` (coluna `GA`) / municípios |
| `visaoCIVIL` | Estado civil | `estado_civil` |
| `visaoESCOLA` | Grau de instrução | `escolaridade` |
| `visaoPROF` | Profissão | `profissoes` |
| `visaoATIV` (dinâmica) | Atividade (Cliente, Proposta, Ativ.) | `atividades_agricolas` |
| `Benef_Politica_Pub_Descr` | Beneficiário de políticas públicas | `politicas_publicas` |
| `visaoPOR_PRONAF` | Porte | `porte_pronaf` |
| `visaoTP_LOG` | Tipo de logradouro | `tipos_logradouro` |
| `visaoMUNI` | Município | `municipios` |
| `visaoPOSSE` | Tipo de uso do imóvel | `posse` |
| `visaoPRG` | Programa | `programas_credito` |
| `visaoAGC` (dinâmica) | Agência | `agencias_bnb` |
| `visaoOBJ` | Objetivo do crédito | `objetivos` |
| `visaoUND` / `visaoUND_S400` | Unidades | `unidade_medida` |
| `visaoUSO` | Uso do investimento | `usos_garantias` |
| `Imoveis_Inversao` | Nº do imóvel da inversão | `imoveis_inversoes` |
| `visaoAPLIC` | Aplicação dos recursos | `aplicacao_recursos` |
| `listaFINALIDADE_APL_REC` | Finalidade do crédito/aplicação | `finalidade` |
| `visaoCONS` | Estado de conservação | `conservacao` |
| `visaoRACA_*` | Raças | `racas` |
| `listaBOV_LEITE` / `listaBOV_CORTE` / `listaOVI` / `listaCAPRI` | Atividade pecuária | `ativ_pecuaria`, `ativ_pec_ovinos` |
| `visaoSETATIV` | Setor da atividade | `setor_atividade` |
| `visaoATIV_REB_CLAS` | Atividade (outras receitas) | `rebate_classificacao` |
| `visaoPER` | Periodicidade | `periodicidade` |
| `visaoSIM_NAO` | Sim/Não | `sim_nao` |
| `lista_ANALISADOR_DESC_ATIVIDADE` | Descrição de atividade (Avaliação/Agrícola) | `desc_atividades_agricolas` |

> **Programas cadastrados** (`programas_credito`): FNE/PRONAF Grupo "A" – FNE (**368**), Grupo "A" – Res. 5.183-24 (**699**), Cooperativas (**980**), com fonte, prazo, % de capacidade de pagamento, carência, encargos e valor limite. Mostre **só** os que estiverem na lista `visaoPRG`.

---

## 6. Regras de validação (reproduzir fielmente)

Extraídas do VBA (`mdlCritica`) e das colunas `Y/Z`:

- **Nome / Razão Social:** obrigatório, **≤ 55** caracteres. `ValidaNome`: sem 3 ou 4 caracteres iguais seguidos; primeiro caractere não pode ser espaço; **pessoa física:** primeiro nome com mais de 1 letra, **sem abreviação** (não pode conter `.` nem `,`), sem nome de 1 letra no meio; se tiver menos de 30 caracteres, **precisa de ao menos 2 nomes**; não pode começar com "NAO "/"NÃO "; não pode terminar em ponto. Para Endereço use `ValidaNome(…,"J")` (sem as regras específicas de PF), limite **45**.
- **CPF:** 11 dígitos (completa com zeros à esquerda), rejeita sequências repetidas (`00000000000`…`99999999999`), confere os dois dígitos verificadores (pesos 11→2 e 12→2).
- **CNPJ:** valide como o módulo `Verifica_CGC`/`CNPJFormatar` (inclui **CNPJ alfanumérico**; função `CNPJAlfa_FormatarSeValido`). Máscaras na tabela `mascaras` (`00.000.000/0000-00` e `000.000.000-00`).
- **Nº do endereço:** número ou `S/N`.
- **CEP:** inteiro até 99.999.999 ("CEP inconsistente").
- **DDD:** inteiro 1–9999; **Telefone:** inteiro 0–999999999.
- **Datas:** não podem ser futuras (≤ hoje), no formato dd/mm/aaaa; *Data de Emissão* ≥ *Data de Nascimento*.
- **Renda / valores monetários:** decimais ≥ 0.
- **CPF do cônjuge:** diferente do CPF do cliente.
- **Obrigatórios por tela:** indicador na coluna `Z` (Cliente) e colunas auxiliares `Y/Z/AA` nas outras abas (veja CSV).
- **Críticas do sistema:** a tabela `criticas_sistema` (≈93 mensagens) traz os textos de aviso/erro da planilha. Use os mesmos textos.

---

## 7. Fluxo da aplicação
1. **Início:** novo projeto, abrir projeto `.json` salvo, ou importar um `.xlsm` já preenchido (opcional, ver §9).
2. **Formulário em etapas** (stepper): Cliente → Avaliação → Proposta → Cronograma → Atividades (Agrícola, Pecuária, Outras) → Financiamento.
3. **Painel de críticas:** lista de campos obrigatórios/inválidos por tela, com clique para ir ao campo (equivale ao relatório de críticas da planilha).
4. **Finalizar e baixar:** só habilita quando não houver erro bloqueante; mostra aviso para pendências não bloqueantes. Baixa `PlanilhaPRONAF-A2_<CPF>_<data>.xlsm`.

---

## 8. Exportação do `.xlsm` preenchido (parte crítica)

**Algoritmo (no navegador, JSZip):**
1. Carregar o modelo `.xlsm` como ZIP.
2. Para cada aba de entrada, localizar o XML da aba (mapa: `Cliente`→`xl/worksheets/sheet13.xml`, `Avaliação`→`sheet14.xml`, ` Proposta`→`sheet15.xml`, `Cronograma`→`sheet17.xml`, `Ativ. Agrícola`→`sheet20.xml`, `Ativ. Pecuária`→`sheet21.xml`, `Outras Ativ`→`sheet22.xml`, `CalculoFinanceiro`→`sheet25.xml`; confirme em `xl/workbook.xml` + `xl/_rels/workbook.xml.rels`).
3. Para cada célula de entrada preenchida, **alterar só o elemento `<c r="E13" …>`** correspondente:
   - texto → `t="inlineStr"` com `<is><t xml:space="preserve">…</t></is>` (escapar `& < >`). Não mexer em `sharedStrings.xml`.
   - número → `<v>123.45</v>` sem `t`.
   - data → número serial do Excel (base 1900) com o **estilo (`s`) original** da célula.
   - **Preservar o atributo `s` (estilo) existente.** Se a célula não existir no XML, crie-a na ordem correta dentro da `<row>` (colunas em ordem crescente).
4. Em `xl/workbook.xml`, garantir `<calcPr … fullCalcOnLoad="1"/>` para forçar recálculo ao abrir.
5. **Não alterar** `vbaProject.bin`, `ctrlProps`, `drawings`, `comments`, `connections`, `externalLinks`, `calcChain.xml` etc. Regravar o ZIP com os mesmos arquivos (compressão deflate).
6. Entregar o blob como download.

**Proibido gravar:** células com `<f>` (fórmula), abas ocultas (`SEAP`, `Tabelas`, `BUSCA`…), colunas auxiliares de crítica.

**Aviso importante:** o arquivo modelo contém **ligações externas** a caminhos internos do banco. O Excel perguntará se atualiza vínculos; o usuário deve **recusar**. Mostre esse aviso na tela de download.

---

## 9. Importar `.xlsm` existente (opcional)
Ler os mesmos intervalos de entrada de um `.xlsm` já preenchido (valores em cache) para recarregar o formulário. Somente leitura; mesma lista de campos.

---

## 10. SEAP (fase 2 — apenas contexto)
- O `.SEAP` é uma planilha **.xls (BIFF8) protegida por senha**, com uma aba `SEAP`, renomeada para `.SEAP`. A macro `frmGeraSEAP.btnGeraSEAP_Click` copia **os valores** da aba oculta `SEAP`; a senha está fixa no VBA (`vba_referencia/frmGeraSEAP.bas`).
- `seap_layout.json` lista os **209 campos** (tabelas `T033CLIE`, `T033PROJ`, `T033IMOV`, `T033COOB`… ) com tipo, tamanho, obrigatoriedade e a fórmula que busca cada valor nas telas.
- **Na fase 1, a geração do `.SEAP` continua sendo feita no Excel**, pelo botão da planilha. Gerar o arquivo no navegador exige escrever `.xls` criptografado e **ainda não foi validado contra o sistema SEAP real**.

---

## 11. Critérios de aceite

1. **Cobertura:** todo campo de `campos_*.csv` com `validacao_tipo` ou valor padrão existe na UI (exceto os marcados como espaçador/auxiliar). Gere um teste que compara a lista de campos da UI com os CSVs.
2. **Listas:** cada lista suspensa tem exatamente os mesmos itens e a mesma ordem da `VISAO` (teste de contagem: municípios 5.625 linhas lidas, agências 300, empreendimentos BACEN 977, atividades agrícolas 1.647 etc. — conferir com `n_linhas` do JSON).
3. **Validações:** casos de teste para CPF válido/ inválido, `ValidaNome` (repetições, abreviação, 1 letra), datas futuras, CEP, `S/N`.
4. **Round-trip:** preencher o formulário, exportar, reabrir o `.xlsm` **sem macros** (ex.: ler o XML) e verificar que cada célula de entrada contém o valor digitado, que **nenhuma fórmula foi alterada** e que o ZIP contém os mesmos arquivos do modelo (incluindo `xl/vbaProject.bin`).
5. **Abertura no Excel:** abrir o `.xlsm` exportado no Excel com macros; confirmar que não há aviso de arquivo corrompido, que as fórmulas recalculam e que os botões/macros funcionam. *(Teste manual — não é possível automatizar sem Excel.)*
6. **Privacidade:** nenhuma requisição de rede com dados do cliente; sem logs de CPF/nome.

---

## 12. Limites conhecidos desta especificação
- Os inventários `campos_*.csv` marcam **células de entrada com validação ou valor padrão**. Células destravadas sem validação e sem rótulo (espaçadores) aparecem só no resumo acima; **confirme visualmente no `.xlsm`**.
- Os rótulos `rotulo_linha`/`cabecalho_coluna` dos CSVs são **inferidos** pela posição (texto fixo mais próximo à esquerda/acima) e podem estar imprecisos em grades.
- Colunas `K` e `M` do Programa de Investimentos (Proposta) não têm cabeçalho próprio claro; o significado deve ser confirmado no arquivo original.
- Não foi possível testar a abertura do arquivo exportado no Excel nem a importação do `.SEAP` no sistema do banco.
- O modelo é uma ferramenta interna do BNB: confirme a permissão para hospedar o modelo e distribuir uma versão web.
