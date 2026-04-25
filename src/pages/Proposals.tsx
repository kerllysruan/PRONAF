import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, DollarSign, FileUp, RotateCcw, CheckCircle2, Eye, MapPin, User, Landmark, ClipboardList, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  const [viewingStockProposal, setViewingStockProposal] = useState<any | null>(null);
  const [viewingProposal, setViewingProposal] = useState<any | null>(null);

  const handleRevertToStock = async (id: string) => {
    setRevertingId(id);
    await updateStockProposal(id, { status: 'AGUARDANDO ENTREVISTA' });
    setRevertingId(null);
    navigate('/estoque');
  };
  const [selectedTaskType, setSelectedTaskType] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [designerFilter, setDesignerFilter] = useState<string>("all");
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

  const filtered = useMemo(() => {
    // Removed setPage(0) to prevent reset on data update
    let result = proposals.filter((p) => {
      // Excluir as que já estão assinadas (concluídas) da lista principal
      if (p.status === 'aprovada') return false;

      const matchesSearch =
        p.producer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.producer_cpf.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesDesigner = designerFilter === "all" || p.project_designer === designerFilter;
      const d = parseISO(p.entry_date);
      const matchesMonth = filterMonth === "all" || getMonth(d) + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || getYear(d) === Number(filterYear);
      return matchesSearch && matchesStatus && matchesDesigner && matchesMonth && matchesYear;
    });

    // Aplicar ordenamento
    if (sortBy === "nome") {
      result.sort((a, b) => a.producer_name.localeCompare(b.producer_name));
    } else if (sortBy === "data") {
      result.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    }

    return result;
  }, [proposals, searchTerm, statusFilter, designerFilter, filterMonth, filterYear, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, designerFilter, filterMonth, filterYear, sortBy]);

  // Keep page valid if data shrinks
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  useEffect(() => {
    if (page > 0 && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const filteredForSum = useMemo(() => {
    return proposals.filter((p) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesDesigner = designerFilter === "all" || p.project_designer === designerFilter;
      const d = parseISO(p.entry_date);
      const matchesMonth = filterMonth === "all" || getMonth(d) + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || getYear(d) === Number(filterYear);
      return matchesStatus && matchesDesigner && matchesMonth && matchesYear;
    });
  }, [proposals, statusFilter, designerFilter, filterMonth, filterYear]);

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
      // Se uma tarefa foi selecionada, criar a tarefa vinculada à proposta
      if (selectedTaskType && selectedMember) {
        await createTask({
          title: ASSIGNABLE_TASK_TYPES[selectedTaskType as AssignableTaskType],
          description: `Tarefa atribuída para proposta de ${formData.producer_name}`,
          assigned_to: selectedMember,
          priority: 'media',
          status: 'pendente',
          due_date: null,
          proposal_id: editingId,
          document_name: selectedTaskType,
        });
      }
    } else {
      const result = await createProposal(formData as any);
      if (result) {
        targetProposalId = result.id;
        saveSuccess = true;
        // Se uma tarefa foi selecionada na criação, criar a tarefa
        if (selectedTaskType && selectedMember && result.id) {
          await createTask({
            title: ASSIGNABLE_TASK_TYPES[selectedTaskType as AssignableTaskType],
            description: `Tarefa atribuída para proposta de ${formData.producer_name}`,
            assigned_to: selectedMember,
            priority: 'media',
            status: 'pendente',
            due_date: null,
            proposal_id: result.id,
            document_name: selectedTaskType,
          });
        }
      }
    }

    if (saveSuccess && targetProposalId) {
      // Lógica de Migração Automática para o Estoque se o status for "CONTRATO ASSINADO"
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
          // Remover da lista de propostas ativas após migrar com sucesso
          await deleteProposal(targetProposalId);
          setIsDialogOpen(false);
          // Opcional: Redirecionar para o estoque para ver o resultado
          navigate('/estoque');
          return;
        }
      }
      
      setSelectedTaskType("");
      setSelectedMember("");
      setIsDialogOpen(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Gestão de Propostas</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {proposals.length} registros ativos na agência
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {permissions.can_create_proposals && (
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
              className="rounded-xl border-border/60 hover:bg-background/80 transition-all font-bold text-xs px-5 h-11 flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" /> Importar CSV
            </Button>
          )}
          {permissions.can_create_proposals && (
            <Button
              onClick={openNew}
              className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold text-xs px-5 h-11 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Nova Proposta
            </Button>
          )}
        </div>
      </div>

      {/* KPI Resumo */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-0 shadow-premium bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent overflow-hidden relative rounded-3xl">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <DollarSign className="h-32 w-32 -mr-8 -mt-8" />
          </div>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <span className="text-xl font-bold font-heading">{filteredForSum.length}</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Volume em Propostas Filtradas</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase font-bold px-2 py-0">
                    {filteredForSum.length} {filteredForSum.length === 1 ? 'registro' : 'registros'}
                  </Badge>
                  {statusFilter !== "all" && (
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0 border-muted-foreground/20">
                      Filtro: {STATUS_LABELS[statusFilter as ProposalStatus]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">Montante Financeiro</p>
              <span className="text-4xl font-black bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent font-heading tracking-tight italic">
                {formatCurrency(filteredForSum.reduce((acc, curr) => acc + Number(curr.requested_value || 0), 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Seção: Concluídas do Estoque (Movida para o Topo para Visibilidade) ─── */}
      {concludedStockProposals.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Propostas Concluídas</h2>
              <p className="text-xs text-muted-foreground">Finalizadas no estoque ou com contrato assinado.</p>
            </div>
            <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
              {allConcludedProposalsCount} registro{allConcludedProposalsCount > 1 ? 's' : ''}
            </span>
          </div>

          <Card className="border-0 shadow-premium rounded-3xl overflow-hidden bg-emerald-50/20 border border-emerald-100/50">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-100/30 border-b border-emerald-100/50">
                  <tr>
                    <th className="text-left py-3 pl-6 text-[10px] font-black uppercase tracking-wider text-emerald-700 w-[250px]">Produtor / CPF</th>
                    <th className="text-left py-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">Operação / Projetista</th>
                    <th className="text-left py-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">Município / Local</th>
                    <th className="text-left py-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">Pendências / Serasa</th>
                    <th className="text-right py-3 text-[10px] font-black uppercase tracking-wider text-emerald-700">Valor Estimado</th>
                    <th className="text-right py-3 pr-6 text-[10px] font-black uppercase tracking-wider text-emerald-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Propostas do Estoque */}
                  {concludedStockProposals.map((p) => (
                    <tr key={p.id} className="border-b border-emerald-100/20 hover:bg-emerald-100/10 transition-colors">
                      <td className="py-3 pl-6">
                        <div className="font-bold text-slate-800 text-xs">{p.producer_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.producer_cpf || '---'}</div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[8px] font-black h-4 px-1 mt-0.5">ESTOQUE</Badge>
                      </td>
                      <td className="py-3">
                        <div className="text-xs font-semibold text-slate-700">{p.credit_program || '---'}</div>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase">{p.projetista || 'SEM PROJETISTA'}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-slate-600">{p.municipio || '---'}</div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[150px]">{p.localizacao || '---'}</div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          {p.pendencias && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] py-0 px-1.5 w-fit">
                              P: {p.pendencias}
                            </Badge>
                          )}
                          {p.serasa && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] py-0 px-1.5 w-fit">
                              S: {p.serasa}
                            </Badge>
                          )}
                          {!p.pendencias && !p.serasa && <span className="text-[10px] text-muted-foreground italic">Nada constando</span>}
                        </div>
                      </td>
                      <td className="py-3 text-right text-xs font-bold text-emerald-700 tabular-nums">
                        {p.estimated_value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.estimated_value)) : '---'}
                      </td>
                      <td className="py-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingStockProposal(p)}
                            title="Ver todos os detalhes"
                            className="h-8 w-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRevertToStock(p.id)}
                            disabled={revertingId === p.id}
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-white border border-amber-200 hover:bg-amber-50 rounded-lg px-3 py-1.5 shadow-sm transition-all disabled:opacity-50"
                          >
                            {revertingId === p.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RotateCcw className="h-3 w-3" />}
                            Reverter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Propostas da Lista Principal (Contrato Assinado) */}
                  {concludedMainProposals.map((p) => (
                    <tr key={p.id} className="border-b border-emerald-100/20 hover:bg-emerald-100/10 transition-colors">
                      <td className="py-3 pl-6">
                        <div className="font-bold text-slate-800 text-xs">{p.producer_name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.producer_cpf || '---'}</div>
                        <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[8px] font-black h-4 px-1 mt-0.5">LISTA ATIVA</Badge>
                      </td>
                      <td className="py-3">
                        <div className="text-xs font-semibold text-slate-700">{p.credit_program || '---'}</div>
                        <div className="text-[10px] text-indigo-600 font-bold uppercase">{PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || 'SEM PROJETISTA'}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-slate-600">{p.producer_address || '---'}</div>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[150px]">Sicad: {p.sicad || '---'}</div>
                      </td>
                      <td className="py-3">
                        <Badge className="bg-green-50 text-green-700 border border-green-200 text-[9px] py-0.5 px-2 font-black">
                          CONTRATO ASSINADO
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-xs font-bold text-emerald-700 tabular-nums">
                        {p.requested_value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.requested_value)) : '---'}
                      </td>
                      <td className="py-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(p.id);
                              setFormData({
                                producer_name: p.producer_name,
                                producer_cpf: p.producer_cpf,
                                producer_address: p.producer_address || "",
                                producer_phone: p.producer_phone || "",
                                pronaf_line: p.pronaf_line,
                                project_designer: p.project_designer || "ney_medeiros",
                                requested_value: p.requested_value,
                                status: p.status,
                                entry_date: p.entry_date,
                                notes: p.notes || "",
                                sicad: p.sicad || "",
                                credit_program: p.credit_program || "",
                                request_type: p.request_type || "",
                                agency_code: p.agency_code || "",
                                agency_name: p.agency_name || "",
                                task: p.task || "",
                                central_date: p.central_date || "",
                                activity_start_date: p.activity_start_date || "",
                                last_analyst: p.last_analyst || "",
                                owner: p.owner || "",
                                originator: p.originator || "",
                                current_state: p.current_state || "",
                                category: p.category || "",
                                client_size: p.client_size || "",
                                proposal_number: p.proposal_number || "",
                                credit_purpose: p.credit_purpose || "",
                                resource_application: p.resource_application || "",
                                special_treatment: p.special_treatment || "",
                                central: p.central || "",
                                superintendence_code: p.superintendence_code || "",
                                superintendence_name: p.superintendence_name || "",
                                microcredit: p.microcredit || "",
                                renegotiation_type: p.renegotiation_type || "",
                                guarantee_type: p.guarantee_type || "",
                                registration_central_task: p.registration_central_task || "",
                                registration_central_activity_start: p.registration_central_activity_start || "",
                                judicial_period: p.judicial_period || "",
                                requesting_unit: p.requesting_unit || "",
                                agreement: p.agreement || "",
                                culture: p.culture || "",
                                roc_type: p.roc_type || "",
                                poa_prd_subject: p.poa_prd_subject || "",
                                activity_id: p.activity_id || "",
                              });
                              setIsDialogOpen(true);
                            }}
                            title="Editar Proposta"
                            className="h-8 w-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-700 hover:bg-blue-50 transition-all shadow-sm"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Dialog de Detalhes da Proposta Concluída */}
      <Dialog open={!!viewingStockProposal} onOpenChange={() => setViewingStockProposal(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0 shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white relative">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black">{viewingStockProposal?.producer_name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-medium text-emerald-100 flex items-center gap-1">
                    <User className="h-3 w-3" /> {viewingStockProposal?.producer_cpf || 'CPF não informado'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-emerald-300"></span>
                  <span className="text-xs font-bold text-white bg-emerald-500/50 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    CONCLUÍDO NO ESTOQUE
                  </span>
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
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Estimado</p>
                      <p className="text-xl font-black text-emerald-700">
                        {viewingStockProposal?.estimated_value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(viewingStockProposal.estimated_value)) : '---'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Programa de Crédito</p>
                      <p className="text-sm font-semibold text-slate-700">{viewingStockProposal?.credit_program || '---'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Linha de Crédito</p>
                      <p className="text-sm font-semibold text-slate-700">{viewingStockProposal?.linha_credito || '---'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <MapPin className="h-3.5 w-3.5" /> Localização e Agência
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Município</span>
                      <span className="text-xs font-bold text-slate-700">{viewingStockProposal?.municipio || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Agência</span>
                      <span className="text-xs font-bold text-slate-700">{viewingStockProposal?.agencia_cadastro || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Projetista</span>
                      <span className="text-xs font-bold text-indigo-600">{viewingStockProposal?.projetista || '---'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Info className="h-3.5 w-3.5" /> Detalhes Adicionais
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Pendências</span>
                      <span className="text-xs font-bold text-amber-600">{viewingStockProposal?.pendencias || 'Nenhuma'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Serasa</span>
                      <span className="text-xs font-bold text-slate-700">{viewingStockProposal?.serasa || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs text-slate-500">Localização</span>
                      <span className="text-xs font-bold text-slate-700">{viewingStockProposal?.localizacao || '---'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <ClipboardList className="h-3.5 w-3.5" /> Observações
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed min-h-[100px] border border-slate-100 italic">
                    {viewingStockProposal?.notes || viewingStockProposal?.observacoes_extra || 'Sem observações adicionais.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/80 p-6 border-t border-slate-100 flex sm:justify-between items-center rounded-b-3xl">
            <p className="text-[10px] text-slate-400 italic">Criado em: {viewingStockProposal?.created_at ? new Date(viewingStockProposal.created_at).toLocaleDateString('pt-BR') : '---'}</p>
            <Button variant="outline" onClick={() => setViewingStockProposal(null)} className="rounded-xl font-bold text-xs h-10 border-slate-200">
              Fechar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Filtros Lateral */}
        <aside className="md:col-span-3 space-y-6 sticky top-24">
          <Card className="border-0 shadow-premium rounded-3xl overflow-hidden bg-card/60 backdrop-blur-sm">
            <div className="bg-primary/5 p-4 border-b border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Search className="h-3 w-3" /> Filtros Avançados
              </p>
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Busca Rápida</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    placeholder="Nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Filtrar por Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 shadow-inner">
                    <SelectValue placeholder="Todos os Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all" className="rounded-lg">Todos os Status</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="rounded-lg">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Ordenar por</label>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 shadow-inner">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="data" className="rounded-lg">Data (Mais Novas)</SelectItem>
                    <SelectItem value="nome" className="rounded-lg">Ordem Alfabética (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Mês/Ano</label>
                <MonthYearFilter
                  month={filterMonth}
                  year={filterYear}
                  onMonthChange={setFilterMonth}
                  onYearChange={setFilterYear}
                  years={availableYears}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Projetista</label>
                <Select value={designerFilter} onValueChange={setDesignerFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 shadow-inner">
                    <SelectValue placeholder="Projetista" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all" className="rounded-lg">Todos os Projetistas</SelectItem>
                    {Object.entries(PROJECT_DESIGNER_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="rounded-lg">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
            <p className="text-xs font-bold text-primary mb-2">Dica Pro</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">Use os filtros para analisar o desempenho de projetistas específicos ou períodos de tempo.</p>
          </div>
        </aside>

        {/* Tabela de Propostas */}
        <div className="md:col-span-9 space-y-6">
          <Card className="border-0 shadow-premium rounded-3xl overflow-hidden bg-card/80 backdrop-blur-md transition-all">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="w-[300px] py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-6">Beneficiário</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Operação</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Valor Solicitado</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</TableHead>
                    <TableHead className="py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((proposal) => (
                    <TableRow key={proposal.id} className="group hover:bg-primary/5 transition-colors border-border/30">
                      <TableCell className="py-4 pl-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => openEdit(proposal)}>{proposal.producer_name}</span>
                          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{proposal.producer_cpf}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{proposal.credit_program || 'Não Informado'}</span>
                          <span className="text-[9px] text-muted-foreground/60 uppercase font-black">{proposal.sicad || 'SEM SICAD'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="text-sm font-bold tabular-nums text-primary">
                          {formatCurrency(Number(proposal.requested_value))}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-bold shadow-sm border-0 ${STATUS_COLORS[proposal.status as ProposalStatus]}`}>
                          {STATUS_LABELS[proposal.status as ProposalStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-emerald-100/50 text-emerald-600" 
                            onClick={() => setViewingProposal(proposal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {permissions.can_edit_proposals && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" onClick={() => openEdit(proposal)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {permissions.can_delete_proposals && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteId(proposal.id);
                                setIsDeleteAlertOpen(true);
                              }}
                              className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                          <Search className="h-10 w-10" />
                          <p className="text-sm font-medium">Nenhuma proposta encontrada</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação Premium */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground font-medium">
                  Mostrando <span className="font-bold text-foreground">{paged.length}</span> de <span className="font-bold text-foreground">{filtered.length}</span> propostas
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-border/50 hover:bg-background/80"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                      <Button
                        key={i}
                        variant={page === i ? "default" : "outline"}
                        size="icon"
                        className={`h-8 w-8 rounded-lg text-xs font-bold ${page === i ? 'shadow-md shadow-primary/20' : 'border-border/50'}`}
                        onClick={() => setPage(i)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-border/50 hover:bg-background/80"
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
      </div>

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

