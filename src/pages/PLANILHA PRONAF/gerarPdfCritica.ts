import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica } from "./engineCritica";
import { ProjetoA2, SemoventeItem, UsoTerraAgricolaItem } from "./types";
import { getParametrosConsolidados, BaseParametrosTecnicos } from "./parametrosStorage";

/* ═══════════════════════════════════════════════════════════════════════
   PALETA FINTECH CLARA — Design System Unificado
   Estilo: Clean, Minimalista, Dados em Primeiro Plano
   ═══════════════════════════════════════════════════════════════════════ */

type RGB = [number, number, number];

const P = {
  // Backgrounds e superficies
  white:      [255, 255, 255] as RGB,
  offWhite:   [250, 251, 253] as RGB,
  surface:    [245, 247, 250] as RGB,
  surfaceMd:  [238, 242, 248] as RGB,

  // Marca principal
  navy:       [12,  28,  64 ] as RGB,  // Header principal
  navyMd:     [23,  49, 100 ] as RGB,  // Sub-headers / destaques
  blue:       [37,  99, 235 ] as RGB,  // Azul primario vivo
  blueLight:  [219, 234, 254] as RGB,  // Fundo azul suave
  blueBg:     [239, 246, 255] as RGB,

  // Status — Conformidade
  green:      [5,  150, 105 ] as RGB,
  greenBg:    [236, 253, 245] as RGB,
  greenBrd:   [167, 243, 208] as RGB,

  amber:      [180,  83,   9 ] as RGB,
  amberBg:    [255, 251, 235] as RGB,
  amberBrd:   [253, 211, 159] as RGB,

  red:        [185,  28,  28 ] as RGB,
  redBg:      [254, 242, 242] as RGB,
  redBrd:     [254, 202, 202] as RGB,

  // Texto
  ink:        [ 10,  20,  50 ] as RGB,   // Títulos
  bodyTxt:    [ 45,  65, 100 ] as RGB,   // Corpo
  mutedTxt:   [ 90, 115, 160 ] as RGB,   // Legendas
  lightTxt:   [145, 170, 215] as RGB,    // Placeholder

  // Bordas
  border:     [214, 224, 240] as RGB,
  borderMd:   [185, 200, 225] as RGB,
};

/* ═══════════════════════════════════════════════════════════════════════
   ESTILO DE TABELA UNIFICADO — FINTECH CLEAN
   Usado em TODAS as tabelas do documento para consistência visual
   ═══════════════════════════════════════════════════════════════════════ */

const TABLE_HEAD_STYLE = {
  fillColor: P.navyMd,
  textColor: P.white,
  fontStyle: "bold" as const,
  fontSize: 6.8,
  cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
};

const TABLE_BODY_STYLE = {
  fontSize: 6.5,
  cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
  textColor: P.bodyTxt,
  overflow: "linebreak" as const,
  valign: "middle" as const,
  lineColor: P.border,
  lineWidth: 0.18,
};

const TABLE_ALT_BG  = P.offWhite;
const TABLE_MARGIN  = { left: 12, right: 12, top: 18, bottom: 14 };

/* ═══════════════════════════════════════════════════════════════════════
   UTILITÁRIOS DE FORMATAÇÃO E TEXTO
   ═══════════════════════════════════════════════════════════════════════ */

function formatBRL(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function fmtN(n: number | null | undefined, dec = 2): string {
  if (n === null || n === undefined || isNaN(n)) return "0";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/**
 * Sanitiza texto para codificacao WinAnsi do jsPDF (Helvetica).
 * Remove todos os caracteres que causam exibicao corrompida.
 */
function txt(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/[<=]\s/g, (m) => m)
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u00d7/g, "x")
    .replace(/\u00f7/g, "/")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2022/g, "-")
    .replace(/\u2713/g, "OK")
    .replace(/[^\u0020-\u00FF]/g, "")
    .trim();
}

