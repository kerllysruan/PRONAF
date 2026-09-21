import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { StockProposal } from "@/types/stock";
import { Agency } from "@/contexts/AgencyContext";

export interface StockReportOptions {
  proposals: StockProposal[];
  agencies?: Agency[];
  selectedAgencyName?: string;
  filters: {
    projetista: string;
    municipio: string;
    status: string;
    reportType?: "full" | "executive" | "table_only";
    sortBy?: "value_desc" | "name_asc" | "projetista_asc" | "status_asc";
  };
  userName?: string;
}

// Formatador de Moeda BRL
function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Formatador compacto para KPIs (ex: R$ 7,4M)
function formatCompactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
  }
  return formatBRL(value);
}

// Cores temáticas do relatório executivo
const THEME = {
  primary: [15, 23, 42] as [number, number, number],       // Slate 900 (Fundo escuro corporativo)
  primarySoft: [30, 41, 59] as [number, number, number],   // Slate 800
  accentEmerald: [5, 150, 105] as [number, number, number], // Emerald 600
  accentIndigo: [79, 70, 229] as [number, number, number], // Indigo 600
  accentBlue: [37, 99, 235] as [number, number, number],    // Blue 600
  accentAmber: [217, 119, 6] as [number, number, number],   // Amber 600
  accentRed: [220, 38, 38] as [number, number, number],     // Red 600
  accentPurple: [147, 51, 234] as [number, number, number], // Purple 600
  cardBg: [255, 255, 255] as [number, number, number],
  pageBg: [248, 250, 252] as [number, number, number],     // Slate 50
  border: [226, 232, 240] as [number, number, number],     // Slate 200
  textMain: [15, 23, 42] as [number, number, number],      // Slate 900
  textMuted: [100, 116, 139] as [number, number, number],  // Slate 500
  textLight: [148, 163, 184] as [number, number, number],  // Slate 400
};

// Obter cor de status
function getStatusColor(status: string): [number, number, number] {
  const s = (status || "").toUpperCase();
  if (s.includes("CONCLUÍD") || s.includes("CONCLUID") || s.includes("APROVAD")) {
    return [16, 185, 129]; // Emerald
  }
  if (s.includes("CENTRAL") || s.includes("AUTORIZADO")) {
    return [79, 70, 229]; // Indigo
  }
  if (s.includes("ENTREVISTA") || s.includes("ANÁLISE") || s.includes("ANALISE")) {
    return [6, 182, 212]; // Cyan
  }
  if (s.includes("PENDÊNCIA") || s.includes("PENDENCIA") || s.includes("GERENCIAIS")) {
    return [245, 158, 11]; // Amber
  }
  if (s.includes("RESTRIÇÃO") || s.includes("RESTRICAO")) {
    return [239, 68, 68]; // Red
  }
  return [100, 116, 139]; // Slate
}

