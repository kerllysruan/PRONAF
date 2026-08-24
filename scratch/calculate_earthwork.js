import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 59 points from official survey report
const points = [
  { p: 1, e: 392114.183, n: 9774217.464, z: 52.990 },
  { p: 2, e: 392116.725, n: 9774219.767, z: 52.839 },
  { p: 3, e: 392110.563, n: 9774227.694, z: 53.023 },
  { p: 4, e: 392107.837, n: 9774225.703, z: 53.087 },
  { p: 5, e: 392101.623, n: 9774233.670, z: 53.195 },
  { p: 6, e: 392104.137, n: 9774236.080, z: 53.151 },
  { p: 7, e: 392098.562, n: 9774243.460, z: 53.213 },
  { p: 8, e: 392095.933, n: 9774241.226, z: 53.285 },
  { p: 9, e: 392105.997, n: 9774250.224, z: 53.300 },
  { p: 10, e: 392113.595, n: 9774256.857, z: 52.967 },
  { p: 11, e: 392121.013, n: 9774263.713, z: 52.833 },
  { p: 12, e: 392130.523, n: 9774272.129, z: 52.700 },
  { p: 13, e: 392136.630, n: 9774263.560, z: 52.512 },
  { p: 14, e: 392128.824, n: 9774256.893, z: 52.525 },
  { p: 15, e: 392121.042, n: 9774250.538, z: 52.598 },
  { p: 16, e: 392113.406, n: 9774243.961, z: 53.141 },
  { p: 17, e: 392142.659, n: 9774255.456, z: 52.236 },
  { p: 18, e: 392135.044, n: 9774248.669, z: 52.353 },
  { p: 19, e: 392127.229, n: 9774241.932, z: 52.428 },
  { p: 20, e: 392119.554, n: 9774235.427, z: 52.849 },
  { p: 21, e: 392125.525, n: 9774228.059, z: 52.534 },
  { p: 22, e: 392133.094, n: 9774234.757, z: 52.292 },
  { p: 23, e: 392140.624, n: 9774241.396, z: 52.131 },
  { p: 24, e: 392148.299, n: 9774248.137, z: 52.091 },
  { p: 25, e: 392163.480, n: 9774261.310, z: 51.898 },
  { p: 26, e: 392178.378, n: 9774274.682, z: 51.754 },
  { p: 27, e: 392193.254, n: 9774287.736, z: 51.488 },
  { p: 28, e: 392207.963, n: 9774300.590, z: 51.302 },
  { p: 29, e: 392234.448, n: 9774321.326, z: 51.155 },
  { p: 30, e: 392227.200, n: 9774328.250, z: 51.252 },
  { p: 31, e: 392119.658, n: 9774335.581, z: 51.470 },
  { p: 32, e: 392210.480, n: 9774343.991, z: 51.647 },
  { p: 33, e: 392195.164, n: 9774331.093, z: 51.570 },
  { p: 34, e: 392202.897, n: 9774323.840, z: 51.267 },
  { p: 35, e: 392210.542, n: 9774317.260, z: 51.268 },
  { p: 36, e: 392217.571, n: 9774309.176, z: 51.070 },
  { p: 37, e: 392180.421, n: 9774317.248, z: 51.830 },
  { p: 38, e: 392187.739, n: 9774310.516, z: 51.477 },
  { p: 39, e: 392192.920, n: 9774301.876, z: 51.311 },
  { p: 40, e: 392165.246, n: 9774303.701, z: 52.052 },
  { p: 41, e: 392173.310, n: 9774296.415, z: 51.892 },
  { p: 42, e: 392180.948, n: 9774289.580, z: 51.720 },
  { p: 43, e: 392150.535, n: 9774290.215, z: 52.271 },
  { p: 44, e: 392158.609, n: 9774282.852, z: 52.092 },
  { p: 45, e: 392165.959, n: 9774275.753, z: 51.901 },
  { p: 46, e: 392138.483, n: 9774279.544, z: 52.586 },
  { p: 47, e: 392146.650, n: 9774272.849, z: 52.323 },
  { p: 48, e: 392154.479, n: 9774266.392, z: 52.126 },
  { p: 49, e: 392105.328, n: 9774305.428, z: 53.447 },
  { p: 50, e: 392073.968, n: 9774279.154, z: 54.010 },
  { p: 51, e: 392082.197, n: 9774337.474, z: 54.879 },
  { p: 52, e: 392089.694, n: 9774344.508, z: 54.888 },
  { p: 53, e: 392097.145, n: 9774351.452, z: 54.881 },
  { p: 54, e: 392104.715, n: 9774358.593, z: 54.779 },
  { p: 55, e: 392116.175, n: 9774369.404, z: 54.683 },
  { p: 56, e: 392121.539, n: 9774363.648, z: 53.522 },
  { p: 57, e: 392069.839, n: 9774276.071, z: 53.955 },
  { p: 58, e: 392080.200, n: 9774262.031, z: 53.685 },
  { p: 59, e: 392087.384, n: 9774252.580, z: 53.497 }
];

