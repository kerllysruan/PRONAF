import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = "C:\\Users\\Windows Lite BR\\.gemini\\antigravity\\brain\\aae53569-28aa-4134-88fb-99690b63f529";

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'earthwork_results.json'), 'utf-8'));

// -------------------------------------------------------------
// CHART 1: Curva de Compensação de Volumes (Corte x Aterro x Saldo)
// -------------------------------------------------------------
function generateVolumeCurveSVG() {
  const width = 800;
  const height = 500;
  const margin = { top: 60, right: 60, bottom: 60, left: 80 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const curve = data.cotaCurve;
  const minZ = 51.0;
  const maxZ = 55.0;
  const maxVol = Math.max(...curve.map(c => Math.max(c.vCut, c.vFill)));

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

  const bestZ = data.bestHorizontal.zProj;
  const bestX = mapX(bestZ);
  const bestY = mapY(data.bestHorizontal.vCut);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 20px; font-weight: bold; }
    .subtitle { fill: #94a3b8; font-size: 13px; }
    .axis-label { fill: #cbd5e1; font-size: 12px; }
    .grid-line { stroke: #334155; stroke-dasharray: 4,4; stroke-width: 1; }
    .legend-text { fill: #e2e8f0; font-size: 13px; }
  </style>

  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" class="title">GRÁFICO 1: CURVA DE COMPENSAÇÃO DE VOLUMES (CORTE x ATERRO)</text>
  <text x="${width/2}" y="48" text-anchor="middle" class="subtitle">Identificação da Cota Plana de Balanço Zero (Z = ${bestZ.toFixed(2)} m)</text>

  <!-- Grid lines & Y Axis -->
  ${[0, 5000, 10000, 15000, 20000, 25000].map(vol => {
    const y = mapY(vol);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid-line" />
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="axis-label">${vol.toLocaleString()} m³</text>
    `;
  }).join('')}

  <!-- X Axis labels -->
  ${[51.0, 51.5, 52.0, 52.55, 53.0, 53.5, 54.0, 54.5, 55.0].map(z => {
    const x = mapX(z);
    return `
      <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 6}" stroke="#64748b" stroke-width="1" />
      <text x="${x}" y="${height - margin.bottom + 22}" text-anchor="middle" class="axis-label">${z.toFixed(2)}m</text>
    `;
  }).join('')}

  <!-- X Axis Title -->
  <text x="${width/2}" y="${height - 15}" text-anchor="middle" class="axis-label" font-weight="bold">Cota de Projeto (m)</text>
  
  <!-- Y Axis Title -->
  <text x="20" y="${height/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 20 ${height/2})">Volume (m³)</text>

  <!-- Lines -->
  <path d="${pathCut}" fill="none" stroke="#ef4444" stroke-width="3.5" />
  <path d="${pathFill}" fill="none" stroke="#3b82f6" stroke-width="3.5" />
  <path d="${pathBalance}" fill="none" stroke="#eab308" stroke-width="2.5" stroke-dasharray="6,4" />

  <!-- Intersection Highlight -->
  <line x1="${bestX}" y1="${margin.top}" x2="${bestX}" y2="${height - margin.bottom}" stroke="#10b981" stroke-width="2" stroke-dasharray="4,4" />
  <circle cx="${bestX}" cy="${bestY}" r="7" fill="#10b981" stroke="#ffffff" stroke-width="2" />
  
  <!-- Highlight Box -->
  <rect x="${bestX + 15}" y="${bestY - 45}" width="190" height="50" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="1.5" />
  <text x="${bestX + 25}" y="${bestY - 26}" fill="#10b981" font-size="12px" font-weight="bold">Cota Plana Econômica</text>
  <text x="${bestX + 25}" y="${bestY - 10}" fill="#f8fafc" font-size="11px">Z = ${bestZ.toFixed(2)} m (V ≈ 6.700 m³)</text>

  <!-- Legend -->
  <g transform="translate(${margin.left + 20}, ${margin.top + 20})">
    <rect x="0" y="0" width="340" height="35" rx="6" fill="#1e293b" opacity="0.9" stroke="#334155" />
    <line x1="15" y1="17" x2="35" y2="17" stroke="#ef4444" stroke-width="3.5" />
    <text x="42" y="21" class="legend-text">Vol. Corte (Escavação)</text>

    <line x1="190" y1="17" x2="210" y2="17" stroke="#3b82f6" stroke-width="3.5" />
    <text x="217" y="21" class="legend-text">Vol. Aterro (Preenchimento)</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'chart1_volume_curve.svg'), svg);
  console.log("Generated chart1_volume_curve.svg");
}

// -------------------------------------------------------------
// CHART 2: Comparativo de Custos e Movimentação (Solução Mais Econômica)
// -------------------------------------------------------------
function generateCostComparisonSVG() {
  const width = 800;
  const height = 480;
  const margin = { top: 70, right: 40, bottom: 80, left: 240 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const comparisons = data.comparisons;
  const maxCost = Math.max(...comparisons.map(c => c.cost));

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 19px; font-weight: bold; }
    .subtitle { fill: #94a3b8; font-size: 13px; }
    .bar-label { fill: #f8fafc; font-size: 12px; font-weight: 500; }
    .cost-text { fill: #ffffff; font-size: 13px; font-weight: bold; }
    .saving-badge { fill: #10b981; font-size: 12px; font-weight: bold; }
  </style>

  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" class="title">GRÁFICO 2: COMPARATIVO DE CUSTO TOTAL DE TERRAPLENAGEM</text>
  <text x="${width/2}" y="48" text-anchor="middle" class="subtitle">Demonstração da Solução Mais Econômica (Plano Inclinado vs Cotas Planas)</text>

  <g transform="translate(${margin.left}, ${margin.top})">
    ${comparisons.map((c, i) => {
      const barH = 45;
      const gap = 30;
      const y = i * (barH + gap);
      const barW = (c.cost / maxCost) * w;
      const isBest = i === 0;
      const barColor = isBest ? "url(#gradBest)" : (i === 1 ? "#3b82f6" : "#64748b");

      return `
        <!-- Label -->
        <text x="-15" y="${y + barH/2 + 4}" text-anchor="end" class="bar-label" fill="${isBest ? '#34d399' : '#cbd5e1'}">
          ${c.name}
        </text>

        <!-- Bar Background -->
        <rect x="0" y="${y}" width="${w}" height="${barH}" rx="6" fill="#1e293b" />
        
        <!-- Bar Fill -->
        <rect x="0" y="${y}" width="${barW}" height="${barH}" rx="6" fill="${barColor}" />

        <!-- Cost Label -->
        <text x="${barW + 12}" y="${y + barH/2 + 5}" class="cost-text" fill="${isBest ? '#34d399' : '#ffffff'}">
          R$ ${c.cost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </text>

        <!-- Details -->
        <text x="12" y="${y + barH/2 + 4}" font-size="11px" fill="#ffffff" font-weight="bold">
          Corte: ${c.vCut.toFixed(0)}m³ | Aterro: ${c.vFill.toFixed(0)}m³ (Total: ${(c.vCut + c.vFill).toFixed(0)}m³)
        </text>

        ${isBest ? `
          <!-- Winner Badge -->
          <g transform="translate(${barW - 130}, ${y + 8})">
            <rect x="0" y="0" width="120" height="28" rx="4" fill="#065f46" stroke="#34d399" stroke-width="1.5" />
            <text x="60" y="18" text-anchor="middle" class="saving-badge">★ MAIS ECONÔMICO</text>
          </g>
        ` : ''}
      `;
    }).join('')}
  </g>

  <!-- Gradients -->
  <defs>
    <linearGradient id="gradBest" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>

  <!-- Bottom Recommendation Box -->
  <rect x="40" y="${height - 55}" width="${width - 80}" height="40" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
  <text x="${width/2}" y="${height - 30}" text-anchor="middle" fill="#a7f3d0" font-size="13px" font-weight="bold">
    💡 Conclusão Econômica: O Plano Inclinado gera uma economia de R$ 124.029,58 (58.7%) em relação à cota plana!
  </text>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'chart2_cost_comparison.svg'), svg);
  console.log("Generated chart2_cost_comparison.svg");
}

// -------------------------------------------------------------
// CHART 3: Mapa de Isolinhas e Zonas de Corte x Aterro (Heatmap 2D)
// -------------------------------------------------------------
function generateCutFillMapSVG() {
  const width = 800;
  const height = 650;
  const margin = { top: 60, right: 140, bottom: 60, left: 80 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  const grid = data.grid;
  const stats = data.stats;

  const mapX = (e) => margin.left + ((e - stats.minE) / (stats.maxE - stats.minE)) * w;
  const mapY = (n) => margin.top + h - ((n - stats.minN) / (stats.maxN - stats.minN)) * h;

  // Render grid cells as color rects for Cut vs Fill (Plane solution)
  // Green/Blue for Aterro (diffPlane < 0), Red/Orange for Corte (diffPlane > 0)
  const cellWidth = ((2.0) / (stats.maxE - stats.minE)) * w;
  const cellHeight = ((2.0) / (stats.maxN - stats.minN)) * h;

  const cellsSVG = grid.map(c => {
    const x = mapX(c.e) - cellWidth/2;
    const y = mapY(c.n) - cellHeight/2;
    const d = c.diffPlane; // depth in meters

    let color = "#1e293b";
    if (d > 0.8) color = "#dc2626";       // Corte Forte
    else if (d > 0.3) color = "#f97316";  // Corte Médio
    else if (d > 0.05) color = "#fbbf24"; // Corte Leve
    else if (d >= -0.05) color = "#fef08a"; // Linha Neutra (Zero)
    else if (d >= -0.3) color = "#38bdf8"; // Aterro Leve
    else if (d >= -0.8) color = "#2563eb"; // Aterro Médio
    else color = "#1d4ed8";               // Aterro Forte

    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellWidth+0.8).toFixed(1)}" height="${(cellHeight+0.8).toFixed(1)}" fill="${color}" opacity="0.85" />`;
  }).join('\n');

  // Overlay points
  const pointsSVG = data.points.map(pt => {
    const px = mapX(pt.e);
    const py = mapY(pt.n);
    return `
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.5" fill="#ffffff" stroke="#000" stroke-width="0.5" />
      <text x="${(px + 4).toFixed(1)}" y="${(py + 3).toFixed(1)}" font-size="8px" fill="#f8fafc" font-weight="bold">${pt.p}</text>
    `;
  }).join('\n');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 19px; font-weight: bold; }
    .subtitle { fill: #94a3b8; font-size: 13px; }
    .axis-label { fill: #cbd5e1; font-size: 11px; }
    .legend-title { fill: #f8fafc; font-size: 12px; font-weight: bold; }
    .legend-text { fill: #cbd5e1; font-size: 11px; }
  </style>

  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" class="title">GRÁFICO 3: MAPA ESPACIAL DE ZONAS DE CORTE E ATERRO</text>
  <text x="${width/2}" y="46" text-anchor="middle" class="subtitle">Distribuição das Espessuras de Escavação (Corte) e Preenchimento (Aterro)</text>

  <!-- Cells -->
  <g>${cellsSVG}</g>

  <!-- Points -->
  <g>${pointsSVG}</g>

  <!-- Axis -->
  <rect x="${margin.left}" y="${margin.top}" width="${w}" height="${h}" fill="none" stroke="#475569" stroke-width="1.5" />

  <text x="${margin.left + w/2}" y="${height - 20}" text-anchor="middle" class="axis-label" font-weight="bold">Coordenada Este - UTM (m)</text>
  <text x="25" y="${margin.top + h/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 25 ${margin.top + h/2})">Coordenada Norte - UTM (m)</text>

  <!-- Legend Box -->
  <g transform="translate(${width - 130}, ${margin.top})">
    <rect x="0" y="0" width="120" height="280" rx="8" fill="#1e293b" stroke="#334155" />
    <text x="60" y="22" text-anchor="middle" class="legend-title">LEGENDA DE ESPESSURA</text>

    <!-- Corte Items -->
    <rect x="15" y="40" width="20" height="15" fill="#dc2626" rx="2" />
    <text x="42" y="52" class="legend-text">Corte &gt; 0,8m</text>

    <rect x="15" y="65" width="20" height="15" fill="#f97316" rx="2" />
    <text x="42" y="77" class="legend-text">Corte 0,3-0,8m</text>

    <rect x="15" y="90" width="20" height="15" fill="#fbbf24" rx="2" />
    <text x="42" y="102" class="legend-text">Corte 0,05-0,3m</text>

    <!-- Zero Item -->
    <rect x="15" y="120" width="20" height="15" fill="#fef08a" rx="2" />
    <text x="42" y="132" class="legend-text" font-weight="bold">Linha Neutra (0m)</text>

    <!-- Aterro Items -->
    <rect x="15" y="150" width="20" height="15" fill="#38bdf8" rx="2" />
    <text x="42" y="162" class="legend-text">Aterro 0,05-0,3m</text>

    <rect x="15" y="175" width="20" height="15" fill="#2563eb" rx="2" />
    <text x="42" y="187" class="legend-text">Aterro 0,3-0,8m</text>

    <rect x="15" y="200" width="20" height="15" fill="#1d4ed8" rx="2" />
    <text x="42" y="212" class="legend-text">Aterro &gt; 0,8m</text>

    <!-- Point symbol -->
    <circle cx="25" cy="240" r="4" fill="#ffffff" stroke="#000" stroke-width="1" />
    <text x="42" y="244" class="legend-text">Ponto Cota</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'chart3_cut_fill_map.svg'), svg);
  console.log("Generated chart3_cut_fill_map.svg");
}

// -------------------------------------------------------------
// CHART 4: Perfil Longitudinal do Terreno vs Linha de Projeto
// -------------------------------------------------------------
function generateLongitudinalProfileSVG() {
  const width = 800;
  const height = 450;
  const margin = { top: 60, right: 60, bottom: 70, left: 70 };
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;

  // Profile along NW -> SE diagonal (Point 52 to Point 29)
  // Distance along diagonal
  const pStart = data.points.find(p => p.p === 52); // NW highest
  const pEnd = data.points.find(p => p.p === 29);   // SE lowest

  const diagPoints = data.grid.map(c => {
    // Project cell on line from pStart to pEnd
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
  let pathPlane = "";
  let pathHoriz = "";

  diagPoints.forEach((pt, i) => {
    const x = mapX(pt.dist);
    const yNat = mapY(pt.z);
    const yPlane = mapY(pt.zPlane);
    const yHoriz = mapY(pt.zHoriz);

    if (i === 0) {
      pathNat += `M ${x} ${yNat}`;
      pathPlane += `M ${x} ${yPlane}`;
      pathHoriz += `M ${x} ${yHoriz}`;
    } else {
      pathNat += ` L ${x} ${yNat}`;
      pathPlane += ` L ${x} ${yPlane}`;
      pathHoriz += ` L ${x} ${yHoriz}`;
    }
  });

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background: #0f172a; font-family: 'Segoe UI', sans-serif;">
  <style>
    .title { fill: #f8fafc; font-size: 19px; font-weight: bold; }
    .subtitle { fill: #94a3b8; font-size: 13px; }
    .axis-label { fill: #cbd5e1; font-size: 11px; }
    .grid-line { stroke: #334155; stroke-dasharray: 4,4; stroke-width: 1; }
    .legend-text { fill: #e2e8f0; font-size: 12px; }
  </style>

  <!-- Title -->
  <text x="${width/2}" y="30" text-anchor="middle" class="title">GRÁFICO 4: PERFIL LONGITUDINAL DE TERRAPLENAGEM (DIAGONAL NW ➔ SE)</text>
  <text x="${width/2}" y="46" text-anchor="middle" class="subtitle">Comparação do Terreno Natural com o Plano Inclinado Otimizado</text>

  <!-- Y Axis Grid -->
  ${[51.0, 52.0, 53.0, 54.0, 55.0].map(z => {
    const y = mapY(z);
    return `
      <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="grid-line" />
      <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" class="axis-label">${z.toFixed(1)} m</text>
    `;
  }).join('')}

  <!-- X Axis Labels -->
  ${[0, 50, 100, 150, 200].map(d => {
    if (d > maxDist) return '';
    const x = mapX(d);
    return `
      <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 6}" stroke="#64748b" />
      <text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" class="axis-label">${d}m</text>
    `;
  }).join('')}

  <text x="${width/2}" y="${height - 15}" text-anchor="middle" class="axis-label" font-weight="bold">Distância Acumulada no Perfil (m)</text>
  <text x="20" y="${height/2}" text-anchor="middle" class="axis-label" font-weight="bold" transform="rotate(-90 20 ${height/2})">Elevação / Cota (m)</text>

  <!-- Lines -->
  <path d="${pathHoriz}" fill="none" stroke="#eab308" stroke-width="2" stroke-dasharray="6,4" />
  <path d="${pathNat}" fill="none" stroke="#38bdf8" stroke-width="3" />
  <path d="${pathPlane}" fill="none" stroke="#10b981" stroke-width="3.5" />

  <!-- Legend -->
  <g transform="translate(${margin.left + 20}, ${margin.top + 15})">
    <rect x="0" y="0" width="460" height="32" rx="6" fill="#1e293b" opacity="0.9" stroke="#334155" />
    
    <line x1="15" y1="16" x2="35" y2="16" stroke="#38bdf8" stroke-width="3" />
    <text x="42" y="20" class="legend-text">Terreno Natural</text>

    <line x1="150" y1="16" x2="170" y2="16" stroke="#10b981" stroke-width="3.5" />
    <text x="177" y="20" class="legend-text" font-weight="bold">Plano Inclinado (Mais Econômico)</text>

    <line x1="360" y1="16" x2="380" y2="16" stroke="#eab308" stroke-width="2" stroke-dasharray="4,4" />
    <text x="387" y="20" class="legend-text">Cota Plana (52.60m)</text>
  </g>
</svg>
  `;

  fs.writeFileSync(path.join(artifactDir, 'chart4_profile.svg'), svg);
  console.log("Generated chart4_profile.svg");
}

generateVolumeCurveSVG();
generateCostComparisonSVG();
generateCutFillMapSVG();
generateLongitudinalProfileSVG();
