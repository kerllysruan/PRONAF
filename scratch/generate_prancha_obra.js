import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = "C:\\Users\\Windows Lite BR\\.gemini\\antigravity\\brain\\aae53569-28aa-4134-88fb-99690b63f529";

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'earthwork_results.json'), 'utf-8'));
const bestZ = 52.60;

// Sort points by point number for operator clarity
const points = data.points.map(pt => {
  const diff = pt.z - bestZ;
  const diffCm = Math.round(diff * 100);
  const action = diffCm > 0 ? 'CORTE' : (diffCm < 0 ? 'ATERRO' : 'COTA');
  return { ...pt, diff, diffCm, action };
});

function generatePranchaObraSVG() {
  const width = 1200;
  const height = 850;
  const margin = { top: 90, right: 320, bottom: 80, left: 90 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const stats = data.stats;

  const mapX = (e) => margin.left + ((e - stats.minE) / (stats.maxE - stats.minE)) * w;
  const mapY = (n) => margin.top + h - ((n - stats.minN) / (stats.maxN - stats.minN)) * h;

  // Background zones (grid cells)
  const cellWidth = ((2.0) / (stats.maxE - stats.minE)) * w;
  const cellHeight = ((2.0) / (stats.maxN - stats.minN)) * h;

  const cellsSVG = data.grid.map(c => {
    const x = mapX(c.e) - cellWidth/2;
    const y = mapY(c.n) - cellHeight/2;
    const d = c.z - bestZ;

    let color = "#1e293b";
    if (d > 0.8) color = "#dc2626";       // Corte Forte (Vermelho)
    else if (d > 0.15) color = "#ea580c";  // Corte Médio (Laranja)
    else if (d >= -0.15) color = "#16a34a"; // Cota Zero (Verde Estabilizado)
    else if (d >= -0.8) color = "#0284c7"; // Aterro Médio (Azul Claro)
    else color = "#1d4ed8";               // Aterro Forte (Azul Escuro)

    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellWidth+1.2).toFixed(1)}" height="${(cellHeight+1.2).toFixed(1)}" fill="${color}" opacity="0.45" />`;
  }).join('\n');

  // Point Markers for Operator (Big readable numbers & labels)
  const pointsSVG = points.map(pt => {
    const px = mapX(pt.e);
    const py = mapY(pt.n);

    const isCut = pt.diffCm > 0;
    const isZero = Math.abs(pt.diffCm) <= 5;
    const badgeColor = isZero ? "#16a34a" : (isCut ? "#ef4444" : "#3b82f6");
    const signStr = isCut ? `-${pt.diffCm} cm` : (isZero ? "COTA 0" : `+${Math.abs(pt.diffCm)} cm`);

    return `
      <!-- Ground Stake Point -->
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${badgeColor}" stroke="#ffffff" stroke-width="2" />
      
      <!-- Label Box for Machine Operator -->
      <g transform="translate(${px.toFixed(1)}, ${(py - 12).toFixed(1)})">
        <rect x="-35" y="-20" width="70" height="20" rx="4" fill="#0f172a" stroke="${badgeColor}" stroke-width="1.8" opacity="0.92" />
        <text x="0" y="-6" text-anchor="middle" font-size="11px" font-weight="bold" fill="${badgeColor}">P${pt.p}: ${signStr}</text>
      </g>
    `;
  }).join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #090d16; font-family: 'Segoe UI', Arial, sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 24px; font-weight: bold; }
    .subtitle { fill: #38bdf8; font-size: 15px; font-weight: 600; }
    .header-box { fill: #1e293b; stroke: #334155; stroke-width: 1.5; }
    .legend-title { fill: #f8fafc; font-size: 14px; font-weight: bold; }
    .legend-text { fill: #cbd5e1; font-size: 12px; }
    .op-step { fill: #f8fafc; font-size: 12px; }
  </style>

  <!-- Cabeçalho Principal da Prancha de Obra -->
  <rect x="20" y="15" width="${width - 40}" height="60" rx="8" class="header-box" />
  <text x="35" y="42" class="title">PRANCHA DE EXECUÇÃO DE CAMPO - TERRAPLENAGEM (OBRA)</text>
  <text x="35" y="62" class="subtitle">GUIA RÁPIDO DO OPERADOR | PLATAFORMA PLANA ECONÔMICA (COTA DE PROJETO: Z = 52,60 m)</text>
  
  <rect x="${width - 240}" y="25" width="210" height="40" rx="6" fill="#065f46" stroke="#34d399" stroke-width="2" />
  <text x="${width - 135}" y="50" text-anchor="middle" fill="#34d399" font-size="14px" font-weight="bold">BALANÇO ZERO (6.705 m³)</text>

  <!-- Zonas Altimétricas de Fundo -->
  <g>${cellsSVG}</g>

  <!-- Seta de Movimentação Principal do Solo -->
  <g transform="translate(${margin.left + 80}, ${margin.top + 80})">
    <path d="M 0 0 L 160 140" stroke="#facc15" stroke-width="6" stroke-dasharray="10,6" />
    <polygon points="160,140 140,130 145,150" fill="#facc15" />
    <rect x="20" y="40" width="170" height="30" rx="4" fill="#0f172a" stroke="#facc15" stroke-width="1.5" />
    <text x="105" y="60" text-anchor="middle" fill="#facc15" font-size="11px" font-weight="bold">FLUXO DE TRANSPORTE DO SOLO ➔</text>
  </g>

  <!-- Marcadores de Piquetes para Operador -->
  <g>${pointsSVG}</g>

  <!-- Moldura e Eixos -->
  <rect x="${margin.left}" y="${margin.top}" width="${w}" height="${h}" fill="none" stroke="#475569" stroke-width="2" />

  <!-- PAINEL LATERAL DO OPERADOR (DIREITA) -->
  <g transform="translate(${width - 300}, ${margin.top})">
    <rect x="0" y="0" width="280" height="${h}" rx="10" fill="#1e293b" stroke="#334155" stroke-width="2" />

    <!-- Título do Painel -->
    <text x="140" y="30" text-anchor="middle" class="legend-title" fill="#f8fafc" font-size="15px">📋 INSTRUÇÕES DO OPERADOR</text>
    <line x1="15" y1="42" x2="265" y2="42" stroke="#334155" stroke-width="1.5" />

    <!-- Código de Cores Simplificado -->
    <text x="15" y="65" class="legend-title" fill="#38bdf8">1. CÓDIGO DE CORES DA BALIZA</text>
    
    <rect x="15" y="78" width="24" height="20" fill="#ef4444" rx="4" />
    <text x="48" y="93" class="legend-text" font-weight="bold" fill="#ef4444">VERMELHO: CORTE (ESCAVAR)</text>

    <rect x="15" y="108" width="24" height="20" fill="#3b82f6" rx="4" />
    <text x="48" y="123" class="legend-text" font-weight="bold" fill="#60a5fa">AZUL: ATERRO (ENCHER)</text>

    <rect x="15" y="138" width="24" height="20" fill="#16a34a" rx="4" />
    <text x="48" y="153" class="legend-text" font-weight="bold" fill="#4ade80">VERDE: COTA ZERO (FINALIZADO)</text>

    <line x1="15" y1="175" x2="265" y2="175" stroke="#334155" stroke-width="1.5" />

    <!-- Sequência de Ataque na Obra -->
    <text x="15" y="198" class="legend-title" fill="#f8fafc">2. PASSO A PASSO NA MAQUINA</text>

    <g transform="translate(15, 215)">
      <circle cx="10" cy="10" r="10" fill="#ef4444" />
      <text x="10" y="14" text-anchor="middle" fill="#fff" font-size="11px" font-weight="bold">1</text>
      <text x="28" y="14" class="op-step" font-weight="bold">Raspar Setor NW (P51/P52)</text>
      <text x="28" y="28" font-size="10px" fill="#cbd5e1">Corte máximo: -2,28m de solo</text>
    </g>

    <g transform="translate(15, 260)">
      <circle cx="10" cy="10" r="10" fill="#f97316" />
      <text x="10" y="14" text-anchor="middle" fill="#fff" font-size="11px" font-weight="bold">2</text>
      <text x="28" y="14" class="op-step" font-weight="bold">Empurrar solo para o Centro</text>
      <text x="28" y="28" font-size="10px" fill="#cbd5e1">Trajeto médio: 90 metros</text>
    </g>

    <g transform="translate(15, 305)">
      <circle cx="10" cy="10" r="10" fill="#3b82f6" />
      <text x="10" y="14" text-anchor="middle" fill="#fff" font-size="11px" font-weight="bold">3</text>
      <text x="28" y="14" class="op-step" font-weight="bold">Preencher Setor SE (P29/P36)</text>
      <text x="28" y="28" font-size="10px" fill="#cbd5e1">Camadas de no máx. 20 cm</text>
    </g>

    <g transform="translate(15, 350)">
      <circle cx="10" cy="10" r="10" fill="#16a34a" />
      <text x="10" y="14" text-anchor="middle" fill="#fff" font-size="11px" font-weight="bold">4</text>
      <text x="28" y="14" class="op-step" font-weight="bold">Nivelar Greide (Patrol)</text>
      <text x="28" y="28" font-size="10px" fill="#cbd5e1">Conferir na cota 52,60m exata</text>
    </g>

    <line x1="15" y1="395" x2="265" y2="395" stroke="#334155" stroke-width="1.5" />

    <!-- Tabela Rápida dos Principais Piquetes -->
    <text x="15" y="418" class="legend-title" fill="#facc15">3. PONTOS CHAVE DE CAMPO</text>
    <text x="15" y="438" font-size="11px" fill="#cbd5e1">• P52 (NW): Escavar <tspan font-weight="bold" fill="#ef4444">228 cm</tspan></text>
    <text x="15" y="455" font-size="11px" fill="#cbd5e1">• P51 (NW): Escavar <tspan font-weight="bold" fill="#ef4444">228 cm</tspan></text>
    <text x="15" y="472" font-size="11px" fill="#cbd5e1">• P10 (Centro): Escavar <tspan font-weight="bold" fill="#f97316">37 cm</tspan></text>
    <text x="15" y="489" font-size="11px" fill="#cbd5e1">• P15 (Linha 0): Cota Ok <tspan font-weight="bold" fill="#4ade80">0 cm</tspan></text>
    <text x="15" y="506" font-size="11px" fill="#cbd5e1">• P29 (SE): Aterrar <tspan font-weight="bold" fill="#60a5fa">144 cm</tspan></text>
    <text x="15" y="523" font-size="11px" fill="#cbd5e1">• P36 (SE): Aterrar <tspan font-weight="bold" fill="#60a5fa">153 cm</tspan></text>

    <!-- Alerta de Segurança / Qualidade -->
    <rect x="15" y="545" width="250" height="48" rx="6" fill="#0f172a" stroke="#eab308" stroke-width="1.5" />
    <text x="140" y="565" text-anchor="middle" font-size="11px" fill="#eab308" font-weight="bold">⚠️ RECOMENDAÇÃO DE CAMPO</text>
    <text x="140" y="582" text-anchor="middle" font-size="10px" fill="#cbd5e1">Compactar a cada 20cm de aterro!</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'prancha_execucao_obra.svg'), svg);
  console.log("Gerado prancha_execucao_obra.svg");
}

generatePranchaObraSVG();
