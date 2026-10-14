import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RelatorioCritica, ItemCritica } from "./engineCritica";

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
 * Gera e realiza o download do Parecer Técnico de Conformidade e Auditoria do PRONAF A2 em PDF.
 */
export function gerarPdfParecerCritica(relatorio: RelatorioCritica): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;

  // Paleta de cores corporativa
  const COLORS = {
    headerBg: [15, 23, 42] as [number, number, number],       // Slate 900
    primary: [37, 99, 235] as [number, number, number],        // Blue 600
    ok: [16, 185, 129] as [number, number, number],           // Emerald 500
    alerta: [217, 119, 6] as [number, number, number],         // Amber 600
    bloqueia: [220, 38, 38] as [number, number, number],       // Red 600
    bgLight: [248, 250, 252] as [number, number, number],      // Slate 50
    cardBorder: [226, 232, 240] as [number, number, number],   // Slate 200
    textMain: [15, 23, 42] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
  };

  // ────────────────────────────────────────────────────────────
  // 1. CABEÇALHO INSTITUCIONAL
  // ────────────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.headerBg);
  doc.roundedRect(margin, margin, contentW, 26, 3, 3, "F");

  // Faixa de destaque lateral
  const statusColor =
    relatorio.statusGeral === "BLOQUEIA"
      ? COLORS.bloqueia
      : relatorio.statusGeral === "ALERTA"
      ? COLORS.alerta
      : COLORS.ok;

  doc.setFillColor(...statusColor);
  doc.roundedRect(margin, margin, 4.5, 26, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("BANCO DO NORDESTE DO BRASIL / SEAP — PRONAF A2", margin + 8, margin + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text("PARECER TÉCNICO DE AUDITORIA E CONFORMIDADE DE PROPOSTA", margin + 8, margin + 14);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Avaliação de 27 Regras Oficiais BNB (F1 a F5)  •  Emissão: ${relatorio.dataAvaliacao}`, margin + 8, margin + 20);

  // Badge Status no canto superior direito
  const badgeText =
    relatorio.statusGeral === "BLOQUEIA"
      ? "BLOQUEIO TÉCNICO"
      : relatorio.statusGeral === "ALERTA"
      ? "COM ADVERTÊNCIAS"
      : "TOTALMENTE CONFORME";

  doc.setFillColor(...statusColor);
  doc.roundedRect(pageW - margin - 48, margin + 6, 42, 14, 2.5, 2.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(badgeText, pageW - margin - 27, margin + 14.5, { align: "center" });

  // ────────────────────────────────────────────────────────────
  // 2. DADOS DO PROPONENTE E DA PROPOSTA
  // ────────────────────────────────────────────────────────────
  let currentY = margin + 30;

  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(margin, currentY, contentW, 28, 2.5, 2.5, "F");
  doc.setDrawColor(...COLORS.cardBorder);
  doc.roundedRect(margin, currentY, contentW, 28, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text("PROPONENTE / CLIENTE", margin + 4, currentY + 6);
  doc.text("MUNICÍPIO / UF", margin + 70, currentY + 6);
  doc.text("VALOR TOTAL FINANCIADO", margin + 130, currentY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMain);
  const nomeLimitado = relatorio.proponenteNome.length > 30 ? relatorio.proponenteNome.substring(0, 28) + "..." : relatorio.proponenteNome;
  doc.text(nomeLimitado, margin + 4, currentY + 11);
  doc.text(`${relatorio.municipio} - ${relatorio.uf}`, margin + 70, currentY + 11);
  doc.setTextColor(...COLORS.primary);
  doc.text(formatBRL(relatorio.valorFinanciado), margin + 130, currentY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`CPF: ${relatorio.proponenteCpf || "Não informado"}`, margin + 4, currentY + 16);
  doc.text("PROGRAMA DE CRÉDITO", margin + 4, currentY + 22);
  doc.text("ATIVIDADE PRINCIPAL", margin + 70, currentY + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMain);
  doc.text(relatorio.programa || "FNE / PRONAF A", margin + 4, currentY + 26);
  doc.text(relatorio.atividadePrincipal || "Bovinocultura de Corte", margin + 70, currentY + 26);

  currentY += 32;

  // ────────────────────────────────────────────────────────────
  // 3. INDICADORES DO PARECER (CARDS DE KPI)
  // ────────────────────────────────────────────────────────────
  const kpiW = (contentW - 3 * 3) / 4;
  const kpiH = 16;

  const kpis = [
    { label: "REGRAS AVALIADAS", val: String(relatorio.totalRegras), cor: COLORS.headerBg },
    { label: "CONFORMES (OK)", val: String(relatorio.totalOk), cor: COLORS.ok },
    { label: "ALERTAS (AVISO)", val: String(relatorio.totalAlertas), cor: COLORS.alerta },
    { label: "BLOQUEIOS (IMPEDE)", val: String(relatorio.totalBloqueios), cor: COLORS.bloqueia },
  ];

  kpis.forEach((kpi, idx) => {
    const kx = margin + idx * (kpiW + 3);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(kx, currentY, kpiW, kpiH, 2, 2, "F");
    doc.setDrawColor(...COLORS.cardBorder);
    doc.roundedRect(kx, currentY, kpiW, kpiH, 2, 2, "S");

    // Barra lateral de cor
    doc.setFillColor(...kpi.cor);
    doc.roundedRect(kx, currentY, 2, kpiH, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(kpi.label, kx + 5, currentY + 5.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...kpi.cor);
    doc.text(kpi.val, kx + 5, currentY + 12.5);
  });

  currentY += kpiH + 5;

  // ────────────────────────────────────────────────────────────
  // 4. SEÇÃO DE INCONFORMIDADES E "COMO RESOLVER"
  // ────────────────────────────────────────────────────────────
  const pendencias = relatorio.itens.filter((i) => i.status === "BLOQUEIA" || i.status === "ALERTA");

  if (pendencias.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...(relatorio.totalBloqueios > 0 ? COLORS.bloqueia : COLORS.alerta));
    doc.text(`INCONFORMIDADES IDENTIFICADAS E AÇÕES DE CORREÇÃO (${pendencias.length})`, margin, currentY);
    currentY += 4;

    const dataTabelaPendencias = pendencias.map((item) => [
      item.id,
      item.status,
      item.regra,
      String(item.valorProposta),
      String(item.valorReferencia),
      item.comoResolver,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Cód.", "Severidade", "Regra de Auditoria", "Valor Proposta", "Parâmetro BNB", "Orientação Técnica / Como Resolver"]],
      body: dataTabelaPendencias,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.headerBg,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: COLORS.textMain,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 12, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 18, fontStyle: "bold", halign: "center" },
        2: { cellWidth: 42, fontStyle: "bold" },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: "auto", textColor: [15, 23, 42] },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = String(data.cell.raw);
          if (val === "BLOQUEIA") {
            data.cell.styles.textColor = COLORS.bloqueia;
            data.cell.styles.fillColor = [254, 242, 242];
          } else if (val === "ALERTA") {
            data.cell.styles.textColor = COLORS.alerta;
            data.cell.styles.fillColor = [255, 251, 235];
          }
        }
        if (data.section === "body" && data.column.index === 5) {
          data.cell.styles.fillColor = [248, 250, 252];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
    currentY = (docWithAutoTable.lastAutoTable?.finalY ?? currentY) + 8;
  } else {
    // Alerta de 100% conforme
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, currentY, contentW, 14, 2, 2, "F");
    doc.setDrawColor(...COLORS.ok);
    doc.roundedRect(margin, currentY, contentW, 14, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.ok);
    doc.text("PARABÉNS! PROPOSTA EM PLENA CONFORMIDADE TÉCNICA", margin + 6, currentY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text("Nenhuma inconformidade ou advertência foi identificada perante as normas oficiais do Banco do Nordeste.", margin + 6, currentY + 10.5);

    currentY += 20;
  }

  // ────────────────────────────────────────────────────────────
  // 5. MATRIZ COMPLETA DE AUDITORIA (27 REGRAS)
  // ────────────────────────────────────────────────────────────
  if (currentY > pageH - 45) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.headerBg);
  doc.text("MATRIZ COMPLETA DE AVALIAÇÃO TÉCNICA (27 REGRAS BNB / SEAP)", margin, currentY);
  currentY += 4;

  const todasRegrasData = relatorio.itens.map((item) => [
    item.id,
    item.regra,
    item.status,
    String(item.valorProposta || "—"),
    String(item.valorReferencia || "—"),
    item.fonte,
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["ID", "Descrição da Regra", "Status", "Informado na Proposta", "Parâmetro Oficial BNB", "Base"]],
    body: todasRegrasData,
    theme: "striped",
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: COLORS.textMain,
    },
    columnStyles: {
      0: { cellWidth: 10, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 68 },
      2: { cellWidth: 20, fontStyle: "bold", halign: "center" },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 14, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const val = String(data.cell.raw);
        if (val === "BLOQUEIA") {
          data.cell.styles.textColor = COLORS.bloqueia;
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (val === "ALERTA") {
          data.cell.styles.textColor = COLORS.alerta;
          data.cell.styles.fillColor = [255, 251, 235];
        } else if (val === "OK") {
          data.cell.styles.textColor = COLORS.ok;
        }
      }
    },
  });

  // ────────────────────────────────────────────────────────────
  // 6. RODAPÉ COM PAGINAÇÃO E NOTA LEGAL EM TODAS AS PÁGINAS
  // ────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.cardBorder);
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      "Documento de auditoria técnica prévia BNB / SEAP. Valores conferidos automaticamente com base nos manuais de crédito vigentes.",
      margin,
      pageH - 6.5
    );
    doc.setFont("helvetica", "bold");
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 6.5, { align: "right" });
  }

  // Nome do arquivo para download
  const cleanCpf = (relatorio.proponenteCpf || "PROPOSTA").replace(/\D/g, "");
  const nomeArquivo = `Parecer_Tecnico_PRONAF_${cleanCpf || "BNB"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
  return doc;
}
