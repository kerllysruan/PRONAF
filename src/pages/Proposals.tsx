import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
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

const PAGE_SIZE = 10;

export default function Proposals() {
  const { proposals, loading, createProposal, updateProposal, deleteProposal, refetch } = useProposals();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
      const d = parseISO(p.entry_date);
      const matchesMonth = filterMonth === "all" || getMonth(d) + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || getYear(d) === Number(filterYear);
      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });

    // Aplicar ordenamento
    if (sortBy === "nome") {
      result.sort((a, b) => a.producer_name.localeCompare(b.producer_name));
    } else if (sortBy === "data") {
      result.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
    }

    return result;
  }, [proposals, searchTerm, statusFilter, filterMonth, filterYear, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, filterMonth, filterYear, sortBy]);

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
      const d = parseISO(p.entry_date);
      const matchesMonth = filterMonth === "all" || getMonth(d) + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || getYear(d) === Number(filterYear);
      return matchesStatus && matchesMonth && matchesYear;
    });
  }, [proposals, statusFilter, filterMonth, filterYear]);

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
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.producer_name.trim() || !formData.producer_cpf.trim()) return;
    if (editingId) {
      await updateProposal(editingId, formData);
    } else {
      await createProposal(formData as any);
    }
    setIsDialogOpen(false);
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
        <Button onClick={openNew} className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover-lift">
          <Plus className="h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MonthYearFilter month={filterMonth} year={filterYear} onMonthChange={setFilterMonth} onYearChange={setFilterYear} years={availableYears} />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "nome" | "data")}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data">Mais Recentes</SelectItem>
                <SelectItem value="nome">Ordem Alfabética</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg md:col-span-3 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 dark:from-primary/10 dark:via-accent/10 dark:to-primary/20 hover-lift">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">{filteredForSum.length}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Filtrado</p>
                <p className="text-sm text-muted-foreground mt-0.5">{filteredForSum.length} {filteredForSum.length === 1 ? 'proposta' : 'propostas'}</p>
              </div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-heading">
              {formatCurrency(filteredForSum.reduce((acc, curr) => acc + Number(curr.requested_value || 0), 0))}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30">
                  <TableHead className="font-semibold">Produtor</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">CPF</TableHead>
                  <TableHead className="font-semibold">Linha</TableHead>
                  <TableHead className="font-semibold">Projetista</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="hidden lg:table-cell font-semibold">Data</TableHead>
                  <TableHead className="w-24 font-semibold">Ações</TableHead>
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
                    <TableRow key={p.id} className="hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all">
                      <TableCell className="font-semibold">{p.producer_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm font-mono">{p.producer_cpf}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {PRONAF_LINE_LABELS[p.pronaf_line as PronafLine] || p.pronaf_line}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{PROJECT_DESIGNER_LABELS[p.project_designer as ProjectDesigner] || p.project_designer || "-"}</TableCell>
                      <TableCell className="font-bold text-primary">{formatCurrency(Number(p.requested_value))}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[p.status as ProposalStatus] || ''} text-xs px-3 py-1 rounded-full`}>
                          {STATUS_LABELS[p.status as ProposalStatus] || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground font-medium">
                        {format(parseISO(p.entry_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => {
                            setDeleteId(p.id);
                            setIsDeleteAlertOpen(true);
                          }}><Trash2 className="h-4 w-4" /></Button>
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
          <div className="space-y-4">
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
                <Label>Data de Entrada</Label>
                <Input type="date" value={formData.entry_date} onChange={(e) => setFormData((f) => ({ ...f, entry_date: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={formData.producer_address} onChange={(e) => setFormData((f) => ({ ...f, producer_address: e.target.value }))} placeholder="Endereço da propriedade" />
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
                <Label>Valor Solicitado</Label>
                <CurrencyInput value={formData.requested_value} onChange={(v) => setFormData((f) => ({ ...f, requested_value: v }))} />
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
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} placeholder="Observações..." rows={3} />
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
    </div>
  );
}
