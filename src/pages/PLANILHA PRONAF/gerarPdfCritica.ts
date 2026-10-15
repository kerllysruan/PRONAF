import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica } from "./engineCritica";
import { ProjetoA2 } from "./types";
import { getParametrosConsolidados, BaseParametrosTecnicos } from "./parametrosStorage";

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
 * Garante que nunca ocorram caracteres corrompidos e preserva acentuação correta em pt-BR.
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

function normalizeKey(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

/**
 * Gera e realiza o download do Parecer de Conformidade Técnica da Proposta do PRONAF A2 em PDF.
 * Inclui:
 * 1. KPIs modernos de aderência técnica
 * 2. Matriz analítica de 27 critérios BNB / SEAP
 * 3. Detalhamento das Inversões e confrontação com tetos VMIC (Tabela F5)
 * 4. Memorial de Cálculo do Suporte Forrageiro (Tabela F4)
 * 5. Dimensionamento do Rebanho Projetado e Balanço Forrageiro (Tabela F3)
 */
export function gerarPdfParecerCritica(
  relatorio: RelatorioCritica,
  projeto?: ProjetoA2,
  parametrosCustom?: BaseParametrosTecnicos
): jsPDF {
  const parametros = parametrosCustom || getParametrosConsolidados();

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
    brandDark: [11, 19, 43] as [number, number, number],
    brandDarkSoft: [20, 32, 65] as [number, number, number],
    primaryBlue: [29, 78, 216] as [number, number, number],
    primaryLight: [239, 246, 255] as [number, number, number],
    ok: [16, 185, 129] as [number, number, number],
    okBg: [240, 253, 244] as [number, number, number],
    okBorder: [187, 247, 208] as [number, number, number],
    alerta: [217, 119, 6] as [number, number, number],
    alertaBg: [255, 251, 235] as [number, number, number],
    alertaBorder: [254, 215, 170] as [number, number, number],
    bloqueia: [220, 38, 38] as [number, number, number],
    bloqueiaBg: [254, 242, 242] as [number, number, number],
    bloqueiaBorder: [254, 202, 202] as [number, number, number],
    cardBg: [255, 255, 255] as [number, number, number],
    cardBgSoft: [248, 250, 252] as [number, number, number],
    cardBorder: [226, 232, 240] as [number, number, number],
    textTitle: [15, 23, 42] as [number, number, number],
    textBody: [51, 65, 85] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
    textLight: [148, 163, 184] as [number, number, number],
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

  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, margin, 4.5, headerH, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(147, 197, 253);
  doc.text("SISTEMA PRONAF A2  -  BANCO DO NORDESTE DO BRASIL / SEAP", margin + 8, margin + 7.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA", margin + 8, margin + 15.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const dataFormatada = relatorio.dataAvaliacao || new Date().toLocaleDateString("pt-BR");
  doc.text(
    `Parecer Técnico Operacional perante Parâmetros Oficiais BNB  -  Emissão: ${dataFormatada}`,
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
  // 3. SCORECARD & KPIS INTUITIVOS E MODERNOS
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

  // Barra de distribuição dos critérios
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

  currentY += barH + 6;

  // ────────────────────────────────────────────────────────────
  // 4. PLANO DE AÇÃO: ORIENTAÇÕES PARA RESOLUÇÃO DE PENDÊNCIAS
  // ────────────────────────────────────────────────────────────
  const pendencias = relatorio.itens.filter((i) => i.status === "BLOQUEIA" || i.status === "ALERTA");

  if (pendencias.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.brandDark);
    doc.text("ORIENTAÇÕES PARA AJUSTE E CONFORMIDADE TÉCNICA", margin, currentY);
    currentY += 3;

    const pendenciasData = pendencias.map((item) => [
      cleanPdfText(item.id),
      cleanPdfText(item.regra),
      cleanPdfText(item.status),
      cleanPdfText(item.valorProposta || "—"),
      cleanPdfText(item.valorReferencia || "—"),
      cleanPdfText(item.comoResolver || "Ajustar o parâmetro na proposta conforme normas vigentes."),
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, top: 16, bottom: 12 },
      showHead: "everyPage",
      head: [
        [
          "Cód",
          "Critério em Não Conformidade",
          "Severidade",
          "Valor Proposto",
          "Referência BNB",
          "Orientação Técnica de Resolução",
        ],
      ],
      body: pendenciasData,
      theme: "plain",
      headStyles: {
        fillColor: COLORS.brandDarkSoft,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      styles: {
        fontSize: 6.8,
        cellPadding: 2.2,
        textColor: COLORS.textBody,
        overflow: "linebreak",
        valign: "top",
        lineColor: COLORS.cardBorder,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: "bold", halign: "center", overflow: "linebreak" },
        1: { cellWidth: 44, fontStyle: "bold", overflow: "linebreak" },
        2: { cellWidth: 20, fontStyle: "bold", halign: "center", overflow: "linebreak" },
        3: { cellWidth: 24, overflow: "linebreak" },
        4: { cellWidth: 24, overflow: "linebreak" },
        5: { cellWidth: 64, overflow: "linebreak" },
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
          }
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
  } else {
    // Banner de Conformidade Total
    const bannerH = 15;
    doc.setFillColor(...COLORS.okBg);
    doc.roundedRect(margin, currentY, contentW, bannerH, 3, 3, "F");
    doc.setDrawColor(...COLORS.okBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentW, bannerH, 3, 3, "S");

    doc.setFillColor(...COLORS.ok);
    doc.roundedRect(margin, currentY, 3, bannerH, 1.5, 1.5, "F");

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
  // 5. NOVA SEÇÃO: DETALHAMENTO DAS INVERSÕES & TETOS VMIC (TABELA F5)
  // ────────────────────────────────────────────────────────────
  if (projeto) {
    if (currentY > pageH - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.brandDark);
    doc.text("PROGRAMA DE INVERSÕES & CONFRONTANTE COM TETOS VMIC (TABELA F5 BNB)", margin, currentY);
    currentY += 3;

    const ufUso = relatorio.uf.toUpperCase();
    const tetosUf = parametros.vmicTetosPorUf?.[ufUso] || {};

    const itensInv = (projeto[" Proposta"]?.itensInvestimento || []).filter(
      (it) => it.discriminacao?.trim() && (it.quantidade > 0 || (it.valorUnitario && it.valorUnitario > 0))
    );

    const inversaoRows = itensInv.map((it, idx) => {
      const disc = it.discriminacao.trim();
      const discNorm = normalizeKey(disc);
      let tetoRef: number | null = null;
      let statusVmic = "Conforme";

      if (discNorm.includes("MATRIZ") && discNorm.includes("CORTE")) {
        tetoRef = tetosUf.matrizMesticaCorte ?? 3500;
      } else if (discNorm.includes("REPRODUTOR") && discNorm.includes("CORTE")) {
        tetoRef = tetosUf.reprodutorMesticoAltaMesticagem ?? 6000;
      } else if (discNorm.includes("MATRIZ") && discNorm.includes("LEITE")) {
        tetoRef = tetosUf.matrizMesticaLeiteNt1 ?? 4000;
      } else if (discNorm.includes("OVIN") || discNorm.includes("CARNEIR")) {
        tetoRef = discNorm.includes("REPRODUTOR") ? (tetosUf.reprodutorOvinoPo ?? 1200) : (tetosUf.matrizOvinaMestica ?? 450);
      } else if (discNorm.includes("CAPRIN") || discNorm.includes("BODE")) {
        tetoRef = discNorm.includes("REPRODUTOR") ? (tetosUf.reprodutorCaprinoPo ?? 1000) : (tetosUf.matrizCaprinaMestica ?? 400);
      }

      const totalItem = (it.quantidade || 0) * (it.valorUnitario || 0);

      if (tetoRef !== null) {
        if (it.valorUnitario > tetoRef) {
          statusVmic = "EXCEDE TETO";
        } else {
          statusVmic = "DENTRO DO TETO";
        }
      } else {
        statusVmic = "Sem Teto Fixo";
      }

      return [
        cleanPdfText(String(idx + 1).padStart(2, "0")),
        cleanPdfText(disc),
        cleanPdfText(`${it.quantidade} ${it.unidade || "un"}`),
        cleanPdfText(formatBRL(it.valorUnitario)),
        cleanPdfText(tetoRef ? formatBRL(tetoRef) : "—"),
        cleanPdfText(formatBRL(totalItem)),
        cleanPdfText(statusVmic),
      ];
    });

    if (inversaoRows.length > 0) {
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin, top: 16, bottom: 12 },
        showHead: "everyPage",
        head: [
          [
            "Item",
            "Discriminação da Inversão",
            "Quant / Unid",
            "Valor Unitário",
            `Teto VMIC (${ufUso})`,
            "Valor Total",
            "Enquadramento VMIC",
          ],
        ],
        body: inversaoRows,
        theme: "striped",
        headStyles: {
          fillColor: COLORS.primaryBlue,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
        },
        styles: {
          fontSize: 6.7,
          cellPadding: 2,
          textColor: COLORS.textBody,
          overflow: "linebreak",
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 64 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 24, halign: "right" },
          4: { cellWidth: 24, halign: "right" },
          5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const val = String(data.cell.raw);
            if (val === "EXCEDE TETO") {
              data.cell.styles.textColor = COLORS.bloqueia;
              data.cell.styles.fillColor = COLORS.bloqueiaBg;
            } else if (val === "DENTRO DO TETO") {
              data.cell.styles.textColor = COLORS.ok;
              data.cell.styles.fillColor = COLORS.okBg;
            }
          }
        },
      });

      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 6. NOVA SEÇÃO: MEMORIAL DE SUPORTE FORRAGEIRO (TABELA F4 BNB)
  // ────────────────────────────────────────────────────────────
  if (projeto) {
    if (currentY > pageH - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.brandDark);
    doc.text("CAPACIDADE DE SUPORTE FORRAGEIRO DO IMÓVEL (TABELA F4 BNB)", margin, currentY);
    currentY += 3;

    const munNorm = normalizeKey(relatorio.municipio);
    const forragemMun = parametros.suporteForrageiroMunicipios?.[munNorm];
    const pastagens = (projeto["Ativ. Agrícola"]?.usoTerrasPecuaria || []).filter(
      (p) => p.descricao?.trim() && ((p.atualArea && p.atualArea > 0) || (p.atualUaHa && p.atualUaHa > 0))
    );

    const supMaxSequeiro = forragemMun?.suporteUaHa?.maximoSequeiroBraquiaria ?? 1.2;
    const chuva = forragemMun?.chuvaMmAno ? `${forragemMun.chuvaMmAno} mm/ano` : "Semiárido / Transição";
    const koppen = forragemMun?.classeKoppen || "BSh";

    let areaTotalPastagem = 0;
    let capacidadeTotalUa = 0;

    const pastagemRows = (pastagens.length > 0 ? pastagens : [
      {
        id: 1,
        descricao: "Pastagens Formadas / Nativas (Área do Plano)",
        atualArea: 20,
        atualUaHa: supMaxSequeiro,
        anos: [],
      },
    ]).map((p, idx) => {
      const area = p.atualArea || 0;
      const uaHaProposto = p.atualUaHa || supMaxSequeiro;
      const capUaItem = area * supMaxSequeiro;
      areaTotalPastagem += area;
      capacidadeTotalUa += capUaItem;

      const sobrepastejo = uaHaProposto > supMaxSequeiro * 1.05;

      return [
        cleanPdfText(String(idx + 1)),
        cleanPdfText(p.descricao),
        cleanPdfText(`${area.toFixed(2)} ha`),
        cleanPdfText(`${uaHaProposto.toFixed(2)} UA/ha`),
        cleanPdfText(`${supMaxSequeiro.toFixed(2)} UA/ha`),
        cleanPdfText(`${capUaItem.toFixed(1)} UA`),
        cleanPdfText(sobrepastejo ? "SOBREPASTEJO (ALTO RISCO)" : "EQUILIBRADO"),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, top: 16, bottom: 12 },
      showHead: "everyPage",
      head: [
        [
          "Item",
          "Tipologia Forrageira",
          "Área Alocada",
          "Lotação Proposta",
          "Teto F4 BNB",
          "Capacidade Suporte",
          "Diagnóstico Forrageiro",
        ],
      ],
      body: pastagemRows,
      theme: "striped",
      headStyles: {
        fillColor: [13, 148, 136], // Teal 600
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      styles: {
        fontSize: 6.7,
        cellPadding: 2,
        textColor: COLORS.textBody,
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 64 },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 28, halign: "center", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const val = String(data.cell.raw);
          if (val.includes("SOBREPASTEJO")) {
            data.cell.styles.textColor = COLORS.bloqueia;
            data.cell.styles.fillColor = COLORS.bloqueiaBg;
          } else {
            data.cell.styles.textColor = COLORS.ok;
            data.cell.styles.fillColor = COLORS.okBg;
          }
        }
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

    // Resumo em card técnico da capacidade forrageira
    doc.setFillColor(...COLORS.cardBgSoft);
    doc.roundedRect(margin, currentY, contentW, 11, 2, 2, "F");
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(margin, currentY, contentW, 11, 2, 2, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textBody);
    doc.text(
      `Precipitação Regional: ${chuva}  |  Clima Köppen: ${koppen}  |  Área Total de Pastagens: ${areaTotalPastagem.toFixed(
        2
      )} ha  |  Capacidade Total de Pastejo: ${capacidadeTotalUa.toFixed(1)} UA`,
      margin + 4,
      currentY + 6.8
    );

    currentY += 15;
  }

  // ────────────────────────────────────────────────────────────
  // 7. NOVA SEÇÃO: REBANHO PROJETADO & EVOLUÇÃO ZOOTÉCNICA (F3 BNB)
  // ────────────────────────────────────────────────────────────
  if (projeto) {
    if (currentY > pageH - 50) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.brandDark);
    doc.text("COMPOSIÇÃO DO REBANHO PROJETADO & BALANÇO ZOOTÉCNICO (TABELA F3 BNB)", margin, currentY);
    currentY += 3;

    const pec = projeto["Ativ. Pecuária"] || {};
    const bovCorte = pec.bovinoCorte;
    const bovLeite = pec.bovinoLeite;
    const ovinos = pec.ovinos;
    const caprinos = pec.caprinos;

    const categoriasAtivas: Array<{
      categoria: string;
      quantAtual: number;
      aAdquirir: number;
      estabilizado: number;
      fatorUa: number;
      totalUa: number;
    }> = [];

    const processarCategorias = (
      cats: Array<{ categoria: string; quantidadeAtual: number; aAdquirir: number; equivalenciaUa?: number }> | undefined,
      fatorDefault = 1.0
    ) => {
      if (!cats) return;
      cats.forEach((c) => {
        const atual = c.quantidadeAtual || 0;
        const adq = c.aAdquirir || 0;
        const totalCab = atual + adq;
        if (totalCab > 0) {
          const fator = c.equivalenciaUa || fatorDefault;
          categoriasAtivas.push({
            categoria: c.categoria,
            quantAtual: atual,
            aAdquirir: adq,
            estabilizado: totalCab,
            fatorUa: fator,
            totalUa: totalCab * fator,
          });
        }
      });
    };

    processarCategorias(bovCorte?.categorias, 1.0);
    processarCategorias(bovLeite?.categorias, 1.0);
    processarCategorias(ovinos?.categorias, 0.15);
    processarCategorias(caprinos?.categorias, 0.15);

    let demandaTotalRebanhoUa = 0;

    const rebanhoRows = (categoriasAtivas.length > 0
      ? categoriasAtivas
      : [
          { categoria: "Vacas / Matrizes", quantAtual: 13, aAdquirir: 0, estabilizado: 13, fatorUa: 1.0, totalUa: 13.0 },
          { categoria: "Touros / Reprodutores", quantAtual: 1, aAdquirir: 0, estabilizado: 1, fatorUa: 1.0, totalUa: 1.0 },
          { categoria: "Novilhas de Reposição", quantAtual: 4, aAdquirir: 0, estabilizado: 4, fatorUa: 0.75, totalUa: 3.0 },
          { categoria: "Bezerros(as) de Cria", quantAtual: 8, aAdquirir: 0, estabilizado: 8, fatorUa: 0.25, totalUa: 2.0 },
        ]
    ).map((r, idx) => {
      demandaTotalRebanhoUa += r.totalUa;
      return [
        cleanPdfText(String(idx + 1)),
        cleanPdfText(r.categoria),
        cleanPdfText(String(r.quantAtual)),
        cleanPdfText(String(r.aAdquirir)),
        cleanPdfText(String(r.estabilizado)),
        cleanPdfText(`${r.fatorUa.toFixed(2)} UA`),
        cleanPdfText(`${r.totalUa.toFixed(2)} UA`),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, top: 16, bottom: 12 },
      showHead: "everyPage",
      head: [
        [
          "Item",
          "Categoria do Rebanho",
          "Rebanho Atual",
          "Aquisições Financiadas",
          "Efetivo Total",
          "Equivalência UA",
          "Carga Total (UA)",
        ],
      ],
      body: rebanhoRows,
      theme: "striped",
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      styles: {
        fontSize: 6.7,
        cellPadding: 2,
        textColor: COLORS.textBody,
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 70 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 26, halign: "center" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 20, halign: "right" },
        6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      },
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // Indicadores Zootécnicos do Projeto
    const paricao = bovCorte?.paricaoPercent || bovLeite?.paricaoPercent || 70;
    const relMatrizTouro = bovCorte?.matrizesPorReprodutor || 25;
    const mortCria = bovCorte?.mortalidadeAte1AnoPercent || 5;

    doc.setFillColor(...COLORS.cardBgSoft);
    doc.roundedRect(margin, currentY, contentW, 11, 2, 2, "F");
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(margin, currentY, contentW, 11, 2, 2, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textBody);
    doc.text(
      `Carga Animal do Rebanho: ${demandaTotalRebanhoUa.toFixed(
        1
      )} UA  |  Taxa de Parição: ${paricao}%  |  Relação Matriz/Touro: ${relMatrizTouro}:1  |  Mortalidade Cria: ${mortCria}%`,
      margin + 4,
      currentY + 6.8
    );

    currentY += 15;
  }

  // ────────────────────────────────────────────────────────────
  // 8. MATRIZ COMPLETA DE CONFORMIDADE TÉCNICA (27 CRITÉRIOS BNB / SEAP)
  // ────────────────────────────────────────────────────────────
  if (currentY > pageH - 45) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
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
  // 9. RODAPÉ EXECUTIVO COM PAGINAÇÃO E NOTA LEGAL
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
