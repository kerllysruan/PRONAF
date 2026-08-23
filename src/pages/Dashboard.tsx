import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChartTooltip } from "@/components/ChartTooltip";
import {
  FileText, CheckCircle2, Search, DollarSign, TrendingUp, Loader2,
  Sparkles, AlertTriangle, Clock, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  Filter, Check, Box, Zap, Target, Lightbulb, ShieldAlert, Award, Activity, Briefcase,
  Users, TrendingDown, AlertCircle, Banknote, CircleDollarSign, Send,
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
import { useStockProposals } from "@/hooks/useStockProposals";
import { useTeam } from "@/hooks/useTeam";
import { useDisbursements } from "@/hooks/useDisbursements";
import { STATUS_LABELS, PRONAF_LINE_LABELS, PROJECT_DESIGNER_LABELS, type ProposalStatus, type PronafLine, type ProjectDesigner } from "@/types/proposal";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { useAgency } from "@/contexts/AgencyContext";
import { useDocumentationReview } from "@/hooks/useDocumentationReview";

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

const DISBURSEMENT_COLORS: Record<string, string> = {
  pendente: "#f59e0b",
  aprovado: "#3b82f6",
  liberado: "#22c55e",
  negado: "#ef4444",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCompact = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}mi`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return formatCurrency(value);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { proposals, loading: loadingP } = useProposals();
  const { proposals: stockProposals, loading: loadingStock } = useStockProposals();
  const { tasks, members, loading: loadingT } = useTeam();
  const { disbursements, loading: loadingD } = useDisbursements();
  const { submissions, loading: loadingDocs } = useDocumentationReview();
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

  const handleExportPDF = async (filters?: { designers: string[], statuses: string[], months: string[], years: string[], programs: string[] }) => {
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

        const activeDesigners = filters?.designers || selectedDesigners;
        const teamToPrint = members.filter(m => activeDesigners.length === 0 || activeDesigners.includes(m.id));

        const sortedTeam = [...teamToPrint].sort((a, b) => {
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

      const activeDesigners = filters?.designers || selectedDesigners;
      const activeStatuses = filters?.statuses || selectedStatuses;
      const activeMonths = filters?.months || selectedMonths;
      const activeYears = filters?.years || selectedYears;
      const activePrograms = filters?.programs || selectedPrograms;

      const proposalsToPrint = proposals.filter((p) => {
        // First filter by agency
        if (effectiveAgencyId !== "all" && p.agency_id !== effectiveAgencyId) return false;
        
        // Date filters
        if (!p.created_at) return false;
        const d = parseISO(p.created_at);
        const pMonth = (getMonth(d) + 1).toString();
        const pYear = getYear(d).toString();

        // Custom dialog filters (Only use these, disregard global dashboard filters)
        if (activeMonths.length > 0 && !activeMonths.includes(pMonth)) return false;
        if (activeYears.length > 0 && !activeYears.includes(pYear)) return false;
        
        // Selection filters
        const matchesDesigner = activeDesigners.length === 0 || (p.project_designer && activeDesigners.includes(p.project_designer));
        const matchesStatus = activeStatuses.length === 0 || (p.status && activeStatuses.includes(p.status));
        const matchesProgram = activePrograms.length === 0 || (p.credit_program && activePrograms.includes(p.credit_program));

        return matchesDesigner && matchesStatus && matchesProgram;
      });

      const tableData = proposalsToPrint.map(p => {
        const designerLabel = p.project_designer 
          ? (PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || p.project_designer) 
          : '-';
          
        return [
          p.producer_name,
          p.producer_cpf || '-',
          formatCurrency(Number(p.requested_value)),
          p.credit_program || 'Não Informado',
          designerLabel,
          format(parseISO(p.created_at), "dd/MM/yyyy")
        ];
      });

      autoTable(pdf, {
        startY: 70,
        head: [['PRODUTOR', 'CPF', 'VALOR (R$)', 'PROGRAMA DE CRÉDITO', 'PROJETISTA', 'DATA ENTRADA']],
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

  // =============================================
  // DATA COMPUTATIONS — Consolidated from all pages
  // =============================================

  const stats = useMemo(() => {
    // Helper to safely parse numeric values (handles strings, nulls, undefined, and BR formatting without NaN)
    const safeParseNum = (val: any): number => {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const str = String(val).trim();
      let clean = str.replace(/[^\d.,]/g, '');
      if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(clean)) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(clean)) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/,/g, '.');
      }
      const parsed = parseFloat(clean);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Helper to check if a main proposal is concluded
    const isConcluidoMainStatus = (s: string) => s === "aprovada" || s === "contrato_liberado";

    // 1. Esteira principal
    const propostasAtivasMain = filteredProposals.filter(p => !isConcluidoMainStatus(p.status) && p.status !== "negada");
    const totalMainAtivas = propostasAtivasMain.length;
    const valorTotalMainAtivas = propostasAtivasMain.reduce((sum, p) => sum + safeParseNum(p.requested_value), 0);

    const propostasConcluidasMain = filteredProposals.filter(p => isConcluidoMainStatus(p.status));
    const aprovadasMain = propostasConcluidasMain.length;
    const valorAprovadoMain = propostasConcluidasMain.reduce((sum, p) => sum + safeParseNum(p.requested_value), 0);

    const pendentesMain = filteredProposals.filter((p) => p.status === "documentacao_pendente").length;
    const novasMain = filteredProposals.filter((p) => p.status === "nova").length;
    const negadasMain = filteredProposals.filter((p) => p.status === "negada").length;

    // 2. Estoque (Pipeline)
    const isConcluidoStockStatus = (statusStr: string) => {
      const norm = (statusStr || '').toUpperCase().trim();
      return norm === 'CONCLUÍDO' || norm === 'CONCLUIDO' || norm === 'APROVADA' || norm === 'APROVADO' || norm === 'CONTRATO LIBERADO' || norm === 'FINALIZADO';
    };

    // Active stock items
    const estoqueAtivoProposals = stockProposals.filter(p => !isConcluidoStockStatus(p.status));
    const estoqueAtivo = estoqueAtivoProposals.length;
    const estoqueValorAtivo = estoqueAtivoProposals.reduce((sum, p) => sum + safeParseNum(p.estimated_value), 0);
    
    // Concluded stock items
    const estoqueConcluidoProposals = stockProposals.filter(p => isConcluidoStockStatus(p.status));
    const estoqueConcluido = estoqueConcluidoProposals.length;
    const estoqueValorConcluido = estoqueConcluidoProposals.reduce((sum, p) => sum + safeParseNum(p.estimated_value), 0);

    // Stock items "enviados à central"
    const isEnviadoCentralStockStatus = (statusStr: string | null, centralField?: string | null, centralDate?: string | null) => {
      const norm = (statusStr || '').toLowerCase().trim();
      if (norm.includes('enviad') && norm.includes('central')) return true;
      if (norm === 'central' || norm.includes('enviado para central') || norm.includes('enviado à central') || norm.includes('enviado a central')) return true;
      if (centralField && centralField.trim().length > 0 && centralField.trim() !== '---') return true;
      if (centralDate && centralDate.trim().length > 0 && centralDate.trim() !== '---') return true;
      return false;
    };

    const estoqueEnviadoCentralProposals = estoqueAtivoProposals.filter(p => isEnviadoCentralStockStatus(p.status, p.central, p.central_date));
    const estoqueEnviadoCentral = estoqueEnviadoCentralProposals.length;
    const estoqueValorEnviadoCentral = estoqueEnviadoCentralProposals.reduce((sum, p) => sum + safeParseNum(p.estimated_value), 0);

    // 3. TOTAIS GERAS ABSOLUTOS (TODAS AS PROPOSTAS DO SISTEMA - INCLUSIVE CONCLUÍDAS)
    const totalPropostasSistema = stockProposals.length + filteredProposals.length;
    const valorTotalSistema = stockProposals.reduce((sum, p) => sum + safeParseNum(p.estimated_value), 0) +
                               filteredProposals.reduce((sum, p) => sum + safeParseNum(p.requested_value), 0);

    const totalConcluidoGeral = estoqueConcluido + aprovadasMain;
    const valorConcluidoGeral = estoqueValorConcluido + valorAprovadoMain;

    const taxaAprovacao = totalPropostasSistema > 0 ? Math.round((totalConcluidoGeral / totalPropostasSistema) * 100) : 0;
    
    return {
      // Total Geral do Sistema (Todas as Propostas)
      totalGeral: totalPropostasSistema,
      valorTotalGeral: valorTotalSistema,
      total: totalPropostasSistema,
      valorTotal: valorTotalSistema,

      aprovadas: totalConcluidoGeral,
      valorAprovado: valorConcluidoGeral,
      taxaAprovacao,

      // Main Esteira breakdown
      totalMainAtivas,
      valorTotalMainAtivas,
      aprovadasMain,
      valorAprovadoMain,
      pendentes: pendentesMain,
      novas: novasMain,
      negadas: negadasMain,

      // Stock breakdown
      estoqueTotal: stockProposals.length,
      estoqueAtivo,
      estoqueValor: estoqueValorAtivo,
      estoqueConcluido,
      estoqueValorConcluido,
      estoqueEnviadoCentral,
      estoqueValorEnviadoCentral,
      concluidasTotal: totalConcluidoGeral,
    };
  }, [filteredProposals, stockProposals]);

  // Disbursement stats
  const disbursementStats = useMemo(() => {
    const totalCount = disbursements.length;
    const totalAmount = disbursements.reduce((s, d) => s + Number(d.amount), 0);
    const liberados = disbursements.filter(d => d.status === 'liberado');
    const liberadoAmount = liberados.reduce((s, d) => s + Number(d.amount), 0);
    const pendentes = disbursements.filter(d => d.status === 'pendente');
    const pendenteAmount = pendentes.reduce((s, d) => s + Number(d.amount), 0);
    const solicitados = disbursements.filter(d => d.status === 'aprovado');
    const solicitadoAmount = solicitados.reduce((s, d) => s + Number(d.amount), 0);

    return { totalCount, totalAmount, liberadoCount: liberados.length, liberadoAmount, pendenteCount: pendentes.length, pendenteAmount, solicitadoCount: solicitados.length, solicitadoAmount };
  }, [disbursements]);

  // Disbursement chart data by projetista
  const disbursementByDesigner = useMemo(() => {
    const map = new Map<string, { name: string; pendente: number; solicitado: number; liberado: number }>();
    
    Object.entries(PROJECT_DESIGNER_LABELS).forEach(([key, label]) => {
      map.set(key, { name: label.split(" ")[0], pendente: 0, solicitado: 0, liberado: 0 });
    });
    map.set("others", { name: "Outros", pendente: 0, solicitado: 0, liberado: 0 });

    disbursements.forEach(d => {
      const proposal = proposals.find(p => p.id === d.proposal_id);
      const designerKey = proposal?.project_designer || "others";
      const key = map.has(designerKey) ? designerKey : "others";
      const entry = map.get(key)!;
      const amount = Number(d.amount);

      if (d.status === 'pendente') entry.pendente += amount;
      if (d.status === 'aprovado') entry.solicitado += amount;
      if (d.status === 'liberado') entry.liberado += amount;
    });

    return Array.from(map.values()).filter(item => item.pendente > 0 || item.solicitado > 0 || item.liberado > 0);
  }, [disbursements, proposals]);

  // Disbursement status pie data
  const disbursementPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    disbursements.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    const labels: Record<string, string> = { pendente: "Pendente", aprovado: "Solicitado", liberado: "Liberado", negado: "Negado" };
    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([status, value]) => ({
        name: labels[status] || status,
        value,
        fill: DISBURSEMENT_COLORS[status] || "#94a3b8",
      }));
  }, [disbursements]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProposals.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as ProposalStatus] || status || status,
        value: count,
        fill: STATUS_CHART_COLORS[status] || "hsl(215, 16%, 47%)"
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  const pieData = useMemo(() => statusChartData, [statusChartData]);

  const monthlyData = useMemo(() => {
    const months: { name: string; propostas: number; valor: number }[] = [];
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    
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
      .slice(0, 10);
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
    const totalSubmissions = submissions.length;
    const fullyApproved = submissions.filter(
      (s) => s.totalFiles > 0 && s.approvedCount === s.totalFiles
    ).length;
    
    const totalFiles = submissions.reduce((a, s) => a + s.totalFiles, 0);
    const approvedFiles = submissions.reduce((a, s) => a + s.approvedCount, 0);
    const rateFiles = totalFiles > 0 ? Math.round((approvedFiles / totalFiles) * 100) : 0;

    return { 
      totalDocs: totalSubmissions, 
      completedDocs: fullyApproved, 
      rate: rateFiles 
    };
  }, [submissions]);

  const taskStats = useMemo(() => {
    const docsComPendencia = submissions.filter((s) => s.pendingCount > 0 || s.rejectedCount > 0).length;
    return {
      total: tasks.length + docsComPendencia,
      pendentes: tasks.filter((t) => t.status === "pendente").length + docsComPendencia,
      atrasadas: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "concluida").length,
    };
  }, [tasks, submissions]);

  // =============================================
  // SMART INSIGHTS — Auto-generated from data
  // =============================================
  const insights = useMemo(() => {
    const items: { type: 'success' | 'warning' | 'danger' | 'info'; icon: typeof Zap; title: string; description: string }[] = [];

    // Gargalo de documentação
    if (stats.pendentes > 0) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Gargalo de Documentação',
        description: `${stats.pendentes} proposta${stats.pendentes > 1 ? 's' : ''} com documentação pendente na esteira.`,
      });
    }

    // Taxa de aprovação
    if (stats.total > 0) {
      const target = 80;
      if (stats.taxaAprovacao >= target) {
        items.push({
          type: 'success',
          icon: Target,
          title: 'Meta de Aprovação Atingida',
          description: `Taxa atual: ${stats.taxaAprovacao}% — Meta: ${target}%. Excelente performance!`,
        });
      } else {
        items.push({
          type: 'info',
          icon: Target,
          title: 'Performance de Aprovação',
          description: `Taxa atual: ${stats.taxaAprovacao}% — Meta: ${target}%. Faltam ${target - stats.taxaAprovacao}pp.`,
        });
      }
    }

    // Tendência de volume (comparar últimos 2 meses)
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1];
      const prev = monthlyData[monthlyData.length - 2];
      if (prev.propostas > 0) {
        const growth = Math.round(((last.propostas - prev.propostas) / prev.propostas) * 100);
        if (growth > 0) {
          items.push({
            type: 'success',
            icon: TrendingUp,
            title: 'Tendência de Crescimento',
            description: `Volume de propostas cresceu ${growth}% em relação ao mês anterior.`,
          });
        } else if (growth < 0) {
          items.push({
            type: 'danger',
            icon: TrendingDown,
            title: 'Queda no Volume',
            description: `Volume de propostas caiu ${Math.abs(growth)}% em relação ao mês anterior.`,
          });
        }
      }
    }

    // Projetista destaque
    if (designerChartData.length > 0) {
      const top = designerChartData[0];
      items.push({
        type: 'info',
        icon: Award,
        title: 'Projetista Destaque',
        description: `${top.name} processou ${top.value} proposta${top.value > 1 ? 's' : ''} no período.`,
      });
    }

    // Desembolsos pendentes
    if (disbursementStats.pendenteCount > 0) {
      items.push({
        type: 'warning',
        icon: Banknote,
        title: 'Desembolsos Pendentes',
        description: `${formatCurrency(disbursementStats.pendenteAmount)} em ${disbursementStats.pendenteCount} pedido${disbursementStats.pendenteCount > 1 ? 's' : ''} aguardando liberação.`,
      });
    }

    // Negadas
    if (stats.negadas > 0 && stats.total > 0) {
      const pctNeg = Math.round((stats.negadas / stats.total) * 100);
      if (pctNeg > 15) {
        items.push({
          type: 'danger',
          icon: ShieldAlert,
          title: 'Alta Taxa de Negação',
          description: `${pctNeg}% das propostas foram negadas. Revise critérios de entrada.`,
        });
      }
    }

    // Tarefas atrasadas
    if (taskStats.atrasadas > 0) {
      items.push({
        type: 'danger',
        icon: AlertCircle,
        title: 'Tarefas em Atraso',
        description: `${taskStats.atrasadas} tarefa${taskStats.atrasadas > 1 ? 's' : ''} da equipe estão vencidas.`,
      });
    }

    // Estoque grande
    if (stats.estoqueAtivo > 20) {
      items.push({
        type: 'info',
        icon: Box,
        title: 'Estoque Significativo',
        description: `${stats.estoqueAtivo} propostas aguardando entrada na esteira. Volume: ${formatCurrency(stats.estoqueValor)}.`,
      });
    }

    return items.slice(0, 4); // Max 4 insights
  }, [stats, monthlyData, designerChartData, disbursementStats, taskStats]);



  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (loadingP || loadingT || loadingStock || loadingDocs) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const insightBgMap = {
    success: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/60',
    warning: 'from-amber-500/10 to-amber-500/5 border-amber-200/60',
    danger: 'from-red-500/10 to-red-500/5 border-red-200/60',
    info: 'from-blue-500/10 to-blue-500/5 border-blue-200/60',
  };
  const insightIconMap = {
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    danger: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ============================================= */}
      {/* HEADER — Central de Comando */}
      {/* ============================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group/icon transform transition-all duration-500 hover:rotate-6 hover:scale-110">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">{getGreeting()} 👋</p>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Central de Comando</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Visão consolidada do estoque e documentação operacional
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

          {/* ============================================= */}
          {/* FILTER DIALOG — PDF Report Generation */}
          {/* ============================================= */}
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
                            {PROJECT_DESIGNER_LABELS[designer as ProjectDesigner] || designer}
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

        {/* ============================================= */}
        {/* MÓDULOS DE DADOS INTEGRADOS (/propostas, /estoque, /documentacao) */}
        {/* ============================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Alimentação de Dados Integrada em Tempo Real
            </h2>
            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200/60 uppercase tracking-wider">
              Conexão Ativa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Módulo Propostas */}
            <Link
              to="/propostas"
              className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-emerald-900/95 via-emerald-950 to-slate-950 text-white border-2 border-emerald-500/40 shadow-[0_10px_30px_rgba(5,46,22,0.3)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:border-amber-400/60 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black tracking-widest uppercase mb-2.5">
                    supergestao.digital/propostas
                  </Badge>
                  <h3 className="text-xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    Propostas de Crédito
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                    {stats.concluidasTotal} propostas concluídas · <span className="text-emerald-400 font-bold">{formatCurrency(stats.valorAprovado)}</span> aprovados
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-md">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-black text-amber-300 uppercase tracking-wider">
                <span>Gerenciar Esteira de Crédito</span>
                <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Módulo Estoque */}
            <Link
              to="/estoque"
              className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-indigo-900/95 via-indigo-950 to-slate-950 text-white border-2 border-indigo-500/40 shadow-[0_10px_30px_rgba(30,27,75,0.3)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.3)] hover:border-indigo-400/60 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 text-[9px] font-black tracking-widest uppercase mb-2.5">
                    supergestao.digital/estoque
                  </Badge>
                  <h3 className="text-xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    Estoque de Propostas
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                    {stats.estoqueAtivo} em pipeline · <span className="text-indigo-300 font-bold">{formatCurrency(stats.estoqueValor)}</span> estimado
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-400/15 border border-indigo-400/40 flex items-center justify-center text-indigo-300 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-md">
                  <Box className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-black text-indigo-300 uppercase tracking-wider">
                <span>Gerenciar Pipeline de Estoque</span>
                <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Módulo Documentação */}
            <Link
              to="/documentacao"
              className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-teal-900/95 via-teal-950 to-slate-950 text-white border-2 border-teal-500/40 shadow-[0_10px_30px_rgba(19,78,74,0.3)] hover:shadow-[0_20px_40px_rgba(20,184,166,0.3)] hover:border-teal-300/60 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[9px] font-black tracking-widest uppercase mb-2.5">
                    supergestao.digital/documentacao
                  </Badge>
                  <h3 className="text-xl font-black tracking-tight text-white group-hover:text-teal-300 transition-colors">
                    Análise Documental
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                    {docStats.completedDocs}/{docStats.totalDocs} validados · <span className="text-teal-300 font-bold">{docStats.rate}%</span> conformidade
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-teal-400/15 border border-teal-400/40 flex items-center justify-center text-teal-300 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-md">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-300 uppercase tracking-wider">
                <span>Gerenciar Documentação</span>
                <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

      {/* ============================================= */}
      {/* KPI ROW 1 — TOTAL GERAL DO SISTEMA (TODAS AS PROPOSTAS) */}
      {/* ============================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Consolidado Geral da Plataforma (Todas as Propostas)
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            {stats.totalGeral} propostas totais cadastradas
          </span>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total de Propostas (Geral) */}
          <Card className="group relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total Propostas</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.totalGeral}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[9px] font-black tracking-wider uppercase">
                    TODAS AS PROPOSTAS
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transform group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Volume Financeiro (Total Geral em R$) */}
          <Card className="group relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Volume Financeiro</p>
                  <p className="text-xl font-black font-heading text-foreground mt-0.5">{formatCurrency(stats.valorTotalGeral)}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20 text-[9px] font-black tracking-wider uppercase">
                    <DollarSign className="h-2.5 w-2.5 mr-0.5 text-accent" /> TOTAL GERAL R$
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent transform group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Geral Concluídas */}
          <Card className="group relative overflow-hidden border-2 border-emerald-100 dark:border-emerald-900/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Geral Concluídas</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.concluidasTotal}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 text-[9px] font-black tracking-wider uppercase">
                    {stats.taxaAprovacao}% TAXA APROVAÇÃO
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Volume Concluído Efetivo */}
          <Card className="group relative overflow-hidden border-2 border-emerald-200 dark:border-emerald-900/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Volume Concluído</p>
                  <p className="text-xl font-black font-heading text-emerald-600 mt-0.5">{formatCurrency(stats.valorAprovado)}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 border border-emerald-300/50 text-[9px] font-black tracking-wider uppercase">
                    LIBERADO R$
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <Banknote className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================= */}
      {/* KPI ROW 2 — MÓDULO ESTOQUE (/estoque) */}
      {/* ============================================= */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
            <Box className="h-3.5 w-3.5 text-indigo-600" />
            Detalhamento do Estoque de Propostas (supergestao.digital/estoque)
          </h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200/50">
            {stats.estoqueAtivo} ativas · {stats.estoqueEnviadoCentral} enviadas à central
          </span>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Total em Estoque Ativo */}
          <Card className="group relative overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Estoque Ativo</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.estoqueAtivo}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 text-[9px] font-black tracking-wider uppercase">
                    <Box className="h-2.5 w-2.5 mr-1" /> AGUARDANDO ESTEIRA
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-200/50 flex items-center justify-center text-indigo-600 transform group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm">
                  <Box className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Volume em Estoque Ativo (Sem concluídas!) */}
          <Card className="group relative overflow-hidden border-2 border-violet-100 dark:border-violet-900/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Volume Estoque Ativo</p>
                  <p className="text-xl font-black font-heading text-foreground mt-0.5">{formatCurrency(stats.estoqueValor)}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-700 border border-violet-200/50 text-[9px] font-black tracking-wider uppercase">
                    <CircleDollarSign className="h-2.5 w-2.5 mr-1 text-violet-600" /> APENAS ESTOQUE ATIVO
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-200/50 flex items-center justify-center text-violet-600 transform group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                  <CircleDollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Enviadas à Central no Estoque */}
          <Card 
            onClick={() => navigate("/estoque?status=ENVIADO PARA CENTRAL")}
            className="group relative overflow-hidden border-2 border-emerald-100 dark:border-emerald-900/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Estoque Enviado à Central</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.estoqueEnviadoCentral}</p>
                  <Badge 
                    variant="secondary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/estoque?status=ENVIADO PARA CENTRAL");
                    }}
                    className="mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-200/50 text-[9px] font-black tracking-wider uppercase cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Send className="h-2.5 w-2.5 mr-1 text-emerald-600" /> ENVIADAS À CENTRAL
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <Send className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Volume Enviado à Central do Estoque */}
          <Card 
            onClick={() => navigate("/estoque?status=ENVIADO PARA CENTRAL")}
            className="group relative overflow-hidden border-2 border-emerald-200 dark:border-emerald-900/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Volume Enviado à Central</p>
                  <p className="text-xl font-black font-heading text-emerald-600 mt-0.5">{formatCurrency(stats.estoqueValorEnviadoCentral)}</p>
                  <Badge 
                    variant="secondary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/estoque?status=ENVIADO PARA CENTRAL");
                    }}
                    className="mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 border border-emerald-300/50 text-[9px] font-black tracking-wider uppercase cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <Send className="h-2.5 w-2.5 mr-1 text-emerald-700" /> ENVIADO À CENTRAL
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <Banknote className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================= */}
      {/* KPI ROW 2 — ESTEIRA DE CRÉDITO (/propostas) */}
      {/* ============================================= */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-emerald-600" />
            Módulo Esteira de Crédito PRONAF (supergestao.digital/propostas)
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            {stats.totalMainAtivas} propostas em análise
          </span>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Propostas Ativas na Esteira */}
          <Card className="group relative overflow-hidden border-2 border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Propostas na Esteira</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.totalMainAtivas}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[9px] font-black">
                    +{stats.novasMain} NOVAS
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transform group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Volume Financeiro na Esteira (EXCLUSIVO NÃO CONCLUÍDAS) */}
          <Card className="group relative overflow-hidden border-2 border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Volume da Esteira</p>
                  <p className="text-2xl font-black font-heading text-foreground mt-0.5">{formatCompact(stats.valorTotalMainAtivas)}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-200/50 text-[9px] font-black tracking-wider uppercase">
                    <DollarSign className="h-2.5 w-2.5 mr-0.5 text-amber-600" /> NÃO CONCLUÍDAS
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent transform group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Aprovadas na Esteira */}
          <Card className="group relative overflow-hidden border-2 border-emerald-100 dark:border-emerald-900/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-white dark:bg-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Aprovadas Esteira</p>
                  <p className="text-3xl font-black font-heading text-foreground">{stats.aprovadasMain}</p>
                  <Badge variant="secondary" className="mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200/50 text-[9px] font-black tracking-wider uppercase">
                    CONTRATO LIBERADO
                  </Badge>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Valor Aprovado Esteira */}
          <Card className="group relative overflow-hidden border-2 border-emerald-200 dark:border-emerald-900/60 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Valor Aprovado Esteira</p>
                  <p className="text-2xl font-black font-heading text-emerald-600 mt-0.5">{formatCompact(stats.valorAprovadoMain)}</p>
                  <p className="text-[9px] font-black text-emerald-600 mt-1.5 flex items-center gap-1 uppercase tracking-wider">
                    CRÉDITO LIBERADO
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-200/50 flex items-center justify-center text-emerald-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Desembolsos Liberados */}
        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Desembolsos</p>
                <p className="text-xl font-extrabold font-heading text-foreground mt-0.5">{formatCompact(disbursementStats.liberadoAmount)}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 border-0 text-[9px] font-bold">
                    {disbursementStats.liberadoCount} LIBERADOS
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 transform group-hover:scale-110 group-hover:-rotate-3 transition-all">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processos Ativos */}
        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Processos Ativos</p>
                <p className="text-3xl font-extrabold font-heading text-foreground">{stats.ativos}</p>
                <Badge variant="secondary" className="mt-1.5 px-2 py-0.5 rounded-lg bg-warning/10 text-warning border-0 text-[9px] font-bold flex items-center gap-1 w-fit">
                  <Clock className="h-2.5 w-2.5" /> {stats.pendentes} PEND. DOCS
                </Badge>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning transform group-hover:scale-110 group-hover:-rotate-6 transition-all">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================= */}
      {/* SECONDARY KPIs — Documentação, Equipe, Negadas, Pendências */}
      {/* ============================================= */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border border-slate-200/60 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[24px] bg-white/70 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Documentação</p>
              <span className="text-sm font-black text-primary">{docStats.rate}%</span>
            </div>
            <Progress value={docStats.rate} className="h-1.5 bg-primary/10" />
            <p className="text-[10px] text-slate-700 mt-2 font-medium">{docStats.completedDocs}/{docStats.totalDocs} documentos validados</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-slate-200/60 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[24px] bg-white/70 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative z-10">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pendências</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{taskStats.pendentes}</p>
            {taskStats.atrasadas > 0 && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-lg bg-destructive/10 w-fit">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-black">{taskStats.atrasadas} EM ATRASO</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-slate-200/60 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[24px] bg-white/70 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative z-10">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Equipe Ativa</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{members.length}</p>
            <p className="text-[10px] text-slate-700 mt-2 font-medium uppercase tracking-tighter">analistas disponíveis</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden border border-slate-200/60 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-[24px] bg-white/70 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-5 relative z-10">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Negadas</p>
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

      {/* ============================================= */}
      {/* INSIGHTS INTELIGENTES — Auto-generated */}
      {/* ============================================= */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Insights Inteligentes</h2>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight, idx) => {
              const IconComp = insight.icon;
              return (
                <div
                  key={idx}
                  className={`group relative p-4 rounded-2xl border bg-gradient-to-br ${insightBgMap[insight.type]} hover:scale-[1.02] transition-all duration-300 cursor-default`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${insightIconMap[insight.type]}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* CHARTS ROW 1 — Status + Evolução */}
      {/* ============================================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent ref={statusChartRef} className="p-6 relative z-10 flex-1 flex flex-col">
            <div className="flex flex-col mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Distribuição por Status</h3>
              <p className="text-[10px] text-slate-700 font-medium">Quantidade de propostas ativas</p>
            </div>
            <div className="h-64 flex-1">
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
                    <Tooltip content={<ChartTooltip formatter={(v) => `${v} propostas`} />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent ref={evolutionChartRef} className="p-6 relative z-10 flex-1 flex flex-col">
            <div className="flex flex-col mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Evolução Acumulada</h3>
              <p className="text-[10px] text-slate-700 font-medium">Volume financeiro ao longo do tempo</p>
            </div>
            <div className="h-64 flex-1">
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
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Volume Acumulado" stroke="#052e16" fill="url(#colorValor)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================= */}
      {/* CHARTS ROW 2 — Programas + Desembolsos */}
      {/* ============================================= */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10 flex-1 flex flex-col">
            <div className="flex flex-col mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Programas de Crédito</h3>
              <p className="text-[10px] text-slate-700 font-medium">Valores processados por linha (R$ mil)</p>
            </div>
            <div className="h-64 flex-1">
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
                    <Tooltip content={<ChartTooltip />} />
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

        {/* Desembolsos por Projetista — NOVO */}
        <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10 flex-1 flex flex-col">
            <div className="flex flex-col mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Desembolsos por Projetista</h3>
              <p className="text-[10px] text-slate-700 font-medium">Pendente, solicitado e liberado (R$)</p>
            </div>
            <div className="h-64 flex-1">
              {disbursementByDesigner.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
                  <Banknote className="h-8 w-8 opacity-30" />
                  <span>Nenhum desembolso registrado</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disbursementByDesigner} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `R$ ${v / 1000}k`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [formatCurrency(value), ""]} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar name="Pendente" dataKey="pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Solicitado" dataKey="solicitado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar name="Liberado" dataKey="liberado" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================= */}
      {/* Recent Proposals */}
      {/* ============================================= */}
      <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6 relative z-10 flex-1 flex flex-col">
          <div className="flex flex-col mb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Últimas Propostas Cadastradas</h3>
            <p className="text-[10px] text-slate-700 font-medium">Histórico recente na esteira</p>
          </div>
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

      {/* ============================================= */}
      {/* Hidden section for PDF Report Layout */}
      {/* ============================================= */}
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
                      <linearGradient id="colorValorPrint" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 500 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Area type="monotone" dataKey="valor" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorValorPrint)" strokeWidth={4} />
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
