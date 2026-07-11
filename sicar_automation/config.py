import os
from pathlib import Path

# Caminhos do projeto
BASE_DIR = Path(__file__).resolve().parent
PDFS_DIR = BASE_DIR / "PDFs"

# Garante que a pasta de PDFs exista
PDFS_DIR.mkdir(parents=True, exist_ok=True)

# Configurações do Navegador
HEADLESS = False  # Definir como False ajuda caso haja necessidade de CAPTCHA manual
TIMEOUT = 30000   # Timeout padrão em milissegundos (30s)

# URLs do SICAR
# URL da Consulta Pública Federal do Cadastro Ambiental Rural
SICAR_URL = "https://www.car.gov.br/publico/imoveis/index"

# Configurações de arquivos
INPUT_EXCEL = BASE_DIR / "CAR.xlsx"
OUTPUT_EXCEL = BASE_DIR / "Resultado.xlsx"
LOG_FILE = BASE_DIR / "log.txt"
