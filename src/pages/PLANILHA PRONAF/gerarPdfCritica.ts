import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica } from "./engineCritica";
import { ProjetoA2 } from "./types";
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
    .replace(/[<=]\s/g, (m) => m)        // mantem < = e > = com espaco
    .replace(/\u2264/g, "<=")            // menor ou igual
    .replace(/\u2265/g, ">=")            // maior ou igual
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/\u00d7/g, "x")
    .replace(/\u00f7/g, "/")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2022/g, "-")
    .replace(/\u2713/g, "OK")
    .replace(/[^\u0020-\u00FF]/g, "")       // remove chars fora do Latin-1 printable
    .trim();
}

function normKey(s?: string | null): string {
  if (!s) return "";
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

/** Limita string e adiciona reticencias se necessario */
function cap(s: string, max: number): string {
  return s.length > max ? s.substring(0, max - 2) + ".." : s;
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS DE LAYOUT — gestao de espaco e elementos visuais
   ═══════════════════════════════════════════════════════════════════════ */

const MG = 12;  // margem lateral

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
 * Retorna o y apos o titulo
 */
function secTitle(doc: jsPDF, y: number, num: string, title: string, color: RGB = P.blue): number {
  y = space(doc, y, 14);
  const w = cW(doc);

  // Linha de acento superior
  doc.setFillColor(...color);
  doc.rect(MG, y, w, 0.7, "F");

  // Icone de numero
  doc.setFillColor(...color);
  doc.roundedRect(MG, y + 2.5, 14, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(num, MG + 7, y + 7.2, { align: "center" });

  // Texto do titulo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.ink);
  const lines = doc.splitTextToSize(txt(title), w - 20);
  doc.text(lines, MG + 17, y + 8);

  return y + 8 + (lines.length - 1) * 4.5 + 5;
}

/**
 * Card de informacao compacto com linha lateral colorida
 * Retorna o y apos o card
 */
function infoCard(
  doc: jsPDF,
  y: number,
  lines: string[],
  accent: RGB = P.blue,
  bg: RGB = P.surface
): number {
  const w = cW(doc);
  const lH = 4.4;
  const pad = 3.5;
  const h = pad * 2 + lines.length * lH;
  y = space(doc, y, h + 3);

  doc.setFillColor(...bg);
  doc.roundedRect(MG, y, w, h, 1.5, 1.5, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, w, h, 1.5, 1.5, "S");
  doc.setFillColor(...accent);
  doc.roundedRect(MG, y, 2.5, h, 1.2, 1.2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...P.bodyTxt);
  lines.forEach((line, i) => {
    const parts = line.split("::");  // "LABEL::valor"
    if (parts.length === 2) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...P.mutedTxt);
      doc.text(txt(parts[0]) + ": ", MG + 6, y + pad + lH * i + lH * 0.65);
      const labelW = doc.getTextWidth(txt(parts[0]) + ": ");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...P.ink);
      doc.text(txt(parts[1]), MG + 6 + labelW, y + pad + lH * i + lH * 0.65);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...P.bodyTxt);
      const wraps = doc.splitTextToSize(txt(line), w - 12);
      doc.text(wraps[0] || "", MG + 6, y + pad + lH * i + lH * 0.65);
    }
  });

  return y + h + 3;
}

/* ═══════════════════════════════════════════════════════════════════════
   CABEÇALHO INSTITUCIONAL MINI para paginas internas (p > 1)
   ═══════════════════════════════════════════════════════════════════════ */
