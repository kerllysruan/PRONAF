# Manual Passo a Passo: Instalando o PRONAF na sua Instância ServiceNow
### (Guia para Iniciantes — do Zero ao Sistema no Ar)

Este guia foi feito pensando em quem **não tem experiência prévia com o ServiceNow**. Siga cada passo calmamente: são apenas **4 cliques** para deixar tudo funcionando!

---

## 🟢 ETAPA 0: Se você ainda NÃO tem uma instância do ServiceNow

Se você já tem uma instância fornecida pela sua empresa ou faculdade, **pule para a ETAPA 1**. Se não tiver, consiga uma gratuita em 2 minutos:

1. Acesse o site oficial de desenvolvedores do ServiceNow: [https://developer.servicenow.com](https://developer.servicenow.com)
2. Clique em **Sign Up** e crie uma conta gratuita com seu e-mail.
3. Depois de logar, clique no botão **Request an Instance** (no canto superior direito).
4. Escolha a versão mais recente recomendada (**Xanadu** ou **Washington DC**) e confirme.
5. Pronto! O ServiceNow te dará um link com seu usuário `admin` e sua senha temporária (ex: `https://dev12345.service-now.com`).

---

## 🚀 ETAPA 1: Onde está o arquivo de instalação mágica?

Já deixamos o arquivo pronto dentro deste projeto no caminho:
📁 **`PRONAF/servicenow/PRONAF_Update_Set.xml`**

*(Se você estiver com o projeto aberto no seu computador, o arquivo está na pasta `servicenow/PRONAF_Update_Set.xml`)*.

---

## 🖱️ ETAPA 2: Os 4 Cliques dentro do ServiceNow (Instalação)

### Passo 1: Localizar a tela de Update Sets
1. Entre na sua instância do ServiceNow (ex: `https://devXXXXX.service-now.com`) com seu usuário `admin`.
2. No topo da tela, clique no menu **All** (ou no ícone de lupa / menu de navegação).
3. Na caixa de busca que abrir, digite exatamente:
   `Retrieved Update Sets`
4. Na lista de resultados que aparecer, clique em **Retrieved Update Sets** (em *System Update Sets*).

---

### Passo 2: Importar o arquivo XML
1. Na tela que abriu, role até o final da página ou procure os links em azul embaixo da tabela.
2. Clique no link: **"Import Update Set from XML"**.
3. Clique no botão **"Escolher arquivo"** (ou *Browse*).
4. Selecione o arquivo **`PRONAF_Update_Set.xml`** do seu computador.
5. Clique no botão amarelo/azul **"Upload"**.

---

### Passo 3: Pré-visualizar (Preview)
1. Você verá agora na lista uma linha com o nome:
   👉 **`PRONAF Gestao de Propostas - Pacote Completo v1.0`**
2. Clique em cima desse nome para abrir os detalhes.
3. No canto superior direito, clique no botão:
   👉 **"Preview Update Set"**
4. Uma barra de progresso vai carregar até 100%. Quando terminar, clique no botão **Close**.

---

### Passo 4: Aplicar na Instância (Commit)
1. Agora que a pré-visualização deu 100% de sucesso, um novo botão vai aparecer no canto superior direito:
   👉 **"Commit Update Set"**
2. Clique nele e confirme.
3. O ServiceNow vai criar todas as tabelas, menus, regras e o dashboard automaticamente! Quando a barra chegar em 100%, clique em **Close**.

🎉 **PARABÉNS! A instalação está 100% concluída!**

---

## 🖥️ ETAPA 3: Como abrir e ver a sua página funcionando?

1. No topo esquerdo, clique novamente no menu **All**.
2. Digite na busca: `PRONAF`.
3. Você verá um novo menu chamado **PRONAF Crédito Rural** com duas opções:
   - 🌟 **Painel do Projetista (Dashboard)**: Clique aqui para abrir a página completa com o visual moderno, as 3 abas, os 9 cards e o importador de planilhas!
   - 📋 **Todas as Propostas (Esteira Bancária)**: Abre a lista gerencial de tarefas do ServiceNow para os analistas do banco acompanharem o status.

---

## ❓ Perguntas Frequentes de Iniciantes

* **O visual é mesmo o da tela moderna?**
  * Sim! Ao clicar em *Painel do Projetista (Dashboard)*, a tela abre exatamente com os mesmos cards, o leitor de planilhas com senha `senhasBN`, o dossiê e os gráficos.
* **Preciso programar alguma coisa?**
  * Nada! O arquivo XML já fez todo o trabalho de banco de dados, menus, segurança e integração para você.
