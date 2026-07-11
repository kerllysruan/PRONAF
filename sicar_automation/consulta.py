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
            page.wait_for_load_state("networkidle")
            
            # Tenta fechar possíveis modais/popups de avisos que impedem a interação
            try:
                modais_fechar = [
                    "button.close",
                    "button:has-text('Fechar')",
                    "button:has-text('Entendido')",
                    "#fechar-aviso",
                    ".modal-header button",
                    ".modal-footer button",
                    ".close-modal"
                ]
                for btn_sel in modais_fechar:
                    loc_btn = page.locator(btn_sel).first
                    if loc_btn.is_visible():
                        loc_btn.click(timeout=3000, force=True)
                        logger.info("Modal de aviso/popup fechada com sucesso!")
            except Exception:
                pass

            # Aguarda o campo de busca
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
                loc = page.locator(seletor).first
                if loc.is_visible():
                    input_busca = loc
                    break
                    
            if not input_busca:
                input_busca = page.locator("input[type='text']").first
                
            input_busca.click(force=True)
            input_busca.focus()
            input_busca.fill(car_number)
            
            # Clica no botão de busca/lupa ou aperta Enter
            page.keyboard.press("Enter")
            
            # Aguarda o carregamento do resultado
            page.wait_for_timeout(3000) # Espera estática rápida para estabilizar
            
            # Se houver um link de detalhes ou card do imóvel, clica nele
            card_link = page.locator("a[href*='detalhe']").first
            if card_link.is_visible():
                card_link.click(force=True)
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
                
                # Substitui caracteres inválidos do número do CAR para o nome do arquivo
                safe_car_name = car_number.replace("/", "_").replace("\\", "_").replace(":", "_")
                from .config import PDFS_DIR
                pdf_path = PDFS_DIR / f"{safe_car_name}.pdf"
                
                # Tenta baixar o demonstrativo PDF oficial usando os botões da página
                download_success = False
                try:
                    # Seletores comuns para o botão de baixar PDF/Demonstrativo no SICAR
                    seletores_download = [
                        "a[href*='pdf']",
                        "a:has-text('Demonstrativo')",
                        "a:has-text('demonstrativo')",
                        "button:has-text('Demonstrativo')",
                        "button:has-text('demonstrativo')",
                        ".btn-download",
                        "a[title*='Demonstrativo']",
                        "a[title*='pdf']"
                    ]
                    
                    botao_download = None
                    for sel in seletores_download:
                        loc = page.locator(sel).first
                        if loc.is_visible():
                            botao_download = loc
                            break
                            
                    if botao_download:
                        logger.info(f"Botão de download oficial encontrado. Iniciando download do PDF para {car_number}...")
                        with page.expect_download(timeout=15000) as download_info:
                            botao_download.click()
                        download = download_info.value
                        download.save_as(str(pdf_path))
                        dados_car["PDF Comprovante"] = str(pdf_path)
                        download_success = True
                        logger.info(f"Download do PDF oficial concluído para {car_number}")
                except Exception as e_down:
                    logger.warning(f"Não foi possível baixar o PDF oficial via clique: {str(e_down)}. Tentando geração alternativa...")

                if not download_success:
                    try:
                        # Se estiver em modo headless, podemos usar a API nativa de impressão em PDF do Chrome
                        if HEADLESS:
                            pdf_bytes = page.pdf(format="A4", print_background=True)
                            pdf_path = save_pdf_comprovante(car_number, pdf_bytes)
                            dados_car["PDF Comprovante"] = pdf_path
                        else:
                            # Se estiver em modo visível (headless=False), page.pdf() não é suportado pelo Chromium.
                            # Como alternativa, salvamos um print completo em imagem PNG de alta qualidade
                            png_path = pdf_path.with_suffix(".png")
                            page.screenshot(path=str(png_path), full_page=True)
                            dados_car["PDF Comprovante"] = str(png_path)
                            logger.info(f"Comprovante visual do CAR {car_number} salvo como imagem (headless=False): {png_path}")
                    except Exception as e_pdf:
                        logger.error(f"Erro ao gerar comprovante alternativo do CAR {car_number}: {str(e_pdf)}")
            else:
                dados_car["Status da Consulta"] = "Não encontrado"
                logger.warning(f"CAR {car_number} não encontrado nos registros do SICAR.")
                
        except Exception as e:
            # Captura um print da tela no momento do erro para ajudar no diagnóstico
            try:
                from .config import PDFS_DIR
                safe_car = car_number.replace("/", "_").replace("\\", "_").replace(":", "_")
                screenshot_err = PDFS_DIR / f"erro_{safe_car}.png"
                page.screenshot(path=str(screenshot_err), full_page=True)
                logger.info(f"Screenshot do erro salvo em: {screenshot_err}")
            except Exception:
                pass
            logger.error(f"Erro ao consultar CAR {car_number}: {str(e)}")
            dados_car["Status da Consulta"] = f"Erro: {str(e)}"
            
        finally:
            browser.close()
            
    return dados_car
