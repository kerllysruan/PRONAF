import { useState, useCallback, useMemo, useEffect } from "react";
import { useDocumentationReview, SubmittedProposal, AuthorizedProposal } from "@/hooks/useDocumentationReview";
import {
  getDocLabel,
  DOC_STATUS_COLORS,
  DOC_STATUS_LABELS,
  DOCUMENTATION_REQUIRED,
  DocFileStatus,
} from "@/types/documentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  FileCheck,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Archive,
  ArrowLeft,
  ClipboardList,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  FileText,
  RefreshCw,
  Undo2,
  Link2,
  Send,
  Clock,
  FileBarChart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Documentation() {
  const {
    submissions,
    authorizedProposals,
    loading,
    approveDocument,
    rejectDocument,
    approveProposal,
    revertProposal,
    downloadFile,
    getFileUrl,
    downloadAllAsZip,
    approveAllDocuments,
    rejectAllDocuments,
    refetch,
  } = useDocumentationReview();

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmittedProposal | null>(null);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfName, setViewingPdfName] = useState("");
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingFileId, setRejectingFileId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportFilterProjetista, setReportFilterProjetista] = useState("all");
  const [reportFilterPrograma, setReportFilterPrograma] = useState("all");

  // Keep selectedSubmission in sync when submissions array updates (after approve/reject)
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.token.id === selectedSubmission.token.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions]);

  // ─── Stats ────────────────────────────────────────────────────
  const totalSubmissions = submissions.length;
  const fullyApproved = submissions.filter(
    (s) => s.totalFiles > 0 && s.approvedCount === s.totalFiles
  ).length;
  const withPending = submissions.filter((s) => s.pendingCount > 0).length;
  const withRejections = submissions.filter((s) => s.rejectedCount > 0).length;

  // ─── Filtered list ────────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter(
      (s) =>
        s.proposal.producer_name.toLowerCase().includes(term) ||
        (s.proposal.producer_cpf && s.proposal.producer_cpf.includes(term))
    );
  }, [submissions, searchTerm]);

  // ─── Filtered authorized proposals ────────────────────────────
  const filteredAuthorized = useMemo(() => {
    if (!searchTerm.trim()) return authorizedProposals;
    const term = searchTerm.toLowerCase();
    return authorizedProposals.filter(
      (p) =>
        p.producer_name.toLowerCase().includes(term) ||
        (p.producer_cpf && p.producer_cpf.includes(term))
    );
  }, [authorizedProposals, searchTerm]);

  // ─── Report data: merge both lists ─────────────────────────────
  const allProjetistas = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => { if (s.proposal.projetista) set.add(s.proposal.projetista); });
    authorizedProposals.forEach((p) => { if (p.projetista) set.add(p.projetista); });
    return Array.from(set).sort();
  }, [submissions, authorizedProposals]);

  const allProgramas = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => { if (s.proposal.credit_program) set.add(s.proposal.credit_program); });
    authorizedProposals.forEach((p) => { if (p.credit_program) set.add(p.credit_program); });
    return Array.from(set).sort();
  }, [submissions, authorizedProposals]);

  // ─── Generate PDF Report ───────────────────────────────────────
  const generateReport = useCallback(() => {
    const formatCurrency = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Build unified data
    type ReportItem = {
      producer_name: string;
      producer_cpf: string | null;
      projetista: string | null;
      credit_program: string | null;
      municipio: string | null;
      estimated_value: number | null;
      status_docs: string;
      link: string | null;
    };

    const items: ReportItem[] = [
      ...submissions.map((s) => ({
        producer_name: s.proposal.producer_name,
        producer_cpf: s.proposal.producer_cpf,
        projetista: s.proposal.projetista,
        credit_program: s.proposal.credit_program,
        municipio: s.proposal.municipio,
        estimated_value: s.proposal.estimated_value,
        status_docs: s.approvedCount === s.totalFiles
          ? "APROVADA"
          : s.rejectedCount > 0
          ? "REPROVADA"
          : `${s.approvedCount}/${s.totalFiles}`,
        link: `${window.location.origin}/enviar-documentacao?token=${s.token.token}`,
      })),
      ...authorizedProposals.map((p) => ({
        producer_name: p.producer_name,
        producer_cpf: p.producer_cpf,
        projetista: p.projetista,
        credit_program: p.credit_program,
        municipio: p.municipio,
        estimated_value: p.estimated_value,
        status_docs: "AGUARDANDO ENVIO",
        link: p.token
          ? `${window.location.origin}/enviar-documentacao?token=${p.token}`
          : null,
      })),
    ];

    // Apply filters
    let filtered = items;
    if (reportFilterProjetista !== "all") {
      filtered = filtered.filter((i) => i.projetista === reportFilterProjetista);
    }
    if (reportFilterPrograma !== "all") {
      filtered = filtered.filter((i) => i.credit_program === reportFilterPrograma);
    }

    if (filtered.length === 0) {
      toast({ title: "Nenhuma proposta encontrada", description: "Ajuste os filtros e tente novamente.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const now = new Date();
    const timestamp = now.toLocaleString("pt-BR");

    // ═══════════════════════════════════════════════════
    // PÁGINA 1 — DASHBOARD KPI
    // ═══════════════════════════════════════════════════

    // Background
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageW, pageH, "F");

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 42, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 42, pageW, 2.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PRONAF DIGITAL", 15, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("RELATÓRIO DE DOCUMENTAÇÃO POR PROJETISTA", 15, 28);

    // Filter badges in header
    doc.setFontSize(7);
    const drawBadge = (x: number, label: string, val: string) => {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(x, 12, 55, 18, 2, 2, "F");
      doc.setTextColor(148, 163, 184);
      doc.text(label, x + 4, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      const truncVal = val.length > 25 ? val.substring(0, 22) + "..." : val;
      doc.text(truncVal, x + 4, 25);
      doc.setFont("helvetica", "normal");
    };
    drawBadge(pageW - 130, "PROJETISTA", reportFilterProjetista === "all" ? "TODOS" : reportFilterProjetista.toUpperCase());
    drawBadge(pageW - 70, "PROGRAMA", reportFilterPrograma === "all" ? "TODOS" : reportFilterPrograma.toUpperCase());

    // ── KPI Cards ──────────────────────────────────
    const totalItems = filtered.length;
    const totalValue = filtered.reduce((acc, i) => acc + (Number(i.estimated_value) || 0), 0);
    const avgValue = totalItems > 0 ? totalValue / totalItems : 0;
    const countAprovada = filtered.filter((i) => i.status_docs === "APROVADA").length;
    const countReprovada = filtered.filter((i) => i.status_docs === "REPROVADA").length;
    const countAguardando = filtered.filter((i) => i.status_docs === "AGUARDANDO ENVIO").length;
    const countEmAnalise = filtered.filter(
      (i) => i.status_docs !== "APROVADA" && i.status_docs !== "REPROVADA" && i.status_docs !== "AGUARDANDO ENVIO"
    ).length;
    const pctAprovada = totalItems > 0 ? Math.round((countAprovada / totalItems) * 100) : 0;

    const kpiY = 55;
    const kpiW = 44;
    const kpiH = 24;
    const kpiGap = 3.5;
    const startX = 15;

    const drawKPI = (x: number, title: string, value: string, sub: string, color: [number, number, number]) => {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "S");
      doc.setFillColor(...color);
      doc.rect(x + 5, kpiY + 8, 2, 10, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 10, kpiY + 10);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(value, x + 10, kpiY + 17);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(sub, x + 10, kpiY + 21);
    };

    drawKPI(startX, "Total Propostas", `${totalItems}`, "no relatório", [79, 70, 229]);
    drawKPI(startX + (kpiW + kpiGap), "Volume Total", formatCurrency(totalValue), "valor estimado", [16, 185, 129]);
    drawKPI(startX + (kpiW + kpiGap) * 2, "Ticket Médio", formatCurrency(avgValue), "por proposta", [245, 158, 11]);
    drawKPI(startX + (kpiW + kpiGap) * 3, "Aprovadas", `${pctAprovada}%`, `${countAprovada} propostas`, [16, 185, 129]);
    drawKPI(startX + (kpiW + kpiGap) * 4, "Em Análise", `${countEmAnalise}`, "docs enviados", [99, 102, 241]);
    drawKPI(startX + (kpiW + kpiGap) * 5, "Aguardando", `${countAguardando}`, "sem envio ainda", [245, 158, 11]);

    // ── STATUS DISTRIBUTION (Horizontal Bars) ──────
    const mainY = 90;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUIÇÃO POR STATUS DA DOCUMENTAÇÃO", 15, mainY);

    const statusData = [
      { label: "APROVADA", count: countAprovada, color: [16, 185, 129] as [number, number, number] },
      { label: "EM ANÁLISE", count: countEmAnalise, color: [99, 102, 241] as [number, number, number] },
      { label: "REPROVADA", count: countReprovada, color: [239, 68, 68] as [number, number, number] },
      { label: "AGUARDANDO ENVIO", count: countAguardando, color: [245, 158, 11] as [number, number, number] },
    ].filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

    const barX = 15;
    const barW = 100;
    const barH = 8;
    const barGap = 4;
    const maxC = Math.max(...statusData.map((s) => s.count), 1);

    statusData.forEach((s, i) => {
      const y = mainY + 8 + i * (barH + barGap);
      const fillW = (s.count / maxC) * barW;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, y, barW, barH, 2, 2, "F");
      doc.setFillColor(...s.color);
      if (fillW > 3) doc.roundedRect(barX, y, fillW, barH, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.text(s.label, barX + 2, y - 1);
      doc.setTextColor(15, 23, 42);
      doc.text(`${s.count} (${Math.round((s.count / totalItems) * 100)}%)`, barX + barW - 2, y + 6, { align: "right" });
    });

    // ── DONUT CHART (Health) ──────────────────────
    const midX = 140;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TAXA DE APROVAÇÃO", midX, mainY);

    const centerX = midX + 35;
    const centerY = mainY + 30;
    doc.setLineWidth(12);
    doc.setDrawColor(241, 245, 249);
    doc.circle(centerX, centerY, 18, "S");
    doc.setDrawColor(16, 185, 129);
    doc.circle(centerX, centerY, 18, "S");
    if (countReprovada > 0) {
      doc.setLineWidth(1);
    }
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.text(`${pctAprovada}%`, centerX, centerY + 2, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text("APROVAÇÃO", centerX, centerY + 8, { align: "center" });

    // Legend
    const legendY = mainY + 55;
    doc.setFillColor(16, 185, 129); doc.circle(midX + 5, legendY, 2, "F");
    doc.setTextColor(15, 23, 42); doc.setFontSize(7);
    doc.text(`Aprovadas: ${countAprovada}`, midX + 10, legendY + 2);
    doc.setFillColor(99, 102, 241); doc.circle(midX + 5, legendY + 6, 2, "F");
    doc.text(`Em Análise: ${countEmAnalise}`, midX + 10, legendY + 8);
    doc.setFillColor(239, 68, 68); doc.circle(midX + 5, legendY + 12, 2, "F");
    doc.text(`Reprovadas: ${countReprovada}`, midX + 10, legendY + 14);
    doc.setFillColor(245, 158, 11); doc.circle(midX + 5, legendY + 18, 2, "F");
    doc.text(`Aguardando: ${countAguardando}`, midX + 10, legendY + 20);

    // ── RANKING POR MUNICÍPIO ─────────────────────
    const rightX = 210;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOP MUNICÍPIOS", rightX, mainY);

    const munRanking = [...new Set(filtered.map((i) => i.municipio).filter(Boolean))]
      .map((m) => ({
        name: m!,
        count: filtered.filter((i) => i.municipio === m).length,
        val: filtered.filter((i) => i.municipio === m).reduce((a, b) => a + (Number(b.estimated_value) || 0), 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    autoTable(doc, {
      startY: mainY + 5,
      head: [["#", "MUNICÍPIO", "QTD", "VOLUME R$"]],
      body: munRanking.map((m, i) => [i + 1, m.name, m.count, formatCurrency(m.val)]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 7, halign: "center" },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { halign: "center", cellWidth: 8 }, 2: { halign: "center" }, 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: rightX, right: 15 },
    });

    // ═══════════════════════════════════════════════════
    // PÁGINA 2 — DETALHAMENTO COM BOTÕES DE LINK
    // ═══════════════════════════════════════════════════
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHAMENTO DAS PROPOSTAS — DOCUMENTAÇÃO", 15, 10);

    const tableData = filtered.map((item, idx) => [
      idx + 1,
      item.producer_name.toUpperCase(),
      item.producer_cpf || "---",
      item.projetista?.toUpperCase() || "N/A",
      item.municipio || "---",
      item.status_docs,
      formatCurrency(Number(item.estimated_value) || 0),
      item.link ? "📄 ENVIAR DOCS" : "—",
    ]);

    autoTable(doc, {
      startY: 18,
      head: [["#", "PRODUTOR", "CPF", "PROJETISTA", "MUNICÍPIO", "STATUS DOCS", "VALOR R$", "AÇÃO"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 7.5, halign: "center" },
      styles: { fontSize: 7, cellPadding: 2, valign: "middle" },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { fontStyle: "bold", cellWidth: 50 },
        5: { halign: "center" },
        6: { halign: "right", fontStyle: "bold" },
        7: { halign: "center", cellWidth: 28 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data: any) => {
        // Draw a visible button in the AÇÃO column
        if (data.section === "body" && data.column.index === 7) {
          const item = filtered[data.row.index];
          if (item?.link) {
            const btnW = 24;
            const btnH = 6;
            const btnX = data.cell.x + (data.cell.width - btnW) / 2;
            const btnY = data.cell.y + (data.cell.height - btnH) / 2;

            // Draw button background
            doc.setFillColor(79, 70, 229);
            doc.roundedRect(btnX, btnY, btnW, btnH, 1.5, 1.5, "F");

            // Draw button text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(5.5);
            doc.setFont("helvetica", "bold");
            doc.text("ENVIAR DOCS", btnX + btnW / 2, btnY + btnH / 2 + 1.5, { align: "center" });

            // Make it clickable
            doc.link(btnX, btnY, btnW, btnH, { url: item.link });
          }
        }
      },
    });

    // ── Page with individual link buttons ──
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("LINKS DE ENVIO DE DOCUMENTAÇÃO", 15, 10);

    const linkItems = filtered.filter((i) => i.link);
    const linkData = linkItems.map((item, idx) => [
      idx + 1,
      item.producer_name.toUpperCase(),
      item.producer_cpf || "---",
      item.status_docs,
      "", // placeholder for the button
    ]);

    autoTable(doc, {
      startY: 18,
      head: [["#", "PRODUTOR", "CPF", "STATUS", "ABRIR PÁGINA DE ENVIO"]],
      body: linkData,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 7.5, halign: "center" },
      styles: { fontSize: 7, cellPadding: 3, valign: "middle" },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { fontStyle: "bold", cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { halign: "center", cellWidth: 30 },
        4: { halign: "center", cellWidth: 55 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const item = linkItems[data.row.index];
          if (item?.link) {
            const btnW = 48;
            const btnH = 7;
            const btnX = data.cell.x + (data.cell.width - btnW) / 2;
            const btnY = data.cell.y + (data.cell.height - btnH) / 2;

            // Draw button background (green)
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(btnX, btnY, btnW, btnH, 2, 2, "F");

            // Draw button text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.text("📄 ABRIR PÁGINA DE ENVIO", btnX + btnW / 2, btnY + btnH / 2 + 1.8, { align: "center" });

            // Make it clickable
            doc.link(btnX, btnY, btnW, btnH, { url: item.link });
          }
        }
      },
    });

    // FOOTER (All Pages)
    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gerado em ${timestamp}  |  PRONAF Digital  |  Página ${i} de ${pages}`,
        pageW / 2,
        pageH - 5,
        { align: "center" }
      );
    }

    const projetistaName = reportFilterProjetista === "all" ? "GERAL" : reportFilterProjetista.replace(/\s+/g, "_").toUpperCase();
    doc.save(`Relatorio_Documentacao_${projetistaName}_${now.toISOString().slice(0, 10).replace(/-/g, "")}.pdf`);
    setReportDialogOpen(false);
    toast({ title: "Relatório gerado com sucesso! 📊", description: "O PDF foi baixado." });
  }, [submissions, authorizedProposals, reportFilterProjetista, reportFilterPrograma, toast]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleViewPdf = useCallback(
    async (filePath: string, fileName: string) => {
      setPdfLoading(true);
      setViewingPdfName(fileName);
      try {
        const url = await getFileUrl(filePath);
        if (url) {
          setViewingPdfUrl(url);
          setIsPdfDialogOpen(true);
        }
      } finally {
        setPdfLoading(false);
      }
    },
    [getFileUrl]
  );

  const handleClosePdfDialog = useCallback(() => {
    setIsPdfDialogOpen(false);
    setViewingPdfUrl(null);
    setViewingPdfName("");
  }, []);

  const handleOpenRejectDialog = useCallback((fileId: string) => {
    setRejectingFileId(fileId);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingFileId || !selectedSubmission) return;
    await rejectDocument(rejectingFileId, rejectReason, selectedSubmission.token.id);
    setRejectDialogOpen(false);
    setRejectingFileId(null);
    setRejectReason("");
  }, [rejectingFileId, rejectReason, selectedSubmission, rejectDocument]);

  const handleApproveProposal = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveProposal(selectedSubmission.token.id, selectedSubmission.proposal.id);
  }, [selectedSubmission, approveProposal]);

  const handleApproveAllDocs = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveAllDocuments(selectedSubmission.token.id);
  }, [selectedSubmission, approveAllDocuments]);

  const handleConfirmBulkReject = useCallback(async () => {
    if (!selectedSubmission) return;
    await rejectAllDocuments(selectedSubmission.token.id, bulkRejectReason);
    setBulkRejectDialogOpen(false);
    setBulkRejectReason("");
  }, [selectedSubmission, bulkRejectReason, rejectAllDocuments]);

  // ─── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Detail View ──────────────────────────────────────────────
  if (selectedSubmission) {
    const sub = selectedSubmission;
    const approvedPct =
      sub.totalFiles > 0
        ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
        : 0;
    const allApproved = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;

    return (
      <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setSelectedSubmission(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading font-extrabold text-xl md:text-2xl leading-tight">
                {sub.proposal.producer_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                CPF: {sub.proposal.producer_cpf || "—"} · {sub.proposal.municipio || "—"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`ml-2 text-xs ${
                allApproved
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : sub.rejectedCount > 0
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }`}
            >
              {allApproved
                ? "Totalmente Aprovada"
                : sub.rejectedCount > 0
                ? "Com Reprovações"
                : "Em Análise"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sub.files.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/30"
                  onClick={handleApproveAllDocs}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Aprovar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl text-red-700 border-red-300 hover:bg-red-50 bg-red-50/30"
                  onClick={() => {
                    setBulkRejectReason("");
                    setBulkRejectDialogOpen(true);
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reprovar Todos
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => downloadAllAsZip(sub)}
            >
              <Archive className="h-4 w-4" />
              Baixar Todos em ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={async () => {
                const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                await navigator.clipboard.writeText(url);
                toast({
                  title: "Link copiado! 📋",
                  description: "Link da página de envio copiado para a área de transferência.",
                });
              }}
            >
              <Link2 className="h-4 w-4" />
              Copiar Link Envio
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={() => setRevertDialogOpen(true)}
            >
              <Undo2 className="h-4 w-4" />
              Reverter Status
            </Button>
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!allApproved}
              onClick={handleApproveProposal}
            >
              <ShieldCheck className="h-4 w-4" />
              Aprovar Proposta
            </Button>
          </div>
        </div>

        {/* ── Progress Card ──────────────────────────────────── */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 pb-5 px-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Progresso da Documentação
                </p>
                <p className="font-heading font-extrabold text-2xl mt-1">
                  {sub.approvedCount}
                  <span className="text-muted-foreground font-medium text-base">
                    /{sub.totalFiles}
                  </span>{" "}
                  <span className="text-sm font-medium text-muted-foreground">aprovados</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-heading font-extrabold text-3xl text-primary">
                  {approvedPct}%
                </span>
              </div>
            </div>
            <Progress value={approvedPct} className="h-2.5 rounded-full" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {sub.approvedCount} aprovados
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {sub.pendingCount} pendentes
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                {sub.rejectedCount} reprovados
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Documents Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sub.files.map((file) => {
            const status = file.status as DocFileStatus;
            return (
              <Card
                key={file.id}
                className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <p className="font-heading font-bold text-sm truncate">
                        {getDocLabel(file.document_type)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${DOC_STATUS_COLORS[status]}`}
                    >
                      {DOC_STATUS_LABELS[status]}
                    </Badge>
                  </div>

                  {status === "reprovado" && file.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                        <span className="font-bold">Motivo:</span> {file.rejection_reason}
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
                    {file.file_name}
                  </p>

                  <Separator className="opacity-50" />

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl text-xs h-8"
                      disabled={pdfLoading}
                      onClick={() => handleViewPdf(file.file_path, file.file_name)}
                    >
                      {pdfLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl text-xs h-8"
                      onClick={() => downloadFile(file.file_path, file.file_name)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </Button>
                    {status !== "aprovado" && (
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => approveDocument(file.id)}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Aprovar
                      </Button>
                    )}
                    {status !== "reprovado" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs h-8"
                        onClick={() => handleOpenRejectDialog(file.id)}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Reprovar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sub.files.length === 0 && (
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">Nenhum documento enviado nesta proposta.</p>
            </CardContent>
          </Card>
        )}

        {/* ── PDF Viewer Dialog ───────────────────────────────── */}
        <Dialog open={isPdfDialogOpen} onOpenChange={handleClosePdfDialog}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {viewingPdfName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pré-visualização do documento enviado
              </DialogDescription>
            </DialogHeader>
            <div className="h-[80vh] w-full bg-muted/20">
              {viewingPdfUrl ? (
                <iframe
                  src={viewingPdfUrl}
                  className="w-full h-full border-0"
                  title={viewingPdfName}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Reject Dialog ──────────────────────────────────── */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Documento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Confirmar Reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ── Bulk Reject Dialog ──────────────────────────────────── */}
        <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Todos os Documentos
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação em lote de todos os documentos. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação geral..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setBulkRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!bulkRejectReason.trim()}
                onClick={handleConfirmBulkReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Reprovar Todos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Revert Confirmation Dialog ──────────────────────────── */}
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-amber-500" />
                Reverter Proposta
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Isto irá restaurar o status da proposta para{" "}
                <strong>{sub.token.previous_status || "CADASTRADA"}</strong>,
                excluir todos os documentos enviados e remover o token de envio.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRevertDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isReverting}
                onClick={async () => {
                  setIsReverting(true);
                  const success = await revertProposal(sub);
                  setIsReverting(false);
                  if (success) {
                    setRevertDialogOpen(false);
                    setSelectedSubmission(null);
                  }
                }}
              >
                {isReverting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Revertendo...
                  </>
                ) : (
                  <>
                    <Undo2 className="h-4 w-4" />
                    Confirmar Reversão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── List View (no proposal selected) ─────────────────────────
  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight">
              Documentação
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de conformidade e análise documental
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            onClick={() => {
              setReportFilterProjetista("all");
              setReportFilterPrograma("all");
              setReportDialogOpen(true);
            }}
          >
            <FileBarChart className="h-4 w-4" />
            Gerar Relatório
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ── Report Dialog ─────────────────────────────────── */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-indigo-500" />
              Gerar Relatório PDF
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Selecione os filtros para gerar o relatório de documentação com KPIs e links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Projetista
              </label>
              <Select value={reportFilterProjetista} onValueChange={setReportFilterProjetista}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos os projetistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetistas</SelectItem>
                  {allProjetistas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Programa de Crédito
              </label>
              <Select value={reportFilterPrograma} onValueChange={setReportFilterPrograma}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  {allProgramas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={generateReport}
            >
              <FileBarChart className="h-4 w-4" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Recebidas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight">
                  {totalSubmissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fully Approved */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Totalmente Aprovadas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-emerald-600">
                  {fullyApproved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Pending */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Pendências
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-amber-600">
                  {withPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Rejections */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Reprovações
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-red-600">
                  {withRejections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Stats Cards - Authorized ─────────────────────────── */}
      {authorizedProposals.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Autorizadas (Aguardando Docs)
                  </p>
                  <p className="font-heading font-extrabold text-2xl leading-tight text-blue-600">
                    {authorizedProposals.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10">
                  <Link2 className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Com Link Gerado
                  </p>
                  <p className="font-heading font-extrabold text-2xl leading-tight text-violet-600">
                    {authorizedProposals.filter((p) => p.token).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Search Bar ───────────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do produtor ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-border/60 bg-background/60"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Aguardando Documentação Table ─────────────────────── */}
      {filteredAuthorized.length > 0 && (
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 px-6 pt-5">
            <CardTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Aguardando Documentação
              <Badge variant="secondary" className="ml-2 font-mono text-xs bg-blue-100 text-blue-700 border-blue-200">
                {filteredAuthorized.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Propostas com status "Autorizado Envio para Central" — link de envio gerado automaticamente
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6">
                      Produtor
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Projetista
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Município
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuthorized.map((p) => (
                    <TableRow
                      key={p.id}
                      className="transition-all duration-300 hover:bg-accent/50 border-border/30"
                    >
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-semibold text-sm leading-tight">
                            {p.producer_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.producer_cpf || "CPF não informado"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {p.projetista || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-100 text-blue-700 border-blue-200"
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {p.municipio || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {p.token ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Copiar Link de Envio"
                            onClick={async () => {
                              const url = `${window.location.origin}/enviar-documentacao?token=${p.token}`;
                              await navigator.clipboard.writeText(url);
                              toast({
                                title: "Link copiado! 📋",
                                description: "Link da página de envio copiado.",
                              });
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline-block" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}


      {/* ── Table ────────────────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-6 pt-5">
          <CardTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Propostas Recebidas
            <Badge variant="secondary" className="ml-2 font-mono text-xs">
              {filteredSubmissions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileCheck className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">
                {searchTerm.trim()
                  ? "Nenhuma proposta encontrada com os termos pesquisados."
                  : "Nenhuma documentação recebida até o momento."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6">
                      Produtor
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Projetista
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status Docs
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Município
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const pct =
                      sub.totalFiles > 0
                        ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
                        : 0;
                    const allOk = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;
                    const hasRejects = sub.rejectedCount > 0;

                    return (
                      <TableRow
                        key={sub.token.id}
                        className="cursor-pointer transition-all duration-300 hover:bg-accent/50 border-border/30"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        <TableCell className="pl-6 py-4">
                          <div>
                            <p className="font-semibold text-sm leading-tight">
                              {sub.proposal.producer_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sub.proposal.producer_cpf || "CPF não informado"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {sub.proposal.projetista || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[140px]">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                allOk
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : hasRejects
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                            >
                              {sub.approvedCount}/{sub.totalFiles} aprovados
                            </Badge>
                            <Progress value={pct} className="h-1.5 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {sub.proposal.municipio || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Copiar Link de Envio"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                                await navigator.clipboard.writeText(url);
                                toast({
                                  title: "Link copiado! 📋",
                                  description: "Link da página de envio copiado.",
                                });
                              }}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 text-slate-500 hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmission(sub);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
