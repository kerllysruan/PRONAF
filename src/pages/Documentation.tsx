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
  ClipboardCheck,
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
    updateGedId,
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
  const [pageFilterProjetista, setPageFilterProjetista] = useState("all");

  // Keep selectedSubmission in sync when submissions array updates (after approve/reject)
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.token.id === selectedSubmission.token.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions]);

  // ─── Stats (Reactivity to pageFilterProjetista) ───────────────
  const filteredSubmissionsForStats = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    if (pageFilterProjetista === "all") return submissions;
    return submissions.filter(
      (s) => normalizeName(s.proposal.projetista) === pageFilterProjetista.toUpperCase()
    );
  }, [submissions, pageFilterProjetista]);

  const filteredAuthorizedForStats = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    if (pageFilterProjetista === "all") return authorizedProposals;
    return authorizedProposals.filter(
      (p) => normalizeName(p.projetista) === pageFilterProjetista.toUpperCase()
    );
  }, [authorizedProposals, pageFilterProjetista]);

  const totalSubmissions = filteredSubmissionsForStats.length;
  const fullyApproved = filteredSubmissionsForStats.filter(
    (s) => s.totalFiles > 0 && s.approvedCount === s.totalFiles
  ).length;
  const withPending = filteredSubmissionsForStats.filter((s) => s.pendingCount > 0).length;
  const withRejections = filteredSubmissionsForStats.filter((s) => s.rejectedCount > 0).length;

  // ─── Filtered list ────────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    let result = submissions;
    if (pageFilterProjetista !== "all") {
      result = result.filter(
        (s) => normalizeName(s.proposal.projetista) === pageFilterProjetista.toUpperCase()
      );
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (s) =>
        s.proposal.producer_name.toLowerCase().includes(term) ||
        (s.proposal.producer_cpf && s.proposal.producer_cpf.includes(term))
    );
  }, [submissions, searchTerm, pageFilterProjetista]);

  // ─── Filtered authorized proposals ────────────────────────────
  const filteredAuthorized = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    let result = authorizedProposals;
    if (pageFilterProjetista !== "all") {
      result = result.filter(
        (p) => normalizeName(p.projetista) === pageFilterProjetista.toUpperCase()
      );
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (p) =>
        p.producer_name.toLowerCase().includes(term) ||
        (p.producer_cpf && p.producer_cpf.includes(term))
    );
  }, [authorizedProposals, searchTerm, pageFilterProjetista]);

  // ─── Report data: merge both lists ─────────────────────────────
  const allProjetistas = useMemo(() => {
    const set = new Set<string>();
    const normalizeName = (name: string) => {
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };
    submissions.forEach((s) => {
      if (s.proposal.projetista) set.add(normalizeName(s.proposal.projetista));
    });
    authorizedProposals.forEach((p) => {
      if (p.projetista) set.add(normalizeName(p.projetista));
    });
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

    const normalizeProjetista = (name: string | null) => {
      if (!name) return null;
      const upper = name.trim().toUpperCase();
      if (upper === "NEY MEDEIRO" || upper === "NEY MEDEIROS") return "NEY MEDEIROS";
      return upper;
    };

    const items: ReportItem[] = [
      ...submissions.map((s) => ({
        producer_name: s.proposal.producer_name,
        producer_cpf: s.proposal.producer_cpf,
        projetista: normalizeProjetista(s.proposal.projetista),
        credit_program: s.proposal.credit_program,
        municipio: s.proposal.municipio,
        estimated_value: s.proposal.estimated_value,
        status_docs: s.approvedCount === s.totalFiles
          ? "APROVADA"
          : s.rejectedCount > 0
          ? "REPROVADA"
          : "PENDENTE",
        link: `${window.location.origin}/enviar-documentacao?token=${s.token.token}`,
      })),
      ...authorizedProposals.map((p) => ({
        producer_name: p.producer_name,
        producer_cpf: p.producer_cpf,
        projetista: normalizeProjetista(p.projetista),
        credit_program: p.credit_program,
        municipio: p.municipio,
        estimated_value: p.estimated_value,
        status_docs: "AGUARDANDO ENVIO DOCUMENTAÇÃO",
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
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, "F");

    // Header — gradient-style with accent stripe
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 32, pageW, 6, "F");
    // Accent stripe
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 38, pageW, 1.5, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 39.5, pageW, 1.5, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE DOCUMENTAÇÃO", 15, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Gerado em ${timestamp}`, 15, 23);

    // Filter badges in header
    doc.setFontSize(7);
    const drawBadge = (x: number, label: string, val: string) => {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(x, 8, 58, 20, 3, 3, "F");
      // Border
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, 8, 58, 20, 3, 3, "S");
      doc.setLineWidth(0.2);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.text(label, x + 5, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const truncVal = val.length > 22 ? val.substring(0, 20) + "..." : val;
      doc.text(truncVal, x + 5, 23);
      doc.setFont("helvetica", "normal");
    };
    drawBadge(pageW - 135, "PROJETISTA", reportFilterProjetista === "all" ? "TODOS" : reportFilterProjetista.toUpperCase());
    drawBadge(pageW - 72, "PROGRAMA", reportFilterPrograma === "all" ? "TODOS" : reportFilterPrograma.toUpperCase());

    // ── KPI Calculations ──────────────────────────────────
    const totalItems = filtered.length;
    const totalValue = filtered.reduce((acc, i) => acc + (Number(i.estimated_value) || 0), 0);
    const avgValue = totalItems > 0 ? totalValue / totalItems : 0;
    const countAprovada = filtered.filter((i) => i.status_docs === "APROVADA").length;
    const countReprovada = filtered.filter((i) => i.status_docs === "REPROVADA").length;
    const countAguardando = filtered.filter((i) => i.status_docs === "AGUARDANDO ENVIO DOCUMENTAÇÃO").length;
    const countPendente = filtered.filter((i) => i.status_docs === "PENDENTE").length;
    const pctAprovada = totalItems > 0 ? Math.round((countAprovada / totalItems) * 100) : 0;

    // ── ROW 1: Summary KPI Cards (3 large) ──────────────
    const kpiY = 48;
    const kpiW = 88;
    const kpiH = 26;
    const kpiGap = 5;
    const startX = 15;

    const drawBigKPI = (x: number, title: string, value: string, sub: string, color: [number, number, number]) => {
      // Card shadow
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(x + 0.5, kpiY + 0.5, kpiW, kpiH, 3, 3, "F");
      // Card background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "F");
      // Color accent left bar
      doc.setFillColor(...color);
      doc.roundedRect(x, kpiY, 3.5, kpiH, 3, 0, "F");
      doc.rect(x + 2, kpiY, 1.5, kpiH, "F");
      // Title
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 9, kpiY + 8);
      // Value
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(15);
      doc.text(value, x + 9, kpiY + 17);
      // Subtitle
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(sub, x + 9, kpiY + 22);
    };

    drawBigKPI(startX, "Total de Propostas", `${totalItems}`, "propostas no relatório", [79, 70, 229]);
    drawBigKPI(startX + kpiW + kpiGap, "Volume Total Estimado", formatCurrency(totalValue), "valor total bruto", [16, 185, 129]);
    drawBigKPI(startX + (kpiW + kpiGap) * 2, "Ticket Médio", formatCurrency(avgValue), "valor médio por proposta", [245, 158, 11]);

    // ── ROW 2: Status KPI Cards (4 cards with big numbers) ──
    const statusY = kpiY + kpiH + 5;
    const sKpiW = 65;
    const sKpiH = 28;
    const sKpiGap = 5;
    const sStartX = 15;

    const drawStatusKPI = (x: number, title: string, count: number, pct: number, color: [number, number, number]) => {
      // Card shadow
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(x + 0.5, statusY + 0.5, sKpiW, sKpiH, 3, 3, "F");
      // Card background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, statusY, sKpiW, sKpiH, 3, 3, "F");
      // Top color accent line
      doc.setFillColor(...color);
      doc.roundedRect(x, statusY, sKpiW, 3, 3, 0, "F");
      // Title
      doc.setTextColor(...color);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 5, statusY + 10);
      // Big number
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text(`${count}`, x + 5, statusY + 21);
      // Percentage
      doc.setTextColor(...color);
      doc.setFontSize(9);
      doc.text(`${pct}%`, x + sKpiW - 5, statusY + 21, { align: "right" });
      // Label
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("propostas", x + 5, statusY + 25);
    };

    const pctReprovada = totalItems > 0 ? Math.round((countReprovada / totalItems) * 100) : 0;
    const pctPendente = totalItems > 0 ? Math.round((countPendente / totalItems) * 100) : 0;
    const pctAguardando = totalItems > 0 ? Math.round((countAguardando / totalItems) * 100) : 0;

    drawStatusKPI(sStartX, "Aprovadas", countAprovada, pctAprovada, [16, 185, 129]);
    drawStatusKPI(sStartX + sKpiW + sKpiGap, "Pendentes", countPendente, pctPendente, [99, 102, 241]);
    drawStatusKPI(sStartX + (sKpiW + sKpiGap) * 2, "Reprovadas", countReprovada, pctReprovada, [239, 68, 68]);
    drawStatusKPI(sStartX + (sKpiW + sKpiGap) * 3, "Aguardando Envio", countAguardando, pctAguardando, [245, 158, 11]);

    // ── STATUS DISTRIBUTION (Large Horizontal Bars) ──────
    const mainY = statusY + sKpiH + 10;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUIÇÃO POR STATUS", 15, mainY);

    const statusData = [
      { label: "APROVADA", count: countAprovada, color: [16, 185, 129] as [number, number, number] },
      { label: "PENDENTE", count: countPendente, color: [99, 102, 241] as [number, number, number] },
      { label: "REPROVADA", count: countReprovada, color: [239, 68, 68] as [number, number, number] },
      { label: "AGUARDANDO ENVIO DOC.", count: countAguardando, color: [245, 158, 11] as [number, number, number] },
    ].filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

    const barX = 15;
    const barW = 115;
    const barH = 10;
    const barGap = 5;
    const maxC = Math.max(...statusData.map((s) => s.count), 1);

    statusData.forEach((s, i) => {
      const y = mainY + 8 + i * (barH + barGap);
      const fillW = Math.max((s.count / maxC) * barW, 15);
      // Background bar
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, y, barW, barH, 2.5, 2.5, "F");
      // Filled bar
      doc.setFillColor(...s.color);
      doc.roundedRect(barX, y, fillW, barH, 2.5, 2.5, "F");
      // Label above
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.text(s.label, barX + 2, y - 1.5);
      // Count + pct - render in dark slate/black to be clearly visible
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      // Render text to the right of the bar if it is short, otherwise offset inside but in black
      const textX = fillW > 35 ? barX + 4 : barX + fillW + 4;
      doc.text(`${s.count}  (${Math.round((s.count / totalItems) * 100)}%)`, textX, y + barH / 2 + 2.5);
    });

    // ── DONUT CHART (Approval Rate) ──────────────────────
    const midX = 155;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TAXA DE APROVAÇÃO", midX, mainY);

    const centerX = midX + 35;
    const centerY = mainY + 30;
    doc.setLineWidth(14);
    doc.setDrawColor(241, 245, 249);
    doc.circle(centerX, centerY, 20, "S");
    doc.setDrawColor(16, 185, 129);
    doc.circle(centerX, centerY, 20, "S");
    if (countReprovada > 0) {
      doc.setLineWidth(1);
    }
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${pctAprovada}%`, centerX, centerY + 3, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("APROVAÇÃO", centerX, centerY + 10, { align: "center" });

    // Legend with big numbers
    const legendY = mainY + 58;
    const drawLegend = (y: number, label: string, count: number, color: [number, number, number]) => {
      doc.setFillColor(...color);
      doc.roundedRect(midX + 2, y - 2, 4, 4, 1, 1, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${count}`, midX + 10, y + 1.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(label, midX + 20, y + 1.5);
    };
    drawLegend(legendY, "Aprovadas", countAprovada, [16, 185, 129]);
    drawLegend(legendY + 8, "Pendentes", countPendente, [99, 102, 241]);
    drawLegend(legendY + 16, "Reprovadas", countReprovada, [239, 68, 68]);
    drawLegend(legendY + 24, "Aguardando Envio Doc.", countAguardando, [245, 158, 11]);

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
      .slice(0, 7);

    autoTable(doc, {
      startY: mainY + 5,
      head: [["#", "MUNICÍPIO", "QTD", "VOLUME R$"]],
      body: munRanking.map((m, i) => [i + 1, m.name, m.count, formatCurrency(m.val)]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 7, halign: "center" },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { halign: "center", cellWidth: 8 }, 2: { halign: "center" }, 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: rightX, right: 15 },
      pageBreak: "avoid" as any,
    });

    // ═══════════════════════════════════════════════════
    // PÁGINA 2 — DETALHAMENTO COM BOTÕES DE LINK
    // ═══════════════════════════════════════════════════
    doc.addPage();
    // Subtle background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, "F");
    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 14, pageW, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHAMENTO DAS PROPOSTAS — DOCUMENTAÇÃO", 15, 9);

    const tableData = filtered.map((item, idx) => [
      idx + 1,
      item.producer_name.toUpperCase(),
      item.producer_cpf || "---",
      item.projetista?.toUpperCase() || "N/A",
      item.municipio || "---",
      item.status_docs,
      formatCurrency(Number(item.estimated_value) || 0),
      item.link ? "" : "—",
    ]);

    autoTable(doc, {
      startY: 18,
      head: [["#", "PRODUTOR", "CPF", "PROJETISTA", "MUNICÍPIO", "STATUS DOCUMENTAÇÃO", "VALOR R$", "AÇÃO"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7, halign: "center", fontStyle: "bold" },
      styles: { fontSize: 6.5, cellPadding: 2.5, valign: "middle", lineColor: [226, 232, 240], lineWidth: 0.3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 7 },
        1: { fontStyle: "bold", cellWidth: 46 },
        5: { halign: "center", cellWidth: 38 },
        6: { halign: "right", fontStyle: "bold" },
        7: { halign: "center", cellWidth: 30 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data: any) => {
        // Draw a visible button in the AÇÃO column
        if (data.section === "body" && data.column.index === 7) {
          const item = filtered[data.row.index];
          if (item?.link) {
            const btnW = 28;
            const btnH = 6;
            const btnX = data.cell.x + (data.cell.width - btnW) / 2;
            const btnY = data.cell.y + (data.cell.height - btnH) / 2;

            // Draw button background
            doc.setFillColor(79, 70, 229);
            doc.roundedRect(btnX, btnY, btnW, btnH, 1.5, 1.5, "F");

            // Draw button text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(4.8);
            doc.setFont("helvetica", "bold");
            doc.text("ENVIAR DOCUMENTAÇÃO", btnX + btnW / 2, btnY + btnH / 2 + 1.6, { align: "center" });

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
              className="gap-2 rounded-xl text-violet-600 border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              onClick={() => {
                const now = new Date();
                const dateStr = now.toLocaleDateString("pt-BR");
                const d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                const W = d.internal.pageSize.getWidth();
                const H = d.internal.pageSize.getHeight();

                // ── HEADER BAND ────────────────────────────────────
                // Dark navy background
                d.setFillColor(15, 23, 42);
                d.rect(0, 0, W, 38, "F");
                // Violet accent stripe
                d.setFillColor(99, 102, 241);
                d.rect(0, 38, W, 2, "F");
                // Light gray page body
                d.setFillColor(248, 250, 252);
                d.rect(0, 40, W, H - 40, "F");

                // Title
                d.setTextColor(255, 255, 255);
                d.setFont("helvetica", "bold");
                d.setFontSize(16);
                d.text("CHECKLIST DE DOCUMENTAÇÃO", 14, 14);

                // Subtitle tag
                d.setFillColor(99, 102, 241);
                d.roundedRect(14, 18, 42, 5.5, 1.5, 1.5, "F");
                d.setTextColor(255, 255, 255);
                d.setFont("helvetica", "bold");
                d.setFontSize(7);
                d.text("PRONAF — DOCUMENTAÇÃO", 35, 21.9, { align: "center" });

                // Info grid (right side)
                const infoItems = [
                  ["PRODUTOR", sub.proposal.producer_name || "—"],
                  ["CPF", sub.proposal.producer_cpf || "—"],
                  ["MUNICÍPIO", sub.proposal.municipio || "—"],
                  ["LINHA DE CRÉDITO", sub.proposal.linha_credito || sub.proposal.credit_program || "—"],
                ];
                const col1X = 14;
                const col2X = W / 2 + 4;
                infoItems.forEach((item, idx) => {
                  const col = idx % 2 === 0 ? col1X : col2X;
                  const row = Math.floor(idx / 2);
                  const baseY = 26 + row * 7;
                  d.setFont("helvetica", "bold");
                  d.setFontSize(6.5);
                  d.setTextColor(148, 163, 184);
                  d.text(item[0], col, baseY);
                  d.setFont("helvetica", "normal");
                  d.setFontSize(8);
                  d.setTextColor(255, 255, 255);
                  const maxW = W / 2 - 20;
                  d.text(item[1], col, baseY + 4, { maxWidth: maxW });
                });

                // ── BUILD GED MAP from files (user-assigned) ──────
                // Per document_type: pick latest file with a ged_id (prefer approved)
                const gedMap = new Map<string, string>(); // document_type -> ged_id
                const statusMap = new Map<string, string>(); // document_type -> best status

                sub.files.forEach((f) => {
                  const ex = statusMap.get(f.document_type);
                  // Track best status
                  if (!ex) {
                    statusMap.set(f.document_type, f.status);
                    if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                  } else if (f.status === "aprovado") {
                    statusMap.set(f.document_type, "aprovado");
                    if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                  } else if (f.status === "pendente" && ex !== "aprovado") {
                    statusMap.set(f.document_type, "pendente");
                    if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                  } else if (!gedMap.has(f.document_type) && f.ged_id) {
                    gedMap.set(f.document_type, f.ged_id);
                  }
                });

                // Counts
                let cEntregue = 0, cAguardando = 0, cReprovado = 0, cPendente = 0;
                DOCUMENTATION_REQUIRED.forEach((doc) => {
                  const st = statusMap.get(doc.key);
                  if (st === "aprovado") cEntregue++;
                  else if (st === "pendente") cAguardando++;
                  else if (st === "reprovado") cReprovado++;
                  else cPendente++;
                });

                // ── KPI SUMMARY ROW ───────────────────────────────
                const kpiY = 44;
                const kpiH = 14;
                const kpiW = (W - 28 - 9) / 4;
                const kpis = [
                  { label: "ENTREGUE", val: cEntregue, fill: [16, 185, 129] as [number, number, number] },
                  { label: "AGUARD. APROV.", val: cAguardando, fill: [245, 158, 11] as [number, number, number] },
                  { label: "REPROVADO", val: cReprovado, fill: [239, 68, 68] as [number, number, number] },
                  { label: "PENDENTE", val: cPendente, fill: [100, 116, 139] as [number, number, number] },
                ];
                kpis.forEach((k, i) => {
                  const x = 14 + i * (kpiW + 3);
                  d.setFillColor(255, 255, 255);
                  d.roundedRect(x, kpiY, kpiW, kpiH, 2, 2, "F");
                  d.setFillColor(...k.fill);
                  d.roundedRect(x, kpiY, 2.5, kpiH, 1, 1, "F");
                  d.setFont("helvetica", "bold");
                  d.setFontSize(12);
                  d.setTextColor(...k.fill);
                  d.text(String(k.val), x + 6, kpiY + 8.5);
                  d.setFont("helvetica", "normal");
                  d.setFontSize(6);
                  d.setTextColor(71, 85, 105);
                  d.text(k.label, x + 6, kpiY + 12.5);
                });

                // ── TABLE ─────────────────────────────────────────
                const tableBody = DOCUMENTATION_REQUIRED.map((doc, i) => {
                  const st = statusMap.get(doc.key);
                  const gedId = gedMap.get(doc.key) || "—";
                  let statusLabel = "PENDENTE";
                  if (st === "aprovado") statusLabel = "ENTREGUE";
                  else if (st === "pendente") statusLabel = "AGUARD. APROV.";
                  else if (st === "reprovado") statusLabel = "REPROVADO";
                  return [i + 1, gedId, doc.label, statusLabel];
                });

                // Status color map
                const STATUS_COLORS: Record<string, [number, number, number]> = {
                  "ENTREGUE": [16, 185, 129],
                  "AGUARD. APROV.": [245, 158, 11],
                  "REPROVADO": [239, 68, 68],
                  "PENDENTE": [100, 116, 139],
                };

                autoTable(d, {
                  startY: kpiY + kpiH + 4,
                  head: [["#", "ID-GED", "DOCUMENTO", "STATUS"]],
                  body: tableBody,
                  theme: "plain",
                  headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontSize: 7.5,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
                  },
                  styles: {
                    fontSize: 7.5,
                    cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                    valign: "middle",
                    textColor: [30, 41, 59],
                    lineColor: [226, 232, 240],
                    lineWidth: 0.3,
                  },
                  columnStyles: {
                    0: { halign: "center", cellWidth: 9 },
                    1: { halign: "center", cellWidth: 26, fontStyle: "bold", textColor: [99, 102, 241] },
                    2: { cellWidth: 115 },
                    3: { halign: "center", cellWidth: 38, fontStyle: "bold" },
                  },
                  alternateRowStyles: { fillColor: [241, 245, 249] },
                  willDrawCell: (data: any) => {
                    if (data.section === "body" && data.column.index === 3) {
                      const status = tableBody[data.row.index]?.[3] as string;
                      const color = STATUS_COLORS[status] || [100, 116, 139];
                      data.cell.styles.textColor = color;
                    }
                  },
                  didDrawPage: (hookData: any) => {
                    // Footer on each page
                    const pageNum = (d as any).internal.getCurrentPageInfo().pageNumber;
                    const total = (d as any).internal.getNumberOfPages();
                    d.setFillColor(30, 41, 59);
                    d.rect(0, H - 9, W, 9, "F");
                    d.setFont("helvetica", "normal");
                    d.setFontSize(6.5);
                    d.setTextColor(148, 163, 184);
                    d.text(`Gerado em ${dateStr}  ·  Proposta: ${sub.proposal.producer_name}`, 14, H - 3.5);
                    d.text(`Página ${pageNum} de ${total}`, W - 14, H - 3.5, { align: "right" });
                  },
                });

                const safeName = (sub.proposal.producer_name || "Produtor")
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, "_").toUpperCase();
                d.save(`Checklist_${safeName}_${now.toISOString().slice(0, 10)}.pdf`);
              }}
            >
              <ClipboardCheck className="h-4 w-4" />
              Gerar Checklist
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
          {(() => {
            // Deduplicate: show only 1 file per document_type
            // Priority: aprovado > pendente > reprovado, then most recent
            const statusPriority: Record<string, number> = { aprovado: 3, pendente: 2, reprovado: 1 };
            const bestByType = new Map<string, typeof sub.files[0]>();
            sub.files.forEach((file) => {
              const existing = bestByType.get(file.document_type);
              if (!existing) {
                bestByType.set(file.document_type, file);
              } else {
                const newPrio = statusPriority[file.status] || 0;
                const oldPrio = statusPriority[existing.status] || 0;
                if (newPrio > oldPrio || (newPrio === oldPrio && file.created_at > existing.created_at)) {
                  bestByType.set(file.document_type, file);
                }
              }
            });
            const uniqueFiles = [...bestByType.values()];
            return uniqueFiles.map((file) => {
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

                  {/* ── GED ID field ──────────────────────────── */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                      ID-GED:
                    </span>
                    <input
                      type="text"
                      defaultValue={file.ged_id ?? ""}
                      placeholder="Ex: GED-001"
                      maxLength={20}
                      className="flex-1 h-7 rounded-lg border border-border/60 bg-background px-2 text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all"
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (file.ged_id ?? "")) {
                          updateGedId(file.id, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                    />
                  </div>

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
          )()}
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
      {filteredAuthorizedForStats.length > 0 && (
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
                    {filteredAuthorizedForStats.length}
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
                    {filteredAuthorizedForStats.filter((p) => p.token).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Search Bar & Filter ─────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do produtor ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-border/60 bg-background/60"
              />
            </div>
            <div className="w-full sm:w-[250px]">
              <Select value={pageFilterProjetista} onValueChange={setPageFilterProjetista}>
                <SelectTrigger className="rounded-xl border-border/60 bg-background/60">
                  <SelectValue placeholder="Filtrar por projetista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Projetistas</SelectItem>
                  {allProjetistas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
