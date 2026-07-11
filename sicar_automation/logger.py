import logging
from .config import LOG_FILE

# Configuração do Logger
def setup_logger():
    logger = logging.getLogger("sicar_automation")
    logger.setLevel(logging.INFO)
    
    # Formato do Log
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    # Handler para salvar em arquivo
    file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Handler para console (opcional se precisar de logs em tempo real)
    # console_handler = logging.StreamHandler()
    # console_handler.setFormatter(formatter)
    # logger.addHandler(console_handler)
    
    return logger

logger = setup_logger()