export function generateExecutiveStockReport(options: StockReportOptions): void {
  const { proposals, agencies, selectedAgencyName, filters } = options;
  const reportType = filters.reportType || "full";
  const sortBy = filters.sortBy || "value_desc";

  // Normalização de string
  const norm = (v: string | null | undefined) => (v || "").trim().toUpperCase();

  // Filtragem dos dados
  let filtered = proposals.map((p) => {
    let st = norm(p.status).replace("AUTORIZADO ENVIO PARA CENTRAL", "AUTORIZADO ENVIO CENTRAL");
    return {
      ...p,
      status: st,
      projetista: norm(p.projetista) || "NÃO INFORMADO",
      municipio: norm(p.municipio) || "NÃO INFORMADO",
      producer_name: norm(p.producer_name) || "PRODUTOR NÃO INFORMADO",
      linha_credito: norm(p.linha_credito) || "GERAL",
      estimated_value: Number(p.estimated_value) || 0,
    };
  });

  if (filters.projetista && filters.projetista !== "all") {
    filtered = filtered.filter((p) => p.projetista === norm(filters.projetista));
  }
  if (filters.municipio && filters.municipio !== "all") {
    filtered = filtered.filter((p) => p.municipio === norm(filters.municipio));
  }
  if (filters.status && filters.status !== "all") {
    const targetStatus = norm(filters.status).replace("AUTORIZADO ENVIO PARA CENTRAL", "AUTORIZADO ENVIO CENTRAL");
    filtered = filtered.filter((p) => p.status === targetStatus);
  }

  // Ordenação
  filtered.sort((a, b) => {
    if (sortBy === "value_desc") return b.estimated_value - a.estimated_value;
    if (sortBy === "name_asc") return a.producer_name.localeCompare(b.producer_name);
    if (sortBy === "projetista_asc") return a.projetista.localeCompare(b.projetista);
    if (sortBy === "status_asc") return a.status.localeCompare(b.status);
    return 0;
  });

  // Métricas Consolidadas
  const totalCount = filtered.length;
  const totalValue = filtered.reduce((acc, p) => acc + p.estimated_value, 0);
  const avgValue = totalCount > 0 ? totalValue / totalCount : 0;

  // Regularidade (propostas sem restrição)
  const countRestricao = filtered.filter((p) => p.status.includes("RESTRIÇÃO") || p.status.includes("RESTRICAO")).length;
  const countRegular = totalCount - countRestricao;
  const pctRegular = totalCount > 0 ? Math.round((countRegular / totalCount) * 100) : 100;

  // Projetista Destaque
  const projMap = new Map<string, { count: number; total: number }>();
  filtered.forEach((p) => {
    const entry = projMap.get(p.projetista) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.estimated_value;
    projMap.set(p.projetista, entry);
  });
  const projRanking = Array.from(projMap.entries())
    .map(([name, stat]) => ({ name, count: stat.count, total: stat.total }))
    .sort((a, b) => b.total - a.total);
  const topProjetista = projRanking[0] || { name: "N/A", total: 0, count: 0 };

  // Município Destaque
  const munMap = new Map<string, { count: number; total: number }>();
  filtered.forEach((p) => {
    const entry = munMap.get(p.municipio) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.estimated_value;
    munMap.set(p.municipio, entry);
  });
  const munRanking = Array.from(munMap.entries())
    .map(([name, stat]) => ({ name, count: stat.count, total: stat.total }))
    .sort((a, b) => b.count - a.count);
  const topMunicipio = munRanking[0] || { name: "N/A", count: 0, total: 0 };

  // Status breakdown
  const statusMap = new Map<string, { count: number; total: number }>();
  filtered.forEach((p) => {
    const entry = statusMap.get(p.status) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.estimated_value;
    statusMap.set(p.status, entry);
  });
  const statusStats = Array.from(statusMap.entries())
    .map(([status, stat]) => ({ status, count: stat.count, total: stat.total }))
    .sort((a, b) => b.count - a.count);

  // Linhas de Crédito breakdown
  const linhaMap = new Map<string, { count: number; total: number }>();
  filtered.forEach((p) => {
    let rawLinha = (p.linha_credito || p.credit_program || "NÃO INFORMADA").trim();
    if (rawLinha.includes("699")) {
      rawLinha = "PRONAF A 699";
    } else if (rawLinha.includes("368")) {
      rawLinha = "PRONAF A 368";
    }
    const entry = linhaMap.get(rawLinha) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += p.estimated_value;
    linhaMap.set(rawLinha, entry);
  });
  const linhaStats = Array.from(linhaMap.entries())
    .map(([linha, stat]) => ({ linha, count: stat.count, total: stat.total }))
    .sort((a, b) => b.total - a.total);

  // ── INICIALIZAÇÃO DO DOCUMENTO (Landscape A4: 297mm x 210mm) ──
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");

  // =========================================================================
  // SEÇÃO: PÁGINA 1 — DASHBOARD ESTRATÉGICO EXECUTIVO (ENQUADRAMENTO PROFISSIONAL)
  // =========================================================================
  if (reportType === "full" || reportType === "executive") {
    // 1. Fundo da Página (Off-White Slate 50)
    doc.setFillColor(...THEME.pageBg);
    doc.rect(0, 0, pageW, pageH, "F");

    // 2. Header Executivo (Altura: 30mm)
    doc.setFillColor(...THEME.primary);
    doc.rect(0, 0, pageW, 30, "F");

    // Filete Gradiente de Destaque (Altura: 1.5mm)
    doc.setFillColor(...THEME.accentEmerald);
    doc.rect(0, 30, pageW * 0.6, 1.5, "F");
    doc.setFillColor(...THEME.accentIndigo);
    doc.rect(pageW * 0.6, 30, pageW * 0.4, 1.5, "F");

    // Logo / Ícone de Identidade
    doc.setFillColor(...THEME.accentEmerald);
    doc.roundedRect(14, 6.5, 8, 8, 1.8, 1.8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("PR", 18, 12, { align: "center" });

    // Título Principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PRONAF GESTÃO DE ESTOQUE", 25, 12);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...THEME.textLight);
    doc.text("PAINEL ESTRATÉGICO DE CAPTAÇÃO & GESTÃO DA CARTEIRA", 25, 18);

    // Metadata Card no Topo Direito (Largura: 104mm, Altura: 20mm)
    const metaW = 104;
    const metaH = 20;
    const metaX = pageW - metaW - 14;
    const metaY = 5;

    doc.setFillColor(...THEME.primarySoft);
    doc.roundedRect(metaX, metaY, metaW, metaH, 2, 2, "F");
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(metaX, metaY, metaW, metaH, 2, 2, "S");

    doc.setFontSize(6);
    doc.setTextColor(...THEME.textLight);
    doc.text("EMISSÃO:", metaX + 4, metaY + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(timestamp, metaX + 20, metaY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...THEME.textLight);
    doc.text("AGÊNCIA:", metaX + 4, metaY + 11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...THEME.accentEmerald);
    const agTxt = (selectedAgencyName || "TODAS AS AGÊNCIAS").toUpperCase();
    doc.text(agTxt.length > 28 ? agTxt.substring(0, 26) + "..." : agTxt, metaX + 20, metaY + 11);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...THEME.textLight);
    doc.text("FILTROS:", metaX + 4, metaY + 16.5);
    let filterSummary = "";
    if (filters.projetista !== "all") filterSummary += `Proj: ${filters.projetista} | `;
    if (filters.municipio !== "all") filterSummary += `Mun: ${filters.municipio} | `;
    if (filters.status !== "all") filterSummary += `Status: ${filters.status}`;
    if (!filterSummary) filterSummary = "Visão Global (Sem Restrição de Filtros)";
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.text(filterSummary.length > 44 ? filterSummary.substring(0, 42) + "..." : filterSummary, metaX + 20, metaY + 16.5);

    // ── 3. CARDS DE KPI (Faixa: Y = 35mm até Y = 57mm | Altura: 22mm) ──
    const kpiY = 35;
    const kpiH = 22;
    const cardGap = 3.5;
    const totalCards = 6;
    const kpiW = (pageW - 28 - (totalCards - 1) * cardGap) / totalCards; // ~42mm cada

    const drawKpiCard = (
      index: number,
      title: string,
      mainValue: string,
      subValue: string,
      accentColor: [number, number, number],
      badgeText?: string
    ) => {
      const x = 14 + index * (kpiW + cardGap);

      // Card Background & Border
      doc.setFillColor(...THEME.cardBg);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 2.5, 2.5, "F");
      doc.setDrawColor(...THEME.border);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 2.5, 2.5, "S");

      // Barra de destaque superior
      doc.setFillColor(...accentColor);
      doc.rect(x + 3, kpiY, kpiW - 6, 1.5, "F");

      // Título do KPI
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...THEME.textMuted);
      doc.text(title.toUpperCase(), x + 4, kpiY + 6);

      // Valor Principal (Calibrado dinamicamente para nunca vazar do card)
      doc.setFont("helvetica", "bold");
      if (mainValue.length > 15) {
        doc.setFontSize(8);
      } else if (mainValue.length > 11) {
        doc.setFontSize(9);
      } else {
        doc.setFontSize(10.5);
      }
      doc.setTextColor(...THEME.textMain);
      doc.text(mainValue, x + 4, kpiY + 13);

      // Subtexto explicativo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...THEME.textMuted);
      const subSafe = subValue.length > 22 ? subValue.substring(0, 20) + ".." : subValue;
      doc.text(subSafe, x + 4, kpiY + 18.5);

      // Badge opcional no canto
      if (badgeText) {
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.roundedRect(x + kpiW - 15, kpiY + 3.2, 12, 4, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(4.5);
        doc.setFont("helvetica", "bold");
        doc.text(badgeText, x + kpiW - 9, kpiY + 6, { align: "center" });
      }
    };

    drawKpiCard(0, "Montante Estoque", formatCompactBRL(totalValue), `Total: ${formatBRL(totalValue)}`, THEME.accentEmerald, "TOTAL");
    drawKpiCard(1, "Qtd Propostas", `${totalCount} Propostas`, "Propostas cadastradas", THEME.accentIndigo, `${totalCount} UN`);
    drawKpiCard(2, "Ticket Médio", formatCompactBRL(avgValue), `Média: ${formatBRL(avgValue)}`, THEME.accentBlue);
    drawKpiCard(3, "Regularidade", `${pctRegular}% Regular`, `${countRestricao} com restrição`, pctRegular >= 80 ? THEME.accentEmerald : THEME.accentAmber);
    drawKpiCard(4, "Top Projetista", topProjetista.name.split(" ")[0] || "N/A", formatCompactBRL(topProjetista.total), THEME.accentPurple, "1º LUGAR");
    drawKpiCard(5, "Polo Regional", topMunicipio.name.split("/")[0] || "N/A", `${topMunicipio.count} propostas`, THEME.accentAmber, "LÍDER");

    // ── 4. ÁREA ANALÍTICA CENTRAL (Faixa: Y = 61mm até Y = 143mm | Altura: 82mm) ──
    const mainY = 61;
    const mainH = 82;
    const colGap = 4.5;
    const colW = (pageW - 28 - 2 * colGap) / 3; // ~86.6mm cada coluna

    // ─── COLUNA 1: DISTRIBUIÇÃO POR STATUS (Barras Horizontais Protegidas) ───
    const col1X = 14;
    doc.setFillColor(...THEME.cardBg);
    doc.roundedRect(col1X, mainY, colW, mainH, 2.5, 2.5, "F");
    doc.setDrawColor(...THEME.border);
    doc.roundedRect(col1X, mainY, colW, mainH, 2.5, 2.5, "S");

    // Header da Coluna 1
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(col1X, mainY, colW, 8.5, 2.5, 2.5, "F");
    doc.rect(col1X, mainY + 5.5, colW, 3, "F");
    doc.setDrawColor(...THEME.border);
    doc.line(col1X, mainY + 8.5, col1X + colW, mainY + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...THEME.textMain);
    doc.text("DISTRIBUIÇÃO DE CARTEIRA POR STATUS", col1X + 5, mainY + 5.5);

    // Agrupamento para caber exatamente em 6 linhas sem risco de transbordamento
    let visibleStatuses = statusStats.slice(0, 6);
    if (statusStats.length > 6) {
      const top5 = statusStats.slice(0, 5);
      const others = statusStats.slice(5);
      const otherCount = others.reduce((acc, o) => acc + o.count, 0);
      const otherTotal = others.reduce((acc, o) => acc + o.total, 0);
      visibleStatuses = [...top5, { status: "OUTROS STATUS", count: otherCount, total: otherTotal }];
    }

    const maxStatusCount = Math.max(...visibleStatuses.map((s) => s.count), 1);
    const barStartY = mainY + 11;
    const barRowH = 11.5;

    visibleStatuses.forEach((st, idx) => {
      const y = barStartY + idx * barRowH;
      const barColor = getStatusColor(st.status);
      const pct = totalCount > 0 ? Math.round((st.count / totalCount) * 100) : 0;
      const progressW = (colW - 12) * (st.count / maxStatusCount);

      // Ponto colorido + Nome do status
      doc.setFillColor(...barColor);
      doc.circle(col1X + 5, y + 2, 1.3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...THEME.textMain);
      const stLabel = st.status.length > 20 ? st.status.substring(0, 18) + ".." : st.status;
      doc.text(stLabel, col1X + 8, y + 3);

      // Contagem e Valor no canto direito
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...THEME.textMuted);
      doc.text(`${st.count} un (${pct}%)  •  ${formatCompactBRL(st.total)}`, col1X + colW - 5, y + 3, { align: "right" });

      // Barra de progresso de fundo
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(col1X + 5, y + 4.8, colW - 10, 2.8, 1, 1, "F");

      // Barra preenchida
      if (progressW > 2) {
        doc.setFillColor(...barColor);
        doc.roundedRect(col1X + 5, y + 4.8, Math.max(progressW, 3), 2.8, 1, 1, "F");
      }
    });

    // ─── COLUNA 2: SAÚDE DA CARTEIRA & LINHAS DE CRÉDITO ───
    const col2X = col1X + colW + colGap;
    doc.setFillColor(...THEME.cardBg);
    doc.roundedRect(col2X, mainY, colW, mainH, 2.5, 2.5, "F");
    doc.setDrawColor(...THEME.border);
    doc.roundedRect(col2X, mainY, colW, mainH, 2.5, 2.5, "S");

    // Header da Coluna 2
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(col2X, mainY, colW, 8.5, 2.5, 2.5, "F");
    doc.rect(col2X, mainY + 5.5, colW, 3, "F");
    doc.setDrawColor(...THEME.border);
    doc.line(col2X, mainY + 8.5, col2X + colW, mainY + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...THEME.textMain);
    doc.text("SAÚDE & LINHAS DE CRÉDITO", col2X + 5, mainY + 5.5);

    // Medidor Circular de Regularidade
    const gaugeCenterY = mainY + 23;
    const gaugeCenterX = col2X + colW / 2;

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(4.5);
    doc.circle(gaugeCenterX, gaugeCenterY, 11, "S");

    // Indicador Regularidade
    doc.setDrawColor(pctRegular >= 80 ? 16 : 245, pctRegular >= 80 ? 185 : 158, pctRegular >= 80 ? 129 : 11);
    doc.setLineWidth(4.5);
    doc.circle(gaugeCenterX, gaugeCenterY, 11, "S");

    // Texto Central do Círculo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...THEME.textMain);
    doc.text(`${pctRegular}%`, gaugeCenterX, gaugeCenterY + 1.2, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(...THEME.accentEmerald);
    doc.text("REGULARIDADE", gaugeCenterX, gaugeCenterY + 5.2, { align: "center" });

    // Mini Legenda de Saúde
    const subLegendY = mainY + 38;
    doc.setFillColor(...THEME.accentEmerald);
    doc.circle(col2X + 8, subLegendY, 1.3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...THEME.textMain);
    doc.text(`Aptas / Regulares: ${countRegular} propostas (${pctRegular}%)`, col2X + 11, subLegendY + 1);

    doc.setFillColor(...THEME.accentRed);
    doc.circle(col2X + 8, subLegendY + 5, 1.3, "F");
    doc.text(`Com Restrição: ${countRestricao} propostas (${100 - pctRegular}%)`, col2X + 11, subLegendY + 6);

    // Divisor sutil
    doc.setDrawColor(...THEME.border);
    doc.setLineWidth(0.3);
    doc.line(col2X + 5, subLegendY + 9.5, col2X + colW - 5, subLegendY + 9.5);

    // Bloco Inferior: Top Linhas de Crédito
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...THEME.textMain);
    doc.text("PRINCIPAIS LINHAS DE CRÉDITO", col2X + 5, subLegendY + 14);

    const visibleLinhas = linhaStats.slice(0, 3);
    visibleLinhas.forEach((lin, idx) => {
      const ly = subLegendY + 18 + idx * 7.5;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(col2X + 5, ly - 2, colW - 10, 6, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...THEME.textMain);
      const lName = lin.linha.length > 20 ? lin.linha.substring(0, 18) + ".." : lin.linha;
      doc.text(lName, col2X + 8, ly + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(...THEME.textMuted);
      doc.text(`${lin.count} un  •  ${formatCompactBRL(lin.total)}`, col2X + colW - 8, ly + 2, { align: "right" });
    });

    // ─── COLUNA 3: RANKING DE PROJETISTAS (Mini-Tabela Rigorosamente Enquadrada) ───
    const col3X = col2X + colW + colGap;
    doc.setFillColor(...THEME.cardBg);
    doc.roundedRect(col3X, mainY, colW, mainH, 2.5, 2.5, "F");
    doc.setDrawColor(...THEME.border);
    doc.roundedRect(col3X, mainY, colW, mainH, 2.5, 2.5, "S");

    // Header da Coluna 3
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(col3X, mainY, colW, 8.5, 2.5, 2.5, "F");
    doc.rect(col3X, mainY + 5.5, colW, 3, "F");
    doc.setDrawColor(...THEME.border);
    doc.line(col3X, mainY + 8.5, col3X + colW, mainY + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...THEME.textMain);
    doc.text("RANKING DE PROJETISTAS (VOLUME)", col3X + 5, mainY + 5.5);

    const visibleProj = projRanking.slice(0, 5);
    const projTableData = visibleProj.map((p, idx) => {
      const share = totalValue > 0 ? Math.round((p.total / totalValue) * 100) : 0;
      const medal = idx === 0 ? "1º" : idx === 1 ? "2º" : idx === 2 ? "3º" : `${idx + 1}º`;
      const shortName = p.name.length > 18 ? p.name.substring(0, 16) + ".." : p.name;
      return [medal, shortName, p.count.toString(), formatCompactBRL(p.total), `${share}%`];
    });

    autoTable(doc, {
      startY: mainY + 10,
      head: [["#", "PROJETISTA", "QTD", "VALOR R$", "%"]],
      body: projTableData,
      theme: "plain",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontSize: 5.5,
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 5.5,
        cellPadding: 1.8,
        textColor: [15, 23, 42],
        valign: "middle",
      },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", cellWidth: 7 },
        1: { fontStyle: "bold", cellWidth: 37 },
        2: { halign: "center", cellWidth: 9 },
        3: { halign: "right", fontStyle: "bold", cellWidth: 20 },
        4: { halign: "right", textColor: [100, 116, 139], cellWidth: 9 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: col3X + 2, right: pageW - (col3X + colW - 2) },
    });

    // ── 5. SEÇÃO INFERIOR: CONCENTRAÇÃO GEOGRÁFICA (Faixa: Y = 147mm até Y = 173mm | Altura: 26mm) ──
    // IMPORTANTE: Começa a 147mm (4mm abaixo das 3 colunas que terminam em 143mm) — ZERO SOBREPOSIÇÃO!
    const geoY = 147;
    const geoH = 26;
    doc.setFillColor(...THEME.cardBg);
    doc.roundedRect(14, geoY, pageW - 28, geoH, 2.5, 2.5, "F");
    doc.setDrawColor(...THEME.border);
    doc.roundedRect(14, geoY, pageW - 28, geoH, 2.5, 2.5, "S");

    // Título da faixa geográfica
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...THEME.accentIndigo);
    doc.text("DISTRIBUIÇÃO GEOGRÁFICA REGIONAL (TOP 5 MUNICÍPIOS)", 20, geoY + 5.5);

    const top5Municipios = munRanking.slice(0, 5);
    const munCardW = (pageW - 28 - 16 - 4 * 3.5) / 5; // ~48.5mm cada

    top5Municipios.forEach((m, idx) => {
      const mx = 20 + idx * (munCardW + 3.5);
      const my = geoY + 8.5;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(mx, my, munCardW, 14, 2, 2, "F");
      doc.setDrawColor(...THEME.border);
      doc.roundedRect(mx, my, munCardW, 14, 2, 2, "S");

      // Indicador de posição
      doc.setFillColor(...THEME.accentIndigo);
      doc.rect(mx + 2, my + 2, 1.5, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...THEME.textMain);
      const munTitle = m.name.length > 15 ? m.name.substring(0, 13) + ".." : m.name;
      doc.text(munTitle, mx + 5, my + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      doc.setTextColor(...THEME.textMuted);
      doc.text(`${m.count} propostas cadastradas`, mx + 5, my + 8.5);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...THEME.accentEmerald);
      doc.text(formatCompactBRL(m.total), mx + 5, my + 12);
    });
  }

  // =========================================================================
  // SEÇÃO: PÁGINAS SEGUINTES — DETALHAMENTO ANALÍTICO COMPLETO
  // =========================================================================
  if (reportType === "full" || reportType === "table_only") {
    if (reportType === "full") {
      doc.addPage();
    }

    // Header da Página de Detalhamento
    doc.setFillColor(...THEME.primary);
    doc.rect(0, 0, pageW, 16, "F");

    // Filete colorido
    doc.setFillColor(...THEME.accentEmerald);
    doc.rect(0, 16, pageW, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("PRONAF DIGITAL • DETALHAMENTO TÉCNICO DAS PROPOSTAS EM ESTOQUE", 14, 10);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...THEME.textLight);
    doc.text(`Listagem Analítica Completa  •  Total: ${totalCount} propostas  •  Montante: ${formatBRL(totalValue)}  •  Emissão: ${timestamp}`, 14, 14);

    // Preparação dos Dados da Tabela
    const tableHeaders = [
      "#",
      "PRODUTOR",
      "CPF",
      "PROJETISTA",
      "MUNICÍPIO",
      "LINHA DE CRÉDITO",
      "STATUS",
      "VALOR ESTIMADO",
    ];

    const tableBody = filtered.map((p, idx) => [
      (idx + 1).toString(),
      p.producer_name,
      p.producer_cpf || "---",
      p.projetista,
      p.municipio,
      p.linha_credito,
      p.status,
      formatBRL(p.estimated_value),
    ]);

    autoTable(doc, {
      startY: 21,
      head: [tableHeaders],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 2.2,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.8,
        valign: "middle",
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { fontStyle: "bold", cellWidth: 56 },
        2: { halign: "center", cellWidth: 26 },
        3: { cellWidth: 44 },
        4: { cellWidth: 32 },
        5: { cellWidth: 32 },
        6: { halign: "center", fontStyle: "bold", cellWidth: 38 },
        7: { halign: "right", fontStyle: "bold", cellWidth: 33 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      // Linha de Rodapé da Tabela com Totais
      foot: [
        [
          "",
          `TOTAL GERAL: ${totalCount} PROPOSTAS`,
          "",
          "",
          "",
          "",
          `TICKET MÉDIO: ${formatBRL(avgValue)}`,
          formatBRL(totalValue),
        ],
      ],
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
        fontSize: 7,
        halign: "right",
      },
      margin: { left: 14, right: 14, top: 21, bottom: 16 },
    });
  }

  // =========================================================================
  // RODAPÉ CORPORATIVO EM TODAS AS PÁGINAS (Y = 198mm até 206mm)
  // =========================================================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha divisória fina no rodapé
    doc.setDrawColor(...THEME.border);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 9, pageW - 14, pageH - 9);

    doc.setFontSize(6);
    doc.setTextColor(...THEME.textMuted);
    doc.text(
      `Documento emitido pelo Sistema PRONAF Digital  •  Uso Interno e Confidencial  •  Emissão: ${timestamp}`,
      14,
      pageH - 4.5
    );

    doc.setFont("helvetica", "bold");
    doc.text(`Página ${i} de ${totalPages}`, pageW - 14, pageH - 4.5, { align: "right" });
  }

  // Salvar o arquivo
  const filename = `Relatorio_Executivo_Estoque_PRONAF_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`;
  doc.save(filename);
}
