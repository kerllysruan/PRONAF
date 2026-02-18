import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, DollarSign } from "lucide-react";
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
  ProposalStatus, PronafLine, ProjectDesigner, STATUS_LABELS, STATUS_COLORS, PRONAF_LINE_LABELS, PROJECT_DESIGNER_LABELS,
} from "@/types/proposal";
import { format, parseISO, getMonth, getYear } from "date-fns";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import { CurrencyInput } from "@/components/ui/currency-input";

import { usePermissions } from "@/hooks/usePermissions";

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Proposals() {
  const { proposals, loading, createProposal, updateProposal, deleteProposal, refetch } = useProposals();
  const { permissions } = usePermissions();
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
  const [formData, setFormData] = useState({
    producer_name: "", producer_cpf: "", producer_address: "", producer_phone: "",
    pronaf_line: "custeio", project_designer: "ney_medeiros", requested_value: 0, status: "nova",
    entry_date: new Date().toISOString().split("T")[0], notes: "",
    sicad: "", credit_program: "", request_type: "", agency_code: "", agency_name: "",
    task: "", central_date: "", activity_start_date: "", last_analyst: "",
    owner: "", originator: "", current_state: "", category: "", client_size: "",
    proposal_number: "", credit_purpose: "", resource_application: "", special_treatment: "",
  });

  const availableYears = useMemo(() => {
    const years = new Set(proposals.map((p) => String(getYear(parseISO(p.entry_date)))));
    return Array.from(years).sort().reverse();
  }, [proposals]);

  const filtered = useMemo(() => {
    // Removed setPage(0) to prevent reset on data update
    let result = proposals.filter((p) => {
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
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.producer_name.trim() || !formData.producer_cpf.trim()) return;
    if (editingId) {
      await updateProposal(editingId, formData);
      setIsDialogOpen(false);
    } else {
      const result = await createProposal(formData as any);
      if (result) setIsDialogOpen(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground">Propostas</h1>
          <p className="text-sm text-muted-foreground mt-2">Cadastro e gerenciamento de propostas PRONAF</p>
        </div>
        {permissions.can_create_proposals && (
          <Button onClick={openNew} className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover-lift">
            <Plus className="h-4 w-4" /> Nova Proposta
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30 rounded-xl transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background/50 border-muted-foreground/20 hover:border-primary/30 transition-all font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <MonthYearFilter
                month={filterMonth}
                year={filterYear}
                onMonthChange={setFilterMonth}
                onYearChange={setFilterYear}
                years={availableYears}
              />

              <Select value={designerFilter} onValueChange={setDesignerFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background/50 border-muted-foreground/20 hover:border-primary/30 transition-all font-medium">
                  <SelectValue placeholder="Projetista" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                  <SelectItem value="all">Todos os projetistas</SelectItem>
                  {Object.entries(PROJECT_DESIGNER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "nome" | "data")}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl bg-background/50 border-muted-foreground/20 hover:border-primary/30 transition-all font-medium">
                  <ArrowUpDown className="h-4 w-4 mr-2 opacity-50" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                  <SelectItem value="data">Mais Recentes</SelectItem>
                  <SelectItem value="nome">Ordem Alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <DollarSign className="h-32 w-32 -mr-8 -mt-8" />
          </div>
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <span className="text-xl font-bold font-heading">{filteredForSum.length}</span>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Volume Total em Propostas</p>
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

      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-muted-foreground/10">
                  <TableHead className="py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">Produtor</TableHead>
                  <TableHead className="hidden md:table-cell py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">CPF</TableHead>
                  <TableHead className="py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">Linha</TableHead>
                  <TableHead className="py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">Projetista</TableHead>
                  <TableHead className="py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70 text-right">Valor</TableHead>
                  <TableHead className="py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70 text-center">Status</TableHead>
                  <TableHead className="hidden lg:table-cell py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70">Data</TableHead>
                  {(permissions.can_edit_proposals || permissions.can_delete_proposals) && (
                    <TableHead className="w-24 py-4 text-[11px] font-black uppercase tracking-wider text-muted-foreground/70 text-right">Ações</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {proposals.length === 0 ? "Nenhuma proposta cadastrada." : "Nenhuma proposta encontrada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((p) => (
                    <TableRow key={p.id} className="group hover:bg-muted/20 transition-all border-b border-muted-foreground/5 last:border-0">
                      <TableCell className="py-4">
                        <p className="font-bold text-sm tracking-tight text-foreground/90 group-hover:text-primary transition-colors">{p.producer_name}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4">
                        <span className="text-xs font-mono text-muted-foreground/60">{p.producer_cpf}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 px-2 border-primary/10 bg-primary/[0.02] text-muted-foreground whitespace-nowrap">
                          {PRONAF_LINE_LABELS[p.pronaf_line as PronafLine] || p.pronaf_line}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-xs font-medium text-muted-foreground">{PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || p.project_designer || "-"}</span>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-black text-sm text-primary tracking-tighter">{formatCurrency(Number(p.requested_value))}</span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className={`${STATUS_COLORS[p.status as ProposalStatus] || ''} text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border-0 shadow-sm whitespace-nowrap`}>
                          {STATUS_LABELS[p.status as ProposalStatus] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-4">
                        <span className="text-xs font-medium text-muted-foreground/70">{format(parseISO(p.entry_date), "dd/MM/yyyy")}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          {permissions.can_edit_proposals && (
                            <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          )}
                          {permissions.can_delete_proposals && (
                            <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => {
                              setDeleteId(p.id);
                              setIsDeleteAlertOpen(true);
                            }}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t bg-gradient-to-r from-muted/20 to-transparent">
              <p className="text-sm text-muted-foreground font-medium">
                <span className="font-semibold text-foreground">{filtered.length}</span> propostas • Página <span className="font-semibold text-foreground">{page + 1}</span> de <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 hover-lift" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 hover-lift" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editingId ? "Editar Proposta" : "Nova Proposta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1">Dados do Produtor</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome do Produtor *</Label>
                  <Input value={formData.producer_name} onChange={(e) => setFormData((f) => ({ ...f, producer_name: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div className="space-y-2">
                  <Label>CPF *</Label>
                  <Input value={formData.producer_cpf} onChange={(e) => setFormData((f) => ({ ...f, producer_cpf: e.target.value }))} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>SICAD</Label>
                  <Input value={formData.sicad} onChange={(e) => setFormData((f) => ({ ...f, sicad: e.target.value }))} placeholder="Número SICAD" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={formData.producer_address} onChange={(e) => setFormData((f) => ({ ...f, producer_address: e.target.value }))} placeholder="Endereço da propriedade" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1">Detalhes da Operação</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Número da Proposta</Label>
                  <Input value={formData.proposal_number} onChange={(e) => setFormData((f) => ({ ...f, proposal_number: e.target.value }))} placeholder="000.000.000" />
                </div>
                <div className="space-y-2">
                  <Label>Programa</Label>
                  <Input value={formData.credit_program} onChange={(e) => setFormData((f) => ({ ...f, credit_program: e.target.value }))} placeholder="Ex: FNE/PRONAF A" />
                </div>
                <div className="space-y-2">
                  <Label>Linha PRONAF</Label>
                  <Select value={formData.pronaf_line} onValueChange={(v) => setFormData((f) => ({ ...f, pronaf_line: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRONAF_LINE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input value={formData.category} onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))} placeholder="Ex: VAREJO RURAL" />
                </div>
                <div className="space-y-2">
                  <Label>Finalidade do Crédito</Label>
                  <Input value={formData.credit_purpose} onChange={(e) => setFormData((f) => ({ ...f, credit_purpose: e.target.value }))} placeholder="Ex: INVESTIMENTO" />
                </div>
                <div className="space-y-2">
                  <Label>Aplicação de Recurso</Label>
                  <Input value={formData.resource_application} onChange={(e) => setFormData((f) => ({ ...f, resource_application: e.target.value }))} placeholder="Ex: AQUIS. ISOL. M" />
                </div>
                <div className="space-y-2">
                  <Label>Valor Solicitado</Label>
                  <CurrencyInput value={formData.requested_value} onChange={(v) => setFormData((f) => ({ ...f, requested_value: v }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tratamento Especial</Label>
                  <Input value={formData.special_treatment} onChange={(e) => setFormData((f) => ({ ...f, special_treatment: e.target.value }))} placeholder="Ex: SEM TRATAMENTO" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-1">Gestão e Prazos</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Agência</Label>
                  <Input value={formData.agency_name} onChange={(e) => setFormData((f) => ({ ...f, agency_name: e.target.value }))} placeholder="Nome da agência" />
                </div>
                <div className="space-y-2">
                  <Label>Analista responsável</Label>
                  <Input value={formData.last_analyst} onChange={(e) => setFormData((f) => ({ ...f, last_analyst: e.target.value }))} placeholder="F123456" />
                </div>
                <div className="space-y-2">
                  <Label>Dono (Owner)</Label>
                  <Input value={formData.owner} onChange={(e) => setFormData((f) => ({ ...f, owner: e.target.value }))} placeholder="F123456" />
                </div>
                <div className="space-y-2">
                  <Label>Tarefa Atual</Label>
                  <Input value={formData.task} onChange={(e) => setFormData((f) => ({ ...f, task: e.target.value }))} placeholder="Ex: Resolver Ocorrência" />
                </div>
                <div className="space-y-2">
                  <Label>Projetista</Label>
                  <Select value={formData.project_designer} onValueChange={(v) => setFormData((f) => ({ ...f, project_designer: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_DESIGNER_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Entrada</Label>
                  <Input type="date" value={formData.entry_date} onChange={(e) => setFormData((f) => ({ ...f, entry_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Data Central</Label>
                  <Input value={formData.central_date} onChange={(e) => setFormData((f) => ({ ...f, central_date: e.target.value }))} placeholder="Ex: 16/12/2025" />
                </div>
                <div className="space-y-2">
                  <Label>Início Atividade</Label>
                  <Input value={formData.activity_start_date} onChange={(e) => setFormData((f) => ({ ...f, activity_start_date: e.target.value }))} placeholder="Ex: 30/12/2025" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado Atual</Label>
                  <Input value={formData.current_state} onChange={(e) => setFormData((f) => ({ ...f, current_state: e.target.value }))} placeholder="Ex: Em execução" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} placeholder="Observações adicionais..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar Alterações" : "Cadastrar Proposta"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente a proposta e todos os documentos vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </div >
  );
}
