import { useState, useMemo, useRef } from "react";
import {
  FileText, CheckCircle2, Search, DollarSign, TrendingUp, Loader2,
  Sparkles, AlertTriangle, Clock, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  Filter, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LabelList,
} from "recharts";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { STATUS_LABELS, PRONAF_LINE_LABELS, PROJECT_DESIGNER_LABELS, type ProposalStatus, type PronafLine, type ProjectDesigner } from "@/types/proposal";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useAgency } from "@/contexts/AgencyContext";

const CHART_COLORS = [
  "hsl(215, 70%, 32%)", "hsl(210, 80%, 55%)", "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(199, 89%, 48%)", "hsl(280, 60%, 50%)",
];

const STATUS_CHART_COLORS: Record<string, string> = {
  nova: "hsl(199, 89%, 48%)", // sky
  em_analise: "hsl(215, 70%, 50%)", // blue
  documentacao_pendente: "hsl(38, 92%, 50%)", // amber
  avaliacao_risco: "hsl(346, 87%, 60%)", // rose
  consideracoes_gerenciais: "hsl(215, 16%, 47%)", // slate
  votacao_sinc: "hsl(220, 70%, 40%)", // darker blue
  contrato_liberado: "hsl(142, 71%, 45%)", // emerald
  desembolso: "hsl(175, 70%, 41%)", // teal
  desembolso_solicitado: "hsl(240, 70%, 65%)", // indigo
  em_andamento: "hsl(270, 70%, 60%)", // violet
  aprovada: "hsl(142, 71%, 35%)", // green legacy
  negada: "hsl(0, 72%, 51%)", // red legacy
};

