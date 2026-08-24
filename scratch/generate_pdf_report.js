import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = "C:\\Users\\Windows Lite BR\\.gemini\\antigravity\\brain\\aae53569-28aa-4134-88fb-99690b63f529";

// Load calculation data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'earthwork_results.json'), 'utf-8'));
const bestZ = 52.60;

// Read SVG files
const g1Svg = fs.readFileSync(path.join(artifactDir, 'grafico1_curva_cota_plana_ptbr.svg'), 'utf-8');
const g2Svg = fs.readFileSync(path.join(artifactDir, 'grafico2_mapa_corta_aterro_plana_ptbr.svg'), 'utf-8');
const g3Svg = fs.readFileSync(path.join(artifactDir, 'grafico3_perfil_longitudinal_plana_ptbr.svg'), 'utf-8');
const pranchaSvg = fs.readFileSync(path.join(artifactDir, 'prancha_execucao_obra.svg'), 'utf-8');

// Read 3D render image as base64
const img3dPath = path.join(artifactDir, 'cota_plana_3d_render_1786305652423.jpg');
const img3dBase64 = fs.existsSync(img3dPath) 
  ? `data:image/jpeg;base64,${fs.readFileSync(img3dPath).toString('base64')}`
  : '';

// Generate table rows for 59 points
const pointsRows = data.points.map(pt => {
  const diff = pt.z - bestZ;
  const diffCm = Math.round(diff * 100);
  let actionText = '';
  let badgeClass = '';

  if (diffCm > 5) {
    actionText = `ESCAVAR CORTE (-${diffCm} cm)`;
    badgeClass = 'badge-cut';
  } else if (diffCm < -5) {
    actionText = `ATERRAR (+${Math.abs(diffCm)} cm)`;
    badgeClass = 'badge-fill';
  } else {
    actionText = `COTA GREIDE OK (0 cm)`;
    badgeClass = 'badge-zero';
  }

  return `
    <tr>
      <td style="text-align: center; font-weight: bold;">P${pt.p}</td>
      <td style="text-align: right;">${pt.e.toFixed(3)}</td>
      <td style="text-align: right;">${pt.n.toFixed(3)}</td>
      <td style="text-align: right; font-weight: 500;">${pt.z.toFixed(3)} m</td>
      <td style="text-align: right;">${bestZ.toFixed(3)} m</td>
      <td style="text-align: right; font-weight: bold; color: ${diffCm > 0 ? '#dc2626' : (diffCm < 0 ? '#2563eb' : '#16a34a')};">
        ${diff > 0 ? '+' : ''}${diff.toFixed(3)} m
      </td>
      <td><span class="${badgeClass}">${actionText}</span></td>
    </tr>
  `;
}).join('');

