import time
from playwright.sync_api import sync_playwright, Page, Browser
from .config import SICAR_URL, HEADLESS, TIMEOUT
from .logger import logger
from .download import save_pdf_comprovante

def consultar_registro_sicar(car_number: str) -> dict:
    """
    Executa a consulta de um número de CAR individual no portal público do SICAR.
    Retorna um dicionário com os dados extraídos.
    """
    dados_car = {
        "Número do CAR": car_number,
        "Nome do proprietário ou possuidor": "Não encontrado",
        "Nome do imóvel": "Não encontrado",
        "Município": "Não encontrado",
        "UF": "Não encontrado",
        "Situação do cadastro": "Não encontrado",
        "Status da análise": "Não encontrado",
        "Data de inscrição": "Não encontrado",
        "Área total": "Não encontrado",
        "Área cadastrada": "Não encontrado",
        "Status da Consulta": "Não encontrado",
        "PDF Comprovante": "Não gerado"
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.set_default_timeout(TIMEOUT)

        try:
            logger.info(f"Iniciando consulta para CAR: {car_number}")
            page.goto(SICAR_URL)
            
            # Aguarda o campo de busca
            # O SICAR Nacional geralmente possui uma barra de busca geral ou um campo para digitar o código do imóvel.
            # Vamos tentar localizar o input por seletores comuns e placeholders
            input_busca = None
            seletores_input = [
                "input[placeholder*='Buscar']",
                "input[placeholder*='código']",
                "input[placeholder*='CAR']",
                "input#txtPesquisa",
                "input.search-query",
                "#search-imovel",
                "#codImovel"
            ]
            
            for seletor in seletores_input:
                if page.locator(seletor).is_visible():
                    input_busca = page.locator(seletor)
                    break
                    
            if not input_busca:
                # Fallback: procura o primeiro input do tipo texto visível
                input_busca = page.locator("input[type='text']").first
                
            input_busca.fill(car_number)
            
            # Clica no botão de busca/lupa ou aperta Enter
            page.keyboard.press("Enter")
            
            # Aguarda o carregamento do resultado
            # No SICAR, após a busca o resultado pode abrir em uma tabela ou em um modal/página detalhada
            page.wait_for_timeout(3000) # Espera estática rápida para estabilizar
            
            # Se houver um link de detalhes ou card do imóvel, clica nele
            card_link = page.locator("a[href*='detalhe']").first
            if card_link.is_visible():
                card_link.click()
                page.wait_for_load_state("networkidle")
                
            # Extrai os dados da página
            # Os seletores abaixo são baseados nas tags padrão de tabelas de visualização detalhada do SICAR
            # Usamos busca por texto para maior resiliência a mudanças de layout
            
            # Função auxiliar interna para extrair dados por rótulo textual
            def extrair_por_rotulo(label: str) -> str:
                try:
                    # Encontra o elemento que contém o label e pega o próximo elemento irmão ou elemento pai
                    locator = page.locator(f"text='{label}'").first
                    if locator.is_visible():
                        # Tentativas de buscar o valor adjacente
                        val = page.evaluate(
                            "(node) => {"
                            "  let next = node.nextElementSibling;"
                            "  if (next) return next.innerText.strip();"
                            "  let parent = node.parentElement;"
                            "  if (parent && parent.nextElementSibling) return parent.nextElementSibling.innerText.strip();"
                            "  return '';"
                            "}", 
                            locator.element_handle()
                        )
                        return val if val else "Não disponível"
                except Exception:
                    pass
                return "Não disponível"

            # Extração de Metadados detalhados
            dados_car["Nome do imóvel"] = extrair_por_rotulo("Nome do Imóvel") or extrair_por_rotulo("Denominação do Imóvel")
            dados_car["Município"] = extrair_por_rotulo("Município")
            dados_car["UF"] = extrair_por_rotulo("UF") or extrair_por_rotulo("Estado")
            dados_car["Situação do cadastro"] = extrair_por_rotulo("Situação") or extrair_por_rotulo("Situação do Cadastro")
            dados_car["Status da análise"] = extrair_por_rotulo("Status") or extrair_por_rotulo("Status da Análise")
            dados_car["Data de inscrição"] = extrair_por_rotulo("Inscrição") or extrair_por_rotulo("Data de Inscrição")
            dados_car["Área total"] = extrair_por_rotulo("Área Total") or extrair_por_rotulo("Área do Imóvel")
            dados_car["Área cadastrada"] = extrair_por_rotulo("Área Cadastrada")
            
            # Nome do proprietário/possuidor (se disponível)
            dados_car["Nome do proprietário ou possuidor"] = extrair_por_rotulo("Proprietário") or extrair_por_rotulo("Possuidor") or extrair_por_rotulo("Nome do Proponente")
            
            # Valida se a consulta deu certo
            if dados_car["Município"] != "Não disponível" or dados_car["Situação do cadastro"] != "Não disponível":
                dados_car["Status da Consulta"] = "Sucesso"
                
                # Baixa o comprovante/imprime em PDF
                # Usamos a funcionalidade nativa do navegador para salvar a página como PDF (print to PDF)
                pdf_bytes = page.pdf(format="A4", print_background=True)
                pdf_path = save_pdf_comprovante(car_number, pdf_bytes)
                dados_car["PDF Comprovante"] = pdf_path
            else:
                dados_car["Status da Consulta"] = "Não encontrado"
                logger.warning(f"CAR {car_number} não encontrado nos registros do SICAR.")
                
        except Exception as e:
            logger.error(f"Erro ao consultar CAR {car_number}: {str(e)}")
            dados_car["Status da Consulta"] = f"Erro: {str(e)}"
            
        finally:
            browser.close()
            
    return dados_car
