import pandas as pd
from pathlib import Path
from .config import INPUT_EXCEL, OUTPUT_EXCEL
from .logger import logger

def read_car_list() -> list[str]:
    """
    Lê a lista de CARs do arquivo Excel especificado.
    Retorna uma lista de strings limpas e formatadas.
    """
    if not INPUT_EXCEL.exists():
        logger.error(f"Arquivo de entrada não encontrado: {INPUT_EXCEL}")
        raise FileNotFoundError(f"Arquivo de entrada não encontrado: {INPUT_EXCEL}")
        
    try:
        df = pd.read_excel(INPUT_EXCEL)
        if 'CAR' not in df.columns:
            logger.error("Coluna 'CAR' não encontrada na planilha de entrada.")
            raise ValueError("A planilha de entrada deve conter uma coluna chamada 'CAR'.")
            
        # Limpa e remove nulos
        car_list = df['CAR'].dropna().astype(str).str.strip().tolist()
        logger.info(f"Carregados {len(car_list)} registros de CAR para consulta.")
        return car_list
    except Exception as e:
        logger.error(f"Erro ao ler a planilha Excel de entrada: {str(e)}")
        raise e

def save_results(results: list[dict]):
    """
    Salva os resultados consolidados em um novo arquivo Excel chamado Resultado.xlsx.
    """
    try:
        df = pd.DataFrame(results)
        df.to_excel(OUTPUT_EXCEL, index=False)
        logger.info(f"Resultados salvos com sucesso em: {OUTPUT_EXCEL}")
    except Exception as e:
        logger.error(f"Erro ao salvar a planilha de resultados: {str(e)}")
        raise e