function normKey(s?: string | null): string {
  if (!s) return "";
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS DE LAYOUT — gestao de espaco e elementos visuais
   ═══════════════════════════════════════════════════════════════════════ */

const MG = 12;

function cW(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - MG * 2;
}

function pW(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth();
}

function pH(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

/** Garante espaco suficiente, adicionando pagina se necessario */
function space(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > pH(doc) - 16) {
    doc.addPage();
    return 18;
  }
  return y;
}

/**
 * Titulo de secao — linha fina colorida acima + numero e texto
 */
function secTitle(doc: jsPDF, y: number, num: string, title: string, color: RGB = P.blue): number {
  y = space(doc, y, 14);
  const w = cW(doc);

  doc.setFillColor(...color);
  doc.rect(MG, y, w, 0.7, "F");

  doc.setFillColor(...color);
  doc.roundedRect(MG, y + 2.5, 14, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(num, MG + 7, y + 7.2, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.ink);
  const lines = doc.splitTextToSize(txt(title), w - 20);
  doc.text(lines, MG + 17, y + 8);

  return y + 8 + (lines.length - 1) * 4.5 + 5;
}

/**
 * Card informativo flexivel com quebra de linha automatica e suporte total a multilinhas.
 * Garante que NENHUM texto seja cortado ou sobreposto.
 */
function infoCard(
  doc: jsPDF,
  y: number,
  paragraphs: string[],
  accent: RGB = P.blue,
  bg: RGB = P.surface
): number {
  const w = cW(doc);
  const padX = 7;
  const padY = 4;
  const maxTextW = w - padX - 4;
  const lH = 4.0;

  // Processa quebra de cada paragrafo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);

  const wrappedBlocks: string[][] = [];
  let totalLines = 0;

  paragraphs.forEach((p) => {
    const wrapped = doc.splitTextToSize(txt(p), maxTextW);
    wrappedBlocks.push(wrapped);
    totalLines += wrapped.length;
  });

  const cardH = padY * 2 + totalLines * lH + (paragraphs.length - 1) * 1.5;
  y = space(doc, y, cardH + 4);

  // Fundo e bordas
  doc.setFillColor(...bg);
  doc.roundedRect(MG, y, w, cardH, 2, 2, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, w, cardH, 2, 2, "S");

  // Barra de acento lateral
  doc.setFillColor(...accent);
  doc.roundedRect(MG, y, 2.5, cardH, 1.2, 1.2, "F");

  // Renderizacao do texto
  let currentY = y + padY + 3.0;

  wrappedBlocks.forEach((lines) => {
    lines.forEach((line) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...P.bodyTxt);
      doc.text(line, MG + padX, currentY);
      currentY += lH;
    });
    currentY += 1.5;
  });

  return y + cardH + 3.5;
}

/* ═══════════════════════════════════════════════════════════════════════
   GERADOR PRINCIPAL DO PARECER DE CONFORMIDADE TECNICA
   ═══════════════════════════════════════════════════════════════════════ */

