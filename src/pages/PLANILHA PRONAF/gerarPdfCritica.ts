import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica } from "./engineCritica";

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Sanitiza e normaliza caracteres especiais para codificação segura no jsPDF (Helvetica / WinAnsi).
 * Garante que nunca ocorram caracteres corrompidos ("d, ?, etc.) e preserva acentuação correta em pt-BR.
 */
function cleanPdfText(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/<= /g, "<= ")
    .replace(/>= /g, ">= ")
    .replace(/≤/g, "<= ")
    .replace(/≥/g, ">= ")
    .replace(/[−–—]/g, "-")
    .replace(/×/g, "x")
    .replace(/÷/g, "/")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "-")
    .replace(/✓/g, "OK")
    .trim();
}

/**
 * Gera e realiza o download do Parecer de Conformidade Técnica da Proposta do PRONAF A2 em PDF.
 * Layout executivo de nível aeroespacial com quebra automática de linha em todas as células,
 * cabeçalhos dinâmicos em páginas adicionais e KPIs modernos e intuitivos.
 */
export function gerarPdfParecerCritica(relatorio: RelatorioCritica): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;

  // Paleta de cores corporativa executiva moderna (Design System NASA / Fintech)
  const COLORS = {
    brandDark: [11, 19, 43] as [number, number, number],       // Deep Space Slate
    brandDarkSoft: [20, 32, 65] as [number, number, number],   // Slate Médio
    primaryBlue: [29, 78, 216] as [number, number, number],    // Royal Blue 700
    primaryLight: [239, 246, 255] as [number, number, number], // Blue 50
    ok: [16, 185, 129] as [number, number, number],            // Emerald 500
    okBg: [240, 253, 244] as [number, number, number],          // Emerald 50
    okBorder: [187, 247, 208] as [number, number, number],      // Emerald 200
    alerta: [217, 119, 6] as [number, number, number],          // Amber 600
    alertaBg: [255, 251, 235] as [number, number, number],      // Amber 50
    alertaBorder: [254, 215, 170] as [number, number, number],  // Amber 200
    bloqueia: [220, 38, 38] as [number, number, number],        // Crimson 600
    bloqueiaBg: [254, 242, 242] as [number, number, number],    // Red 50
    bloqueiaBorder: [254, 202, 202] as [number, number, number],// Red 200
    cardBg: [255, 255, 255] as [number, number, number],
    cardBgSoft: [248, 250, 252] as [number, number, number],   // Slate 50
    cardBorder: [226, 232, 240] as [number, number, number],   // Slate 200
    textTitle: [15, 23, 42] as [number, number, number],       // Slate 900
    textBody: [51, 65, 85] as [number, number, number],         // Slate 700
    textMuted: [100, 116, 139] as [number, number, number],     // Slate 500
    textLight: [148, 163, 184] as [number, number, number],     // Slate 400
  };

  const isBloqueia = relatorio.statusGeral === "BLOQUEIA";
  const isAlerta = relatorio.statusGeral === "ALERTA";

  const statusColor = isBloqueia ? COLORS.bloqueia : isAlerta ? COLORS.alerta : COLORS.ok;
  const statusBg = isBloqueia ? COLORS.bloqueiaBg : isAlerta ? COLORS.alertaBg : COLORS.okBg;
  const statusBorder = isBloqueia ? COLORS.bloqueiaBorder : isAlerta ? COLORS.alertaBorder : COLORS.okBorder;

  // ────────────────────────────────────────────────────────────
  // 1. HERO HEADER: CABEÇALHO EXECUTIVO MODERNO
  // ────────────────────────────────────────────────────────────
  const headerH = 29;
  doc.setFillColor(...COLORS.brandDark);
  doc.roundedRect(margin, margin, contentW, headerH, 3.5, 3.5, "F");

  // Faixa de destaque lateral com indicador de conformidade
  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, margin, 4.5, headerH, 2, 2, "F");

  // Tag superior institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(147, 197, 253);
  doc.text("SISTEMA PRONAF A2  -  BANCO DO NORDESTE DO BRASIL / SEAP", margin + 8, margin + 7.5);

  // Título do Relatório (Conforme solicitado)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA", margin + 8, margin + 15.5);

  // Subtítulo e data
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dataFormatada = relatorio.dataAvaliacao || new Date().toLocaleDateString("pt-BR");
  doc.text(
    `Parecer de Enquadramento Operacional perante 27 Parâmetros Oficiais BNB  -  Emissão: ${dataFormatada}`,
    margin + 8,
    margin + 23
  );

  // Badge de Status Geral no canto superior direito
  const badgeW = 46;
  const badgeH = 15;
  const badgeX = pageW - margin - badgeW - 4;
  const badgeY = margin + 7;

  doc.setFillColor(...statusBg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "F");
  doc.setDrawColor(...statusBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...statusColor);
  doc.text("STATUS DA PROPOSTA", badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });

  doc.setFontSize(8.5);
  const statusLabel = isBloqueia
    ? "BLOQUEIO TÉCNICO"
    : isAlerta
    ? "REQUER ATENÇÃO"
    : "TOTALMENTE CONFORME";
  doc.text(statusLabel, badgeX + badgeW / 2, badgeY + 11, { align: "center" });

  // ────────────────────────────────────────────────────────────
  // 2. CARD MODERNO DO PROPONENTE E LOCALIZAÇÃO
  // ────────────────────────────────────────────────────────────
  let currentY = margin + headerH + 3.5;
  const propCardH = 25;

  doc.setFillColor(...COLORS.cardBgSoft);
  doc.roundedRect(margin, currentY, contentW, propCardH, 3, 3, "F");
  doc.setDrawColor(...COLORS.cardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentW, propCardH, 3, 3, "S");

  const colW = contentW / 4;
  doc.setDrawColor(...COLORS.cardBorder);
  doc.line(margin + colW, currentY + 3, margin + colW, currentY + propCardH - 3);
  doc.line(margin + colW * 2, currentY + 3, margin + colW * 2, currentY + propCardH - 3);
  doc.line(margin + colW * 3, currentY + 3, margin + colW * 3, currentY + propCardH - 3);

  // Coluna 1: Proponente
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("PROPONENTE", margin + 4, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textTitle);
  const nomeLimitado =
    relatorio.proponenteNome.length > 24
      ? relatorio.proponenteNome.substring(0, 22) + "..."
      : relatorio.proponenteNome;
  doc.text(nomeLimitado, margin + 4, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textBody);
  doc.text(`CPF: ${relatorio.proponenteCpf || "Não informado"}`, margin + 4, currentY + 18);

  // Coluna 2: Localização e Região
  const col2X = margin + colW + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("LOCALIZAÇÃO DO IMÓVEL", col2X, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textTitle);
  const munLimitado =
    relatorio.municipio.length > 22
      ? relatorio.municipio.substring(0, 20) + "..."
      : `${relatorio.municipio} - ${relatorio.uf}`;
  doc.text(munLimitado, col2X, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textBody);
  doc.text(`Estado Federado: ${relatorio.uf}`, col2X, currentY + 18);

  // Coluna 3: Programa e Atividade
  const col3X = margin + colW * 2 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("PROGRAMA & ATIVIDADE", col3X, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textTitle);
  const prgLimitado =
    relatorio.programa.length > 24
      ? relatorio.programa.substring(0, 22) + "..."
      : relatorio.programa;
  doc.text(prgLimitado, col3X, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textBody);
  const ativLimitada =
    relatorio.atividadePrincipal.length > 24
      ? relatorio.atividadePrincipal.substring(0, 22) + "..."
      : relatorio.atividadePrincipal;
  doc.text(ativLimitada, col3X, currentY + 18);

  // Coluna 4: Investimento e Validação
  const col4X = margin + colW * 3 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("INVESTIMENTO PROPOSTO", col4X, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.primaryBlue);
  doc.text(formatBRL(relatorio.valorFinanciado), col4X, currentY + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Base Normativa BNB: Vigente", col4X, currentY + 18);

  currentY += propCardH + 3.5;

  // ────────────────────────────────────────────────────────────
  // 3. SCORECARD & KPIS INTUITIVOS E MODERNOS (DESIGN EXECUTIVO)
  // ────────────────────────────────────────────────────────────
  const taxaConformidade = Math.round((relatorio.totalOk / relatorio.totalRegras) * 100);

  const kpiCardH = 21;
  const kpiGap = 3;
  const gaugeW = 48;
  const restW = (contentW - gaugeW - kpiGap * 3) / 3;

  // KPI 1: SCORECARD RADIAL DE ADERÊNCIA
  doc.setFillColor(...COLORS.cardBg);
  doc.roundedRect(margin, currentY, gaugeW, kpiCardH, 3, 3, "F");
  doc.setDrawColor(...COLORS.cardBorder);
  doc.roundedRect(margin, currentY, gaugeW, kpiCardH, 3, 3, "S");

  const cx = margin + 11;
  const cy = currentY + kpiCardH / 2;
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(3);
  doc.circle(cx, cy, 6.8, "S");

  doc.setDrawColor(...statusColor);
  doc.setLineWidth(3);
  doc.circle(cx, cy, 6.8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textTitle);
  doc.text(`${taxaConformidade}%`, cx, cy + 1, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("ADERÊNCIA BNB", cx + 11, currentY + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...statusColor);
  doc.text(
    taxaConformidade === 100
      ? "Plena (100%)"
      : taxaConformidade >= 80
      ? "Elevada"
      : "Requer Ajuste",
    cx + 11,
    currentY + 12.5
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...COLORS.textLight);
  doc.text(`${relatorio.totalOk} de ${relatorio.totalRegras} critérios`, cx + 11, currentY + 17.5);

  // KPI 2: CONFORMES (OK)
  const kpi2X = margin + gaugeW + kpiGap;
  doc.setFillColor(...COLORS.okBg);
  doc.roundedRect(kpi2X, currentY, restW, kpiCardH, 3, 3, "F");
  doc.setDrawColor(...COLORS.okBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(kpi2X, currentY, restW, kpiCardH, 3, 3, "S");
  doc.setFillColor(...COLORS.ok);
  doc.roundedRect(kpi2X, currentY, 2.5, kpiCardH, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.ok);
  doc.text("CRITÉRIOS CONFORMES", kpi2X + 5, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.ok);
  doc.text(String(relatorio.totalOk), kpi2X + 5, currentY + 13.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Parâmetros plenamente atendidos", kpi2X + 5, currentY + 18);

  // KPI 3: ADVERTÊNCIAS (ALERTAS)
  const kpi3X = kpi2X + restW + kpiGap;
  doc.setFillColor(...COLORS.alertaBg);
  doc.roundedRect(kpi3X, currentY, restW, kpiCardH, 3, 3, "F");
  doc.setDrawColor(...COLORS.alertaBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(kpi3X, currentY, restW, kpiCardH, 3, 3, "S");
  doc.setFillColor(...COLORS.alerta);
  doc.roundedRect(kpi3X, currentY, 2.5, kpiCardH, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.alerta);
  doc.text("ADVERTÊNCIAS TÉCNICAS", kpi3X + 5, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.alerta);
  doc.text(String(relatorio.totalAlertas), kpi3X + 5, currentY + 13.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Requerem atenção ou justificativa", kpi3X + 5, currentY + 18);

  // KPI 4: IMPEDIMENTOS (BLOQUEIOS)
  const kpi4X = kpi3X + restW + kpiGap;
  doc.setFillColor(...COLORS.bloqueiaBg);
  doc.roundedRect(kpi4X, currentY, restW, kpiCardH, 3, 3, "F");
  doc.setDrawColor(...COLORS.bloqueiaBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(kpi4X, currentY, restW, kpiCardH, 3, 3, "S");
  doc.setFillColor(...COLORS.bloqueia);
  doc.roundedRect(kpi4X, currentY, 2.5, kpiCardH, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.bloqueia);
  doc.text("IMPEDIMENTOS (BLOQUEIA)", kpi4X + 5, currentY + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.bloqueia);
  doc.text(String(relatorio.totalBloqueios), kpi4X + 5, currentY + 13.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("Impedem aprovação bancária", kpi4X + 5, currentY + 18);

  currentY += kpiCardH + 3;

  // ── BARRA TRI-COLOR DE DISTRIBUIÇÃO DOS CRITÉRIOS ──
  const barH = 2.8;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentW, barH, 1.4, 1.4, "F");

  const pctOk = (relatorio.totalOk / relatorio.totalRegras) * contentW;
  const pctAlerta = (relatorio.totalAlertas / relatorio.totalRegras) * contentW;
  const pctBloq = (relatorio.totalBloqueios / relatorio.totalRegras) * contentW;

  let currentBarX = margin;
  if (pctOk > 0) {
    doc.setFillColor(...COLORS.ok);
    doc.roundedRect(currentBarX, currentY, pctOk, barH, 1, 1, "F");
    currentBarX += pctOk;
  }
  if (pctAlerta > 0) {
    doc.setFillColor(...COLORS.alerta);
    doc.rect(currentBarX, currentY, pctAlerta, barH, "F");
    currentBarX += pctAlerta;
  }
  if (pctBloq > 0) {
    doc.setFillColor(...COLORS.bloqueia);
    doc.roundedRect(currentBarX, currentY, pctBloq, barH, 1, 1, "F");
  }

  currentY += barH + 4;

  // ────────────────────────────────────────────────────────────
  // 4. SEÇÃO: PONTOS DE ATENÇÃO E INSTRUÇÕES DE RESOLUÇÃO
  // ────────────────────────────────────────────────────────────
  const pendencias = relatorio.itens.filter(
    (i) => i.status === "BLOQUEIA" || i.status === "ALERTA"
  );

  if (pendencias.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(isBloqueia ? COLORS.bloqueia : COLORS.alerta));
    doc.text(
      `PONTOS DE ATENÇÃO E INSTRUÇÕES DE RESOLUÇÃO (${pendencias.length} ITENS PENDENTES)`,
      margin,
      currentY
    );
    currentY += 3;

    const dataTabelaPendencias = pendencias.map((item) => [
      cleanPdfText(item.id),
      cleanPdfText(item.status),
      cleanPdfText(item.regra),
      cleanPdfText(item.valorProposta || "Não informado"),
      cleanPdfText(item.valorReferencia || "—"),
      cleanPdfText(item.comoResolver),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, top: 16, bottom: 12 },
      showHead: "everyPage",
      head: [
        [
          "Cód.",
          "Severidade",
          "Critério Técnico Avaliado",
          "Informado na Proposta",
          "Parâmetro Oficial BNB",
          "Instrução Técnica (Como Resolver)",
        ],
      ],
      body: dataTabelaPendencias,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.brandDark,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        halign: "left",
      },
      styles: {
        fontSize: 6.6,
        cellPadding: 2,
        textColor: COLORS.textBody,
        overflow: "linebreak",
        valign: "middle",
        minCellHeight: 6,
      },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: "bold", halign: "center", overflow: "linebreak" },
        1: { cellWidth: 20, fontStyle: "bold", halign: "center", overflow: "linebreak" },
        2: { cellWidth: 38, fontStyle: "bold", overflow: "linebreak" },
        3: { cellWidth: 23, overflow: "linebreak" },
        4: { cellWidth: 24, overflow: "linebreak" },
        5: { cellWidth: 71, textColor: COLORS.textTitle, overflow: "linebreak" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = String(data.cell.raw);
          if (val === "BLOQUEIA") {
            data.cell.styles.textColor = COLORS.bloqueia;
            data.cell.styles.fillColor = COLORS.bloqueiaBg;
          } else if (val === "ALERTA") {
            data.cell.styles.textColor = COLORS.alerta;
            data.cell.styles.fillColor = COLORS.alertaBg;
          }
        }
        if (data.section === "body" && data.column.index === 5) {
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          // Cabeçalho institucional dinâmico em páginas subsequentes
          doc.setFillColor(...COLORS.brandDark);
          doc.roundedRect(margin, 5, contentW, 8.5, 2, 2, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA  -  BANCO DO NORDESTE DO BRASIL / SEAP", margin + 4, 10.5);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(203, 213, 225);
          doc.text(`Proponente: ${nomeLimitado}  -  CPF: ${relatorio.proponenteCpf || "—"}`, pageW - margin - 4, 10.5, { align: "right" });
        }
      },
    });

    const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
    currentY = (docWithAutoTable.lastAutoTable?.finalY ?? currentY) + 7;
  } else {
    // Banner elegante de 100% em Conformidade
    const bannerH = 14;
    doc.setFillColor(...COLORS.okBg);
    doc.roundedRect(margin, currentY, contentW, bannerH, 2.5, 2.5, "F");
    doc.setDrawColor(...COLORS.okBorder);
    doc.roundedRect(margin, currentY, contentW, bannerH, 2.5, 2.5, "S");
    doc.setFillColor(...COLORS.ok);
    doc.roundedRect(margin, currentY, 3, bannerH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.ok);
    doc.text("PROPOSTA EM PLENA CONFORMIDADE TÉCNICA COM O BNB", margin + 7, currentY + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.textBody);
    doc.text(
      "Nenhuma inconformidade técnica ou advertência foi identificada. Todos os parâmetros atendem aos Manuais de Crédito do BNB.",
      margin + 7,
      currentY + 10.5
    );

    currentY += bannerH + 7;
  }

  // ────────────────────────────────────────────────────────────
  // 5. MATRIZ COMPLETA DE CONFORMIDADE TÉCNICA (27 CRITÉRIOS BNB / SEAP)
  // ────────────────────────────────────────────────────────────
  if (currentY > pageH - 45) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.brandDark);
  doc.text("MATRIZ COMPLETA DE CONFORMIDADE TÉCNICA (27 CRITÉRIOS BNB / SEAP)", margin, currentY);
  currentY += 3;

  const todasRegrasData = relatorio.itens.map((item) => [
    cleanPdfText(item.id),
    cleanPdfText(item.regra),
    cleanPdfText(item.status),
    cleanPdfText(item.valorProposta || "—"),
    cleanPdfText(item.valorReferencia || "—"),
    cleanPdfText(item.fonte),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, top: 16, bottom: 12 },
    showHead: "everyPage",
    head: [
      [
        "ID",
        "Critério Técnico Avaliado",
        "Conformidade",
        "Informado na Proposta",
        "Parâmetro Oficial BNB",
        "Base",
      ],
    ],
    body: todasRegrasData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.brandDark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    styles: {
      fontSize: 6.6,
      cellPadding: 2,
      textColor: COLORS.textBody,
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: 5.5,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", halign: "center", overflow: "linebreak" },
      1: { cellWidth: 70, overflow: "linebreak" },
      2: { cellWidth: 22, fontStyle: "bold", halign: "center", overflow: "linebreak" },
      3: { cellWidth: 30, overflow: "linebreak" },
      4: { cellWidth: 40, overflow: "linebreak" },
      5: { cellWidth: 14, halign: "center", fontStyle: "bold", overflow: "linebreak" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const val = String(data.cell.raw);
        if (val === "BLOQUEIA") {
          data.cell.styles.textColor = COLORS.bloqueia;
          data.cell.styles.fillColor = COLORS.bloqueiaBg;
        } else if (val === "ALERTA") {
          data.cell.styles.textColor = COLORS.alerta;
          data.cell.styles.fillColor = COLORS.alertaBg;
        } else if (val === "OK") {
          data.cell.styles.textColor = COLORS.ok;
          data.cell.styles.fillColor = COLORS.okBg;
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        // Cabeçalho institucional dinâmico em páginas subsequentes
        doc.setFillColor(...COLORS.brandDark);
        doc.roundedRect(margin, 5, contentW, 8.5, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA  -  BANCO DO NORDESTE DO BRASIL / SEAP", margin + 4, 10.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(203, 213, 225);
        doc.text(`Proponente: ${nomeLimitado}  -  CPF: ${relatorio.proponenteCpf || "—"}`, pageW - margin - 4, 10.5, { align: "right" });
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // 6. RODAPÉ EXECUTIVO COM PAGINAÇÃO E NOTA LEGAL
  // ────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  const dataHoraEmissao = `${dataFormatada} às ${new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 9, pageW - margin, pageH - 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      "Documento técnico emitido para subsidiar a formalização da proposta perante o Banco do Nordeste do Brasil (BNB) e SEAP.",
      margin,
      pageH - 5.5
    );

    doc.setFont("helvetica", "bold");
    doc.text(
      `Página ${i} de ${totalPages}  -  Emitido em ${dataHoraEmissao}`,
      pageW - margin,
      pageH - 5.5,
      { align: "right" }
    );
  }

  // Nome padronizado do arquivo para download
  const cleanCpf = (relatorio.proponenteCpf || "PROPOSTA").replace(/\D/g, "");
  const nomeArquivo = `Conformidade_Tecnica_PRONAF_${cleanCpf || "BNB"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
  return doc;
}
