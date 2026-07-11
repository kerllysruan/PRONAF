import time
from tqdm import tqdm
from .config import INPUT_EXCEL
from .logger import logger
from .excel import read_car_list, save_results
from .consulta import consultar_registro_sicar

def main():
    print("="*60)
    print("INICIANDO SISTEMA DE AUTOMATIZAÇÃO DE CONSULTAS SICAR")
    print("="*60)
    
    logger.info("Sistema de automação SICAR iniciado.")
    
    try:
        # 1. Carrega lista de CARs do Excel
        car_list = read_car_list()
    except Exception as e:
        print(f"\n[ERRO CRÍTICO] Falha ao iniciar: {str(e)}")
        print("Verifique se o arquivo CAR.xlsx existe na pasta da automação.")
        return
        
    total_consultas = len(car_list)
    sucesso_count = 0
    nao_encontrado_count = 0
    erro_count = 0
    
    resultados = []
    
    # 2. Executa a consulta de cada CAR na lista com barra de progresso
    print(f"\nProcessando {total_consultas} consultas...")
    
    # tqdm exibe a barra de progresso no terminal
    for car in tqdm(car_list, desc="Consultando SICAR", unit=" CAR"):
        try:
            # Tenta consultar o CAR
            resultado = consultar_registro_sicar(car)
            resultados.append(resultado)
            
            # Atualiza contadores
            status = resultado.get("Status da Consulta")
            if status == "Sucesso":
                sucesso_count += 1
            elif status == "Não encontrado":
                nao_encontrado_count += 1
            else:
                erro_count += 1
                
        except Exception as e:
            logger.error(f"Erro inesperado no loop principal para o CAR {car}: {str(e)}")
            erro_count += 1
            resultados.append({
                "Número do CAR": car,
                "Status da Consulta": f"Erro inesperado: {str(e)}"
            })
            
        # Pequeno atraso para evitar bloqueio por requisições rápidas
        time.sleep(1)
        
    # 3. Salva resultados finais no Excel
    print("\nSalvando planilha de resultados...")
    save_results(resultados)
    
    # 4. Exibe Resumo no console
    print("\n" + "="*40)
    print("            RESUMO DA EXECUÇÃO")
    print("="*40)
    print(f"Total de consultas processadas: {total_consultas}")
    print(f"Consultas com sucesso:         {sucesso_count}")
    print(f"Cadastros não encontrados:    {nao_encontrado_count}")
    print(f"Erros ocorridos:              {erro_count}")
    print("="*40)
    print("Para relatórios detalhados, consulte: Resultado.xlsx e log.txt\n")
    
    logger.info("Processamento de consultas finalizado com sucesso.")

if __name__ == "__main__":
    main()
