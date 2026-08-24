import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = "C:\\Users\\Windows Lite BR\\.gemini\\antigravity\\brain\\aae53569-28aa-4134-88fb-99690b63f529";

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'earthwork_results.json'), 'utf-8'));
const bestZ = 52.60;

// 1. CURVA DE COMPENSAÇÃO DE VOLUMES E BALANÇO ZERO (PT-BR)
function generateCurvaCompensacaoPTBR() {
  const width = 850;
  const height = 520;
  const margin = { top: 70, right: 60, bottom: 70, left: 90 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const curve = data.cotaCurve;
  const minZ = 51.0;
  const maxZ = 55.0;
  const maxVol = 25000;

  const mapX = (z) => margin.left + ((z - minZ) / (maxZ - minZ)) * w;
  const mapY = (vol) => margin.top + h - (vol / maxVol) * h;

  let pathCut = "";
  let pathFill = "";
  let pathBalance = "";

  curve.forEach((pt, i) => {
    const x = mapX(pt.zProj);
    const yCut = mapY(pt.vCut);
    const yFill = mapY(pt.vFill);
    const yBal = mapY(Math.abs(pt.balance));

    if (i === 0) {
      pathCut += `M ${x} ${yCut}`;
      pathFill += `M ${x} ${yFill}`;
      pathBalance += `M ${x} ${yBal}`;
    } else {
      pathCut += ` L ${x} ${yCut}`;
      pathFill += ` L ${x} ${yFill}`;
      pathBalance += ` L ${x} ${yBal}`;
    }
  });

  const bestX = mapX(bestZ);
  const bestY = mapY(6704.9);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 21px; font-weight: bold; }
    .subtitle { fill: #38bdf8; font-size: 14px; font-weight: 600; }
    .axis-label { fill: #cbd5e1; font-size: 12px; }
    .grid-line { stroke: #334155; stroke-dasharray: 4,4; stroke-width: 1; }
    .legend-text { fill: #f8fafc; font-size: 13px; font-weight: 500; }
  </style>

  <!-- Cabeçalho -->
  <text x="${width/2}" y="32" text-anchor="middle" class="title">GRÁFICO 1: CURVA DE COMPENSAÇÃO DE VOLUMES E COTA PLANA ECONÔMICA</text>
  <text x="${width/2}" y="52" text-anchor="middle" class="subtitle">Determinação do Ponto de Balanço Zero (Cota Plana Z = ${bestZ.toFixed(2)} m)</text>

  <!-- Linhas de Grade e Eixo Y -->
  ${[0, 5000, 10000, 15000, 20000, 25000].map(vol => {
    const y = mapY(vol);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid-line" />
      <text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" class="axis-label">${vol.toLocaleString('pt-BR')} m³</text>
    `;
  }).join('')}

  <!-- Eixo X -->
  ${[51.0, 51.5, 52.0, 52.60, 53.0, 53.5, 54.0, 54.5, 55.0].map(z => {
    const x = mapX(z);
    return `
      <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 6}" stroke="#64748b" stroke-width="1.5" />
      <text x="${x}" y="${height - margin.bottom + 22}" text-anchor="middle" class="axis-label" font-weight="${z === 52.60 ? 'bold' : 'normal'}" fill="${z === 52.60 ? '#34d399' : '#cbd5e1'}">${z.toFixed(2)}m</text>
    `;
  }).join('')}

  <!-- Títulos dos Eixos -->
  <text x="${margin.left + w/2}" y="${height - 20}" text-anchor="middle" class="axis-label" font-weight="bold">Cota Plana de Projeto (Metros)</text>
  <text x="25" y="${margin.top + h/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 25 ${margin.top + h/2})">Volume de Solo (Metros Cúbicos - m³)</text>

  <!-- Curvas principais -->
  <path d="${pathCut}" fill="none" stroke="#ef4444" stroke-width="3.5" />
  <path d="${pathFill}" fill="none" stroke="#3b82f6" stroke-width="3.5" />
  <path d="${pathBalance}" fill="none" stroke="#eab308" stroke-width="2.5" stroke-dasharray="6,4" />

  <!-- Destaque do Ponto Econômico Z = 52,60m -->
  <line x1="${bestX}" y1="${margin.top}" x2="${bestX}" y2="${height - margin.bottom}" stroke="#10b981" stroke-width="2" stroke-dasharray="5,5" />
  <circle cx="${bestX}" cy="${bestY}" r="7.5" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />

  <!-- Caixa de Informação da Cota Econômica -->
  <g transform="translate(${bestX + 15}, ${bestY - 55})">
    <rect x="0" y="0" width="220" height="65" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2" />
    <text x="12" y="22" fill="#34d399" font-size="13px" font-weight="bold">COTA PLANA ECONÔMICA</text>
    <text x="12" y="40" fill="#f8fafc" font-size="12px">Cota Otimizada: Z = 52,60 m</text>
    <text x="12" y="55" fill="#cbd5e1" font-size="11px">Volume Corte: 6.705m³ | Aterro: 6.922m³</text>
  </g>

  <!-- Legenda em Português -->
  <g transform="translate(${margin.left + 20}, ${margin.top + 15})">
    <rect x="0" y="0" width="460" height="36" rx="6" fill="#1e293b" opacity="0.95" stroke="#334155" />
    
    <line x1="15" y1="18" x2="35" y2="18" stroke="#ef4444" stroke-width="3.5" />
    <text x="42" y="22" class="legend-text">Volume de Corte (Escavação)</text>

    <line x1="210" y1="18" x2="230" y2="18" stroke="#3b82f6" stroke-width="3.5" />
    <text x="237" y="22" class="legend-text">Volume de Aterro (Preenchimento)</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'grafico1_curva_cota_plana_ptbr.svg'), svg);
  console.log("Gerado grafico1_curva_cota_plana_ptbr.svg");
}

// 2. MAPA ESPACIAL DE CORTE E ATERRO PARA COTA PLANA 52,60M (PT-BR)
function generateMapaCortaAterroPlanaPTBR() {
  const width = 850;
  const height = 650;
  const margin = { top: 70, right: 160, bottom: 60, left: 85 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const grid = data.grid;
  const stats = data.stats;

  const mapX = (e) => margin.left + ((e - stats.minE) / (stats.maxE - stats.minE)) * w;
  const mapY = (n) => margin.top + h - ((n - stats.minN) / (stats.maxN - stats.minN)) * h;

  const cellWidth = ((2.0) / (stats.maxE - stats.minE)) * w;
  const cellHeight = ((2.0) / (stats.maxN - stats.minN)) * h;

  const cellsSVG = grid.map(c => {
    const x = mapX(c.e) - cellWidth/2;
    const y = mapY(c.n) - cellHeight/2;
    const d = c.z - bestZ; // diff relative to Z = 52.60m

    let color = "#1e293b";
    if (d > 1.5) color = "#b91c1c";        // Corte Muito Forte (>1.5m)
    else if (d > 0.8) color = "#ef4444";   // Corte Forte (0.8m a 1.5m)
    else if (d > 0.2) color = "#f97316";   // Corte Leve/Médio (0.2m a 0.8m)
    else if (d >= -0.2) color = "#fef08a"; // Linha Neutra (-0.2m a +0.2m)
    else if (d >= -0.8) color = "#38bdf8"; // Aterro Leve (-0.2m a -0.8m)
    else if (d >= -1.5) color = "#2563eb"; // Aterro Médio (-0.8m a -1.5m)
    else color = "#1e40af";                // Aterro Forte (<-1.5m)

    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellWidth+0.8).toFixed(1)}" height="${(cellHeight+0.8).toFixed(1)}" fill="${color}" opacity="0.88" />`;
  }).join('\n');

  const pointsSVG = data.points.map(pt => {
    const px = mapX(pt.e);
    const py = mapY(pt.n);
    return `
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.5" fill="#ffffff" stroke="#000" stroke-width="0.5" />
      <text x="${(px + 4).toFixed(1)}" y="${(py + 3).toFixed(1)}" font-size="8px" fill="#f8fafc" font-weight="bold">${pt.p}</text>
    `;
  }).join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 20px; font-weight: bold; }
    .subtitle { fill: #38bdf8; font-size: 14px; font-weight: 600; }
    .axis-label { fill: #cbd5e1; font-size: 11px; }
    .legend-title { fill: #f8fafc; font-size: 12px; font-weight: bold; }
    .legend-text { fill: #cbd5e1; font-size: 11px; }
  </style>

  <!-- Cabeçalho -->
  <text x="${width/2}" y="32" text-anchor="middle" class="title">GRÁFICO 2: MAPA ESPACIAL DE CORTE E ATERRO - COTA PLANA 52,60 M</text>
  <text x="${width/2}" y="52" text-anchor="middle" class="subtitle">Distribuição Espacial das Profundidades de Escavação e Preenchimento no Terreno</text>

  <!-- Malha de Células de Corte/Aterro -->
  <g>${cellsSVG}</g>

  <!-- Pontos Altimétricos -->
  <g>${pointsSVG}</g>

  <!-- Moldura dos Eixos -->
  <rect x="${margin.left}" y="${margin.top}" width="${w}" height="${h}" fill="none" stroke="#475569" stroke-width="1.5" />

  <!-- Títulos dos Eixos -->
  <text x="${margin.left + w/2}" y="${height - 18}" text-anchor="middle" class="axis-label" font-weight="bold">Coordenada Este - UTM (Metros)</text>
  <text x="25" y="${margin.top + h/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 25 ${margin.top + h/2})">Coordenada Norte - UTM (Metros)</text>

  <!-- Legenda em Português -->
  <g transform="translate(${width - 150}, ${margin.top})">
    <rect x="0" y="0" width="140" height="310" rx="8" fill="#1e293b" stroke="#334155" />
    <text x="70" y="22" text-anchor="middle" class="legend-title">LEGENDA DE ESPESSURA</text>

    <!-- Corte -->
    <rect x="12" y="40" width="22" height="15" fill="#b91c1c" rx="2" />
    <text x="42" y="52" class="legend-text">Corte &gt; 1,50m</text>

    <rect x="12" y="65" width="22" height="15" fill="#ef4444" rx="2" />
    <text x="42" y="77" class="legend-text">Corte 0,8m a 1,5m</text>

    <rect x="12" y="90" width="22" height="15" fill="#f97316" rx="2" />
    <text x="42" y="102" class="legend-text">Corte 0,2m a 0,8m</text>

    <!-- Zero -->
    <rect x="12" y="120" width="22" height="15" fill="#fef08a" rx="2" />
    <text x="42" y="132" class="legend-text" font-weight="bold">Linha Neutra (0m)</text>

    <!-- Aterro -->
    <rect x="12" y="150" width="22" height="15" fill="#38bdf8" rx="2" />
    <text x="42" y="162" class="legend-text">Aterro 0,2m a 0,8m</text>

    <rect x="12" y="175" width="22" height="15" fill="#2563eb" rx="2" />
    <text x="42" y="187" class="legend-text">Aterro 0,8m a 1,5m</text>

    <rect x="12" y="200" width="22" height="15" fill="#1e40af" rx="2" />
    <text x="42" y="212" class="legend-text">Aterro &gt; 1,50m</text>

    <!-- Ponto -->
    <circle cx="23" cy="245" r="4" fill="#ffffff" stroke="#000" stroke-width="1" />
    <text x="42" y="249" class="legend-text">Ponto Altimétrico</text>

    <line x1="10" y1="265" x2="130" y2="265" stroke="#334155" />
    <text x="70" y="282" text-anchor="middle" font-size="10px" fill="#34d399" font-weight="bold">Plataforma Z = 52,60m</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'grafico2_mapa_corta_aterro_plana_ptbr.svg'), svg);
  console.log("Gerado grafico2_mapa_corta_aterro_plana_ptbr.svg");
}

// 3. PERFIL LONGITUDINAL COTA PLANA 52,60M (PT-BR)
function generatePerfilLongitudinalPlanaPTBR() {
  const width = 850;
  const height = 480;
  const margin = { top: 70, right: 60, bottom: 75, left: 80 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const pStart = data.points.find(p => p.p === 52); // NW
  const pEnd = data.points.find(p => p.p === 29);   // SE

  const diagPoints = data.grid.map(c => {
    const dx = pEnd.e - pStart.e;
    const dy = pEnd.n - pStart.n;
    const len = Math.sqrt(dx*dx + dy*dy);
    const uX = dx / len;
    const uY = dy / len;

    const dist = (c.e - pStart.e) * uX + (c.n - pStart.n) * uY;
    const perpD = Math.abs((c.e - pStart.e) * (-uY) + (c.n - pStart.n) * uX);

    return { ...c, dist, perpD };
  }).filter(c => c.perpD < 8.0).sort((a, b) => a.dist - b.dist);

  const maxDist = Math.max(...diagPoints.map(d => d.dist));
  const minZ = 50.5;
  const maxZ = 55.5;

  const mapX = (d) => margin.left + (d / maxDist) * w;
  const mapY = (z) => margin.top + h - ((z - minZ) / (maxZ - minZ)) * h;

  let pathNat = "";
  let pathHoriz = "";

  diagPoints.forEach((pt, i) => {
    const x = mapX(pt.dist);
    const yNat = mapY(pt.z);
    const yHoriz = mapY(bestZ);

    if (i === 0) {
      pathNat += `M ${x} ${yNat}`;
      pathHoriz += `M ${x} ${yHoriz}`;
    } else {
      pathNat += ` L ${x} ${yNat}`;
      pathHoriz += ` L ${x} ${yHoriz}`;
    }
  });

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', Arial, sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 20px; font-weight: bold; }
    .subtitle { fill: #38bdf8; font-size: 14px; font-weight: 600; }
    .axis-label { fill: #cbd5e1; font-size: 11px; }
    .grid-line { stroke: #334155; stroke-dasharray: 4,4; stroke-width: 1; }
    .legend-text { fill: #f8fafc; font-size: 12px; font-weight: 500; }
  </style>

  <!-- Cabeçalho -->
  <text x="${width/2}" y="32" text-anchor="middle" class="title">GRÁFICO 3: PERFIL LONGITUDINAL DO TERRENO VS COTA PLANA ECONÔMICA</text>
  <text x="${width/2}" y="52" text-anchor="middle" class="subtitle">Corte Transversal no Eixo de Maior Declividade (Noroeste ➔ Sudeste)</text>

  <!-- Eixo Y e Grade -->
  ${[51.0, 52.0, 52.60, 53.0, 54.0, 55.0].map(z => {
    const y = mapY(z);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid-line" />
      <text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" class="axis-label" font-weight="${z === 52.60 ? 'bold' : 'normal'}" fill="${z === 52.60 ? '#34d399' : '#cbd5e1'}">${z.toFixed(2)} m</text>
    `;
  }).join('')}

  <!-- Eixo X -->
  ${[0, 40, 80, 120, 160, 200].map(d => {
    if (d > maxDist) return '';
    const x = mapX(d);
    return `
      <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 6}" stroke="#64748b" />
      <text x="${x}" y="${height - margin.bottom + 22}" text-anchor="middle" class="axis-label">${d} m</text>
    `;
  }).join('')}

  <!-- Títulos dos Eixos -->
  <text x="${margin.left + w/2}" y="${height - 20}" text-anchor="middle" class="axis-label" font-weight="bold">Distância Acumulada no Perfil (Metros)</text>
  <text x="25" y="${margin.top + h/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 25 ${margin.top + h/2})">Elevação Altimétrica / Cota (m)</text>

  <!-- Linha de Cota Plana Horizontal Z = 52.60m -->
  <line x1="${margin.left}" y1="${mapY(bestZ)}" x2="${width - margin.right}" y2="${mapY(bestZ)}" stroke="#10b981" stroke-width="3.5" />

  <!-- Perfil do Terreno Natural -->
  <path d="${pathNat}" fill="none" stroke="#38bdf8" stroke-width="3.5" />

  <!-- Destaques de Zonas de Corte e Aterro -->
  <text x="${mapX(30)}" y="${mapY(53.8)}" fill="#ef4444" font-size="13px" font-weight="bold">ZONA DE CORTE (ESCAVAÇÃO)</text>
  <text x="${mapX(140)}" y="${mapY(52.1)}" fill="#60a5fa" font-size="13px" font-weight="bold">ZONA DE ATERRO (PREENCHIMENTO)</text>

  <!-- Legenda em Português -->
  <g transform="translate(${margin.left + 20}, ${margin.top + 15})">
    <rect x="0" y="0" width="460" height="35" rx="6" fill="#1e293b" opacity="0.95" stroke="#334155" />
    
    <line x1="15" y1="18" x2="35" y2="18" stroke="#38bdf8" stroke-width="3.5" />
    <text x="42" y="22" class="legend-text">Perfil do Terreno Natural</text>

    <line x1="210" y1="18" x2="230" y2="18" stroke="#10b981" stroke-width="3.5" />
    <text x="237" y="22" class="legend-text" font-weight="bold">Plataforma Plana Econômica (Z = 52,60m)</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'grafico3_perfil_longitudinal_plana_ptbr.svg'), svg);
  console.log("Gerado grafico3_perfil_longitudinal_plana_ptbr.svg");
}

generateCurvaCompensacaoPTBR();
generateMapaCortaAterroPlanaPTBR();
generatePerfilLongitudinalPlanaPTBR();