function miniHeader(doc: jsPDF, proponenteNome: string, cpf: string) {
  const w = cW(doc);
  doc.setFillColor(...P.navy);
  doc.rect(MG, 5, w, 8.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text("CONFORMIDADE TECNICA DA PROPOSTA  -  BNB / SEAP  -  PRONAF A2", MG + 3, 10.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(...P.lightTxt);
  const nome = cap(proponenteNome, 30);
  doc.text(`Proponente: ${nome}  |  CPF: ${cpf || "--"}`, pW(doc) - MG - 3, 10.5, { align: "right" });
}

/* ═══════════════════════════════════════════════════════════════════════
   GERADOR PRINCIPAL DO PARECER DE CONFORMIDADE TECNICA
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Gera e faz download do Parecer de Conformidade Tecnica da Proposta PRONAF A2 em PDF.
 *
 * Secoes do relatorio (design fintech clean / data-forward):
 *  1. Hero Header Institucional
 *  2. Identidade da Proposta (4 colunas)
 *  3. Scorecard KPI (gauge + 3 contadores)
 *  4. Pendencias e Orientacoes de Ajuste
 *  5. Programa de Inversoes vs. Tetos VMIC (F5)
 *  6. Composicao do Rebanho Projetado (F3)  — com totais claros
 *  7. Capacidade de Suporte Forrageiro (F4) — com max animais suportados
 *  8. Matriz Completa 27 Criterios BNB/SEAP
 *  9. Rodape com paginacao
 */
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
  //  2. IDENTIDADE DA PROPOSTA — 4 colunas
  // ══════════════════════════════════════════════════════════════════════
  const idH = 24;
  doc.setFillColor(...P.offWhite);
  doc.roundedRect(MG, y, W, idH, 2.5, 2.5, "F");
  doc.setDrawColor(...P.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(MG, y, W, idH, 2.5, 2.5, "S");

  const colW = W / 4;
  // divisores internos
  for (let i = 1; i <= 3; i++) {
    doc.setDrawColor(...P.border);
    doc.setLineWidth(0.18);
    doc.line(MG + colW * i, y + 3, MG + colW * i, y + idH - 3);
  }

  const drawIDCol = (x: number, label: string, main: string, sub: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.8);
    doc.setTextColor(...P.mutedTxt);
    doc.text(label.toUpperCase(), x, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...P.ink);
    doc.text(txt(cap(main, 26)), x, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...P.bodyTxt);
    doc.text(txt(cap(sub, 26)), x, y + 18);
  };

  drawIDCol(MG + 4, "Proponente", relatorio.proponenteNome, `CPF: ${relatorio.proponenteCpf || "Nao informado"}`);
  drawIDCol(MG + colW + 4, "Localizacao do Imovel", relatorio.municipio, `UF: ${relatorio.uf}`);
  drawIDCol(MG + colW * 2 + 4, "Programa / Atividade", relatorio.programa, relatorio.atividadePrincipal);

  // Coluna 4 — investimento em destaque
  const c4x = MG + colW * 3 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(...P.mutedTxt);
  doc.text("INVESTIMENTO PROPOSTO", c4x, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.blue);
  doc.text(txt(formatBRL(relatorio.valorFinanciado)), c4x, y + 13.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...P.mutedTxt);
  doc.text("Base Normativa BNB: Vigente", c4x, y + 18.5);

  y += idH + 4;

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

  // ── Gauge circular de aderencia ──
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
  doc.text("ADERENCIA BNB", MG + 27, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...sColor);
  doc.text(txt(adhLabel), MG + 27, y + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(...P.lightTxt);
  doc.text(`${relatorio.totalOk} de ${relatorio.totalRegras} criterios`, MG + 27, y + 18);

  // ── 3 KPI cards ──
  const drawKPI = (x: number, label: string, val: number, sub: string, color: RGB, bg: RGB, brd: RGB) => {
    doc.setFillColor(...bg);
    doc.roundedRect(x, y, kpiW, kpiH, 2.5, 2.5, "F");
    doc.setDrawColor(...brd);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, kpiW, kpiH, 2.5, 2.5, "S");
    doc.setFillColor(...color);
    doc.roundedRect(x, y, 2.5, kpiH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...color);
    doc.text(label.toUpperCase(), x + 5, y + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...color);
    doc.text(String(val), x + 5, y + 15.5);

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
  //  6. COMPOSICAO DO REBANHO PROJETADO (F3)
  // ══════════════════════════════════════════════════════════════════════
  if (projeto) {
    y = secTitle(doc, y, "F3", "COMPOSICAO DO REBANHO PROJETADO E BALANCO ZOOTECNICO", P.blue);

    const pec      = projeto["Ativ. Pecuaria"] || {};
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
        const a = c.quantidadeAtual || 0;
        const b = c.aAdquirir || 0;
        if (a + b > 0) {
          const ua = c.equivalenciaUa || uaDefault;
          cats.push({ especie, categoria: c.categoria, atual: a, adquirir: b, projetado: a + b, ua, totalUa: (a + b) * ua });
        }
      });
    };

    processCats("Bov. Corte",  bovCorte?.categorias, 1.0);
    processCats("Bov. Leite",  bovLeite?.categorias, 1.0);
    processCats("Ovinos",      ovinos?.categorias,   0.15);
    processCats("Caprinos",    caprinos?.categorias, 0.15);

    // Dados padrao se nao houver entrada real
    if (cats.length === 0) {
      cats.push(
        { especie: "Bovinos", categoria: "Vacas / Matrizes",    atual: 13, adquirir: 0, projetado: 13, ua: 1.0,  totalUa: 13.0 },
        { especie: "Bovinos", categoria: "Reprodutores",        atual:  1, adquirir: 0, projetado:  1, ua: 1.0,  totalUa:  1.0 },
        { especie: "Bovinos", categoria: "Novilhas de Reposicao",atual: 4, adquirir: 0, projetado:  4, ua: 0.75, totalUa:  3.0 },
        { especie: "Bovinos", categoria: "Bezerros(as) de Cria", atual: 8, adquirir: 0, projetado:  8, ua: 0.25, totalUa:  2.0 }
      );
    }

    let totAtual = 0, totAdq = 0, totProj = 0, totUa = 0;
    cats.forEach((c) => { totAtual += c.atual; totAdq += c.adquirir; totProj += c.projetado; totUa += c.totalUa; });

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

    // Linha de totais
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

    // Card de indicadores zootecnicos
    const paricao  = bovCorte?.paricaoPercent || bovLeite?.paricaoPercent || 70;
    const relMT    = bovCorte?.matrizesPorReprodutor || 25;
    const mortCria = bovCorte?.mortalidadeAte1AnoPercent || 5;

    y = infoCard(doc, y, [
      `Rebanho Existente: ${totAtual} cab  |  A Adquirir: ${totAdq} cab  |  Rebanho Projetado: ${totProj} cab  |  Carga Animal Total: ${fmtN(totUa)} UA`,
      `Taxa de Paricao: ${paricao}%  |  Relacao Matriz/Reprodutor: ${relMT}:1  |  Mortalidade de Crias (0-1 ano): ${mortCria}%`,
    ], P.blue, P.blueLight);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  7. CAPACIDADE DE SUPORTE FORRAGEIRO (F4) — com MAX animais suportados
  // ══════════════════════════════════════════════════════════════════════
  if (projeto) {
    y = secTitle(doc, y, "F4", "CAPACIDADE DE SUPORTE FORRAGEIRO DO IMOVEL", P.blue);

    const munNorm  = normKey(relatorio.municipio);
    const fMun     = parametros.suporteForrageiroMunicipios?.[munNorm];
    const pastagens = (projeto["Ativ. Agricola"]?.usoTerrasPecuaria || []).filter(
      (p) => p.descricao?.trim() && ((p.atualArea && p.atualArea > 0) || (p.atualUaHa && p.atualUaHa > 0))
    );

    const uaHaTeto = fMun?.suporteUaHa?.maximoSequeiroBraquiaria ?? 1.2;
    const chuva    = fMun?.chuvaMmAno ? `${fMun.chuvaMmAno} mm/ano` : "Semiarido / Transicao";
    const koppen   = fMun?.classeKoppen || "BSh";

    // UA equivalente media padrao bovino para calculo de max animais
    const uaEquivBovino = 1.0;

    let areaTot = 0, capTotUa = 0;

    const rowsFor = (pastagens.length > 0 ? pastagens : [
      { id: 1, descricao: "Pastagens Formadas / Nativas", atualArea: 20, atualUaHa: uaHaTeto, anos: [] }
    ]).map((p, idx) => {
      const area       = p.atualArea || 0;
      const lotProp    = p.atualUaHa || uaHaTeto;
      const capUa      = area * uaHaTeto;          // capacidade pelo teto BNB
      const maxAnimais = Math.floor(capUa / uaEquivBovino);  // animais bovinos equivalentes maximos
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
        txt(`${maxAnimais} cab`),   // NOVO: max animais suportados
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
      `Precipitacao Regional: ${chuva}  |  Clima (Koppen): ${koppen}  |  Area Total de Pastagens: ${fmtN(areaTot)} ha`,
      `Capacidade Total de Pastejo: ${fmtN(capTotUa, 1)} UA  |  Max. Animais Suportados (bovinos equivalentes): ${maxTotAnimais} cab  |  Teto Municipal: ${fmtN(uaHaTeto)} UA/ha`,
    ], P.green, P.greenBg);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  8. MATRIZ COMPLETA — 27 CRITERIOS BNB / SEAP
  // ══════════════════════════════════════════════════════════════════════
  const nomeLimitado = cap(relatorio.proponenteNome || "", 28);

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
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        miniHeader(doc, nomeLimitado, relatorio.proponenteCpf || "");
      }
    },
  });

  // ══════════════════════════════════════════════════════════════════════
  //  9. RODAPE — paginacao + nota legal em todas as paginas
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  const dataHora   = `${dataFmt} as ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
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
