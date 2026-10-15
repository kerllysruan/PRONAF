import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica } from "./engineCritica";
import { ProjetoA2 } from "./types";
import { getParametrosConsolidados, BaseParametrosTecnicos } from "./parametrosStorage";

/* ═══════════════════════════════════════════════════════════════════
   UTILITÁRIOS DE FORMATAÇÃO
   ═══════════════════════════════════════════════════════════════════ */

function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
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

/* ═══════════════════════════════════════════════════════════════════
   PALETA DE CORES CORPORATIVA — Design System Executivo BNB
   ═══════════════════════════════════════════════════════════════════ */

type RGB = [number, number, number];

const C = {
  // Fundos principais
  brandDark:    [11, 19, 43]    as RGB,
  brandMid:     [20, 32, 65]    as RGB,
  navy:         [30, 58, 138]   as RGB,
  // Acentos
  blue:         [29, 78, 216]   as RGB,
  blueLight:    [239, 246, 255] as RGB,
  teal:         [13, 148, 136]  as RGB,
  tealBg:       [240, 253, 250] as RGB,
  indigo:       [79, 70, 229]   as RGB,
  indigoBg:     [238, 242, 255] as RGB,
  // Status
  ok:           [16, 185, 129]  as RGB,
  okBg:         [240, 253, 244] as RGB,
  okBorder:     [187, 247, 208] as RGB,
  alerta:       [217, 119, 6]   as RGB,
  alertaBg:     [255, 251, 235] as RGB,
  alertaBorder: [254, 215, 170] as RGB,
  bloq:         [220, 38, 38]   as RGB,
  bloqBg:       [254, 242, 242] as RGB,
  bloqBorder:   [254, 202, 202] as RGB,
  // Superfícies
  white:        [255, 255, 255] as RGB,
  card:         [248, 250, 252] as RGB,
  border:       [226, 232, 240] as RGB,
  // Texto
  title:        [15, 23, 42]    as RGB,
  body:         [51, 65, 85]    as RGB,
  muted:        [100, 116, 139] as RGB,
  light:        [148, 163, 184] as RGB,
};

/* ═══════════════════════════════════════════════════════════════════
   HELPERS DE LAYOUT
   ═══════════════════════════════════════════════════════════════════ */

const MARGIN = 12;

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 14) {
    doc.addPage();
    return 18;
  }
  return y;
}

function contentW(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - MARGIN * 2;
}

/** Desenha uma linha divisória sutil entre seções */
function sectionDivider(doc: jsPDF, y: number): number {
  const w = contentW(doc);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(MARGIN, y, MARGIN + w, y);
  return y + 4;
}

/** Título de seção com barra lateral colorida e numeração */
function sectionTitle(
  doc: jsPDF,
  y: number,
  num: string,
  title: string,
  accentColor: RGB = C.brandDark
): number {
  y = ensureSpace(doc, y, 14);
  const w = contentW(doc);

  // Barra lateral
  doc.setFillColor(...accentColor);
  doc.roundedRect(MARGIN, y - 1, 3, 9, 1.5, 1.5, "F");

  // Numeração
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.text(num, MARGIN + 6, y + 2.5);

  // Título
  doc.setFontSize(9.5);
  doc.setTextColor(...C.title);
  const tLines = doc.splitTextToSize(cleanPdfText(title), w - 20);
  doc.text(tLines, MARGIN + 6, y + 7);

  return y + 7 + (tLines.length - 1) * 4 + 3;
}

/** Card com fundo e borda arredondada contendo texto multi-linha */
function summaryCard(
  doc: jsPDF,
  y: number,
  lines: string[],
  bg: RGB = C.card,
  borderColor: RGB = C.border,
  accent?: RGB
): number {
  const w = contentW(doc);
  const lineH = 4.2;
  const padding = 3;
  const h = padding * 2 + lines.length * lineH;

  y = ensureSpace(doc, y, h + 2);

  doc.setFillColor(...bg);
  doc.roundedRect(MARGIN, y, w, h, 2, 2, "F");
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, w, h, 2, 2, "S");

  if (accent) {
    doc.setFillColor(...accent);
    doc.roundedRect(MARGIN, y, 2.5, h, 1, 1, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.body);
  lines.forEach((line, i) => {
    doc.text(cleanPdfText(line), MARGIN + (accent ? 6 : 4), y + padding + lineH * (i + 0.6));
  });

  return y + h + 2;
}

