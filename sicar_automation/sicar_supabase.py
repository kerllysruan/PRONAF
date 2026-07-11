import os
import time
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from .config import BASE_DIR, HEADLESS, TIMEOUT
from .logger import logger
from .consulta import consultar_registro_sicar

# Carrega arquivo .env da raiz do projeto PRONAF
dotenv_path = BASE_DIR.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

def get_supabase_client() -> Client:
    """Instancia e retorna o cliente Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Credenciais do Supabase não encontradas no arquivo .env")
        raise ValueError("VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY devem estar definidos no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def sincronizar_e_consultar_sicar():
    """
    1. Busca os números de CAR enviados na tabela `documentation_files` (tipos car_individual e car_coletivo).
    2. Consulta as informações no SICAR para cada um.
    3. Atualiza os dados do imóvel na tabela `stock_proposals` para alimentar o Parecer Gerencial no Frontend de forma automática.
    """
    print("="*60)
    print("INICIANDO SINCRONIZAÇÃO E AUTOMATIZAÇÃO COM O SUPABASE")
    print("="*60)
    
    logger.info("Automação Supabase-SICAR iniciada.")
    
    try:
        supabase_client = get_supabase_client()
    except Exception as e:
        print(f"[ERRO CRÍTICO] Falha ao conectar ao Supabase: {str(e)}")
        return

    # Busca arquivos de documentação do tipo CAR que tenham ged_id preenchido (número do CAR)
    print("Buscando números de CAR enviados pelos projetistas no banco de dados...")
    try:
        # Busca arquivos do tipo car_individual e car_coletivo
        response = supabase_client.table("documentation_files").select(
            "id, token_id, document_type, ged_id"
        ).in_("document_type", ["car_individual", "car_coletivo"]).execute()
        
        files = response.data or []
        logger.info(f"Encontrados {len(files)} arquivos de CAR cadastrados no banco.")
    except Exception as e:
        print(f"[ERRO] Falha ao ler tabela de documentação: {str(e)}")
        return

    if not files:
        print("Nenhum arquivo de CAR encontrado para consulta.")
        return

    # Mapeia token_id para obter a proposta associada
    print("Mapeando propostas associadas aos tokens de documentação...")
    propostas_para_atualizar = []
    
    for file in files:
        car_number = file.get("ged_id")
        token_id = file.get("token_id")
        doc_type = file.get("document_type")
        
        # Ignora se o ged_id não parecer um número de CAR válido (muito curto ou nulo)
        if not car_number or len(str(car_number).strip()) < 10 or str(car_number).upper() in ["SIM", "NAO", "NÃO"]:
            continue
            
        try:
            # Obtém a proposta a partir do token
            token_response = supabase_client.table("documentation_tokens").select(
                "proposal_id"
            ).eq("id", token_id).execute()
            
            token_data = token_response.data
            if token_data:
                proposal_id = token_data[0].get("proposal_id")
                propostas_para_atualizar.append({
                    "proposal_id": proposal_id,
                    "car_number": str(car_number).strip(),
                    "doc_type": doc_type
                })
        except Exception as e:
            logger.error(f"Erro ao buscar proposta para token {token_id}: {str(e)}")

    total_propostas = len(propostas_para_atualizar)
    print(f"Total de {total_propostas} números de CAR válidos encontrados para processamento.")

    # Executa a automação no SICAR e atualiza o banco
    for item in propostas_para_atualizar:
        proposal_id = item["proposal_id"]
        car_number = item["car_number"]
        doc_type = item["doc_type"]
        
        print(f"\nConsultando CAR {car_number} no SICAR...")
        try:
            # Executa a raspagem com Playwright
            resultado = consultar_registro_sicar(car_number)
            
            if resultado.get("Status da Consulta") == "Sucesso":
                print(f"-> CAR {car_number} consultado com sucesso!")
                
                # Monta os dados de atualização para a proposta
                # Atualizando 'localizacao' com o nome do imóvel e 'municipio' com o município retornado do SICAR.
                # O Parecer Gerencial no frontend lê esses campos automaticamente!
                update_data = {}
                
                if doc_type == "car_individual":
                    update_data["localizacao"] = resultado.get("Nome do imóvel")
                    update_data["municipio"] = resultado.get("Município")
                
                # Guarda o resumo estruturado nas observações adicionais/notas da proposta
                resumo_sicar = (
                    f"[SICAR AUTOMATIZADO - {doc_type.upper()}]\n"
                    f"Imóvel: {resultado.get('Nome do imóvel')}\n"
                    f"Proprietário: {resultado.get('Nome do proprietário ou possuidor')}\n"
                    f"Situação Cadastro: {resultado.get('Situação do cadastro')}\n"
                    f"Status Análise: {resultado.get('Status da análise')}\n"
                    f"Área Total: {resultado.get('Área total')} ha\n"
                    f"Data Inscrição: {resultado.get('Data de inscrição')}\n"
                )
                
                # Adiciona o resumo à proposta
                # Primeiro busca os dados existentes para não sobrescrever outras notas importantes
                proposal_data = supabase_client.table("stock_proposals").select("notes").eq("id", proposal_id).execute().data
                existing_notes = proposal_data[0].get("notes") if proposal_data else ""
                
                new_notes = f"{existing_notes}\n\n{resumo_sicar}" if existing_notes else resumo_sicar
                update_data["notes"] = new_notes.strip()
                
                # Salva no banco de dados do Supabase
                supabase_client.table("stock_proposals").update(update_data).eq("id", proposal_id).execute()
                print("-> Banco de dados atualizado com as informações do SICAR!")
                logger.info(f"Proposta {proposal_id} atualizada com os dados do CAR {car_number} do SICAR.")
            else:
                print(f"-> CAR {car_number} não pôde ser consultado (Status: {resultado.get('Status da Consulta')})")
                
        except Exception as e:
            print(f"-> Erro ao processar CAR {car_number}: {str(e)}")
            logger.error(f"Erro ao processar e atualizar CAR {car_number} no banco: {str(e)}")
            
        time.sleep(1)

    print("\nSincronização e consultas concluídas com sucesso!")

if __name__ == "__main__":
    sincronizar_e_consultar_sicar()