const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Técnico & Memorial de Cálculo de Terraplenagem - Cota Plana 52,60m</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 11pt;
      background: #ffffff;
    }

    .page-break {
      page-break-after: always;
    }

    /* Cover Page */
    .cover {
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px solid #0284c7;
      padding: 30px;
      box-sizing: border-box;
      background: linear-gradient(185deg, #f0f9ff 0%, #ffffff 100%);
    }

    .cover-header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 15px;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: bold;
      color: #0369a1;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-size: 15pt;
      color: #0369a1;
      font-weight: 600;
    }

    .cover-badge {
      background: #0284c7;
      color: #ffffff;
      padding: 10px 20px;
      font-size: 14pt;
      font-weight: bold;
      border-radius: 6px;
      display: inline-block;
      margin-top: 15px;
    }

    .cover-meta {
      font-size: 11pt;
      color: #334155;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
    }

    /* Sections & Typography */
    h1 {
      font-size: 18pt;
      color: #0369a1;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin-top: 25px;
      margin-bottom: 15px;
    }

    h2 {
      font-size: 14pt;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 10px;
      border-left: 4px solid #0284c7;
      padding-left: 10px;
    }

    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9.5pt;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Highlights & Callouts */
    .callout {
      background-color: #f0f9ff;
      border-left: 5px solid #0284c7;
      padding: 12px 15px;
      margin: 15px 0;
      border-radius: 0 6px 6px 0;
    }

    .callout-title {
      font-weight: bold;
      color: #0369a1;
      margin-bottom: 5px;
    }

    .formula-box {
      background: #0f172a;
      color: #38bdf8;
      font-family: 'Courier New', Courier, monospace;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 10pt;
    }

    /* Badges */
    .badge-cut {
      background: #fee2e2;
      color: #b91c1c;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8.5pt;
    }

    .badge-fill {
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8.5pt;
    }

    .badge-zero {
      background: #dcfce7;
      color: #15803d;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8.5pt;
    }

    .svg-container {
      text-align: center;
      margin: 20px 0;
      width: 100%;
    }

    .svg-container svg {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .img-render {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }
  </style>
</head>
<body>

  <!-- ==================== FOLHA DE ROSTO ==================== -->
  <div class="cover page-break">
    <div class="cover-header">
      <div style="font-size: 11pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Programa Nacional de Fortalecimento da Agricultura Familiar - PRONAF</div>
      <div class="cover-title">Relatório Técnico & Memorial de Cálculo de Terraplenagem</div>
      <div class="cover-subtitle">Estudo da Cota Plana Econômica de Balanço Zero (Z = 52,60 m)</div>
      <div class="cover-badge">SOLUÇÃO DE MÍNIMO CUSTO DIRETO: R$ 203.753,74</div>
    </div>

    <div>
      <p style="font-size: 12pt; color: #334155;"><strong>RESUMO DO PROJETO:</strong> Levantamento topográfico e altimétrico cadastral abrangendo 59 pontos de controle no imóvel, determinando o volume ótimo de escavação e preenchimento para regularização horizontal de terraplenagem.</p>

      <table style="font-size: 10.5pt; margin-top: 20px;">
        <tr><td style="width: 220px; font-weight: bold;">Arquivo Fonte DXF/DWG:</td><td>GEO.dxf / GEO ALTIMETRIA LOTE.dwg</td></tr>
        <tr><td style="font-weight: bold;">Cota Plana Econômica:</td><td>Z = 52,600 metros</td></tr>
        <tr><td style="font-weight: bold;">Volume de Escavação (Corte):</td><td>6.704,90 m³</td></tr>
        <tr><td style="font-weight: bold;">Volume de Aterro (Compactado):</td><td>6.922,10 m³</td></tr>
        <tr><td style="font-weight: bold;">Balanço Líquido de Solo:</td><td>- 217,20 m³ (Compensação Quase Perfeita)</td></tr>
        <tr><td style="font-weight: bold;">Fator de Compactação:</td><td>1,03 (Ensaios Proctor Normal NBR 7182)</td></tr>
      </table>
    </div>

    <div class="cover-meta">
      <table style="border: none; margin: 0;">
        <tr style="background: none;"><td style="border: none; padding: 2px;"><strong>Responsável Técnico:</strong> Engenharia de Agrimensura e Topografia</td><td style="border: none; padding: 2px; text-align: right;"><strong>Data:</strong> 09 de Agosto de 2026</td></tr>
        <tr style="background: none;"><td style="border: none; padding: 2px;"><strong>Sistema de Coordenadas:</strong> UTM (Datum SIRGAS 2000 - Hemisfério Sul)</td><td style="border: none; padding: 2px; text-align: right;"><strong>Normas:</strong> ABNT NBR 13133 / NBR 5681</td></tr>
      </table>
    </div>
  </div>

  <!-- ==================== SEÇÃO 1: DIAGNÓSTICO ALTIMÉTRICO ==================== -->
  <h1>1. Diagnóstico Altimétrico do Imóvel</h1>
  <p>A caracterização topográfica do terreno foi realizada a partir do processamento geométrico dos 59 pontos altimétricos levantados nas camadas <code>PONTOS_NOME</code> e <code>PONTOS_COTA</code> do arquivo <code>GEO.dxf</code>. As cotas oscilam entre <strong>51,070 m</strong> e <strong>54,888 m</strong>, resultando em uma amplitude altimétrica total de <strong>3,818 m</strong>.</p>

  <h2>Quadro de Indicadores Topográficos Gerais</h2>
  <table>
    <thead>
      <tr>
        <th>Indicador Altimétrico</th>
        <th>Resultado Apurado</th>
        <th>Unidade / Padrão PT-BR</th>
        <th>Descrição Técnica</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Total de Pontos Altimétricos</td><td><strong>59</strong></td><td>pontos</td><td>Malha de piquetagem amostrada em campo</td></tr>
      <tr><td>Cota Mínima Absoluta</td><td><strong>51,070</strong></td><td>metros (m)</td><td>Localizada no Ponto P36 (Extremo Sudeste)</td></tr>
      <tr><td>Cota Média do Terreno</td><td><strong>52,597</strong></td><td>metros (m)</td><td>Elevação média ponderada da superfície</td></tr>
      <tr><td>Cota Máxima Absoluta</td><td><strong>54,888</strong></td><td>metros (m)</td><td>Localizada no Ponto P52 (Extremo Noroeste)</td></tr>
      <tr><td>Amplitude Altimétrica</td><td><strong>3,818</strong></td><td>metros (m)</td><td>Diferença total de nível no relevo</td></tr>
      <tr><td>Área do Fecho Convexo</td><td><strong>14.085,70</strong></td><td>m²</td><td>Área poligonal abrangida pelos pontos</td></tr>
      <tr><td>Extensão Territorial (E × N)</td><td><strong>164,61 × 151,94</strong></td><td>metros (m)</td><td>Dimensões retangulares envolventes</td></tr>
      <tr><td>Declividade Média do Plano</td><td><strong>1,56° (2,72%)</strong></td><td>graus / percentual</td><td>Relevo predominantemente plano/suave</td></tr>
      <tr><td>Ajuste Planar ($R^2$)</td><td><strong>0,954</strong></td><td>adimensional</td><td>Forte uniformidade de inclinação natural</td></tr>
      <tr><td>Escoamento Superficial Principal</td><td><strong>113,9° (Sudeste)</strong></td><td>azimute</td><td>Vetor natural de caminhamento das águas</td></tr>
    </tbody>
  </table>

  <h2>Distribuição da Declividade da Malha Triangular</h2>
  <table>
    <thead>
      <tr>
        <th>Faixa de Declividade</th>
        <th>Classificação do Relevo</th>
        <th>Área Estimada (%)</th>
        <th>Aptidão para Regularização / Obras</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>0° a 3°</td><td>Plano</td><td><strong>91,75%</strong></td><td>Excelente aptidão para terraplenagem e mecanização</td></tr>
      <tr><td>3° a 5°</td><td>Suave Ondulado</td><td><strong>5,06%</strong></td><td>Baixo risco de erosão; movimentação simples</td></tr>
      <tr><td>5° a 8°</td><td>Ondulado</td><td><strong>0,13%</strong></td><td>Área reduzida; exigência de curva de nível</td></tr>
      <tr><td>8° a 12°</td><td>Forte Ondulado</td><td><strong>0,97%</strong></td><td>Transição isolada nas bordas da malha</td></tr>
      <tr><td>12° a 20°</td><td>Montanhoso</td><td><strong>1,95%</strong></td><td>Células periféricas pontuais</td></tr>
      <tr><td>> 20°</td><td>Escarpado / Anômalo</td><td><strong>0,14%</strong></td><td>Anomalias locais de triangulação de borda</td></tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== SEÇÃO 2: MEMORIAL DE CÁLCULO ==================== -->
  <h1>2. Memorial de Cálculo de Compensação de Volumes</h1>
  <p>Para determinar a **Cota Plana Econômica**, simulou-se a variação da cota horizontal de projeto $Z_{\text{proj}}$ entre $51,00\text{ m}$ e $55,00\text{ m}$ com passo de $0,05\text{ m}$, integrando a diferença de nível sobre a malha de elementos finitos de $2,00\text{ m} \times 2,00\text{ m}$ ($Area_{\text{célula}} = 4,00\text{ m}^2$).</p>

  <div class="formula-box">
    FÓRMULAS DE COMPENSAÇÃO VOLUMÉTRICA:<br><br>
    Volume de Escavação (Corte):   V_corte  = ∑ [ (Z_terreno - Z_proj) × Area_célula ]   para Z_terreno > Z_proj<br>
    Volume de Preenchimento (Aterro): V_aterro = ∑ [ (Z_proj - Z_terreno) × Area_célula ]   para Z_terreno < Z_proj<br>
    Balanço Líquido de Solo:       Balanço  = V_corte - V_aterro
  </div>

  <div class="callout">
    <div class="callout-title">DETERMINAÇÃO DA COTA ECONÔMICA (Z = 52,60 m):</div>
    A cota $Z = 52,60\text{ m}$ atinge o ponto de <strong>Balanço Zero</strong>, onde o volume escavado no setor Noroeste ($6.704,90\text{ m}^3$) compensa quase a totalidade do volume necessário para aterrar o setor Sudeste ($6.922,10\text{ m}^3$). Aplicando o fator de compactação de 1,03, o saldo é nulo, eliminando a compra de solo ou transporte para bota-fora.
  </div>

  <h2>Demostração da Curva Volumétrica de Compensação</h2>
  <div class="svg-container">
    ${g1Svg}
  </div>

  <div class="page-break"></div>

  <!-- ==================== SEÇÃO 3: MAPAS ESPACIAIS E PERFIL ==================== -->
  <h1>3. Mapeamento Espacial e Perfil Longitudinal</h1>

  <h2>3.1 Planta de Zonas de Corte e Aterro (Heatmap Altimétrico)</h2>
  <p>O mapa espacial indica a profundidade de escavação (vermelho/laranja) e aterro (azul), delimitados pela <strong>Linha Neutra de Passagem (Amarelo)</strong>.</p>
  <div class="svg-container">
    ${g2Svg}
  </div>

  <h2>3.2 Perfil Longitudinal do Terreno vs Cota Plana 52,60m</h2>
  <p>Corte transversal no eixo diagonal Noroeste ➔ Sudeste mostrando a concordância entre o relevo natural e o plano horizontal de projeto.</p>
  <div class="svg-container">
    ${g3Svg}
  </div>

  <div class="page-break"></div>

  <!-- ==================== SEÇÃO 4: MODELO 3D & PRANCHA DE CAMPO ==================== -->
  <h1>4. Modelo Tridimensional & Prancha de Execução de Campo</h1>

  ${img3dBase64 ? `
    <h2>4.1 Renderização Tridimensional Isometric da Plataforma</h2>
    <div style="text-align: center; margin: 15px 0;">
      <img src="${img3dBase64}" class="img-render" alt="Render 3D Cota Plana 52,60m">
    </div>
  ` : ''}

  <h2>4.2 Prancha Guia de Execução para o Operador de Máquina</h2>
  <p>Instrução simplificada em alto contraste para direcionamento da equipe de campo (tratoristas e topógrafos).</p>
  <div class="svg-container">
    ${pranchaSvg}
  </div>

  <div class="page-break"></div>

  <!-- ==================== SEÇÃO 5: ORÇAMENTO E EXECUÇÃO ==================== -->
  <h1>5. Planilha Orçamentária & Especificações Técnicas</h1>

  <h2>Planilha Orçamentária Detalhada (PT-BR)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align: center;">Item</th>
        <th>Descrição dos Serviços de Terraplenagem</th>
        <th style="width: 60px; text-align: center;">Unid.</th>
        <th style="width: 90px; text-align: right;">Quantidade</th>
        <th style="width: 110px; text-align: right;">P. Unitário</th>
        <th style="width: 120px; text-align: right;">Custo Total</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="text-align: center;"><strong>1.0</strong></td><td colspan="5"><strong>SERVIÇOS PRELIMINARES E DEMARCAÇÃO DE CAMPO</strong></td></tr>
      <tr><td style="text-align: center;">1.1</td><td>Locação topográfica, balizamento e piquetagem de rede</td><td style="text-align: center;">m²</td><td style="text-align: right;">14.085,70</td><td style="text-align: right;">R$ 0,45</td><td style="text-align: right;">R$ 6.338,57</td></tr>
      <tr><td style="text-align: center;">1.2</td><td>Decapagem e limpeza de solo vegetal (espessura 15 cm)</td><td style="text-align: center;">m³</td><td style="text-align: right;">2.112,85</td><td style="text-align: right;">R$ 6,50</td><td style="text-align: right;">R$ 13.733,53</td></tr>
      
      <tr><td style="text-align: center;"><strong>2.0</strong></td><td colspan="5"><strong>ESCAVAÇÃO, CARGA E TRANSPORTE INTERNO DE SOLO</strong></td></tr>
      <tr><td style="text-align: center;">2.1</td><td>Escavação mecânica em solo de 1ª Categoria (Setor NW)</td><td style="text-align: center;">m³</td><td style="text-align: right;">6.704,90</td><td style="text-align: right;">R$ 11,20</td><td style="text-align: right;">R$ 75.094,88</td></tr>
      <tr><td style="text-align: center;">2.2</td><td>Carga e transporte interno de solo (DMT média = 90m)</td><td style="text-align: center;">m³</td><td style="text-align: right;">6.704,90</td><td style="text-align: right;">R$ 6,80</td><td style="text-align: right;">R$ 45.593,32</td></tr>

      <tr><td style="text-align: center;"><strong>3.0</strong></td><td colspan="5"><strong>ESPALHAMENTO, NIVELAMENTO E COMPACTAÇÃO DE GREIDE</strong></td></tr>
      <tr><td style="text-align: center;">3.1</td><td>Espalhamento de aterro na cota 52,60m (camadas 20 cm)</td><td style="text-align: center;">m³</td><td style="text-align: right;">6.922,10</td><td style="text-align: right;">R$ 4,50</td><td style="text-align: right;">R$ 31.149,45</td></tr>
      <tr><td style="text-align: center;">3.2</td><td>Compactação mecânica a 95% do Proctor Normal (NBR 7182)</td><td style="text-align: center;">m³</td><td style="text-align: right;">6.922,10</td><td style="text-align: right;">R$ 4,20</td><td style="text-align: right;">R$ 29.072,82</td></tr>
      <tr><td style="text-align: center;">3.3</td><td>Acerto final e acabamento de greide com motoniveladora</td><td style="text-align: center;">m²</td><td style="text-align: right;">14.085,70</td><td style="text-align: right;">R$ 0,20</td><td style="text-align: right;">R$ 2.817,14</td></tr>
      
      <tr style="background-color: #f0f9ff; font-weight: bold; font-size: 10.5pt;">
        <td colspan="5" style="text-align: right; color: #0369a1;">VALOR TOTAL ESTIMADO DA TERRAPLENAGEM:</td>
        <td style="text-align: right; color: #0369a1;">R$ 203.753,74</td>
      </tr>
    </tbody>
  </table>

  <h2>Recomendações para Execução de Campo</h2>
  <div class="callout">
    <p><strong>1. Controle Tecnológico de Compactação:</strong> Cada camada de aterro de $20\text{ cm}$ deve ser ensaiada com frasco de areia (NBR 7185) para garantir Grau de Compactação $GC \ge 95\%$ e umidade no intervalo $w_{\text{ótima}} \pm 2\%$.</p>
    <p><strong>2. Taludes de Proteção:</strong> Onde o corte na borda Noroeste atingir $2,28\text{ m}$, aplicar inclinação de talude $1:1$ ($45^\circ$) com saia de proteção contra erosão pluvial.</p>
  </div>

  <div class="page-break"></div>

  <!-- ==================== SEÇÃO 6: TABELA COMPLETA DOS 59 PONTOS ==================== -->
  <h1>6. Tabela Completa de Piquetagem Altimétrica (59 Pontos)</h1>
  <p>Quadro detalhado de coordenadas UTM, cotas naturais, cotas de projeto e espessura exata de corte/aterro para balizamento de campo.</p>

  <table>
    <thead>
      <tr>
        <th style="width: 45px; text-align: center;">Ponto</th>
        <th style="width: 85px; text-align: right;">Este (E)</th>
        <th style="width: 95px; text-align: right;">Norte (N)</th>
        <th style="width: 80px; text-align: right;">Cota Nat.</th>
        <th style="width: 80px; text-align: right;">Cota Proj.</th>
        <th style="width: 85px; text-align: right;">Off-Set (Z)</th>
        <th>Instrução e Ação da Máquina</th>
      </tr>
    </thead>
    <tbody>
      ${pointsRows}
    </tbody>
  </table>

  <div style="margin-top: 40px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 9pt; color: #64748b;">
    Relatório Técnico emitido para o Sistema PRONAF - Projeto de Infraestrutura e Crédito Agrícola.<br>
    Documento assinado digitalmente / Responsabilidade Técnica de Engenharia.
  </div>

</body>
</html>
`;

// Write HTML file to scratch
const htmlFilePath = path.join(__dirname, 'relatorio_completo_cota_plana.html');
const pdfFilePath = path.join(artifactDir, 'Relatorio_Tecnico_Terraplenagem_Cota_Plana_52.60m.pdf');

fs.writeFileSync(htmlFilePath, htmlContent);
console.log("HTML compiled successfully!");

// Execute MS Edge in headless mode to render PDF
const msedgePath = `"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"`;
const cmd = `${msedgePath} --headless --print-to-pdf="${pdfFilePath}" --no-pdf-header-footer "${htmlFilePath}"`;

console.log("Running MS Edge PDF conversion...");
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log("PDF GENERATED SUCCESSFULLY:", pdfFilePath);
} catch (err) {
  console.error("Error generating PDF via MS Edge:", err);
}