// Centroid computation
const nPts = points.length;
const meanE = points.reduce((acc, p) => acc + p.e, 0) / nPts;
const meanN = points.reduce((acc, p) => acc + p.n, 0) / nPts;
const meanZ = points.reduce((acc, p) => acc + p.z, 0) / nPts;

const minE = Math.min(...points.map(p => p.e));
const maxE = Math.max(...points.map(p => p.e));
const minN = Math.min(...points.map(p => p.n));
const maxN = Math.max(...points.map(p => p.n));
const minZ = Math.min(...points.map(p => p.z));
const maxZ = Math.max(...points.map(p => p.z));

// Create discrete grid within active zone
const step = 2.0; // 2m cell resolution
const grid = [];
const cellArea = step * step;

function interpolateIDW(e, n) {
  let num = 0;
  let den = 0;
  for (const pt of points) {
    const d2 = (pt.e - e)**2 + (pt.n - n)**2;
    if (d2 < 0.0001) return pt.z;
    const w = 1 / Math.pow(d2, 1.2);
    num += pt.z * w;
    den += w;
  }
  return num / den;
}

for (let e = minE; e <= maxE; e += step) {
  for (let n = minN; n <= maxN; n += step) {
    let minD = Infinity;
    for (const pt of points) {
      const d = Math.sqrt((pt.e - e)**2 + (pt.n - n)**2);
      if (d < minD) minD = d;
    }
    // Mask cells within 20m of survey points
    if (minD <= 20.0) {
      const z = interpolateIDW(e, n);
      grid.push({ e, n, z });
    }
  }
}

// 1. HORIZONTAL PLANES ANALYSIS
function calcVolumeHorizontal(zProj) {
  let vCut = 0;
  let vFill = 0;
  let areaCut = 0;
  let areaFill = 0;

  for (const cell of grid) {
    const diff = cell.z - zProj;
    if (diff > 0) {
      vCut += diff * cellArea;
      areaCut += cellArea;
    } else {
      vFill += Math.abs(diff) * cellArea;
      areaFill += cellArea;
    }
  }
  return { zProj, vCut, vFill, balance: vCut - vFill, totalMovement: vCut + vFill, areaCut, areaFill };
}

const cotaCurve = [];
for (let z = 51.0; z <= 55.0; z += 0.05) {
  cotaCurve.push(calcVolumeHorizontal(z));
}

let bestHorizontal = cotaCurve[0];
let minDiff = Infinity;
for (const c of cotaCurve) {
  if (Math.abs(c.balance) < minDiff) {
    minDiff = Math.abs(c.balance);
    bestHorizontal = c;
  }
}

// 2. INCLINED OPTIMAL PLANE (REGRESSION PLANE MATCHING NATURAL TERRAIN SLOPE)
// Z = meanZ + a*(E - meanE) + b*(N - meanN)
let S_ee = 0, S_nn = 0, S_en = 0, S_ez = 0, S_nz = 0;
for (const p of points) {
  const de = p.e - meanE;
  const dn = p.n - meanN;
  const dz = p.z - meanZ;
  S_ee += de * de;
  S_nn += dn * dn;
  S_en += de * dn;
  S_ez += de * dz;
  S_nz += dn * dz;
}
const D = S_ee * S_nn - S_en * S_en;
const a_slopeE = (S_ez * S_nn - S_nz * S_en) / D;
const b_slopeN = (S_nz * S_ee - S_ez * S_en) / D;

let vCutPlane = 0;
let vFillPlane = 0;
let areaCutPlane = 0;
let areaFillPlane = 0;

for (const cell of grid) {
  const zPlane = meanZ + a_slopeE * (cell.e - meanE) + b_slopeN * (cell.n - meanN);
  const diff = cell.z - zPlane;
  if (diff > 0) {
    vCutPlane += diff * cellArea;
    areaCutPlane += cellArea;
  } else {
    vFillPlane += Math.abs(diff) * cellArea;
    areaFillPlane += cellArea;
  }
}