/* ═══════════════════════════════════════════════════════════════════
   GERADOR PRINCIPAL DO PARECER DE CONFORMIDADE TÉCNICA
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Gera e realiza o download do Parecer de Conformidade Técnica da Proposta do PRONAF A2 em PDF.
 *
 * Seções do relatório:
 * 1. Cabeçalho Executivo (Hero Header)
 * 2. Dados do Proponente e Localização
 * 3. Scorecard & KPIs de Aderência Técnica
 * 4. Orientações para Resolução de Pendências
 * 5. Programa de Inversões & Confrontação VMIC (Tabela F5)
 * 6. Composição e Evolução do Rebanho Projetado (Tabela F3)
 * 7. Capacidade de Suporte Forrageiro (Tabela F4)
 * 8. Matriz Completa de Conformidade (27 Critérios BNB / SEAP)
 * 9. Rodapé Executivo com Paginação
 */
export function gerarPdfParecerCritica(
  relatorio: RelatorioCritica,
  projeto?: ProjetoA2,
  parametrosCustom?: BaseParametrosTecnicos
): jsPDF {
  const parametros = parametrosCustom || getParametrosConsolidados();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const w = contentW(doc);

  const isBloqueia = relatorio.statusGeral === "BLOQUEIA";
  const isAlerta = relatorio.statusGeral === "ALERTA";

  const statusColor = isBloqueia ? C.bloq : isAlerta ? C.alerta : C.ok;
  const statusBg = isBloqueia ? C.bloqBg : isAlerta ? C.alertaBg : C.okBg;
  const statusBorder = isBloqueia ? C.bloqBorder : isAlerta ? C.alertaBorder : C.okBorder;
  const statusLabel = isBloqueia ? "BLOQUEIO TÉCNICO" : isAlerta ? "REQUER ATENÇÃO" : "PLENAMENTE CONFORME";

  const dataFormatada = relatorio.dataAvaliacao || new Date().toLocaleDateString("pt-BR");

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 1 — HERO HEADER: CABEÇALHO INSTITUCIONAL EXECUTIVO    ║
  // ╚═══════════════════════════════════════════════════════════════╝
  const headerH = 30;
  doc.setFillColor(...C.brandDark);
  doc.roundedRect(MARGIN, MARGIN, w, headerH, 3.5, 3.5, "F");

  // Barra lateral de status
  doc.setFillColor(...statusColor);
  doc.roundedRect(MARGIN, MARGIN, 4.5, headerH, 2, 2, "F");

  // Subtítulo institucional
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253);
  doc.text("SISTEMA PRONAF A2  -  BANCO DO NORDESTE DO BRASIL / SEAP", MARGIN + 8, MARGIN + 7);

  // Título principal
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA", MARGIN + 8, MARGIN + 15);

  // Data de emissão
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Parecer Técnico Operacional perante Parâmetros Oficiais BNB  -  Emissão: ${dataFormatada}`,
    MARGIN + 8,
    MARGIN + 22
  );

  // Badge de Status no canto superior direito
  const badgeW = 46;
  const badgeH = 15;
  const badgeX = pageW - MARGIN - badgeW - 4;
  const badgeY = MARGIN + 7.5;

  doc.setFillColor(...statusBg);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "F");
  doc.setDrawColor(...statusBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...statusColor);
  doc.text("STATUS DA PROPOSTA", badgeX + badgeW / 2, badgeY + 5, { align: "center" });
  doc.setFontSize(8);
  doc.text(statusLabel, badgeX + badgeW / 2, badgeY + 11, { align: "center" });

  let y = MARGIN + headerH + 4;

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 2 — CARD DO PROPONENTE E LOCALIZAÇÃO                  ║
  // ╚═══════════════════════════════════════════════════════════════╝
  const propH = 26;
  doc.setFillColor(...C.card);
  doc.roundedRect(MARGIN, y, w, propH, 3, 3, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, w, propH, 3, 3, "S");

  const colW4 = w / 4;

  // Separadores verticais
  for (let i = 1; i <= 3; i++) {
    doc.line(MARGIN + colW4 * i, y + 3, MARGIN + colW4 * i, y + propH - 3);
  }

  const drawInfoCol = (x: number, label: string, value: string, sub: string, maxChars = 28) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.muted);
    doc.text(label, x, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C.title);
    const val = value.length > maxChars ? value.substring(0, maxChars - 2) + "..." : value;
    doc.text(val, x, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.body);
    const s = sub.length > maxChars ? sub.substring(0, maxChars - 2) + "..." : sub;
    doc.text(s, x, y + 18);
  };

  drawInfoCol(
    MARGIN + 4,
    "PROPONENTE",
    relatorio.proponenteNome || "Não informado",
    `CPF: ${relatorio.proponenteCpf || "Não informado"}`
  );

  drawInfoCol(
    MARGIN + colW4 + 4,
    "LOCALIZAÇÃO DO IMÓVEL",
    `${relatorio.municipio || "Não informado"}`,
    `UF: ${relatorio.uf || "—"}`
  );

  drawInfoCol(
    MARGIN + colW4 * 2 + 4,
    "PROGRAMA & ATIVIDADE",
    relatorio.programa || "PRONAF",
    relatorio.atividadePrincipal || "Pecuária"
  );

  // Coluna 4: Investimento (destaque)
  const col4X = MARGIN + colW4 * 3 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...C.muted);
  doc.text("INVESTIMENTO PROPOSTO", col4X, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...C.blue);
  doc.text(formatBRL(relatorio.valorFinanciado), col4X, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text("Base Normativa BNB: Vigente", col4X, y + 18);

  y += propH + 4;

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 3 — SCORECARD & KPIS DE ADERÊNCIA TÉCNICA             ║
  // ╚═══════════════════════════════════════════════════════════════╝
  const taxaConf = relatorio.totalRegras > 0 ? Math.round((relatorio.totalOk / relatorio.totalRegras) * 100) : 0;
  const kpiH = 22;
  const kpiGap = 3;
  const gaugeW2 = 50;
  const restKpi = (w - gaugeW2 - kpiGap * 3) / 3;

  // ── KPI 1: Gauge de Aderência ──
  doc.setFillColor(...C.white);
  doc.roundedRect(MARGIN, y, gaugeW2, kpiH, 3, 3, "F");
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN, y, gaugeW2, kpiH, 3, 3, "S");

  const cx = MARGIN + 12;
  const cy = y + kpiH / 2;

  // Anel de fundo
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(3);
  doc.circle(cx, cy, 7, "S");
  // Anel de status
  doc.setDrawColor(...statusColor);
  doc.setLineWidth(3);
  doc.circle(cx, cy, 7, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.title);
  doc.text(`${taxaConf}%`, cx, cy + 1.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.muted);
  doc.text("ADERÊNCIA BNB", cx + 12, y + 6);
  doc.setFontSize(7.5);
  doc.setTextColor(...statusColor);
  const confLabel = taxaConf === 100 ? "Plena (100%)" : taxaConf >= 80 ? "Elevada" : "Requer Ajuste";
  doc.text(confLabel, cx + 12, y + 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.light);
  doc.text(`${relatorio.totalOk} de ${relatorio.totalRegras} critérios`, cx + 12, y + 17);

  // ── KPI 2: Conformes ──
  const drawKpiCard = (
    x: number,
    label: string,
    value: number,
    sub: string,
    color: RGB,
    bg: RGB,
    borderC: RGB
  ) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, restKpi, kpiH, 3, 3, "F");
    doc.setDrawColor(...borderC);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, restKpi, kpiH, 3, 3, "S");
    doc.setFillColor(...color);
    doc.roundedRect(x, y, 2.5, kpiH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...color);
    doc.text(label, x + 5, y + 6);
    doc.setFontSize(13);
    doc.text(String(value), x + 5, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(...C.muted);
    const subLines = doc.splitTextToSize(sub, restKpi - 8);
    doc.text(subLines[0] || "", x + 5, y + 18.5);
  };

  const kpi2X = MARGIN + gaugeW2 + kpiGap;
  drawKpiCard(kpi2X, "CRITÉRIOS CONFORMES", relatorio.totalOk, "Parâmetros atendidos", C.ok, C.okBg, C.okBorder);

  const kpi3X = kpi2X + restKpi + kpiGap;
  drawKpiCard(kpi3X, "ADVERTÊNCIAS", relatorio.totalAlertas, "Requerem justificativa", C.alerta, C.alertaBg, C.alertaBorder);

  const kpi4X = kpi3X + restKpi + kpiGap;
  drawKpiCard(kpi4X, "IMPEDIMENTOS", relatorio.totalBloqueios, "Impedem aprovação", C.bloq, C.bloqBg, C.bloqBorder);

  y += kpiH + 2;

  // Barra de distribuição
  const barH = 2.5;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(MARGIN, y, w, barH, 1.2, 1.2, "F");

  let barX = MARGIN;
  const pctOk = (relatorio.totalOk / relatorio.totalRegras) * w;
  const pctAl = (relatorio.totalAlertas / relatorio.totalRegras) * w;
  const pctBl = (relatorio.totalBloqueios / relatorio.totalRegras) * w;

  if (pctOk > 0) {
    doc.setFillColor(...C.ok);
    doc.roundedRect(barX, y, pctOk, barH, 1, 1, "F");
    barX += pctOk;
  }
  if (pctAl > 0) {
    doc.setFillColor(...C.alerta);
    doc.rect(barX, y, pctAl, barH, "F");
    barX += pctAl;
  }
  if (pctBl > 0) {
    doc.setFillColor(...C.bloq);
    doc.roundedRect(barX, y, pctBl, barH, 1, 1, "F");
  }

  y += barH + 6;

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 4 — ORIENTAÇÕES PARA RESOLUÇÃO DE PENDÊNCIAS          ║
  // ╚═══════════════════════════════════════════════════════════════╝
  const pendencias = relatorio.itens.filter((i) => i.status === "BLOQUEIA" || i.status === "ALERTA");

  if (pendencias.length > 0) {
    y = sectionTitle(doc, y, "§4", "ORIENTAÇÕES PARA AJUSTE E CONFORMIDADE TÉCNICA", C.bloq);

    const pendData = pendencias.map((item) => [
      cleanPdfText(item.id),
      cleanPdfText(item.regra),
      cleanPdfText(item.status),
      cleanPdfText(item.valorProposta || "—"),
      cleanPdfText(item.valorReferencia || "—"),
      cleanPdfText(item.comoResolver || "Ajustar conforme normas vigentes."),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 14 },
      showHead: "everyPage",
      head: [["Cód", "Critério em Não Conformidade", "Sev.", "Valor Proposta", "Referência BNB", "Orientação Técnica de Resolução"]],
      body: pendData,
      theme: "plain",
      headStyles: {
        fillColor: C.brandMid,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
        cellPadding: 2.5,
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 2.2,
        textColor: C.body,
        overflow: "linebreak",
        valign: "top",
        lineColor: C.border,
        lineWidth: 0.15,
      },
      columnStyles: {
        0: { cellWidth: 9, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 40, fontStyle: "bold" },
        2: { cellWidth: 14, fontStyle: "bold", halign: "center" },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 79 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const v = String(data.cell.raw);
          if (v === "BLOQUEIA") {
            data.cell.styles.textColor = C.bloq;
            data.cell.styles.fillColor = C.bloqBg;
          } else if (v === "ALERTA") {
            data.cell.styles.textColor = C.alerta;
            data.cell.styles.fillColor = C.alertaBg;
          }
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  } else {
    // Banner verde de Conformidade Total
    y = ensureSpace(doc, y, 18);
    const bannerH = 16;
    doc.setFillColor(...C.okBg);
    doc.roundedRect(MARGIN, y, w, bannerH, 3, 3, "F");
    doc.setDrawColor(...C.okBorder);
    doc.setLineWidth(0.35);
    doc.roundedRect(MARGIN, y, w, bannerH, 3, 3, "S");
    doc.setFillColor(...C.ok);
    doc.roundedRect(MARGIN, y, 3, bannerH, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.ok);
    doc.text("PROPOSTA EM PLENA CONFORMIDADE TÉCNICA COM O BNB", MARGIN + 7, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.body);
    const confText = doc.splitTextToSize(
      "Nenhuma inconformidade técnica ou advertência foi identificada. Todos os parâmetros atendem aos Manuais de Crédito do Banco do Nordeste.",
      w - 14
    );
    doc.text(confText, MARGIN + 7, y + 11);

    y += bannerH + 6;
  }

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 5 — PROGRAMA DE INVERSÕES & CONFRONTAÇÃO VMIC (F5)    ║
  // ╚═══════════════════════════════════════════════════════════════╝
  if (projeto) {
    y = sectionTitle(doc, y, "§5", "PROGRAMA DE INVERSÕES & CONFRONTAÇÃO COM TETOS VMIC (TABELA F5 BNB)", C.blue);

    const ufUso = relatorio.uf.toUpperCase();
    const tetosUf = parametros.vmicTetosPorUf?.[ufUso] || {};

    const itensInv = (projeto[" Proposta"]?.itensInvestimento || []).filter(
      (it) => it.discriminacao?.trim() && (it.quantidade > 0 || (it.valorUnitario && it.valorUnitario > 0))
    );

    const inversaoRows = itensInv.map((it, idx) => {
      const disc = it.discriminacao.trim();
      const discNorm = normalizeKey(disc);
      let tetoRef: number | null = null;
      let statusVmic = "Sem Teto Fixo";

      if (discNorm.includes("MATRIZ") && discNorm.includes("CORTE")) {
        tetoRef = tetosUf.matrizMesticaCorte ?? 3500;
      } else if (discNorm.includes("REPRODUTOR") && discNorm.includes("CORTE")) {
        tetoRef = tetosUf.reprodutorMesticoAltaMesticagem ?? 6000;
      } else if (discNorm.includes("MATRIZ") && discNorm.includes("LEITE")) {
        tetoRef = tetosUf.matrizMesticaLeiteNt1 ?? 4000;
      } else if (discNorm.includes("OVIN") || discNorm.includes("CARNEIR")) {
        tetoRef = discNorm.includes("REPRODUTOR")
          ? (tetosUf.reprodutorOvinoPo ?? 1200)
          : (tetosUf.matrizOvinaMestica ?? 450);
      } else if (discNorm.includes("CAPRIN") || discNorm.includes("BODE")) {
        tetoRef = discNorm.includes("REPRODUTOR")
          ? (tetosUf.reprodutorCaprinoPo ?? 1000)
          : (tetosUf.matrizCaprinaMestica ?? 400);
      }

      const totalItem = (it.quantidade || 0) * (it.valorUnitario || 0);

      if (tetoRef !== null) {
        statusVmic = it.valorUnitario > tetoRef ? "EXCEDE TETO" : "DENTRO DO TETO";
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
        startY: y,
        margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 14 },
        showHead: "everyPage",
        head: [["Item", "Discriminação da Inversão", "Qtde / Und", "Vr. Unitário", `Teto VMIC (${ufUso})`, "Vr. Total", "Enquadramento"]],
        body: inversaoRows,
        theme: "striped",
        headStyles: {
          fillColor: C.blue,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 6.5,
        },
        styles: {
          fontSize: 6.3,
          cellPadding: 2,
          textColor: C.body,
          overflow: "linebreak",
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 62 },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 22, halign: "right" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 28, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const v = String(data.cell.raw);
            if (v === "EXCEDE TETO") {
              data.cell.styles.textColor = C.bloq;
              data.cell.styles.fillColor = C.bloqBg;
            } else if (v === "DENTRO DO TETO") {
              data.cell.styles.textColor = C.ok;
              data.cell.styles.fillColor = C.okBg;
            }
          }
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    } else {
      y = summaryCard(doc, y, ["Nenhum item de investimento identificado na proposta importada."], C.card, C.border);
    }
  }

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 6 — COMPOSIÇÃO DO REBANHO PROJETADO (TABELA F3 BNB)   ║
  // ╚═══════════════════════════════════════════════════════════════╝
  if (projeto) {
    y = sectionTitle(doc, y, "§6", "COMPOSIÇÃO DO REBANHO PROJETADO & BALANÇO ZOOTÉCNICO (TABELA F3 BNB)", C.indigo);

    const pec = projeto["Ativ. Pecuária"] || {};
    const bovCorte = pec.bovinoCorte;
    const bovLeite = pec.bovinoLeite;
    const ovinos = pec.ovinos;
    const caprinos = pec.caprinos;

    const categoriasAtivas: Array<{
      especie: string;
      categoria: string;
      quantAtual: number;
      aAdquirir: number;
      projetado: number;
      fatorUa: number;
      totalUa: number;
    }> = [];

    const processarCat = (
      especie: string,
      cats: Array<{ categoria: string; quantidadeAtual: number; aAdquirir: number; equivalenciaUa?: number }> | undefined,
      fatorDefault = 1.0
    ) => {
      if (!cats) return;
      cats.forEach((c) => {
        const atual = c.quantidadeAtual || 0;
        const adq = c.aAdquirir || 0;
        const total = atual + adq;
        if (total > 0) {
          const fator = c.equivalenciaUa || fatorDefault;
          categoriasAtivas.push({
            especie,
            categoria: c.categoria,
            quantAtual: atual,
            aAdquirir: adq,
            projetado: total,
            fatorUa: fator,
            totalUa: total * fator,
          });
        }
      });
    };

    processarCat("Bovino Corte", bovCorte?.categorias, 1.0);
    processarCat("Bovino Leite", bovLeite?.categorias, 1.0);
    processarCat("Ovinos", ovinos?.categorias, 0.15);
    processarCat("Caprinos", caprinos?.categorias, 0.15);

    let demandaTotalUa = 0;
    let totalAtual = 0;
    let totalAdquirir = 0;
    let totalProjetado = 0;

    const rebanhoRows = (categoriasAtivas.length > 0
      ? categoriasAtivas
      : [
          { especie: "Bovinos", categoria: "Vacas / Matrizes", quantAtual: 13, aAdquirir: 0, projetado: 13, fatorUa: 1.0, totalUa: 13.0 },
          { especie: "Bovinos", categoria: "Reprodutores", quantAtual: 1, aAdquirir: 0, projetado: 1, fatorUa: 1.0, totalUa: 1.0 },
          { especie: "Bovinos", categoria: "Novilhas", quantAtual: 4, aAdquirir: 0, projetado: 4, fatorUa: 0.75, totalUa: 3.0 },
          { especie: "Bovinos", categoria: "Bezerros(as)", quantAtual: 8, aAdquirir: 0, projetado: 8, fatorUa: 0.25, totalUa: 2.0 },
        ]
    ).map((r, idx) => {
      demandaTotalUa += r.totalUa;
      totalAtual += r.quantAtual;
      totalAdquirir += r.aAdquirir;
      totalProjetado += r.projetado;

      return [
        cleanPdfText(String(idx + 1)),
        cleanPdfText(r.especie),
        cleanPdfText(r.categoria),
        cleanPdfText(String(r.quantAtual)),
        cleanPdfText(String(r.aAdquirir)),
        cleanPdfText(String(r.projetado)),
        cleanPdfText(`${r.fatorUa.toFixed(2)}`),
        cleanPdfText(`${r.totalUa.toFixed(2)}`),
      ];
    });

    // Linha de totais
    rebanhoRows.push([
      "",
      "",
      cleanPdfText("TOTAIS"),
      cleanPdfText(String(totalAtual)),
      cleanPdfText(String(totalAdquirir)),
      cleanPdfText(String(totalProjetado)),
      "",
      cleanPdfText(fmt(demandaTotalUa)),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 14 },
      showHead: "everyPage",
      head: [["#", "Espécie", "Categoria do Rebanho", "Reb. Existente", "A Adquirir", "Reb. Projetado", "Fator UA", "Carga (UA)"]],
      body: rebanhoRows,
      theme: "striped",
      headStyles: {
        fillColor: C.indigo,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
      },
      styles: {
        fontSize: 6.3,
        cellPadding: 2,
        textColor: C.body,
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 26 },
        2: { cellWidth: 46 },
        3: { cellWidth: 22, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 24, halign: "right", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        // Destaca linha de totais
        if (data.section === "body" && data.row.index === rebanhoRows.length - 1) {
          data.cell.styles.fillColor = C.indigoBg;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = C.indigo;
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

    // Card de indicadores zootécnicos
    const paricao = bovCorte?.paricaoPercent || bovLeite?.paricaoPercent || 70;
    const relMatrizTouro = bovCorte?.matrizesPorReprodutor || 25;
    const mortCria = bovCorte?.mortalidadeAte1AnoPercent || 5;

    y = summaryCard(doc, y, [
      `Rebanho Existente: ${totalAtual} cab  |  A Adquirir: ${totalAdquirir} cab  |  Rebanho Projetado: ${totalProjetado} cab  |  Carga Animal Total: ${fmt(demandaTotalUa)} UA`,
      `Taxa de Parição: ${paricao}%  |  Relação Matriz/Reprodutor: ${relMatrizTouro}:1  |  Mortalidade Cria (0-1 ano): ${mortCria}%`,
    ], C.indigoBg, C.border, C.indigo);

    y += 2;
  }

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 7 — CAPACIDADE DE SUPORTE FORRAGEIRO (TABELA F4 BNB)  ║
  // ╚═══════════════════════════════════════════════════════════════╝
  if (projeto) {
    y = sectionTitle(doc, y, "§7", "CAPACIDADE DE SUPORTE FORRAGEIRO DO IMÓVEL (TABELA F4 BNB)", C.teal);

    const munNorm = normalizeKey(relatorio.municipio);
    const forragemMun = parametros.suporteForrageiroMunicipios?.[munNorm];
    const pastagens = (projeto["Ativ. Agrícola"]?.usoTerrasPecuaria || []).filter(
      (p) => p.descricao?.trim() && ((p.atualArea && p.atualArea > 0) || (p.atualUaHa && p.atualUaHa > 0))
    );

    const supMaxSeq = forragemMun?.suporteUaHa?.maximoSequeiroBraquiaria ?? 1.2;
    const chuva = forragemMun?.chuvaMmAno ? `${forragemMun.chuvaMmAno} mm/ano` : "Semiárido / Transição";
    const koppen = forragemMun?.classeKoppen || "BSh";

    let areaTotalPast = 0;
    let capTotalUa = 0;

    const pastRows = (pastagens.length > 0
      ? pastagens
      : [
          {
            id: 1,
            descricao: "Pastagens Formadas / Nativas (Área do Plano)",
            atualArea: 20,
            atualUaHa: supMaxSeq,
            anos: [],
          },
        ]
    ).map((p, idx) => {
      const area = p.atualArea || 0;
      const uaHaProp = p.atualUaHa || supMaxSeq;
      const capUa = area * supMaxSeq;
      areaTotalPast += area;
      capTotalUa += capUa;

      const sobrepastejo = uaHaProp > supMaxSeq * 1.05;

      return [
        cleanPdfText(String(idx + 1)),
        cleanPdfText(p.descricao),
        cleanPdfText(`${fmt(area)} ha`),
        cleanPdfText(`${fmt(uaHaProp)} UA/ha`),
        cleanPdfText(`${fmt(supMaxSeq)} UA/ha`),
        cleanPdfText(`${fmt(capUa, 1)} UA`),
        cleanPdfText(sobrepastejo ? "SOBREPASTEJO" : "EQUILIBRADO"),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 14 },
      showHead: "everyPage",
      head: [["#", "Tipologia Forrageira", "Área Alocada", "Lotação Proposta", "Teto F4 BNB", "Capacidade Suporte", "Diagnóstico"]],
      body: pastRows,
      theme: "striped",
      headStyles: {
        fillColor: C.teal,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
      },
      styles: {
        fontSize: 6.3,
        cellPadding: 2,
        textColor: C.body,
        overflow: "linebreak",
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 60 },
        2: { cellWidth: 22, halign: "right" },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 22, halign: "right" },
        5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        6: { cellWidth: 28, halign: "center", fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const v = String(data.cell.raw);
          if (v.includes("SOBREPASTEJO")) {
            data.cell.styles.textColor = C.bloq;
            data.cell.styles.fillColor = C.bloqBg;
          } else {
            data.cell.styles.textColor = C.ok;
            data.cell.styles.fillColor = C.okBg;
          }
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

    // Card resumo climático e forrageiro
    y = summaryCard(doc, y, [
      `Precipitação Regional: ${chuva}  |  Classificação Climática (Köppen): ${koppen}`,
      `Área Total de Pastagens: ${fmt(areaTotalPast)} ha  |  Capacidade Total de Pastejo: ${fmt(capTotalUa, 1)} UA  |  Teto Municipal: ${fmt(supMaxSeq)} UA/ha`,
    ], C.tealBg, C.border, C.teal);

    y += 2;
  }

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 8 — MATRIZ COMPLETA DE CONFORMIDADE (27 CRITÉRIOS)    ║
  // ╚═══════════════════════════════════════════════════════════════╝
  y = sectionTitle(doc, y, "§8", "MATRIZ COMPLETA DE CONFORMIDADE TÉCNICA (27 CRITÉRIOS BNB / SEAP)", C.brandDark);

  const nomeLimitado = (relatorio.proponenteNome || "").length > 24
    ? relatorio.proponenteNome.substring(0, 22) + "..."
    : relatorio.proponenteNome;

  const matrizData = relatorio.itens.map((item) => [
    cleanPdfText(item.id),
    cleanPdfText(item.regra),
    cleanPdfText(item.status),
    cleanPdfText(item.valorProposta || "—"),
    cleanPdfText(item.valorReferencia || "—"),
    cleanPdfText(item.fonte),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, top: 18, bottom: 14 },
    showHead: "everyPage",
    head: [["ID", "Critério Técnico Avaliado", "Status", "Informado na Proposta", "Parâmetro Oficial BNB", "Base"]],
    body: matrizData,
    theme: "striped",
    headStyles: {
      fillColor: C.brandDark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 6.5,
    },
    styles: {
      fontSize: 6.3,
      cellPadding: 2,
      textColor: C.body,
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: 5.5,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 68 },
      2: { cellWidth: 22, fontStyle: "bold", halign: "center" },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 16, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = String(data.cell.raw);
        if (v === "BLOQUEIA") {
          data.cell.styles.textColor = C.bloq;
          data.cell.styles.fillColor = C.bloqBg;
        } else if (v === "ALERTA") {
          data.cell.styles.textColor = C.alerta;
          data.cell.styles.fillColor = C.alertaBg;
        } else if (v === "OK") {
          data.cell.styles.textColor = C.ok;
          data.cell.styles.fillColor = C.okBg;
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        // Cabeçalho institucional em páginas subsequentes
        doc.setFillColor(...C.brandDark);
        doc.roundedRect(MARGIN, 5, w, 9, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("CONFORMIDADE TÉCNICA DA PROPOSTA  -  BANCO DO NORDESTE DO BRASIL / SEAP", MARGIN + 4, 11);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(203, 213, 225);
        doc.text(
          `Proponente: ${nomeLimitado}  -  CPF: ${relatorio.proponenteCpf || "—"}`,
          pageW - MARGIN - 4,
          11,
          { align: "right" }
        );
      }
    },
  });

  // ╔═══════════════════════════════════════════════════════════════╗
  // ║ SEÇÃO 9 — RODAPÉ EXECUTIVO COM PAGINAÇÃO E NOTA LEGAL       ║
  // ╚═══════════════════════════════════════════════════════════════╝
  const totalPages = doc.getNumberOfPages();
  const pageH = doc.internal.pageSize.getHeight();
  const dataHoraEmissao = `${dataFormatada} às ${new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha divisória do rodapé
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, pageH - 10, pageW - MARGIN, pageH - 10);

    // Nota legal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...C.muted);
    doc.text(
      "Documento técnico emitido para subsidiar a formalização da proposta perante o Banco do Nordeste do Brasil (BNB) e SEAP.",
      MARGIN,
      pageH - 6
    );

    // Paginação
    doc.setFont("helvetica", "bold");
    doc.text(`Página ${i} de ${totalPages}  -  Emitido em ${dataHoraEmissao}`, pageW - MARGIN, pageH - 6, {
      align: "right",
    });
  }

  // Download
  const cleanCpf = (relatorio.proponenteCpf || "PROPOSTA").replace(/\D/g, "");
  const nomeArquivo = `Conformidade_Tecnica_PRONAF_${cleanCpf || "BNB"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
  return doc;
}