export function gerarPdfParecerCritica(
  relatorio: RelatorioCritica,
  projeto?: ProjetoA2,
  parametrosCustom?: BaseParametrosTecnicos
): jsPDF {
  const parametros = parametrosCustom || getParametrosConsolidados();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = cW(doc);
  const PW = pW(doc);
  const PH = pH(doc);

  const isBloq = relatorio.statusGeral === "BLOQUEIA";
  const isAlt  = relatorio.statusGeral === "ALERTA";

  const sColor  : RGB = isBloq ? P.red   : isAlt ? P.amber : P.green;
  const sBg     : RGB = isBloq ? P.redBg : isAlt ? P.amberBg : P.greenBg;
  const sBorder : RGB = isBloq ? P.redBrd: isAlt ? P.amberBrd: P.greenBrd;
  const sLabel  = isBloq ? "BLOQUEIO TECNICO" : isAlt ? "REQUER ATENCAO" : "PLENAMENTE CONFORME";

  const dataFmt = relatorio.dataAvaliacao || new Date().toLocaleDateString("pt-BR");

  // ══════════════════════════════════════════════════════════════════════
  //  1. HERO HEADER
  // ══════════════════════════════════════════════════════════════════════
  const hdrH = 28;
  doc.setFillColor(...P.navy);
  doc.roundedRect(MG, MG, W, hdrH, 3, 3, "F");

  // Barra lateral de status
  doc.setFillColor(...sColor);
  doc.roundedRect(MG, MG, 4, hdrH, 2, 2, "F");

  // Texto do header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(...P.lightTxt);
  doc.text("SISTEMA PRONAF A2  |  BANCO DO NORDESTE DO BRASIL  |  SEAP", MG + 7, MG + 7.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("CONFORMIDADE TECNICA DA PROPOSTA", MG + 7, MG + 15.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...P.lightTxt);
  doc.text(`Parecer Tecnico Operacional  |  Emissao: ${dataFmt}`, MG + 7, MG + 22);

  // Badge status
  const bW = 44, bH = 14;
  const bX = PW - MG - bW - 3, bY = MG + 7;
  doc.setFillColor(...sBg);
  doc.roundedRect(bX, bY, bW, bH, 2.5, 2.5, "F");
  doc.setDrawColor(...sBorder);
  doc.setLineWidth(0.35);
  doc.roundedRect(bX, bY, bW, bH, 2.5, 2.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(...sColor);
  doc.text("STATUS DA PROPOSTA", bX + bW / 2, bY + 4.8, { align: "center" });
  doc.setFontSize(7.5);
  doc.text(sLabel, bX + bW / 2, bY + 10.5, { align: "center" });

  let y = MG + hdrH + 4;

  // ══════════════════════════════════════════════════════════════════════
  //  2. IDENTIDADE DA PROPOSTA (LAYOUT 2x2 SEGURO CONTRA SOBREPOSICAO)
  // ══════════════════════════════════════════════════════════════════════
  const blockW = (W - 4) / 2;
  const blockH = 18;

  // Bloco 1 (Superior Esquerdo): Proponente
  doc.setFillColor(...P.offWhite);
  doc.roundedRect(MG, y, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, blockW, blockH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("PROPONENTE", MG + 4, y + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...P.ink);
  const propNome = doc.splitTextToSize(txt(relatorio.proponenteNome || "Nao informado"), blockW - 8);
  doc.text(propNome[0] || "", MG + 4, y + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...P.bodyTxt);
  doc.text(`CPF: ${txt(relatorio.proponenteCpf || "Nao informado")}`, MG + 4, y + 14.5);

  // Bloco 2 (Superior Direito): Investimento Proposto
  const b2x = MG + blockW + 4;
  doc.setFillColor(...P.blueBg);
  doc.roundedRect(b2x, y, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(b2x, y, blockW, blockH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("INVESTIMENTO PROPOSTO", b2x + 4, y + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...P.blue);
  doc.text(txt(formatBRL(relatorio.valorFinanciado)), b2x + 4, y + 10.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("Enquadramento Normativo BNB: Vigente", b2x + 4, y + 15);

  y += blockH + 3;

  // Bloco 3 (Inferior Esquerdo): Localizacao do Imovel
  doc.setFillColor(...P.offWhite);
  doc.roundedRect(MG, y, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, blockW, blockH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("LOCALIZACAO DO IMOVEL", MG + 4, y + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...P.ink);
  const munLines = doc.splitTextToSize(txt(`${relatorio.municipio} - ${relatorio.uf}`), blockW - 8);
  doc.text(munLines[0] || "", MG + 4, y + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...P.bodyTxt);
  doc.text(`Estado / Regiao: ${txt(relatorio.uf)}`, MG + 4, y + 14.5);

  // Bloco 4 (Inferior Direito): Programa & Atividade
  doc.setFillColor(...P.offWhite);
  doc.roundedRect(b2x, y, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(b2x, y, blockW, blockH, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("PROGRAMA & ATIVIDADE PRINCIPAL", b2x + 4, y + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...P.ink);
  const prgLines = doc.splitTextToSize(txt(relatorio.programa || "PRONAF"), blockW - 8);
  doc.text(prgLines[0] || "", b2x + 4, y + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...P.bodyTxt);
  const ativLines = doc.splitTextToSize(txt(relatorio.atividadePrincipal || "Agropecuaria"), blockW - 8);
  doc.text(ativLines[0] || "", b2x + 4, y + 14.5);

  y += blockH + 4;

  // ══════════════════════════════════════════════════════════════════════
  //  3. SCORECARD KPI
  // ══════════════════════════════════════════════════════════════════════
  const taxaAdh = relatorio.totalRegras > 0
    ? Math.round((relatorio.totalOk / relatorio.totalRegras) * 100)
    : 0;

  const kpiH  = 22;
  const gaugeW = 50;
  const kpiGap = 3;
  const kpiW   = (W - gaugeW - kpiGap * 3) / 3;

  // Gauge circular de aderencia
  doc.setFillColor(...P.white);
  doc.roundedRect(MG, y, gaugeW, kpiH, 2.5, 2.5, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, gaugeW, kpiH, 2.5, 2.5, "S");

  const gcx = MG + 12, gcy = y + kpiH / 2;
  doc.setDrawColor(...P.surfaceMd);
  doc.setLineWidth(2.8);
  doc.circle(gcx, gcy, 7.5, "S");
  doc.setDrawColor(...sColor);
  doc.setLineWidth(2.8);
  doc.circle(gcx, gcy, 7.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...P.ink);
  doc.text(`${taxaAdh}%`, gcx, gcy + 1.5, { align: "center" });

  const adhLabel = taxaAdh === 100 ? "Plena (100%)" : taxaAdh >= 80 ? "Elevada" : "Requer Ajuste";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(...P.mutedTxt);
  doc.text("ADERENCIA BNB", MG + 26, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...sColor);
  doc.text(txt(adhLabel), MG + 26, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...P.lightTxt);
  doc.text(`${relatorio.totalOk} de ${relatorio.totalRegras} criterios`, MG + 26, y + 18);

  // 3 KPI cards
  const drawKPI = (x: number, label: string, val: number, sub: string, color: RGB, bg: RGB, brd: RGB) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, kpiW, kpiH, 2.5, 2.5, "F");
    doc.setDrawColor(...brd);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, kpiW, kpiH, 2.5, 2.5, "S");
    doc.setFillColor(...color);
    doc.roundedRect(x, y, 2.5, kpiH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(...color);
    doc.text(label.toUpperCase(), x + 5, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(String(val), x + 5, y + 15.0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(...P.mutedTxt);
    doc.text(txt(sub), x + 5, y + 19.5);
  };

  const k2x = MG + gaugeW + kpiGap;
  drawKPI(k2x,              "Criterios Conformes",  relatorio.totalOk,       "Parametros atendidos",   P.green, P.greenBg, P.greenBrd);
  drawKPI(k2x + kpiW + kpiGap, "Advertencias",      relatorio.totalAlertas,  "Requerem justificativa", P.amber, P.amberBg, P.amberBrd);
  drawKPI(k2x + (kpiW + kpiGap) * 2, "Impedimentos",relatorio.totalBloqueios,"Impedem aprovacao",      P.red,   P.redBg,   P.redBrd);

  y += kpiH + 3;

  // Barra de distribuicao tricolor
  const barH = 2.2;
  doc.setFillColor(...P.surfaceMd);
  doc.roundedRect(MG, y, W, barH, 1, 1, "F");
  let bx = MG;
  const pOk = (relatorio.totalOk / relatorio.totalRegras) * W;
  const pAl = (relatorio.totalAlertas / relatorio.totalRegras) * W;
  const pBl = (relatorio.totalBloqueios / relatorio.totalRegras) * W;
  if (pOk > 0) { doc.setFillColor(...P.green); doc.roundedRect(bx, y, pOk, barH, 1, 1, "F"); bx += pOk; }
  if (pAl > 0) { doc.setFillColor(...P.amber); doc.rect(bx, y, pAl, barH, "F"); bx += pAl; }
  if (pBl > 0) { doc.setFillColor(...P.red);   doc.roundedRect(bx, y, pBl, barH, 1, 1, "F"); }
  y += barH + 6;

  // ══════════════════════════════════════════════════════════════════════
  //  4. ORIENTACOES DE AJUSTE (PENDENCIAS)
  // ══════════════════════════════════════════════════════════════════════
  const pendencias = relatorio.itens.filter((i) => i.status === "BLOQUEIA" || i.status === "ALERTA");

  if (pendencias.length > 0) {
    y = secTitle(doc, y, "S4", "ORIENTACOES PARA AJUSTE E CONFORMIDADE TECNICA", P.red);

    autoTable(doc, {
      startY: y,
      margin: TABLE_MARGIN,
      showHead: "everyPage",
      head: [["Cod", "Criterio em Nao Conformidade", "Sev.", "Valor Proposta", "Referencia BNB", "Como Resolver"]],
      body: pendencias.map((item) => [
        txt(item.id),
        txt(item.regra),
        txt(item.status),
        txt(item.valorProposta || "--"),
        txt(item.valorReferencia || "--"),
        txt(item.comoResolver || "Ajustar conforme normas vigentes."),
      ]),
      theme: "plain",
      headStyles: TABLE_HEAD_STYLE,
      styles: TABLE_BODY_STYLE,
      alternateRowStyles: { fillColor: TABLE_ALT_BG },
      columnStyles: {
        0: { cellWidth: 10, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 42, fontStyle: "bold" },
        2: { cellWidth: 14, fontStyle: "bold", halign: "center" },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 76 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const v = String(data.cell.raw);
          if (v === "BLOQUEIA") {
            data.cell.styles.textColor = P.red;
            data.cell.styles.fillColor = P.redBg;
            data.cell.styles.fontStyle = "bold";
          } else if (v === "ALERTA") {
            data.cell.styles.textColor = P.amber;
            data.cell.styles.fillColor = P.amberBg;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  } else {
    y = space(doc, y, 18);
    const banH = 16;
    doc.setFillColor(...P.greenBg);
    doc.roundedRect(MG, y, W, banH, 2.5, 2.5, "F");
    doc.setDrawColor(...P.greenBrd);
    doc.setLineWidth(0.3);
    doc.roundedRect(MG, y, W, banH, 2.5, 2.5, "S");
    doc.setFillColor(...P.green);
    doc.roundedRect(MG, y, 3, banH, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...P.green);
    doc.text("PROPOSTA EM PLENA CONFORMIDADE TECNICA COM O BNB", MG + 7, y + 6.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...P.bodyTxt);
    const okLines = doc.splitTextToSize(
      "Nenhuma inconformidade tecnica ou advertencia foi identificada. Todos os parametros atendem aos Manuais de Credito do Banco do Nordeste.",
      W - 14
    );
    doc.text(okLines, MG + 7, y + 11.5);
    y += banH + 6;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  5. PROGRAMA DE INVERSOES vs. TETOS VMIC (F5)
  // ══════════════════════════════════════════════════════════════════════
  if (projeto) {
    y = secTitle(doc, y, "F5", "PROGRAMA DE INVERSOES E TETOS VMIC POR ITEM", P.blue);

    const ufUso  = relatorio.uf.toUpperCase();
    const tetos  = parametros.vmicTetosPorUf?.[ufUso] || {};
    const itensI = (projeto[" Proposta"]?.itensInvestimento || []).filter(
      (it) => it.discriminacao?.trim() && (it.quantidade > 0 || (it.valorUnitario && it.valorUnitario > 0))
    );

    const rowsInv = itensI.map((it, idx) => {
      const disc     = it.discriminacao.trim();
      const discNorm = normKey(disc);
      let tetoRef: number | null = null;

      if (discNorm.includes("MATRIZ") && discNorm.includes("CORTE"))
        tetoRef = tetos.matrizMesticaCorte ?? 3500;
      else if (discNorm.includes("REPRODUTOR") && (discNorm.includes("CORTE") || discNorm.includes("TOURO")))
        tetoRef = tetos.reprodutorMesticoAltaMesticagem ?? 6000;
      else if (discNorm.includes("MATRIZ") && discNorm.includes("LEITE"))
        tetoRef = tetos.matrizMesticaLeiteNt1 ?? 4000;
      else if (discNorm.includes("OVIN") || discNorm.includes("CARNEIR"))
        tetoRef = discNorm.includes("REPRODUTOR") ? (tetos.reprodutorOvinoPo ?? 1200) : (tetos.matrizOvinaMestica ?? 450);
      else if (discNorm.includes("CAPRIN") || discNorm.includes("BODE"))
        tetoRef = discNorm.includes("REPRODUTOR") ? (tetos.reprodutorCaprinoPo ?? 1000) : (tetos.matrizCaprinaMestica ?? 400);

      const total  = (it.quantidade || 0) * (it.valorUnitario || 0);
      const status = tetoRef === null
        ? "Sem Teto"
        : it.valorUnitario > tetoRef ? "EXCEDE" : "CONFORME";

      return [
        txt(String(idx + 1).padStart(2, "0")),
        txt(disc),
        txt(`${it.quantidade} ${it.unidade || "un"}`),
        txt(formatBRL(it.valorUnitario)),
        txt(tetoRef ? formatBRL(tetoRef) : "--"),
        txt(formatBRL(total)),
        txt(status),
      ];
    });

    if (rowsInv.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: TABLE_MARGIN,
        showHead: "everyPage",
        head: [["#", "Discriminacao da Inversao", "Qtde / Und", "Vr. Unitario", `Teto VMIC (${ufUso})`, "Total Item", "Enquadramento"]],
        body: rowsInv,
        theme: "plain",
        headStyles: TABLE_HEAD_STYLE,
        styles: TABLE_BODY_STYLE,
        alternateRowStyles: { fillColor: TABLE_ALT_BG },
        columnStyles: {
          0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 60 },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 22, halign: "right" },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 24, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 28, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 6) {
            const v = String(data.cell.raw);
            if (v === "EXCEDE") {
              data.cell.styles.textColor = P.red;
              data.cell.styles.fillColor = P.redBg;
            } else if (v === "CONFORME") {
              data.cell.styles.textColor = P.green;
              data.cell.styles.fillColor = P.greenBg;
            }
          }
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    } else {
      y = infoCard(doc, y, ["Nenhum item de investimento identificado na proposta importada."]);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  6. COMPOSICAO DO REBANHO PROJETADO (F3) — DADOS REAIS DA PROPOSTA
  // ══════════════════════════════════════════════════════════════════════
  if (projeto) {
    y = secTitle(doc, y, "F3", "COMPOSICAO DO REBANHO PROJETADO E BALANCO ZOOTECNICO", P.blue);

    // Suporte a chaves com e sem acento
    const projRecord = projeto as unknown as Record<string, unknown>;
    const pec = (projeto["Ativ. Pecuária"] || projRecord["Ativ. Pecuaria"] || {}) as ProjetoA2["Ativ. Pecuária"];
    const av = (projeto.Avaliação || projRecord["Avaliacao"] || {}) as ProjetoA2["Avaliação"];
    const bovCorte = pec.corte;
    const bovLeite = pec.leite;
    const ovinos   = pec.ovinos;
    const caprinos = pec.caprinos;

    interface CatRow { especie: string; categoria: string; atual: number; adquirir: number; projetado: number; ua: number; totalUa: number; }
    const cats: CatRow[] = [];

    const processCats = (
      especie: string,
      catArr: Array<{ categoria: string; quantidadeAtual: number; aAdquirir: number; equivalenciaUa?: number }> | undefined,
      uaDefault: number
    ) => {
      if (!catArr) return;
      catArr.forEach((c) => {
        const a = Number(c.quantidadeAtual) || 0;
        const b = Number(c.aAdquirir) || 0;
        if (a + b > 0) {
          const ua = Number(c.equivalenciaUa) || uaDefault;
          cats.push({ especie, categoria: c.categoria, atual: a, adquirir: b, projetado: a + b, ua, totalUa: (a + b) * ua });
        }
      });
    };

    processCats("Bov. Corte",  bovCorte?.categorias, 1.0);
    processCats("Bov. Leite",  bovLeite?.categorias, 1.0);
    processCats("Ovinos",      ovinos?.categorias,   0.15);
    processCats("Caprinos",    caprinos?.categorias, 0.15);

    // Se a aba de pecuaria nao tiver categorias cadastradas, verificar semoventes da aba Avaliacao
    if (cats.length === 0 && Array.isArray(av.semoventes)) {
      av.semoventes.forEach((s: SemoventeItem) => {
        const q = Number(s.quantidadeCabecas) || 0;
        if (q > 0) {
          const esp = s.especie || "Bovinos";
          const ua = esp.toLowerCase().includes("ovino") || esp.toLowerCase().includes("caprino") ? 0.15 : 1.0;
          cats.push({
            especie: esp,
            categoria: s.categoria || "Semoventes Cadastrados",
            atual: q,
            adquirir: 0,
            projetado: q,
            ua,
            totalUa: q * ua,
          });
        }
      });
    }

    // Se mesmo assim nao houver animais no projeto, exibir linha informativa sem inventar dados
    let totAtual = 0, totAdq = 0, totProj = 0, totUa = 0;
    cats.forEach((c) => { totAtual += c.atual; totAdq += c.adquirir; totProj += c.projetado; totUa += c.totalUa; });

    if (cats.length === 0) {
      y = infoCard(doc, y, [
        `Nenhum rebanho existente ou a adquirir cadastrado nas abas Ativ. Pecuaria ou Avaliacao deste projeto.`,
        `Preencha o efetivo de animais na aba Ativ. Pecuaria para calculo automatico da carga animal (UA) e balanco zootecnico.`,
      ], P.blue, P.blueBg);
    } else {
      const rowsReb: string[][] = cats.map((r, idx) => [
        txt(String(idx + 1)),
        txt(r.especie),
        txt(r.categoria),
        txt(String(r.atual)),
        txt(String(r.adquirir)),
        txt(String(r.projetado)),
        txt(fmtN(r.ua, 2)),
        txt(fmtN(r.totalUa, 2)),
      ]);

      rowsReb.push(["", "", "TOTAIS", txt(String(totAtual)), txt(String(totAdq)), txt(String(totProj)), "", txt(fmtN(totUa, 2))]);

      autoTable(doc, {
        startY: y,
        margin: TABLE_MARGIN,
        showHead: "everyPage",
        head: [["#", "Especie", "Categoria do Rebanho", "Existente", "A Adquirir", "Projetado", "Eq. UA", "Carga UA"]],
        body: rowsReb,
        theme: "plain",
        headStyles: TABLE_HEAD_STYLE,
        styles: TABLE_BODY_STYLE,
        alternateRowStyles: { fillColor: TABLE_ALT_BG },
        columnStyles: {
          0: { cellWidth:  8, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 26 },
          2: { cellWidth: 46 },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 20, halign: "center", fontStyle: "bold" },
          6: { cellWidth: 18, halign: "right" },
          7: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === rowsReb.length - 1) {
            data.cell.styles.fillColor = P.blueLight;
            data.cell.styles.textColor = P.navyMd;
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

      // Card de indicadores zootecnicos com MEMORIAL DE CALCULO EXPLICITO
      const paricao  = bovCorte?.paricaoPercent || bovLeite?.paricaoPercent || 0;
      const relMT    = bovCorte?.matrizesPorReprodutor || 0;
      const mortCria = bovCorte?.mortalidadeAte1AnoPercent || 0;

      const indTxt = paricao > 0
        ? `* Parametros Tecnicos Oficiais: Taxa de Paricao = ${paricao}% | Relacao Matriz/Touro = ${relMT}:1 | Mortalidade de Cria = ${mortCria}%.`
        : `* Balanco Zootecnico calculado a partir do efetivo de cabecas x fator de equivalencia UA informado.`;

      y = infoCard(doc, y, [
        `MEMORIAL DE CALCULO DO REBANHO E CARGA ANIMAL (TABELA F3 BNB):`,
        `* Efetivo Total = Rebanho Existente (${totAtual} cab) + Aquisicoes (${totAdq} cab) = ${totProj} cabecas totais projetadas.`,
        `* Carga Animal Total = Somatorio de [Efetivo por Categoria x Equivalencia UA (Eq. UA)] = ${fmtN(totUa, 2)} UA.`,
        indTxt,
      ], P.blue, P.blueLight);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  7. CAPACIDADE DE SUPORTE FORRAGEIRO (F4) — DADOS REAIS DA PROPOSTA
  // ══════════════════════════════════════════════════════════════════════
  if (projeto) {
    y = secTitle(doc, y, "F4", "CAPACIDADE DE SUPORTE FORRAGEIRO DO IMOVEL", P.blue);

    const munNorm  = normKey(relatorio.municipio);
    const fMun     = parametros.suporteForrageiroMunicipios?.[munNorm];
    const ativAgr = (projeto["Ativ. Agrícola"] || projRecord["Ativ. Agricola"] || {}) as ProjetoA2["Ativ. Agrícola"];
    const listaPastagens: UsoTerraAgricolaItem[] = ativAgr.usoTerrasPecuaria || [];
    const pastagens = listaPastagens.filter(
      (p: UsoTerraAgricolaItem) => p.descricao?.trim() && ((p.atualArea && Number(p.atualArea) > 0) || (p.atualUaHa && Number(p.atualUaHa) > 0))
    );

    const uaHaTeto = fMun?.suporteUaHa?.maximoSequeiroBraquiaria ?? 1.2;
    const chuva    = fMun?.chuvaMmAno ? `${fMun.chuvaMmAno} mm/ano` : "Semiarido / Transicao";
    const koppen   = fMun?.classeKoppen || "BSh";

    const uaEquivBovino = 1.0;
    let areaTot = 0, capTotUa = 0;

    if (pastagens.length === 0) {
      y = infoCard(doc, y, [
        `Nenhuma pastagem ou uso de terra pecuario cadastrado na aba Ativ. Agricola deste projeto.`,
        `Teto Tecnico Municipal de Suporte Forrageiro para ${txt(relatorio.municipio)}: ${fmtN(uaHaTeto)} UA/ha (Braquiaria em Sequeiro).`,
        `Precipitação Bioclimática: ${chuva} | Classificação Köppen: ${koppen}.`,
      ], P.green, P.greenBg);
    } else {
      const rowsFor = pastagens.map((p: UsoTerraAgricolaItem, idx: number) => {
        const area       = Number(p.atualArea) || 0;
        const lotProp    = Number(p.atualUaHa) || uaHaTeto;
        const capUa      = area * uaHaTeto;
        const maxAnimais = Math.floor(capUa / uaEquivBovino);
        areaTot   += area;
        capTotUa  += capUa;

        const diagn = lotProp > uaHaTeto * 1.05 ? "SOBREPASTEJO" : "ADEQUADO";

        return [
          txt(String(idx + 1)),
          txt(p.descricao),
          txt(`${fmtN(area)} ha`),
          txt(`${fmtN(lotProp)} UA/ha`),
          txt(`${fmtN(uaHaTeto)} UA/ha`),
          txt(`${fmtN(capUa, 1)} UA`),
          txt(`${maxAnimais} cab`),
          txt(diagn),
        ];
      });

      const maxTotAnimais = Math.floor(capTotUa / uaEquivBovino);

      autoTable(doc, {
        startY: y,
        margin: TABLE_MARGIN,
        showHead: "everyPage",
        head: [["#", "Tipologia Forrageira", "Area (ha)", "Lotacao Proposta", "Teto BNB (UA/ha)", "Cap. Suporte (UA)", "Max. Animais", "Diagnostico"]],
        body: rowsFor,
        theme: "plain",
        headStyles: TABLE_HEAD_STYLE,
        styles: TABLE_BODY_STYLE,
        alternateRowStyles: { fillColor: TABLE_ALT_BG },
        columnStyles: {
          0: { cellWidth:  8, halign: "center", fontStyle: "bold" },
          1: { cellWidth: 50 },
          2: { cellWidth: 18, halign: "right" },
          3: { cellWidth: 20, halign: "right" },
          4: { cellWidth: 20, halign: "right" },
          5: { cellWidth: 22, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 22, halign: "center", fontStyle: "bold" },
          7: { cellWidth: 26, halign: "center", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 7) {
            const v = String(data.cell.raw);
            if (v.includes("SOBREPASTEJO")) {
              data.cell.styles.textColor = P.red;
              data.cell.styles.fillColor = P.redBg;
            } else {
              data.cell.styles.textColor = P.green;
              data.cell.styles.fillColor = P.greenBg;
            }
          }
          if (data.section === "body" && data.column.index === 6) {
            data.cell.styles.textColor = P.navyMd;
            data.cell.styles.fillColor = P.blueLight;
          }
        },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

      y = infoCard(doc, y, [
        `MEMORIAL DE CALCULO DO SUPORTE FORRAGEIRO (TABELA F4 BNB):`,
        `* Capacidade Total de Pastejo = Area Total (${fmtN(areaTot)} ha) x Teto Municipal BNB (${fmtN(uaHaTeto)} UA/ha) = ${fmtN(capTotUa, 1)} UA.`,
        `* Quantidade Maxima de Animais Suportados = Capacidade Total (${fmtN(capTotUa, 1)} UA) / Equivalencia Bovina (1.0 UA/cab) = ${maxTotAnimais} cabecas.`,
        `* Bioclima Regional: Precipitacao = ${chuva} | Classificacao Koppen = ${koppen}.`,
      ], P.green, P.greenBg);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  8. MATRIZ COMPLETA — 27 CRITERIOS BNB / SEAP
  // ══════════════════════════════════════════════════════════════════════
  y = secTitle(doc, y, "S8", "MATRIZ COMPLETA DE CONFORMIDADE TECNICA (27 CRITERIOS BNB / SEAP)", P.navy);

  autoTable(doc, {
    startY: y,
    margin: TABLE_MARGIN,
    showHead: "everyPage",
    head: [["ID", "Criterio Tecnico Avaliado", "Status", "Valor Proposto", "Parametro Oficial BNB", "Base"]],
    body: relatorio.itens.map((item) => [
      txt(item.id),
      txt(item.regra),
      txt(item.status),
      txt(item.valorProposta || "--"),
      txt(item.valorReferencia || "--"),
      txt(item.fonte),
    ]),
    theme: "plain",
    headStyles: TABLE_HEAD_STYLE,
    styles: { ...TABLE_BODY_STYLE, minCellHeight: 5.5 },
    alternateRowStyles: { fillColor: TABLE_ALT_BG },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 68 },
      2: { cellWidth: 22, fontStyle: "bold", halign: "center" },
      3: { cellWidth: 30 },
      4: { cellWidth: 38 },
      5: { cellWidth: 18, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const v = String(data.cell.raw);
        if (v === "BLOQUEIA") {
          data.cell.styles.textColor = P.red;
          data.cell.styles.fillColor = P.redBg;
        } else if (v === "ALERTA") {
          data.cell.styles.textColor = P.amber;
          data.cell.styles.fillColor = P.amberBg;
        } else if (v === "OK") {
          data.cell.styles.textColor = P.green;
          data.cell.styles.fillColor = P.greenBg;
        }
      }
    },
  });

  // ══════════════════════════════════════════════════════════════════════
  //  9. RODAPE INSTITUCIONAL — PAGINACAO E IDENTIFICACAO EM TODAS AS PAGINAS
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  const dataHora   = `${dataFmt} as ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  const propHeaderNome = txt(relatorio.proponenteNome || "");

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Mini-header em paginas subsequentes (p > 1) desenhado a posteriori no topo livre
    if (i > 1) {
      doc.setFillColor(...P.navy);
      doc.rect(MG, 4.5, W, 7.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CONFORMIDADE TECNICA DA PROPOSTA  -  BNB / SEAP  -  PRONAF A2", MG + 3, 9.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.0);
      doc.setTextColor(...P.lightTxt);
      const capNome = propHeaderNome.length > 28 ? propHeaderNome.substring(0, 26) + ".." : propHeaderNome;
      doc.text(`Proponente: ${capNome}  |  CPF: ${relatorio.proponenteCpf || "--"}`, PW - MG - 3, 9.5, { align: "right" });
    }

    // Rodape
    doc.setDrawColor(...P.borderMd);
    doc.setLineWidth(0.2);
    doc.line(MG, PH - 10, PW - MG, PH - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(...P.mutedTxt);
    doc.text(
      "Documento tecnico emitido para subsidiar a formalizacao da proposta perante o Banco do Nordeste do Brasil (BNB) e SEAP.",
      MG, PH - 6
    );
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...P.navyMd);
    doc.text(`Pagina ${i} de ${totalPages}  |  Emitido em ${dataHora}`, PW - MG, PH - 6, { align: "right" });
  }

  const cleanCpf  = (relatorio.proponenteCpf || "PROPOSTA").replace(/\D/g, "");
  const nomeArq   = `Conformidade_Tecnica_PRONAF_${cleanCpf || "BNB"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArq);
  return doc;
}
