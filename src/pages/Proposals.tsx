import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, DollarSign, FileUp, RotateCcw, CheckCircle2, Eye, MapPin, User, Landmark, ClipboardList, Info, Box, TrendingUp, Calendar, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProposals } from "@/hooks/useProposals";
import {
  ProposalStatus, PronafLine, ProjectDesigner, STATUS_LABELS, STATUS_COLORS, PRONAF_LINE_LABELS, PROJECT_DESIGNER_LABELS, ASSIGNABLE_TASK_TYPES, AssignableTaskType,
} from "@/types/proposal";
import { useTeam } from "@/hooks/useTeam";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ImportProposalsDialog } from "@/components/proposals/ImportProposalsDialog";

import { usePermissions } from "@/hooks/usePermissions";
import { useStockProposals } from "@/hooks/useStockProposals";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Proposals() {
  const navigate = useNavigate();
  const { proposals, loading, createProposal, updateProposal, deleteProposal, refetch } = useProposals();
  const { proposals: stockProposals, updateProposal: updateStockProposal, addProposal: addStockProposal } = useStockProposals();
  const { members, createTask } = useTeam();
  const { permissions } = usePermissions();

  // Propostas concluídas (Estoque + Contrato Assinado da Lista Principal)
  const concludedStockProposals = useMemo(
    () => stockProposals.filter(p => {
      const s = (p.status || '').toUpperCase().trim();
      return s === 'CONCLUÍDO' || s === 'CONCLUIDO';
    }),
    [stockProposals]
  );

  const concludedMainProposals = useMemo(
    () => proposals.filter(p => p.status === 'aprovada'),
    [proposals]
  );

  const allConcludedProposalsCount = concludedStockProposals.length + concludedMainProposals.length;
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [migratingId, setMigratingId] = useState<string | null>(null);
  const [isMigratingAll, setIsMigratingAll] = useState(false);
  const [viewingStockProposal, setViewingStockProposal] = useState<any | null>(null);
  const [viewingProposal, setViewingProposal] = useState<any | null>(null);

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportFilterMonth, setReportFilterMonth] = useState("all");
  const [reportFilterYear, setReportFilterYear] = useState("all");
  const [reportFilterDesigner, setReportFilterDesigner] = useState("all");

  const concludedStats = useMemo(() => {
    const totalCount = allConcludedProposalsCount;
    const totalValue = [...concludedStockProposals, ...concludedMainProposals].reduce(
      (acc, p) => acc + Number(p.estimated_value || p.requested_value || 0), 
      0
    );
    
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);
    
    const thisMonthProposals = [...concludedStockProposals, ...concludedMainProposals].filter(p => {
      const dateStr = p.created_at || p.entry_date;
      if (!dateStr) return false;
      const date = parseISO(dateStr);
      return getMonth(date) === currentMonth && getYear(date) === currentYear;
    });
    
    const monthCount = thisMonthProposals.length;
    const monthValue = thisMonthProposals.reduce(
      (acc, p) => acc + Number(p.estimated_value || p.requested_value || 0), 
      0
    );

    return { totalCount, totalValue, monthCount, monthValue };
  }, [concludedStockProposals, concludedMainProposals, allConcludedProposalsCount]);

  const handleRevertToStock = async (id: string) => {
    setRevertingId(id);
    await updateStockProposal(id, { status: 'AGUARDANDO ENTREVISTA' });
    setRevertingId(null);
    navigate('/estoque');
  };

  const mapToStockData = (p: any) => ({
    producer_name: p.producer_name,
    producer_cpf: p.producer_cpf,
    credit_program: p.credit_program,
    estimated_value: p.requested_value,
    notes: p.notes,
    projetista: PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || p.project_designer,
    municipio: p.producer_address,
    original_csv_status: p.sicad || null,
    linha_credito: p.credit_purpose || null,
    status: 'CONCLUÍDO',
    order_index: 0,
    entry_date: p.entry_date,
    producer_address: p.producer_address,
    producer_phone: p.producer_phone,
    pronaf_line: p.pronaf_line,
    sicad: p.sicad,
    request_type: p.request_type,
    agency_code: p.agency_code,
    agency_name: p.agency_name,
    task: p.task,
    central_date: p.central_date,
    activity_start_date: p.activity_start_date,
    last_analyst: p.last_analyst,
    owner: p.owner,
    originator: p.originator,
    current_state: p.current_state,
    category: p.category,
    client_size: p.client_size,
    proposal_number: p.proposal_number,
    credit_purpose: p.credit_purpose,
    resource_application: p.resource_application,
    special_treatment: p.special_treatment,
    central: p.central,
    superintendence_code: p.superintendence_code,
    superintendence_name: p.superintendence_name,
    microcredit: p.microcredit,
    renegotiation_type: p.renegotiation_type,
    guarantee_type: p.guarantee_type,
    registration_central_task: p.registration_central_task,
    registration_central_activity_start: p.registration_central_activity_start,
    judicial_period: p.judicial_period,
    requesting_unit: p.requesting_unit,
    agreement: p.agreement,
    culture: p.culture,
    roc_type: p.roc_type,
    poa_prd_subject: p.poa_prd_subject,
    activity_id: p.activity_id,
    technical_summary: p.technical_summary,
  });

  const handleMigrateToStock = async (p: any) => {
    setMigratingId(p.id);
    const stockData = mapToStockData(p);

    const migrated = await addStockProposal(stockData as any);
    if (migrated) {
      await deleteProposal(p.id);
    }
    setMigratingId(null);
  };

  const handleMigrateAllToStock = async () => {
    if (concludedMainProposals.length === 0) return;
    if (!confirm(`Deseja migrar todas as ${concludedMainProposals.length} propostas assinadas para o estoque?`)) return;
    
    setIsMigratingAll(true);
    for (const p of concludedMainProposals) {
      const stockData = mapToStockData(p);
      
      const migrated = await addStockProposal(stockData as any);
      if (migrated) {
        await deleteProposal(p.id);
      }
    }
    setIsMigratingAll(false);
    navigate('/estoque');
  };
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [designerFilter, setDesignerFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [sortBy, setSortBy] = useState<"nome" | "data">("data");
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    producer_name: "", producer_cpf: "", producer_address: "", producer_phone: "",
    pronaf_line: "custeio", project_designer: "ney_medeiros", requested_value: 0, status: "nova",
    entry_date: new Date().toISOString().split("T")[0], notes: "",
    sicad: "", credit_program: "", request_type: "", agency_code: "", agency_name: "",
    task: "", central_date: "", activity_start_date: "", last_analyst: "",
    owner: "", originator: "", current_state: "", category: "", client_size: "",
    proposal_number: "", credit_purpose: "", resource_application: "", special_treatment: "",
    central: "", superintendence_code: "", superintendence_name: "", microcredit: "",
    renegotiation_type: "", guarantee_type: "", registration_central_task: "",
    registration_central_activity_start: "", judicial_period: "", requesting_unit: "",
    agreement: "", culture: "", roc_type: "", poa_prd_subject: "", activity_id: "",
  });

  const availableYears = useMemo(() => {
    const years = new Set(proposals.map((p) => String(getYear(parseISO(p.entry_date)))));
    return Array.from(years).sort().reverse();
  }, [proposals]);

  const uniquePrograms = useMemo(() => {
    return [
      'FNE/PRONAF A - RES. 5.183/24 (699)',
      'FNE/PRONAF GRUPO "A" - FNE (368)',
      'FNE/PRONAF-MAIS ALIMENTOS (FNE) (434)',
      'FNE/PRONAF MULHER - FNE (406)',
      'FNE/RURAL (226)'
    ];
  }, []);

  // Auto-classificação de programa baseada em palavras-chave e valor
  useEffect(() => {
    const curProg = formData.credit_program.toUpperCase();
    let targetProg = "";

    if (curProg.includes("MULHER") || curProg.includes("406")) {
      targetProg = 'FNE/PRONAF MULHER - FNE (406)';
    } else if (curProg.includes("ALIMENTOS") || curProg.includes("434")) {
      targetProg = 'FNE/PRONAF-MAIS ALIMENTOS (FNE) (434)';
    } else if (curProg.includes("RURAL") || curProg.includes("226") || curProg === "FNE") {
      targetProg = 'FNE/RURAL (226)';
    } else if (curProg.includes("A") || curProg.includes("368") || curProg.includes("699") || curProg.includes("GRUPO")) {
      targetProg = formData.requested_value < 50000 
        ? 'FNE/PRONAF A - RES. 5.183/24 (699)' 
        : 'FNE/PRONAF GRUPO "A" - FNE (368)';
    }
    
    if (targetProg && formData.credit_program !== targetProg) {
      setFormData(prev => ({ ...prev, credit_program: targetProg }));
    }
  }, [formData.requested_value, formData.credit_program]);

  const allConcluded = useMemo(() => {
    const mainMapped = concludedMainProposals.map(p => ({
      ...p,
      isMain: true,
      displayValue: Number(p.requested_value) || 0,
      displayLocation: p.producer_address || '---',
      displayDesigner: PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || p.project_designer,
      displayDate: p.entry_date
    }));
    const stockMapped = concludedStockProposals.map(p => ({
      ...p,
      isMain: false,
      displayValue: Number(p.estimated_value) || 0,
      displayLocation: p.municipio || '---',
      displayDesigner: p.projetista || 'SEM PROJETISTA',
      displayDate: p.entry_date || p.created_at
    }));
    return [...mainMapped, ...stockMapped].sort((a, b) => {
      if (sortBy === "nome") return a.producer_name.localeCompare(b.producer_name);
      return new Date(b.displayDate || 0).getTime() - new Date(a.displayDate || 0).getTime();
    });
  }, [concludedMainProposals, concludedStockProposals, sortBy]);

  const uniqueDesigners = useMemo(() => {
    const designers = new Set(allConcluded.map(p => p.displayDesigner).filter(Boolean));
    return Array.from(designers).sort();
  }, [allConcluded]);

  const generateReport = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    
    // Filter the proposals for the report
    const reportData = allConcluded.filter(p => {
      const d = p.displayDate ? new Date(p.displayDate) : new Date();
      const matchesMonth = reportFilterMonth === "all" || d.getMonth() + 1 === Number(reportFilterMonth);
      const matchesYear = reportFilterYear === "all" || d.getFullYear() === Number(reportFilterYear);
      const matchesDesigner = reportFilterDesigner === "all" || p.displayDesigner === reportFilterDesigner;
      return matchesMonth && matchesYear && matchesDesigner;
    });

    const totalValue = reportData.reduce((acc, p) => acc + (Number(p.displayValue) || 0), 0);
    const totalCount = reportData.length;
    const avgTicket = totalCount > 0 ? totalValue / totalCount : 0;

    // --- Header Premium ---
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Relatório Executivo", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gestão de Propostas Concluídas", 14, 28);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Gerado em: ${timestamp}`, doc.internal.pageSize.width - 14, 25, { align: "right" });

    // --- KPI Cards (Professional) ---
    let startY = 45;
    
    // Card 1
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(14, startY, 80, 26, 3, 3, 'FD');
    doc.setFillColor(56, 189, 248); // sky-400 as accent
    doc.roundedRect(14, startY, 3, 26, 3, 3, 'F'); // Left border accent
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text("VOLUME TOTAL (QTD)", 22, startY + 8);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(String(totalCount), 22, startY + 19);

    // Card 2
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(100, startY, 80, 26, 3, 3, 'FD');
    doc.setFillColor(52, 211, 153); // emerald-400 as accent
    doc.roundedRect(100, startY, 3, 26, 3, 3, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("MONTANTE CONCLUÍDO", 108, startY + 8);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(formatCurrency(totalValue), 108, startY + 19);

    // Card 3
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(186, startY, 80, 26, 3, 3, 'FD');
    doc.setFillColor(129, 140, 248); // indigo-400 as accent
    doc.roundedRect(186, startY, 3, 26, 3, 3, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET MÉDIO", 194, startY + 8);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(formatCurrency(avgTicket), 194, startY + 19);

    startY += 40;

    // --- Performance por Projetista ---
    const statsByDesigner = reportData.reduce((acc, p) => {
      const designer = p.displayDesigner || "Sem Projetista";
      if (!acc[designer]) acc[designer] = { count: 0, value: 0 };
      acc[designer].count += 1;
      acc[designer].value += (Number(p.displayValue) || 0);
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const designerStatsArray = Object.entries(statsByDesigner)
      .sort((a, b) => b[1].value - a[1].value)
      .map(entry => [
        entry[0],
        String(entry[1].count),
        formatCurrency(entry[1].value),
        `${((entry[1].value / totalValue) * 100 || 0).toFixed(1)}%`
      ]);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Estatísticas por Projetista", 14, startY);
    
    autoTable(doc, {
      startY: startY + 4,
      head: [["Projetista", "Qtd Propostas", "Valor Total Captado", "% do Total"]],
      body: designerStatsArray,
      theme: "grid",
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    startY = (doc as any).lastAutoTable.finalY + 14;

    // --- Table Principal ---
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detalhamento das Propostas", 14, startY);

    const tableData = reportData.map(p => [
      p.isMain ? "Lista Ativa" : "Estoque",
      p.producer_name,
      p.producer_cpf || "-",
      p.credit_program || "-",
      p.displayDesigner || "-",
      p.displayLocation || "-",
      formatCurrency(Number(p.displayValue) || 0)
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [["Origem", "Produtor", "CPF", "Operação", "Projetista", "Município", "Valor"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Documento Gerado pelo Sistema de Gestão  |  Página ${i} de ${pages}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, { align: "center" });
    }

    doc.save(`Relatorio_Propostas_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    setIsReportDialogOpen(false);
  };

  const filtered = useMemo(() => {
    return allConcluded.filter((p) => {
      const matchesSearch =
        p.producer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.producer_cpf?.includes(searchTerm);
      
      const d = p.displayDate ? new Date(p.displayDate) : new Date();
      const matchesMonth = filterMonth === "all" || d.getMonth() + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || d.getFullYear() === Number(filterYear);
      const matchesDesigner = designerFilter === "all" || p.displayDesigner === designerFilter;
      const matchesProgram = programFilter === "all" || p.credit_program === programFilter;

      return matchesSearch && matchesMonth && matchesYear && matchesDesigner && matchesProgram;
    });
  }, [allConcluded, searchTerm, filterMonth, filterYear, designerFilter, programFilter]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterMonth, filterYear, sortBy, designerFilter, programFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);



  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const openNew = () => {
    setEditingId(null);
    setFormData({
      producer_name: "", producer_cpf: "", producer_address: "", producer_phone: "",
      pronaf_line: "custeio", project_designer: "ney_medeiros", requested_value: 0, status: "nova",
      entry_date: new Date().toISOString().split("T")[0], notes: "",
      sicad: "", credit_program: "", request_type: "", agency_code: "", agency_name: "",
      task: "", central_date: "", activity_start_date: "", last_analyst: "",
      owner: "", originator: "", current_state: "", category: "", client_size: "",
      proposal_number: "", credit_purpose: "", resource_application: "", special_treatment: "",
      central: "", superintendence_code: "", superintendence_name: "", microcredit: "",
      renegotiation_type: "", guarantee_type: "", registration_central_task: "",
      registration_central_activity_start: "", judicial_period: "", requesting_unit: "",
      agreement: "", culture: "", roc_type: "", poa_prd_subject: "", activity_id: "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      producer_name: p.producer_name, producer_cpf: p.producer_cpf,
      producer_address: p.producer_address, producer_phone: p.producer_phone,
      pronaf_line: p.pronaf_line, project_designer: p.project_designer || "ney_medeiros", requested_value: Number(p.requested_value),
      status: p.status, entry_date: p.entry_date, notes: p.notes || "",
      sicad: p.sicad || "", credit_program: p.credit_program || "", request_type: p.request_type || "",
      agency_code: p.agency_code || "", agency_name: p.agency_name || "",
      task: p.task || "", central_date: p.central_date || "",
      activity_start_date: p.activity_start_date || "", last_analyst: p.last_analyst || "",
      owner: p.owner || "", originator: p.originator || "",
      current_state: p.current_state || "", category: p.category || "",
      client_size: p.client_size || "", proposal_number: p.proposal_number || "",
      credit_purpose: p.credit_purpose || "", resource_application: p.resource_application || "",
      special_treatment: p.special_treatment || "",
      central: p.central || "", superintendence_code: p.superintendence_code || "",
      superintendence_name: p.superintendence_name || "", microcredit: p.microcredit || "",
      renegotiation_type: p.renegotiation_type || "", guarantee_type: p.guarantee_type || "",
      registration_central_task: p.registration_central_task || "",
      registration_central_activity_start: p.registration_central_activity_start || "",
      judicial_period: p.judicial_period || "", requesting_unit: p.requesting_unit || "",
      agreement: p.agreement || "", culture: p.culture || "",
      roc_type: p.roc_type || "", poa_prd_subject: p.poa_prd_subject || "",
      activity_id: p.activity_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.producer_name.trim() || !formData.producer_cpf.trim()) return;
    
    let targetProposalId = editingId;
    let saveSuccess = false;

    if (editingId) {
      await updateProposal(editingId, formData);
      saveSuccess = true;
    } else {
      const result = await createProposal(formData as any);
      if (result) {
        targetProposalId = result.id;
        saveSuccess = true;
      }
    }

    if (saveSuccess && targetProposalId) {
      if (formData.status === 'aprovada') {
        const stockData = {
          producer_name: formData.producer_name,
          producer_cpf: formData.producer_cpf,
          credit_program: formData.credit_program,
          estimated_value: formData.requested_value,
          notes: formData.notes,
          projetista: PROJECT_DESIGNER_LABELS[formData.project_designer as ProjectDesigner] || formData.project_designer,
          municipio: formData.producer_address,
          original_csv_status: formData.sicad || null,
          linha_credito: formData.credit_purpose || null,
          status: 'CONCLUÍDO',
          order_index: 0
        };

        const migrated = await addStockProposal(stockData as any);
        if (migrated) {
          await deleteProposal(targetProposalId);
          setIsDialogOpen(false);
          return;
        }
      }
      setIsDialogOpen(false);
    }
  };

  const designerChartData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    allConcluded.forEach((p) => {
      const designer = p.displayDesigner || "Sem Projetista";
      if (!dataMap[designer]) dataMap[designer] = 0;
      dataMap[designer] += Number(p.displayValue) || 0;
    });
    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allConcluded]);

  const programChartData = useMemo(() => {
    const dataMap: Record<string, { count: number; value: number }> = {};
    allConcluded.forEach((p) => {
      let program = p.credit_program || "Sem Linha";
      if (program.includes("699")) program = "PRONAF A (699)";
      else if (program.includes("368")) program = "PRONAF A (368)";
      else if (program.includes("434")) program = "MAIS ALIMENTOS";
      else if (program.includes("406")) program = "MULHER";
      else if (program.includes("226")) program = "RURAL (226)";
      
      if (!dataMap[program]) dataMap[program] = { count: 0, value: 0 };
      dataMap[program].count += 1;
      dataMap[program].value += Number(p.displayValue) || 0;
    });
    return Object.entries(dataMap)
      .map(([name, data]) => ({ name, count: data.count, value: data.value }))
      .sort((a, b) => b.count - a.count);
  }, [allConcluded]);
  
  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1"];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-8 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-8 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Gestão de Crédito</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-heading italic">
            Propostas <span className="text-emerald-600">Concluídas</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Relatório detalhado de propostas finalizadas e contratos assinados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
        {/* Lado Esquerdo: KPIs (3 cards compactos empilhados) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Card 1: Montante Concluído */}
          <Card className="border border-slate-200/60 shadow-premium rounded-[20px] overflow-hidden bg-white/80 backdrop-blur-xl group transition-transform hover:scale-[1.02] duration-500 relative flex-1 flex">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-3.5 relative z-10 flex items-center gap-3 w-full">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Montante Concluído</p>
                <h3 className="text-lg font-black text-slate-900 font-heading tracking-tight drop-shadow-sm leading-none">
                  {formatCurrency(concludedStats.totalValue)}
                </h3>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Performance Mês */}
          <Card className="border border-slate-200/60 shadow-premium rounded-[20px] overflow-hidden bg-white/80 backdrop-blur-xl group transition-transform hover:scale-[1.02] duration-500 relative flex-1 flex">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-3.5 relative z-10 flex items-center gap-3 w-full">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Performance Mês</p>
                <h3 className="text-lg font-black text-slate-900 font-heading tracking-tight drop-shadow-sm leading-none">
                  {formatCurrency(concludedStats.monthValue)}
                </h3>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Ticket Médio */}
          <Card className="border border-slate-200/60 shadow-premium rounded-[20px] overflow-hidden bg-white/80 backdrop-blur-xl group transition-transform hover:scale-[1.02] duration-500 relative flex-1 flex">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-3.5 relative z-10 flex items-center gap-3 w-full">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                <DollarSign className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Ticket Médio</p>
                <h3 className="text-lg font-black text-slate-900 font-heading tracking-tight drop-shadow-sm leading-none">
                  {formatCurrency(concludedStats.totalCount > 0 ? concludedStats.totalValue / concludedStats.totalCount : 0)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Centro: Gráfico de Barras */}
        <div className="lg:col-span-5 h-full">
          <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-5 relative z-10 flex-1 flex flex-col">
              <div className="flex flex-col mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Volume por Projetista</h3>
                <p className="text-[10px] text-slate-700 font-medium">Total financeiro captado por cada profissional</p>
              </div>
              <div className="flex-1 w-full min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={designerChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#374151', fontWeight: 600 }} angle={-25} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#374151', fontWeight: 600 }} tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Volume Captado']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                      {designerChartData.map((_, index) => (
                        <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Gráfico de Rosca */}
        <div className="lg:col-span-4 h-full">
          <Card className="border border-slate-200/60 shadow-premium rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl relative group h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-5 relative z-10 flex-1 flex flex-col justify-between">
              <div className="flex flex-col mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Aderência por Linha</h3>
                <p className="text-[10px] text-slate-700 font-medium">Quantidade de contratos por programa</p>
              </div>
              <div className="flex-grow flex flex-col sm:flex-row items-center gap-4 justify-between min-h-[160px]">
                {/* Donut Chart Container */}
                <div className="w-full sm:w-[42%] h-[160px] flex items-center justify-center relative shrink-0">
                  {/* Texto Central */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-1 z-0">
                    <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{concludedStats.totalCount}</span>
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-0.5">Total</span>
                  </div>

                  <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
                    <PieChart>
                      <Pie
                        data={programChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="name"
                      >
                        {programChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: number, name: string) => [`${value} propostas`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* List Legend Container */}
                <div className="flex-1 w-full space-y-1.5 self-center max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {programChartData.map((entry, index) => {
                    const color = COLORS[index % COLORS.length];
                    return (
                      <div key={entry.name} className="flex items-start gap-2 text-[10px] leading-tight hover:bg-slate-50/50 p-1 rounded-lg transition-colors">
                        <span className="h-2 w-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-900 truncate uppercase tracking-tight" title={entry.name}>
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold mt-0.5">
                            <span>{entry.count} {entry.count === 1 ? 'proposta' : 'propostas'}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-extrabold text-emerald-600">{formatCurrency(entry.value)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Search & Filters Top Bar (Redesenhado) ─── */}
      <Card className="shadow-premium border-slate-200 mt-6 rounded-[24px] overflow-hidden bg-white/70 backdrop-blur-2xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Buscar Propostas</Label>
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Nome, CPF..."
                  className="pl-12 h-12 bg-slate-50/50 border-slate-200 rounded-2xl text-sm transition-all hover:bg-slate-50 focus:bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Mês/Ano */}
            <div className="w-auto shrink-0">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Mês/Ano</Label>
              <MonthYearFilter
                month={filterMonth}
                year={filterYear}
                onMonthChange={setFilterMonth}
                onYearChange={setFilterYear}
                years={availableYears}
              />
            </div>

            {/* Ordenar */}
            <div className="w-[160px] shrink-0">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Ordenar</Label>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-full h-12 gap-2 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all">
                  <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="data">Data (Mais Novas)</SelectItem>
                  <SelectItem value="nome">Alfabética (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projetista */}
            <div className="w-[180px] shrink-0">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Projetista</Label>
              <Select value={designerFilter} onValueChange={setDesignerFilter}>
                <SelectTrigger className="w-full h-12 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[300px]">
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueDesigners.map(designer => (
                    <SelectItem key={designer} value={designer}>{designer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linha */}
            <div className="w-[180px] shrink-0">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Linha</Label>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-full h-12 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all truncate text-left">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-[300px] w-[250px]">
                  <SelectItem value="all">Todos</SelectItem>
                  {uniquePrograms.map(prog => (
                    <SelectItem key={prog} value={prog} className="text-xs truncate">{prog}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão Relatório */}
            <div className="shrink-0">
              <Button 
                onClick={() => setIsReportDialogOpen(true)}
                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold px-6 shadow-md shadow-indigo-200/50 transition-all hover:scale-[1.02]"
              >
                <FileUp className="h-4 w-4 mr-2" />
                Relatório
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ─── Seção Principal de Concluídas ─── */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[20px] bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">Histórico de <span className="text-emerald-600">Sucesso</span></h2>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Visualização consolidada de propostas do estoque e assinadas.</p>
            </div>
          </div>
        </div>

        <Card className="border border-slate-200/60 shadow-premium rounded-[40px] overflow-hidden bg-white/70 backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200/60 backdrop-blur-md">
                <tr>
                  <th className="text-left py-6 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Origem</th>
                  <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Produtor / Beneficiário</th>
                  <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Operação Financeira</th>
                  <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Município / Local</th>
                  <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Estimado</th>
                  <th className="text-right py-6 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Ações</th>
                </tr>
              </thead>
                <tbody className="divide-y divide-slate-200/40">
                  {paged.map((p) => (
                    <tr key={p.id} className="group hover:bg-white/90 transition-all duration-300">
                      <td className="py-5 pl-8">
                        {p.isMain ? (
                           <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[9px] font-black h-5 px-2 rounded-lg uppercase tracking-wider shadow-sm">Lista Ativa</Badge>
                        ) : (
                           <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200/50 text-[9px] font-black h-5 px-2 rounded-lg uppercase tracking-wider shadow-sm">Histórico</Badge>
                        )}
                      </td>
                      <td className="py-5">
                        <div className="font-extrabold text-slate-900 text-sm tracking-tight">{p.producer_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 bg-slate-100/50 w-fit px-1.5 py-0.5 rounded-md">{p.producer_cpf || '---'}</div>
                      </td>
                      <td className="py-5">
                        <div className="text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg w-fit border border-slate-200/60 shadow-sm">{p.credit_program || '---'}</div>
                        <div className="text-[9px] text-indigo-600 font-black uppercase mt-1.5 tracking-widest flex items-center gap-1">
                           <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                           {p.displayDesigner}
                        </div>
                      </td>
                      <td className="py-5">
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 bg-slate-50 w-fit px-2.5 py-1 rounded-lg border border-slate-100">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> {p.displayLocation}
                        </div>
                      </td>
                      <td className="py-5 text-right">
                        <div className="text-sm font-black text-slate-900 tabular-nums tracking-tighter bg-emerald-50/50 w-fit ml-auto px-3 py-1 rounded-lg border border-emerald-100 text-emerald-900">
                          {p.displayValue ? formatCurrency(Number(p.displayValue)) : '---'}
                        </div>
                      </td>
                      <td className="py-5 pr-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => p.isMain ? setViewingProposal(p) : setViewingStockProposal(p)}
                            title="Ver Detalhes"
                            className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          {p.isMain ? (
                            <button
                              onClick={() => handleMigrateToStock(p)}
                              disabled={migratingId === p.id}
                              title="Arquivar no Estoque"
                              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm disabled:opacity-50"
                            >
                              {migratingId === p.id ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Box className="h-4.5 w-4.5" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevertToStock(p.id)}
                              disabled={revertingId === p.id}
                              title="Reverter para Fluxo Ativo"
                              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm disabled:opacity-50"
                            >
                              {revertingId === p.id ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <RotateCcw className="h-4.5 w-4.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="h-48 text-center bg-slate-50/50">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                          <Search className="h-10 w-10 text-slate-400" />
                          <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhuma proposta encontrada</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                <p className="text-xs text-slate-400 font-medium">
                  Mostrando <span className="font-black text-slate-700">{paged.length}</span> de <span className="font-black text-slate-700">{filtered.length}</span> propostas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

      {/* Dialog de Relatório */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
              <FileUp className="h-5 w-5" />
              Configurar Relatório
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Mês/Ano</Label>
              <MonthYearFilter
                month={reportFilterMonth}
                year={reportFilterYear}
                onMonthChange={setReportFilterMonth}
                onYearChange={setReportFilterYear}
                years={availableYears}
              />
            </div>
            <div className="grid gap-2 mt-2">
              <Label>Projetista</Label>
              <Select value={reportFilterDesigner} onValueChange={setReportFilterDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Projetistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Projetistas</SelectItem>
                  {uniqueDesigners.map(d => (
                    <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={generateReport} className="bg-indigo-600 hover:bg-indigo-700">Baixar PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da Proposta Ativa (Configuração Gráfica Premium) */}
      <Dialog open={!!viewingProposal} onOpenChange={() => setViewingProposal(null)}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Plus className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black">{viewingProposal?.producer_name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-medium text-primary-foreground/80 flex items-center gap-1">
                    <User className="h-3 w-3" /> {viewingProposal?.producer_cpf || '---'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-primary-foreground/30"></span>
                  <Badge className={`rounded-full px-2 py-0.5 text-[9px] font-black border-0 shadow-sm ${STATUS_COLORS[viewingProposal?.status as ProposalStatus]}`}>
                    {STATUS_LABELS[viewingProposal?.status as ProposalStatus]?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Landmark className="h-3.5 w-3.5" /> Informações Financeiras
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Valor Solicitado</p>
                      <p className="text-xl font-black text-primary">
                        {viewingProposal?.requested_value ? formatCurrency(Number(viewingProposal.requested_value)) : '---'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Programa de Crédito</p>
                      <p className="text-sm font-semibold text-slate-700">{viewingProposal?.credit_program || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">SICAD</p>
                      <p className="text-sm font-semibold text-indigo-600 font-mono tracking-tighter">{viewingProposal?.sicad || 'SEM SICAD'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <MapPin className="h-3.5 w-3.5" /> Localização e Equipe
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Endereço</span>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{viewingProposal?.producer_address || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Projetista</span>
                      <span className="text-xs font-bold text-indigo-600">{PROJECT_DESIGNER_LABELS[viewingProposal?.project_designer as ProjectDesigner] || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Agência</span>
                      <span className="text-xs font-bold text-slate-700">{viewingProposal?.agency_name || '---'} ({viewingProposal?.agency_code || '---'})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Info className="h-3.5 w-3.5" /> Detalhes Técnicos
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Data de Entrada</span>
                      <span className="text-xs font-bold text-slate-700">{viewingProposal?.entry_date ? format(parseISO(viewingProposal.entry_date), 'dd/MM/yyyy') : '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Finalidade</span>
                      <span className="text-xs font-bold text-slate-700">{viewingProposal?.credit_purpose || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">ID Atividade</span>
                      <span className="text-xs font-bold text-slate-700">{viewingProposal?.activity_id || '---'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <ClipboardList className="h-3.5 w-3.5" /> Notas e Observações
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed min-h-[100px] border border-slate-100 italic whitespace-pre-wrap">
                    {viewingProposal?.notes || 'Sem observações adicionais para esta proposta.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/80 p-6 border-t border-slate-100 flex sm:justify-between items-center rounded-b-3xl">
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-400">Origem: {viewingProposal?.originator || 'Sistema'}</p>
              <p className="text-[10px] text-slate-400 italic">Última Análise: {viewingProposal?.last_analyst || 'Não informada'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewingProposal(null)} className="rounded-xl font-bold text-xs h-10 border-slate-200">
                Fechar
              </Button>
              {permissions.can_edit_proposals && (
                <Button onClick={() => { setViewingProposal(null); openEdit(viewingProposal); }} className="rounded-xl font-bold text-xs h-10 shadow-lg shadow-primary/20">
                  Editar Proposta
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-background">
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Plus className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold font-heading">{editingId ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
              <p className="text-primary-foreground/80 text-sm">Insira os detalhes técnicos e financeiros do produtor.</p>
            </DialogHeader>
          </div>
          <div className="p-8 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  Dados do Produtor
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Nome do Produtor *</Label>
                    <Input value={formData.producer_name} onChange={(e) => setFormData((f) => ({ ...f, producer_name: e.target.value }))} placeholder="Nome completo" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">CPF *</Label>
                    <Input value={formData.producer_cpf} onChange={(e) => setFormData((f) => ({ ...f, producer_cpf: e.target.value }))} placeholder="000.000.000-00" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">SICAD</Label>
                    <Input value={formData.sicad} onChange={(e) => setFormData((f) => ({ ...f, sicad: e.target.value }))} placeholder="Número SICAD" className="rounded-xl" />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Endereço</Label>
                    <Input value={formData.producer_address} onChange={(e) => setFormData((f) => ({ ...f, producer_address: e.target.value }))} placeholder="Propriedade rural" className="rounded-xl" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  Operação Financeira
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Programa de Crédito</Label>
                    <Select value={formData.credit_program} onValueChange={(v) => setFormData((f) => ({ ...f, credit_program: v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o programa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {uniquePrograms.map(program => (
                          <SelectItem key={program} value={program} className="rounded-lg">{program}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Valor Solicitado</Label>
                    <CurrencyInput value={formData.requested_value} onChange={(v) => setFormData((f) => ({ ...f, requested_value: v }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Finalidade</Label>
                    <Input value={formData.credit_purpose} onChange={(e) => setFormData((f) => ({ ...f, credit_purpose: e.target.value }))} placeholder="Ex: INVESTIMENTO" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Projetista</Label>
                    <Select value={formData.project_designer} onValueChange={(v) => setFormData((f) => ({ ...f, project_designer: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.entries(PROJECT_DESIGNER_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="rounded-lg">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Data de Entrada</Label>
                    <Input type="date" value={formData.entry_date} onChange={(e) => setFormData((f) => ({ ...f, entry_date: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status da Proposta</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v as ProposalStatus }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="rounded-lg">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  Atribuir Tarefa
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium -mt-2">
                  Crie uma tarefa vinculada a esta proposta e atribua a um membro da equipe.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tipo de Tarefa</Label>
                    <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione a tarefa (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {Object.entries(ASSIGNABLE_TASK_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="rounded-lg">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Atribuir a</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember} disabled={!selectedTaskType}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o membro" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  Dados Complementares (Campo CSV)
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Central</Label>
                    <Input value={formData.central} onChange={(e) => setFormData((f) => ({ ...f, central: e.target.value }))} placeholder="Central" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Cód. Superintendência</Label>
                    <Input value={formData.superintendence_code} onChange={(e) => setFormData((f) => ({ ...f, superintendence_code: e.target.value }))} placeholder="Cód. Superintendência" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Nome Superintendência</Label>
                    <Input value={formData.superintendence_name} onChange={(e) => setFormData((f) => ({ ...f, superintendence_name: e.target.value }))} placeholder="Nome Superintendência" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Microcrédito</Label>
                    <Input value={formData.microcredit} onChange={(e) => setFormData((f) => ({ ...f, microcredit: e.target.value }))} placeholder="Microcrédito" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tipo Renegociação</Label>
                    <Input value={formData.renegotiation_type} onChange={(e) => setFormData((f) => ({ ...f, renegotiation_type: e.target.value }))} placeholder="Tipo Renegociação" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tipo de Garantia</Label>
                    <Input value={formData.guarantee_type} onChange={(e) => setFormData((f) => ({ ...f, guarantee_type: e.target.value }))} placeholder="Tipo de Garantia" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tarefa Central Cadastro</Label>
                    <Input value={formData.registration_central_task} onChange={(e) => setFormData((f) => ({ ...f, registration_central_task: e.target.value }))} placeholder="Tarefa Central" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Dt. Início C. Cadastro</Label>
                    <Input value={formData.registration_central_activity_start} onChange={(e) => setFormData((f) => ({ ...f, registration_central_activity_start: e.target.value }))} placeholder="Data Início" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Prazo Judicial</Label>
                    <Input value={formData.judicial_period} onChange={(e) => setFormData((f) => ({ ...f, judicial_period: e.target.value }))} placeholder="Prazo Judicial" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Unidade Solicitante</Label>
                    <Input value={formData.requesting_unit} onChange={(e) => setFormData((f) => ({ ...f, requesting_unit: e.target.value }))} placeholder="Unidade Solicitante" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Convênio</Label>
                    <Input value={formData.agreement} onChange={(e) => setFormData((f) => ({ ...f, agreement: e.target.value }))} placeholder="Convênio" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Cultura</Label>
                    <Input value={formData.culture} onChange={(e) => setFormData((f) => ({ ...f, culture: e.target.value }))} placeholder="Cultura" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tipo ROC</Label>
                    <Input value={formData.roc_type} onChange={(e) => setFormData((f) => ({ ...f, roc_type: e.target.value }))} placeholder="Tipo ROC" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Assunto POA/PRD</Label>
                    <Input value={formData.poa_prd_subject} onChange={(e) => setFormData((f) => ({ ...f, poa_prd_subject: e.target.value }))} placeholder="Assunto POA/PRD" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">ID Atividade</Label>
                    <Input value={formData.activity_id} onChange={(e) => setFormData((f) => ({ ...f, activity_id: e.target.value }))} placeholder="ID Atividade" className="rounded-xl" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-primary" />
                  Notas e Observações
                </h3>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Observações adicionais ou pendências críticas..."
                  className="min-h-[100px] rounded-2xl resize-none"
                />
              </section>
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t gap-3">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl px-6">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              {editingId ? "Salvar Alterações" : "Cadastrar Proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-3xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-heading">Confirmar Exclusão?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              Esta ação é permanente e removerá todos os dados vinculados a esta proposta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-border/60">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl px-6"
              onClick={() => {
                if (deleteId) {
                  deleteProposal(deleteId);
                  setIsDeleteAlertOpen(false);
                  setDeleteId(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportProposalsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}