const totalMovPlane = vCutPlane + vFillPlane;
const savingVsHorizontal = ((bestHorizontal.totalMovement - totalMovPlane) / bestHorizontal.totalMovement) * 100;

// Unit cost assumptions for financial comparison (R$/m³)
// Excavação + Carga + Transporte local: R$ 18.00/m³
// Compactação de aterro: R$ 12.00/m³
// Importação de bota-fora / empréstimo extra: R$ 45.00/m³
const costPerM3Cut = 18.00;
const costPerM3Fill = 12.00;

const costHorizontal = bestHorizontal.vCut * costPerM3Cut + bestHorizontal.vFill * costPerM3Fill;
const costPlane = vCutPlane * costPerM3Cut + vFillPlane * costPerM3Fill;
// Arbitrary non-economic level comparison (e.g. Z = 51.5m or Z = 54.0m)
const badLevel1 = calcVolumeHorizontal(51.5);
const costBadLevel1 = badLevel1.vCut * costPerM3Cut + badLevel1.vFill * costPerM3Fill + Math.abs(badLevel1.balance) * 45.0;

const badLevel2 = calcVolumeHorizontal(54.0);
const costBadLevel2 = badLevel2.vCut * costPerM3Cut + badLevel2.vFill * costPerM3Fill + Math.abs(badLevel2.balance) * 45.0;

const results = {
  stats: {
    totalPoints: points.length,
    minZ, maxZ, meanZ,
    minE, maxE, minN, maxN,
    totalArea: grid.length * cellArea,
    meanE, meanN
  },
  bestHorizontal: {
    ...bestHorizontal,
    costEstimated: costHorizontal
  },
  inclinedPlane: {
    a_slopeE,
    b_slopeN,
    meanZ,
    slopeDegree: (Math.atan(Math.sqrt(a_slopeE**2 + b_slopeN**2)) * 180 / Math.PI),
    vCut: vCutPlane,
    vFill: vFillPlane,
    balance: vCutPlane - vFillPlane,
    totalMovement: totalMovPlane,
    areaCut: areaCutPlane,
    areaFill: areaFillPlane,
    costEstimated: costPlane,
    savingVsHorizontal
  },
  comparisons: [
    { name: "Plano Inclinado Suave (Mais Econômico)", vCut: vCutPlane, vFill: vFillPlane, cost: costPlane, totalMov: totalMovPlane },
    { name: "Cota Plana Otimizada (Z = 52.55m)", vCut: bestHorizontal.vCut, vFill: bestHorizontal.vFill, cost: costHorizontal, totalMov: bestHorizontal.totalMovement },
    { name: "Cota Baixa Fixa (Z = 51.50m)", vCut: badLevel1.vCut, vFill: badLevel1.vFill, cost: costBadLevel1, totalMov: badLevel1.totalMovement },
    { name: "Cota Alta Fixa (Z = 54.00m)", vCut: badLevel2.vCut, vFill: badLevel2.vFill, cost: costBadLevel2, totalMov: badLevel2.totalMovement }
  ],
  cotaCurve,
  grid: grid.map(cell => ({
    e: cell.e,
    n: cell.n,
    z: cell.z,
    zHoriz: bestHorizontal.zProj,
    zPlane: meanZ + a_slopeE * (cell.e - meanE) + b_slopeN * (cell.n - meanN),
    diffHoriz: cell.z - bestHorizontal.zProj,
    diffPlane: cell.z - (meanZ + a_slopeE * (cell.e - meanE) + b_slopeN * (cell.n - meanN))
  })),
  points
};

fs.writeFileSync(path.join(__dirname, 'earthwork_results.json'), JSON.stringify(results, null, 2));

console.log("=== ANÁLISE COMPLETA CONCLUÍDA COM SUCESSO ===");
console.log(`Cota Plana Otimizada: Z = ${bestHorizontal.zProj.toFixed(2)} m`);
console.log(`  - Corte: ${bestHorizontal.vCut.toFixed(1)} m³ | Aterro: ${bestHorizontal.vFill.toFixed(1)} m³ | Custo Est: R$ ${costHorizontal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
console.log(`Plano Inclinado Otimizado (Declividade natural ~1.56°):`);
console.log(`  - Corte: ${vCutPlane.toFixed(1)} m³ | Aterro: ${vFillPlane.toFixed(1)} m³ | Custo Est: R$ ${costPlane.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
console.log(`  - Economia de Movimentação em relação à cota plana: ${savingVsHorizontal.toFixed(1)}%`);
