from pathlib import Path
from .config import PDFS_DIR
from .logger import logger

def save_pdf_comprovante(car_number: str, page_content_bytes: bytes) -> str:
    """
    Salva o conteúdo em PDF correspondente à consulta do CAR.
    """
    try:
        # Substitui caracteres inválidos do número do CAR para o nome do arquivo
        safe_car_name = car_number.replace("/", "_").replace("\\", "_").replace(":", "_")
        pdf_path = PDFS_DIR / f"{safe_car_name}.pdf"
        
        with open(pdf_path, "wb") as f:
            f.write(page_content_bytes)
            
        logger.info(f"PDF do CAR {car_number} salvo com sucesso em: {pdf_path}")
        return str(pdf_path)
    except Exception as e:
        logger.error(f"Erro ao salvar PDF do CAR {car_number}: {str(e)}")
        raise e
