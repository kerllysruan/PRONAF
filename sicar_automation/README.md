# Automação de Consultas no SICAR (Cadastro Ambiental Rural)

Este módulo automatiza a consulta pública de números de CAR no Sistema Nacional de Cadastro Ambiental Rural (SICAR), extraindo dados cadastrais e gerando comprovantes em PDF.

## Estrutura do Módulo

* `config.py`: Arquivo de configuração de caminhos, timeouts e comportamento do navegador.
* `logger.py`: Gerenciamento de arquivos de log (`log.txt`).
* `excel.py`: Leitor e gravador de dados do Excel (utilizando `pandas` e `openpyxl`).
* `download.py`: Salvamento de comprovantes em formato PDF.
* `consulta.py`: Lógica de automação e raspagem com a biblioteca `Playwright`.
* `main.py`: Ponto de entrada que orquestra todo o processamento.

## Pré-requisitos

* Python 3.12+ instalado no sistema.
* Navegador Google Chrome instalado (ou Chromium).

## Instruções de Instalação e Execução

1. Abra o terminal (PowerShell ou Command Prompt) no diretório desta pasta (`sicar_automation`).
2. Crie um ambiente virtual (opcional, recomendado):
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Instale os binários do navegador necessários para o Playwright:
   ```bash
   playwright install chromium
   ```
5. Insira os números do CAR na planilha `CAR.xlsx` na coluna chamada `CAR`.
6. Execute o script principal:
   ```bash
   python -m sicar_automation.main
   ```

## Resultados Gerados

* **Resultado.xlsx**: Planilha com as informações detalhadas e estruturadas de cada imóvel rural consultado.
* **Pasta PDFs/**: Contém arquivos PDF com a consulta realizada para cada número do CAR que foi encontrado com sucesso.
* **log.txt**: Log do sistema com horário, status e possíveis erros.