export default function Dashboard() {
  const { proposals, loading: loadingP } = useProposals();
  const { tasks, members, loading: loadingT } = useTeam();
  const { agencies, effectiveAgencyId } = useAgency();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // States for the report filter dialog
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Helper arrays for filters
  const allDesigners = useMemo(() => Object.keys(PROJECT_DESIGNER_LABELS), []);
  const allStatuses = useMemo(() => Object.keys(STATUS_LABELS), []);
  const allMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);
  const allPrograms = useMemo(() => {
    const progs = new Set(proposals.map(p => p.credit_program).filter(Boolean) as string[]);
    return Array.from(progs);
  }, [proposals]);

  const toggleSelection = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleAll = (list: string[], setList: (val: string[]) => void, allItems: string[]) => {
    if (list.length === allItems.length) {
      setList([]);
    } else {
      setList([...allItems]);
    }
  };

  const reportListRef = useRef<HTMLDivElement>(null);
  const printableContentRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  const evolutionChartRef = useRef<HTMLDivElement>(null);
  const programsChartRef = useRef<HTMLDivElement>(null);
  const designerChartRef = useRef<HTMLDivElement>(null);



  const availableYears = useMemo(() => {
    const years = new Set(proposals.map((p) => String(getYear(parseISO(p.created_at)))));
    return Array.from(years).sort().reverse();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const d = parseISO(p.created_at);
      const pMonth = (getMonth(d) + 1).toString();
      const pYear = getYear(d).toString();

      // Core Filters (Month/Year from top bar)
      if (filterMonth !== "all" && getMonth(d) + 1 !== Number(filterMonth)) return false;
      if (filterYear !== "all" && getYear(d) !== Number(filterYear)) return false;

      // Report/Global Extension Filters
      const matchesDesigner = selectedDesigners.length === 0 || (p.project_designer && selectedDesigners.includes(p.project_designer));
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(p.status);
      const matchesProgram = selectedPrograms.length === 0 || (p.credit_program && selectedPrograms.includes(p.credit_program));

      return matchesDesigner && matchesStatus && matchesProgram;
    });
  }, [proposals, filterMonth, filterYear, selectedDesigners, selectedStatuses, selectedPrograms]);

  const ongoingProposals = useMemo(() => 
    filteredProposals.filter(p => !['negada', 'aprovada', 'contrato_liberado'].includes(p.status)),
    [filteredProposals]
  );

  const handleExportPDF = async () => {
    setIsExporting(true);
    setIsFilterDialogOpen(false);
    
    try {
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pdfWidth - (margin * 2);

      const addHeader = (title: string, pageType: string) => {
        const currentAgency = agencies.find(a => a.id === effectiveAgencyId);
        const agencyNameStr = currentAgency ? currentAgency.name.toUpperCase() : "GERAL";
        
        const HIERARCHY_RANK: Record<string, number> = {
          "GERENTE GERAL": 1,
          "GERENTE DE RELACIONAMENTO": 2,
          "AUXILIAR DE NEGÓCIOS": 3,
          "ANALISTA BANCÁRIO": 4,
          "SUPORTE ADMINISTRATIVO": 5
        };

        const sortedTeam = [...members].sort((a, b) => {
          const rankA = HIERARCHY_RANK[a.role.toUpperCase()] || 99;
          const rankB = HIERARCHY_RANK[b.role.toUpperCase()] || 99;
          return rankA - rankB;
        });
        
        pdf.setFillColor(5, 46, 22); // Deep Emerald (Success Green)
        pdf.rect(0, 0, pdfWidth, 65, "F");
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        // Using a safe width to avoid collision with right-side metadata
        const titleText = `RELATÓRIO CARTEIRA AGRO - ${agencyNameStr}`;
        pdf.text(titleText, margin, 15, { maxWidth: contentWidth - 50 });
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5); // Slightly smaller for multiple lines
        
        // Render each member in its own line
        let currentY = 25;
        sortedTeam.forEach((m) => {
          if (currentY < 50) { // Limit to avoid overlap with section title
            pdf.text(`${m.name.toUpperCase()} (${m.role.toUpperCase()})`, margin, currentY);
            currentY += 4.5;
          }
        });
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(title.toUpperCase(), margin, 55);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(`GERADO: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pdfWidth - margin, 15, { align: "right" });
        pdf.text(pageType, pdfWidth - margin, 25, { align: "right" });
        
        pdf.setDrawColor(212, 175, 55); // Rich Gold (Prosperity)
        pdf.line(margin, 58, pdfWidth - margin, 58);
      };

      const addFooter = (pageNum: number) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Documento de Gestão Estratégica - PRONAF Digital`, margin, pdfHeight - 10);
        pdf.text(`Página ${pageNum}`, pdfWidth - margin, pdfHeight - 10, { align: "right" });
      };

      // PAGE 1: EXECUTIVE SUMMARY & STATUS
      addHeader("Visão Geral e Distribuição de Status", "VISÃO ESTRATÉGICA");
      
      if (printableContentRef.current) {
        const kpiGrid = printableContentRef.current.querySelector('.grid') as HTMLElement;
        const kpiCanvas = await html2canvas(kpiGrid, { 
          scale: 2, 
          backgroundColor: "#FFFFFF",
          logging: false 
        });
        const kpiImg = kpiCanvas.toDataURL("image/jpeg", 0.8);
        const kpiRatio = contentWidth / kpiCanvas.width;
        pdf.addImage(kpiImg, "JPEG", margin, 70, contentWidth, kpiCanvas.height * kpiRatio);

        if (statusChartRef.current) {
          const statusCanvas = await html2canvas(statusChartRef.current, { 
            scale: 2,
            logging: false 
          });
          const statusImg = statusCanvas.toDataURL("image/jpeg", 0.8);
          const statusRatio = contentWidth / statusCanvas.width;
          pdf.addImage(statusImg, "JPEG", margin, 120, contentWidth, statusCanvas.height * statusRatio);
        }
      }
      addFooter(1);

      // PAGE 2: ANALYTICS & PERFORMANCE
      pdf.addPage();
      addHeader("Performance Temporal e Produtividade", "ANALYTICS & PERFORMANCE");
      
      if (evolutionChartRef.current) {
        const evoCanvas = await html2canvas(evolutionChartRef.current, { 
          scale: 2,
          logging: false 
        });
        const evoImg = evoCanvas.toDataURL("image/jpeg", 0.8);
        const evoRatio = contentWidth / evoCanvas.width;
        pdf.addImage(evoImg, "JPEG", margin, 70, contentWidth, evoCanvas.height * evoRatio);
      }

      if (designerChartRef.current) {
        const desCanvas = await html2canvas(designerChartRef.current, { 
          scale: 2,
          logging: false 
        });
        const desImg = desCanvas.toDataURL("image/jpeg", 0.8);
        const desRatio = contentWidth / desCanvas.width;
        pdf.addImage(desImg, "JPEG", margin, 180, contentWidth, desCanvas.height * desRatio);
      }
      addFooter(2);

      // PAGE 3: PROGRAMS RANKING
      pdf.addPage();
      addHeader("Segmentação por Programas de Crédito", "PORTFOLIO DETAIL");
      
      if (programsChartRef.current) {
        const progCanvas = await html2canvas(programsChartRef.current, { 
          scale: 2,
          logging: false 
        });
        const progImg = progCanvas.toDataURL("image/jpeg", 0.8);
        const progRatio = contentWidth / progCanvas.width;
        pdf.addImage(progImg, "JPEG", margin, 70, contentWidth, progCanvas.height * progRatio);
      }
      addFooter(3);
      
      // PAGE 4+: DATA TABLE (NATIVE)
      pdf.addPage();
      addHeader("Detalhamento Operacional de Propostas", "OPERATIONAL DATA");

      const proposalsToPrint = ongoingProposals;

      const tableData = proposalsToPrint.map(p => [
        p.producer_name,
        p.producer_cpf || '-',
        formatCurrency(Number(p.requested_value)),
        p.credit_program || 'Não Informado',
        format(parseISO(p.created_at), "dd/MM/yyyy")
      ]);

      autoTable(pdf, {
        startY: 70,
        head: [['PRODUTOR', 'CPF', 'VALOR (R$)', 'PROGRAMA DE CRÉDITO', 'DATA ENTRADA']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 4, lineColor: [226, 232, 240] },
        columnStyles: {
          2: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
          if (pdf.internal.pages.length > 4) {
             addFooter(pdf.internal.pages.length - 1);
          }
        }
      });
      
      addFooter(pdf.internal.pages.length - 1);

      pdf.save(`RELATORIO_PREMIUM_PRONAF_${format(new Date(), "yyyyMMdd")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = useMemo(() => {
    const total = filteredProposals.length;
    const aprovadas = filteredProposals.filter((p) => p.status === "aprovada" || p.status === "contrato_liberado").length;
    const ativos = filteredProposals.filter((p) => !["nova", "aprovada", "negada", "contrato_liberado"].includes(p.status)).length;
    const pendentes = filteredProposals.filter((p) => p.status === "documentacao_pendente").length;
    const novas = filteredProposals.filter((p) => p.status === "nova").length;
    const negadas = filteredProposals.filter((p) => p.status === "negada").length;
    const valorTotal = filteredProposals.reduce((sum, p) => sum + Number(p.requested_value), 0);
    const valorAprovado = filteredProposals.filter((p) => p.status === "aprovada" || p.status === "contrato_liberado").reduce((s, p) => s + Number(p.requested_value), 0);
    const taxaAprovacao = total > 0 ? Math.round((aprovadas / total) * 100) : 0;
    return { total, aprovadas, ativos, pendentes, novas, negadas, valorTotal, valorAprovado, taxaAprovacao };
  }, [filteredProposals]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProposals.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    
    // Sort array descending and filter empty
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as ProposalStatus] || status,
        value: count,
        fill: STATUS_CHART_COLORS[status] || "hsl(215, 16%, 47%)"
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  const pieData = useMemo(() => statusChartData, [statusChartData]);

  const monthlyData = useMemo(() => {
    const months: { name: string; propostas: number; valor: number }[] = [];
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    
    // Initial cumulative value for ALL proposals before the 6-month window
    // Important: Use 'proposals' to ignore date filters, but keep agency filter handled by hook
    let cumulativeValue = proposals
      .filter(p => parseISO(p.created_at) < sixMonthsAgo)
      .reduce((s, p) => s + Number(p.requested_value), 0);

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const monthProposals = proposals.filter((p) =>
        isWithinInterval(parseISO(p.created_at), { start, end })
      );
      
      const monthValue = monthProposals.reduce((s, p) => s + Number(p.requested_value), 0);
      cumulativeValue += monthValue;

      months.push({
        name: format(date, "MMM/yy", { locale: ptBR }),
        propostas: monthProposals.length,
        valor: cumulativeValue,
      });
    }
    return months;
  }, [proposals]);

  const lineData = useMemo(() => {
    const programs: Record<string, { count: number; valor: number }> = {};
    filteredProposals.forEach((p) => {
      const progName = p.credit_program || 'Não Informado';
      if (!programs[progName]) programs[progName] = { count: 0, valor: 0 };
      programs[progName].count++;
      programs[progName].valor += Number(p.requested_value);
    });
    return Object.entries(programs)
      .map(([key, val]) => ({
        name: key,
        propostas: val.count,
        valor: val.valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Limita ao top 10 programas para não quebrar layout
  }, [filteredProposals]);

  const designerChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProposals.forEach(p => {
      const designerKey = p.project_designer;
      const designerName = designerKey ? (PROJECT_DESIGNER_LABELS[designerKey] || designerKey) : 'Não Definido';
      counts[designerName] = (counts[designerName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  const docStats = useMemo(() => {
    const totalDocs = filteredProposals.reduce((a, p) => a + p.documents.length, 0);
    const completedDocs = filteredProposals.reduce((a, p) => a + p.documents.filter((d) => d.completed).length, 0);
    return { totalDocs, completedDocs, rate: totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0 };
  }, [filteredProposals]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    pendentes: tasks.filter((t) => t.status === "pendente").length,
    atrasadas: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "concluida").length,
  }), [tasks]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (loadingP || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner group/icon transform transition-all duration-500 hover:rotate-6">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Dashboard Analítico</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Visão estratégica das propostas PRONAF
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsFilterDialogOpen(true)}
            disabled={isExporting}
            className="px-4 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium hover:shadow-premium-hover hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            {isExporting ? "Gerando..." : "Gerar Relatório Filtrado"}
          </button>

          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-0 rounded-[32px] shadow-2xl">
              <DialogHeader className="p-8 bg-gradient-to-br from-primary to-primary/90 text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-extrabold font-heading">Personalizar Relatório PDF</DialogTitle>
                    <p className="text-white/80 text-sm font-medium">Selecione os critérios para o detalhamento operacional</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#2563eb #e5e7eb',
              }}>
                <style dangerouslySetInnerHTML={{ __html: `
                  .filter-scroll-area::-webkit-scrollbar {
                    width: 10px !important;
                    display: block !important;
                  }
                  .filter-scroll-area::-webkit-scrollbar-track {
                    background: #e5e7eb !important;
                    border-radius: 10px !important;
                    margin: 4px 0;
                  }
                  .filter-scroll-area::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #3b82f6, #1d4ed8) !important;
                    border-radius: 10px !important;
                    border: 2px solid #e5e7eb !important;
                  }
                  .filter-scroll-area::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #2563eb, #1e40af) !important;
                  }
                  .filter-inner-scroll::-webkit-scrollbar {
                    width: 8px !important;
                    display: block !important;
                  }
                  .filter-inner-scroll::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.04) !important;
                    border-radius: 8px !important;
                  }
                  .filter-inner-scroll::-webkit-scrollbar-thumb {
                    background: #93c5fd !important;
                    border-radius: 8px !important;
                    border: 2px solid transparent !important;
                    background-clip: padding-box !important;
                  }
                  .filter-inner-scroll::-webkit-scrollbar-thumb:hover {
                    background: #3b82f6 !important;
                    background-clip: padding-box !important;
                  }
                ` }} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 filter-scroll-area">
                  {/* Status Selection */}
                  <div className="space-y-3 bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-5 border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        Status
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px] font-black bg-blue-100 text-blue-700 border-0">{selectedStatuses.length}/{allStatuses.length}</Badge>
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[9px] font-bold h-6 px-2 hover:bg-blue-100/80 text-blue-600 rounded-lg"
                        onClick={() => toggleAll(selectedStatuses, setSelectedStatuses, allStatuses)}
                      >
                        {selectedStatuses.length === allStatuses.length ? "Desmarcar" : "Selecionar Todos"}
                      </Button>
                    </div>
                    <div className="max-h-44 overflow-y-auto filter-inner-scroll rounded-xl bg-white/80 p-3 border border-blue-50 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#93c5fd transparent' }}>
                      {allStatuses.map(status => (
                        <div key={status} className={`flex items-center space-x-2.5 group cursor-pointer p-2 rounded-xl transition-all duration-150 ${selectedStatuses.includes(status) ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`} onClick={() => toggleSelection(selectedStatuses, setSelectedStatuses, status)}>
                          <Checkbox checked={selectedStatuses.includes(status)} className="rounded-md border-2 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                          <Label className="text-sm font-semibold cursor-pointer group-hover:text-blue-700 transition-colors">
                            {STATUS_LABELS[status as ProposalStatus]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Program Selection */}
                  <div className="space-y-3 bg-gradient-to-br from-emerald-50/80 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        Programas
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px] font-black bg-emerald-100 text-emerald-700 border-0">{selectedPrograms.length}/{allPrograms.length}</Badge>
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[9px] font-bold h-6 px-2 hover:bg-emerald-100/80 text-emerald-600 rounded-lg"
                        onClick={() => toggleAll(selectedPrograms, setSelectedPrograms, allPrograms)}
                      >
                        {selectedPrograms.length === allPrograms.length ? "Desmarcar" : "Selecionar Todos"}
                      </Button>
                    </div>
                    <div className="max-h-44 overflow-y-auto filter-inner-scroll rounded-xl bg-white/80 p-3 border border-emerald-50 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6ee7b7 transparent' }}>
                      {allPrograms.length > 0 ? allPrograms.map(program => (
                        <div key={program} className={`flex items-center space-x-2.5 group cursor-pointer p-2 rounded-xl transition-all duration-150 ${selectedPrograms.includes(program) ? 'bg-emerald-50/80 border border-emerald-200' : 'hover:bg-gray-50 border border-transparent'}`} onClick={() => toggleSelection(selectedPrograms, setSelectedPrograms, program)}>
                          <Checkbox checked={selectedPrograms.includes(program)} className="rounded-md border-2 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                          <Label className="text-xs font-semibold cursor-pointer group-hover:text-emerald-700 transition-colors leading-tight">
                            {program}
                          </Label>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground italic p-2 text-center">Nenhum programa encontrado</p>
                      )}
                    </div>
                  </div>

                  {/* Designer Selection */}
                  <div className="space-y-3 bg-gradient-to-br from-violet-50/80 to-white rounded-2xl p-5 border border-violet-100 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-violet-700 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Search className="h-3.5 w-3.5 text-violet-600" />
                        </div>
                        Projetistas
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px] font-black bg-violet-100 text-violet-700 border-0">{selectedDesigners.length}/{allDesigners.length}</Badge>
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[9px] font-bold h-6 px-2 hover:bg-violet-100/80 text-violet-600 rounded-lg"
                        onClick={() => toggleAll(selectedDesigners, setSelectedDesigners, allDesigners)}
                      >
                        {selectedDesigners.length === allDesigners.length ? "Desmarcar" : "Selecionar Todos"}
                      </Button>
                    </div>
                    <div className="max-h-44 overflow-y-auto filter-inner-scroll rounded-xl bg-white/80 p-3 border border-violet-50 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c4b5fd transparent' }}>
                      {allDesigners.map(designer => (
                        <div key={designer} className={`flex items-center space-x-2.5 group cursor-pointer p-2 rounded-xl transition-all duration-150 ${selectedDesigners.includes(designer) ? 'bg-violet-50/80 border border-violet-200' : 'hover:bg-gray-50 border border-transparent'}`} onClick={() => toggleSelection(selectedDesigners, setSelectedDesigners, designer)}>
                          <Checkbox checked={selectedDesigners.includes(designer)} className="rounded-md border-2 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600" />
                          <Label className="text-sm font-semibold cursor-pointer group-hover:text-violet-700 transition-colors">
                            {PROJECT_DESIGNER_LABELS[designer as ProjectDesigner]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Filtering */}
                  <div className="space-y-5 bg-gradient-to-br from-amber-50/80 to-white rounded-2xl p-5 border border-amber-100 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          Mês
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px] font-black bg-amber-100 text-amber-700 border-0">{selectedMonths.length}/{allMonths.length}</Badge>
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[9px] font-bold h-6 px-2 hover:bg-amber-100/80 text-amber-600 rounded-lg"
                          onClick={() => toggleAll(selectedMonths, setSelectedMonths, allMonths)}
                        >
                          {selectedMonths.length === allMonths.length ? "Desmarcar" : "Selecionar Todos"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 bg-white/80 p-3 rounded-xl border border-amber-50">
                        {allMonths.map(m => (
                          <div 
                            key={m} 
                            onClick={() => toggleSelection(selectedMonths, setSelectedMonths, m)}
                            className={`flex items-center justify-center p-2 rounded-lg border text-[10px] font-black transition-all cursor-pointer ${
                              selectedMonths.includes(m) 
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" 
                              : "bg-white text-muted-foreground border-border/60 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            {format(new Date(2024, Number(m) - 1, 1), "MMM", { locale: ptBR }).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          Ano
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[9px] font-black bg-amber-100 text-amber-700 border-0">{selectedYears.length}/{availableYears.length}</Badge>
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[9px] font-bold h-6 px-2 hover:bg-amber-100/80 text-amber-600 rounded-lg"
                          onClick={() => toggleAll(selectedYears, setSelectedYears, availableYears)}
                        >
                          {selectedYears.length === availableYears.length ? "Desmarcar" : "Selecionar Todos"}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 bg-white/80 p-3 rounded-xl border border-amber-50">
                        {availableYears.map(y => (
                          <div 
                            key={y} 
                            onClick={() => toggleSelection(selectedYears, setSelectedYears, y)}
                            className={`px-4 py-2 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                              selectedYears.includes(y) 
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200" 
                              : "bg-white text-muted-foreground border-border/60 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
                            }`}
                          >
                            {y}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 bg-muted/30 border-t border-border/50 flex flex-col sm:flex-row gap-3 items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setIsFilterDialogOpen(false)}
                  className="w-full sm:w-auto rounded-xl font-bold text-sm"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleExportPDF({
                    designers: selectedDesigners,
                    statuses: selectedStatuses,
                    months: selectedMonths,
                    years: selectedYears,
                    programs: selectedPrograms
                  })}
                  disabled={isExporting}
                  className="w-full sm:w-auto bg-primary text-white rounded-xl font-bold text-sm shadow-premium hover:shadow-premium-hover transform active:scale-95 transition-all flex items-center gap-2"
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Gerar Relatório Personalizado
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="bg-background/40 backdrop-blur-md p-1 rounded-xl border border-border/50 shadow-sm">
            <MonthYearFilter 
              month={filterMonth} 
              year={filterYear} 
              years={availableYears}
              onMonthChange={setFilterMonth} 
              onYearChange={setFilterYear} 
            />
          </div>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-8 p-1">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Propostas</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.total}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-0 text-[10px] font-bold">+{stats.novas} NOVAS</Badge>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <FileText className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Contratos Assinados</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.aprovadas}</p>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-sm font-bold text-success drop-shadow-sm font-heading">
                    {formatCurrency(stats.valorAprovado)}
                  </p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[10px] text-success font-bold">{stats.taxaAprovacao}% TAXA</span>
                  </div>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center text-success transform group-hover:scale-110 group-hover:-rotate-3 transition-all">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Volume Financeiro</p>
                <p className="text-2xl font-extrabold font-heading text-foreground mt-1">{formatCurrency(stats.valorTotal)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 flex items-center gap-1 italic">
                  <DollarSign className="h-3 w-3 opacity-50" /> TOTAL PROCESSADO
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                <DollarSign className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Processos Ativos</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.ativos}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-warning/10 text-warning border-0 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {stats.pendentes} PEND. DOCS
                  </Badge>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center text-warning transform group-hover:scale-110 group-hover:-rotate-6 transition-all">
                <Search className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentação</p>
              <span className="text-sm font-black text-primary">{docStats.rate}%</span>
            </div>
            <Progress value={docStats.rate} className="h-1.5 bg-primary/10" />
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">{docStats.completedDocs}/{docStats.totalDocs} documentos validados</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendências</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{taskStats.pendentes}</p>
            {taskStats.atrasadas > 0 && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-lg bg-destructive/10 w-fit">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-black">{taskStats.atrasadas} EM ATRASO</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipe Ativa</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{members.length}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-tighter">analistas disponíveis</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Negadas</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{stats.negadas}</p>
            {stats.total > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-1 w-12 rounded-full bg-destructive/20 overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: `${Math.round((stats.negadas / stats.total) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-destructive font-black">{Math.round((stats.negadas / stats.total) * 100)}% DO TOTAL</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent ref={statusChartRef}>
            <div className="h-64">
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55} 
                      outerRadius={85} 
                      paddingAngle={3} 
                      dataKey="value"
                      labelLine={true}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução Acumulada de Volume Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent ref={evolutionChartRef}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#052e16" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#052e16" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000000 ? `R$ ${(value / 1000000).toFixed(1)}mi` : value >= 1000 ? `R$ ${(value / 1000).toFixed(0)}k` : `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Volume Acumulado"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} 
                  />
                  <Area type="monotone" dataKey="valor" stroke="#052e16" fill="url(#colorValor)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Histórico de Volume Adquirido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValorLine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#052e16" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#052e16" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000000 ? `R$ ${(value / 1000000).toFixed(1)}mi` : value >= 1000 ? `R$ ${(value / 1000).toFixed(0)}k` : `R$ ${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Volume Financeiro"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} 
                  />
                  <Area type="monotone" dataKey="valor" name="Volume Financeiro" stroke="#052e16" fill="url(#colorValorLine)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Valores por Programa de Crédito (R$ mil)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {lineData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} layout="vertical" margin={{ top: 5, right: 100, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10 }} 
                      width={120}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px", maxWidth: "250px", whiteSpace: "normal" }} 
                      formatter={(value: number) => [
                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), 
                        "Valor Total"
                      ]} 
                    />
                    <Bar dataKey="valor" fill="hsl(210, 80%, 55%)" radius={[0, 6, 6, 0]}>
                      <LabelList 
                        dataKey="valor" 
                        position="right" 
                        offset={10}
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(210, 80%, 40%)' }}
                        formatter={(value: number) => 
                          new Intl.NumberFormat("pt-BR", { 
                            style: "currency", 
                            currency: "BRL",
                            maximumFractionDigits: 0 
                          }).format(value)
                        }
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Proposals */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Últimas Propostas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProposals.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.producer_name}</p>
                    <p className="text-xs text-muted-foreground">{PRONAF_LINE_LABELS[p.pronaf_line as PronafLine]} • {format(parseISO(p.created_at), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatCurrency(Number(p.requested_value))}</span>
                  <Badge className={`text-[10px] ${p.status === "aprovada" ? "bg-success text-success-foreground" :
                    p.status === "negada" ? "bg-destructive text-destructive-foreground" :
                      p.status === "em_analise" ? "bg-warning text-warning-foreground" :
                        "bg-info text-info-foreground"
                    }`}>
                    {STATUS_LABELS[p.status as ProposalStatus]}
                  </Badge>
                </div>
              </div>
            ))}
            {filteredProposals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma proposta no período selecionado</p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Hidden section for PDF Report Layout (Vertical & Large Graphics) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '1000px' }}>
        <div ref={printableContentRef} className="bg-white p-10 space-y-12">
          {/* KPI Summary Block */}
          <div className="grid grid-cols-4 gap-6 border-b pb-8">
            <div className="text-center">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Propostas</p>
              <p className="text-3xl font-black text-slate-800">{stats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-bold uppercase">Volume Total</p>
              <p className="text-2xl font-black text-slate-800">{formatCurrency(stats.valorTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-bold uppercase">Assinados</p>
              <p className="text-3xl font-black text-emerald-600">{stats.aprovadas}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 font-bold uppercase">Taxa Sucesso</p>
              <p className="text-3xl font-black text-blue-600">{stats.taxaAprovacao}%</p>
            </div>
          </div>

          {/* Large Vertical Charts Section */}
          <div className="space-y-16">
            <div ref={statusChartRef} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Distribuição de Propostas por Status
              </h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12, fontWeight: 500 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                      <LabelList dataKey="value" position="top" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#1E293B' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div ref={evolutionChartRef} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Evolução de Volume Financeiro Mensal
              </h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Area type="monotone" dataKey="valor" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorValor)" strokeWidth={4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div ref={programsChartRef} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Ranking por Programa de Crédito (Valores Reais)
              </h3>
              <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} layout="vertical" margin={{ top: 10, right: 150, left: 180, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} width={170} />
                    <Bar dataKey="valor" fill="#3B82F6" radius={[0, 10, 10, 0]}>
                      <LabelList 
                        dataKey="valor" 
                        position="right" 
                        formatter={(v: number) => formatCurrency(v)} 
                        style={{ fontSize: '12px', fontWeight: 'bold', fill: '#1E293B' }} 
                        offset={15}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div ref={designerChartRef} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" /> Estatísticas por Projetista (Carga de Trabalho)
              </h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={designerChartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50} fill="#1E3A8A">
                       <LabelList dataKey="value" position="top" style={{ fontSize: '14px', fontWeight: 'bold', fill: '#1E293B' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Propostas em Andamento List Section */}
        <div ref={reportListRef} className="bg-white p-10 mt-10">
          <h2 className="text-2xl font-black mb-8 text-slate-800 border-b-4 border-blue-900 pb-3 flex items-center gap-3">
             <Clock className="h-7 w-7 text-blue-900" /> Detalhamento de Propostas em Andamento
          </h2>
          <table className="w-full text-sm border-collapse rounded-2xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-4 text-left font-bold uppercase tracking-wider">Produtor</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider">CPF</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider">Valor Solicitado</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider">Programa de Crédito</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider">Data Entrada</th>
              </tr>
            </thead>
            <tbody>
              {ongoingProposals.map((p, idx) => (
                <tr key={p.id} className={idx % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                  <td className="p-4 border-b font-semibold text-slate-700">{p.producer_name}</td>
                  <td className="p-4 border-b text-slate-500">{p.producer_cpf || '-'}</td>
                  <td className="p-4 border-b font-bold text-slate-900">{formatCurrency(Number(p.requested_value))}</td>
                  <td className="p-4 border-b text-slate-600 text-xs">{p.credit_program || 'Não Informado'}</td>
                  <td className="p-4 border-b text-slate-500 font-medium">{format(parseISO(p.created_at), "dd/MM/yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center bg-slate-100 p-4 rounded-xl">
             <span className="text-slate-600 font-bold uppercase text-xs">Total de Registros em Andamento:</span>
             <span className="text-xl font-black text-blue-900">{ongoingProposals.length}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
