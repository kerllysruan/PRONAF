import { useState, useMemo, useCallback } from "react";
import {
  Plus, DollarSign, Loader2, Trash2, Eye, ArrowUpRight,
  CheckCircle2, Clock, XCircle, FileText, Filter, Search, Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useDisbursements,
  DISBURSEMENT_STATUS_LABELS,
  DISBURSEMENT_STATUS_COLORS,
  type DisbursementStatus,
} from "@/hooks/useDisbursements";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { DisbursementCharts } from "@/components/dashboard/DisbursementCharts";
import { PROJECT_DESIGNER_LABELS } from "@/types/proposal";

export default function Disbursements() {
  const { disbursements, loading: loadingD, createDisbursement, updateDisbursement, deleteDisbursement } = useDisbursements();
  const { proposals, loading: loadingP, updateProposal } = useProposals();
  const { members, loading: loadingM } = useTeam();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [designerFilter, setDesignerFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposalSearch, setProposalSearch] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProposalLocked, setIsProposalLocked] = useState(false);

  const [disbursementType, setDisbursementType] = useState<'total' | 'parcial'>('total');

  const [formData, setFormData] = useState({
    proposal_id: null as string | null,
    requested_by: null as string | null,
    amount: "",
    disbursement_type: "total" as "total" | "parcial",
    status: "pendente",
    request_date: new Date().toISOString().split("T")[0],
    expected_date: null as string | null,
    disbursed_date: null as string | null,
    bank_name: "",
    agency: "",
    account: "",
    notes: "",
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const amount = Number(numbers) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  const getMemberById = (id?: string | null) => members.find((m) => m.id === id);
  const getProposalById = (id?: string | null) => proposals.find((p) => p.id === id);

  const stats = useMemo(() => {
    const total = disbursements.length;
    const pendentes = disbursements.filter((d) => d.status === "pendente").length;
    const aprovados = disbursements.filter((d) => d.status === "aprovado").length;
    const liberados = disbursements.filter((d) => d.status === "liberado").length;
    const negados = disbursements.filter((d) => d.status === "negado").length;
    const valorTotal = disbursements.reduce((s, d) => s + Number(d.amount), 0);
    const valorLiberado = disbursements.filter((d) => d.status === "liberado").reduce((s, d) => s + Number(d.amount), 0);
    return { total, pendentes, aprovados, liberados, negados, valorTotal, valorLiberado };
  }, [disbursements]);

  const filtered = useMemo(() =>
    disbursements.filter((d) => {
      const proposal = proposals.find(p => p.id === d.proposal_id);
      const designer = proposal?.project_designer;

      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesDesigner = designerFilter === "all" || designer === designerFilter;

      return matchesStatus && matchesDesigner;
    }),
    [disbursements, statusFilter, designerFilter, proposals]);

  /* -------------------------------------------------------------------------- */
  /*                             FUNÇÕES AUXILIARES                             */
  /* -------------------------------------------------------------------------- */

  const getProposalStats = useCallback((proposalId: string, totalValue: number) => {
    const proposalDisbursements = disbursements.filter(
      d => d.proposal_id === proposalId && d.status !== 'negado' && d.status !== 'pendente'
    );
    const used = proposalDisbursements.reduce((acc, d) => acc + Number(d.amount), 0);
    const remaining = Math.max(0, totalValue - used);

    const last = proposalDisbursements.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return { used, remaining, last, count: proposalDisbursements.length };
  }, [disbursements]);

  // Propostas elegíveis para desembolso (aprovada, desembolso, contrato_liberado - exclui 100% quitadas)
  const signedContractProposals = useMemo(() => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const searchRaw = proposalSearch.trim();

    const eligibleStatuses = ['aprovada', 'desembolso', 'contrato_liberado', 'desembolso_solicitado'];

    const baseFilter = (p: any) => {
      if (!eligibleStatuses.includes(p.status)) return false;
      // Excluir propostas 100% quitadas
      const pStats = getProposalStats(p.id, Number(p.requested_value));
      if (pStats.remaining <= 0) return false;
      return true;
    };

    if (!searchRaw) return proposals.filter(baseFilter).sort((a, b) => a.producer_name.localeCompare(b.producer_name));

    const search = normalize(searchRaw);
    const searchNums = searchRaw.replace(/\D/g, '');

    return proposals
      .filter(baseFilter)
      .filter((p) => {
        const name = normalize(p.producer_name);
        const cpf = p.producer_cpf.replace(/\D/g, '');

        const nameMatch = name.includes(search);
        const cpfMatch = searchNums.length > 0 && cpf.includes(searchNums);

        return nameMatch || cpfMatch;
      })
      .sort((a, b) => a.producer_name.localeCompare(b.producer_name));
  }, [proposals, proposalSearch, getProposalStats]);

  const selectedProp = useMemo(() =>
    proposals.find(p => p.id === selectedProposal),
    [proposals, selectedProposal]
  );



  const selectedDisbursement = selectedId ? disbursements.find((d) => d.id === selectedId) : null;

  const handleSave = async () => {
    if (!formData.amount || !formData.proposal_id) return;

    const amount = Number(formData.amount);

    // Validação de segurança
    const selectedProp = signedContractProposals.find(p => p.id === selectedProposal);
    if (selectedProp) {
      const stats = getProposalStats(selectedProp.id, Number(selectedProp.requested_value));

      // Se for total ou parcial, não pode exceder o restante
      // (No caso de total, o valor já vem do restante, mas é bom validar com margem de segurança float)
      if (amount > stats.remaining + 0.05) { // margem de erro float (5 centavos para garantir)
        toast({
          title: "Valor Excedente",
          description: `O valor não pode exceder o saldo restante da proposta (${formatCurrency(stats.remaining)})`,
          variant: "destructive",
        });
        return;
      }
    }

    if (editingId) {
      // Se estiver iniciando um desembolso pendente, muda status para aprovado
      const newStatus = formData.status === 'pendente' ? 'aprovado' : formData.status;

      await updateDisbursement(editingId, {
        ...formData,
        amount: amount,
        disbursement_type: disbursementType,
        status: newStatus,
      } as any);
    } else {
      // Se já houver desembolsos anteriores, o novo pedido entra automaticamente como 'aprovado' (Solicitado)
      const existing = disbursements.filter(d => d.proposal_id === formData.proposal_id);
      const initialStatus = existing.length > 0 ? 'aprovado' : 'pendente';

      await createDisbursement({
        ...formData,
        amount: amount,
        disbursement_type: disbursementType,
        status: initialStatus,
      } as any);
    }

    // Automação: Mudar status da proposta para 'desembolso_solicitado' se ainda não estiver em um estágio avançado
    if (selectedProp &&
      selectedProp.status !== 'desembolso_solicitado' &&
      selectedProp.status !== 'liberado' &&
      selectedProp.status !== 'concluida') {
      await updateProposal(selectedProp.id, { status: 'desembolso_solicitado' } as any);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      proposal_id: null, requested_by: null, amount: "", status: "pendente",
      disbursement_type: "total",
      request_date: new Date().toISOString().split("T")[0],
      disbursed_date: null, notes: "",
    });
    setProposalSearch("");
    setSelectedProposal(null);
    setIsProposalLocked(false);
    setDisbursementType('total');
    setEditingId(null);
  };

  const openEdit = (d: any) => {
    const proposal = proposals.find(p => p.id === d.proposal_id);
    if (!proposal) return;

    setEditingId(d.id);
    setSelectedProposal(d.proposal_id);
    setDisbursementType(d.disbursement_type as 'total' | 'parcial');
    setFormData({
      proposal_id: d.proposal_id,
      requested_by: d.requested_by,
      amount: Number(d.amount).toFixed(2),
      disbursement_type: d.disbursement_type,
      status: d.status,
      request_date: d.request_date.split("T")[0],
      disbursed_date: d.disbursed_date ? d.disbursed_date.split("T")[0] : null,
      notes: d.notes || "",
    });
    setIsDialogOpen(true);
  };

  if (loadingD || loadingP || loadingM) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Detail view
  if (selectedDisbursement) {
    const proposal = getProposalById(selectedDisbursement.proposal_id);
    const member = getMemberById(selectedDisbursement.requested_by);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Voltar</Button>
          <h1 className="text-2xl font-bold font-heading">Detalhes do Desembolso</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold font-heading mt-1">{formatCurrency(Number(selectedDisbursement.amount))}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={`${DISBURSEMENT_STATUS_COLORS[selectedDisbursement.status as DisbursementStatus]} mt-1`}>
                {DISBURSEMENT_STATUS_LABELS[selectedDisbursement.status as DisbursementStatus]}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Produtor</p>
              <p className="text-sm font-semibold mt-1">{proposal?.producer_name || "—"}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-sm font-heading">Informações Completas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Data do Pedido</p>
                <p className="text-sm font-medium">{format(parseISO(selectedDisbursement.request_date), "dd/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Previsão</p>
                <p className="text-sm font-medium">{selectedDisbursement.expected_date ? format(parseISO(selectedDisbursement.expected_date), "dd/MM/yyyy") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data Liberação</p>
                <p className="text-sm font-medium">{selectedDisbursement.disbursed_date ? format(parseISO(selectedDisbursement.disbursed_date), "dd/MM/yyyy") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Solicitado por</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {member ? (
                    <>
                      <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]" style={{ backgroundColor: member.color, color: "white" }}>{getInitials(member.name)}</AvatarFallback></Avatar>
                      <span className="text-sm font-medium">{member.name}</span>
                    </>
                  ) : <span className="text-sm">—</span>}
                </div>
              </div>
            </div>

            {selectedDisbursement.notes && (
              <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm mt-1">{selectedDisbursement.notes}</p></div>
            )}

            {/* Histórico de outros desembolsos da mesma proposta */}
            {proposal && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Histórico desta Proposta
                </h4>
                <div className="space-y-2">
                  {disbursements
                    .filter(d => d.proposal_id === proposal.id && d.id !== selectedDisbursement.id)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(other => (
                      <div key={other.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-full ${DISBURSEMENT_STATUS_COLORS[other.status as DisbursementStatus]} bg-opacity-10 text-[10px]`}>
                            <Badge variant="outline" className={`${DISBURSEMENT_STATUS_COLORS[other.status as DisbursementStatus]} border-0 text-[10px] h-4 px-1 capitalize`}>{other.status}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{formatCurrency(other.amount)}</p>
                            <p className="text-[10px] text-muted-foreground">{format(parseISO(other.request_date), "dd/MM/yyyy")}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedId(other.id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {disbursements.filter(d => d.proposal_id === proposal.id && d.id !== selectedDisbursement.id).length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">Nenhum outro desembolso para esta proposta.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Select value={selectedDisbursement.status} onValueChange={(v) => updateDisbursement(selectedDisbursement.id, { status: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DISBURSEMENT_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="destructive" size="sm" onClick={() => {
                setDeleteId(selectedDisbursement.id);
                setIsDeleteAlertOpen(true);
              }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Controle de Desembolso</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de pedidos e liberação de recursos</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" /> Novo Pedido
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: FileText, label: "Total Pedidos", value: stats.total, sub: "registrados" },
          { icon: Clock, label: "Pendentes", value: stats.pendentes, sub: "aguardando" },
          { icon: CheckCircle2, label: "Aprovados", value: stats.aprovados, sub: "para liberar" },
          { icon: ArrowUpRight, label: "Liberados", value: stats.liberados, sub: "concluídos" },
          { icon: XCircle, label: "Negados", value: stats.negados, sub: "recusados" },
          { icon: DollarSign, label: "Liberado", value: formatCurrency(stats.valorLiberado), sub: "total" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="h-4 w-4 text-primary" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              </div>
              <p className="text-lg font-bold font-heading">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <DisbursementCharts disbursements={filtered} proposals={proposals} />

      {/* Progress */}
      {stats.total > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold font-heading">Taxa de Liberação</h3>
              <span className="text-sm font-bold text-primary">
                {stats.total > 0 ? Math.round((stats.liberados / stats.total) * 100) : 0}%
              </span>
            </div>
            <Progress value={stats.total > 0 ? (stats.liberados / stats.total) * 100 : 0} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(DISBURSEMENT_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={designerFilter} onValueChange={setDesignerFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Projetista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetistas</SelectItem>
                {Object.entries(PROJECT_DESIGNER_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produtor</TableHead>
                  <TableHead className="hidden sm:table-cell">Vlr Proposta</TableHead>
                  <TableHead className="hidden md:table-cell text-indigo-600">Acumulado</TableHead>
                  <TableHead>Pedido Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Projetista</TableHead>
                  <TableHead className="hidden lg:table-cell w-32">Progresso</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido de desembolso encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => {
                    const proposal = getProposalById(d.proposal_id);
                    const member = getMemberById(d.requested_by);
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedId(d.id)}>
                        <TableCell>
                          <p className="font-semibold text-sm leading-tight">{proposal?.producer_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{proposal?.producer_cpf || ""}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium text-xs text-muted-foreground italic">
                          {formatCurrency(Number(proposal?.requested_value || 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-bold text-xs text-indigo-600">
                          {formatCurrency(getProposalStats(d.proposal_id || "", Number(proposal?.requested_value || 0)).used)}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-primary">{formatCurrency(Number(d.amount))}</TableCell>
                        <TableCell>
                          <Badge className={`${DISBURSEMENT_STATUS_COLORS[d.status as DisbursementStatus]} text-[10px] h-5 px-1.5`}>
                            {DISBURSEMENT_STATUS_LABELS[d.status as DisbursementStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {proposal?.project_designer ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5 bg-primary/10 text-primary">
                                <AvatarFallback className="text-[9px]">{getInitials(PROJECT_DESIGNER_LABELS[proposal.project_designer])}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{PROJECT_DESIGNER_LABELS[proposal.project_designer]}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {proposal && d.status !== 'pendente' && (
                            <div className="w-full max-w-[120px]">
                              {Number(proposal.requested_value) > 0 ? (
                                <>
                                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                                    <span>{Math.min(100, Math.round((getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100))}%</span>
                                  </div>
                                  <Progress value={Math.min(100, (getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100)} className="h-1.5" />
                                </>
                              ) : (
                                <span className="text-[10px] text-destructive italic">Valor não definido</span>
                              )}
                            </div>
                          )}
                          {d.status === 'pendente' && (
                            <span className="text-xs text-muted-foreground/50 italic">Não iniciado</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-[11px] font-mono">
                          {format(parseISO(d.request_date), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {d.status === 'pendente' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                                title="Iniciar Desembolso"
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedId(d.id); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Botão Plus para novo desembolso se houver saldo e não for pendente */}
                            {proposal && d.status !== 'pendente' && getProposalStats(proposal.id, Number(proposal.requested_value)).remaining > 0.05 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetForm();
                                  const pStats = getProposalStats(proposal.id, Number(proposal.requested_value));
                                  setSelectedProposal(proposal.id);
                                  setIsProposalLocked(true);

                                  const existingDisbursements = disbursements.filter(d => d.proposal_id === proposal.id);
                                  const hasHistory = existingDisbursements.length > 0;
                                  setDisbursementType(hasHistory ? 'parcial' : 'total');
                                  setFormData((f) => ({
                                    ...f,
                                    proposal_id: proposal.id,
                                    amount: pStats.remaining.toFixed(2),
                                    disbursement_type: hasHistory ? 'parcial' : 'total',
                                    bank_name: "",
                                    agency: "",
                                    account: ""
                                  }));
                                  setIsDialogOpen(true);
                                }}
                                title="Solicitar Novo Desembolso"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(d.id);
                              setIsDeleteAlertOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Disbursement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-primary" />
              {editingId
                ? `Iniciar Desembolso: ${selectedProp?.producer_name || ""}`
                : "Novo Pedido de Desembolso"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {!editingId
                ? "Selecione uma proposta com contrato assinado"
                : "Confirme os dados bancários e o valor para enviar a solicitação"}
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Seleção de Proposta ou Resumo (se editando ou clicado em +) */}
            {(!selectedProposal || (!isProposalLocked && !editingId)) ? (
              <>
                <div className="space-y-2">
                  <Label>Buscar Proposta por Nome ou CPF</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite o nome ou CPF do produtor..."
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                {/* Lista de Propostas */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {signedContractProposals.length} proposta(s) elegível(is) para desembolso
                  </Label>
                  <ScrollArea className="h-48 border rounded-md">
                    <div className="p-2 space-y-2">
                      {signedContractProposals.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-12">
                          {proposalSearch
                            ? "Nenhuma proposta encontrada"
                            : "Nenhuma proposta com contrato assinado"}
                        </div>
                      ) : (
                        signedContractProposals.map((p) => {
                          const stats = getProposalStats(p.id, Number(p.requested_value));
                          const progress = (stats.used / Number(p.requested_value)) * 100;

                          return (
                            <Card
                              key={p.id}
                              className={`cursor-pointer transition-all border-2 ${selectedProposal === p.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                                }`}
                              onClick={() => {
                                setSelectedProposal(p.id);

                                // Auto-fill bank details removed
                                const existingDisbursements = disbursements.filter(d => d.proposal_id === p.id);
                                const lastD = existingDisbursements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

                                const hasHistory = existingDisbursements.length > 0;
                                setDisbursementType(hasHistory ? 'parcial' : 'total');
                                setFormData((f) => ({
                                  ...f,
                                  proposal_id: p.id,
                                  amount: String(stats.remaining),
                                  disbursement_type: hasHistory ? 'parcial' : 'total',
                                  bank_name: lastD?.bank_name || "",
                                  agency: lastD?.agency || "",
                                  account: lastD?.account || "",
                                }));
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold text-sm">{p.producer_name}</p>
                                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                          CPF: {p.producer_cpf}
                                        </p>
                                        <p className="text-[10px] text-primary font-medium mt-1">
                                          Saldo para solicitar: {formatCurrency(stats.remaining)}
                                        </p>
                                      </div>
                                      {progress > 0 && <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50/50">Já solicitado {Math.round(progress)}%</Badge>}
                                    </div>
                                  </div>
                                  {selectedProposal === p.id && (
                                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-3" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              selectedProp && (
                <Card className="bg-muted/30 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {getInitials(selectedProp.producer_name)}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none">{selectedProp.producer_name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">CPF: {selectedProp.producer_cpf}</p>
                      </div>
                    </div>

                    {(() => {
                      const stats = getProposalStats(selectedProp.id, Number(selectedProp.requested_value));
                      const progress = (stats.used / Number(selectedProp.requested_value)) * 100;
                      return (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progresso do Desembolso</span>
                              <span className="font-bold">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-background rounded px-2 py-1.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Já Solicitado</p>
                              <p className="text-xs font-bold font-mono">{formatCurrency(stats.used)}</p>
                            </div>
                            <div className="bg-primary/5 rounded px-2 py-1.5 border border-primary/20">
                              <p className="text-[10px] text-primary/70 uppercase tracking-wider font-semibold">Restante</p>
                              <p className="text-xs font-bold text-primary font-mono">{formatCurrency(stats.remaining)}</p>
                            </div>
                            <div className="bg-background rounded px-2 py-1.5 border">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Proposta</p>
                              <p className="text-xs font-bold font-mono">{formatCurrency(Number(selectedProp.requested_value))}</p>
                            </div>
                          </div>

                          {/* Histórico Simplificado dentro do Diálogo */}
                          {disbursements.filter(d => d.proposal_id === selectedProp.id).length > (editingId ? 1 : 0) && (
                            <div className="pt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Desembolsos Anteriores</p>
                              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {disbursements
                                  .filter(d => d.proposal_id === selectedProp.id && d.id !== editingId)
                                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                  .map(prev => (
                                    <div key={prev.id} className="flex items-center justify-between p-2 rounded bg-background border text-xs">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`${DISBURSEMENT_STATUS_COLORS[prev.status as DisbursementStatus]} border-0 text-[9px] h-4 px-1`}>
                                          {DISBURSEMENT_STATUS_LABELS[prev.status as DisbursementStatus]}
                                        </Badge>
                                        <span className="font-semibold">{formatCurrency(prev.amount)}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">{format(parseISO(prev.request_date), "dd/MM/yyyy")}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {isProposalLocked && !editingId && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-primary h-7"
                          onClick={() => {
                            setIsProposalLocked(false);
                            setSelectedProposal(null);
                            setFormData(f => ({ ...f, proposal_id: null, amount: "" }));
                          }}
                        >
                          Trocar Proposta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            )}

            {/* Resto do Formulário - Aparece quando proposta selecionada */}
            {selectedProposal && (
              <>
                <Separator />
                <div className="space-y-4">
                  {/* Tipo de Desembolso */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tipo de Desembolso *</Label>
                    <Select
                      value={disbursementType}
                      onValueChange={(v: 'total' | 'parcial') => {
                        setDisbursementType(v);
                        const selectedProp = signedContractProposals.find(p => p.id === selectedProposal);
                        let remaining = 0;
                        if (selectedProp) {
                          const stats = getProposalStats(selectedProp.id, Number(selectedProp.requested_value));
                          remaining = stats.remaining;
                        }

                        setFormData((f) => ({
                          ...f,
                          disbursement_type: v,
                          // Se total, usa o SALDO RESTANTE
                          amount: v === 'total'
                            ? remaining.toFixed(2)
                            : f.amount
                        }));
                      }}
                    >
                      <SelectTrigger className="h-11" disabled={disbursements.some(d => d.proposal_id === selectedProposal)}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Desembolso Total</span>
                            <span className="text-xs text-muted-foreground">- Saldo restante</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="parcial">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Desembolso Parcial</span>
                            <span className="text-xs text-muted-foreground">- Valor personalizado</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Valor do Desembolso *</Label>
                      <Input
                        value={formatCurrencyInput(formData.amount || '0')}
                        onChange={(e) => {
                          if (disbursementType === 'parcial') {
                            const value = e.target.value.replace(/\D/g, '');
                            const floatValue = (Number(value) / 100).toFixed(2);
                            setFormData((f) => ({ ...f, amount: floatValue }));
                          }
                        }}
                        placeholder="R$ 0,00"
                        disabled={disbursementType === 'total'}
                        className={`h-11 font-mono ${disbursementType === 'total' ? 'bg-muted/50 font-bold' : ''}`}
                      />
                      {disbursementType === 'total' && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary" /> Saldo restante da proposta
                        </p>
                      )}
                      {disbursementType === 'parcial' && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Máximo disponível: <span className="font-bold">{formatCurrency(
                            getProposalStats(
                              selectedProposal!,
                              Number(proposals.find(p => p.id === selectedProposal)?.requested_value || 0)
                            ).remaining
                          )}</span>
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Solicitado por</Label>
                      <Select
                        value={formData.requested_by || ""}
                        onValueChange={(v) => setFormData((f) => ({ ...f, requested_by: v || null }))}
                      >
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>



                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Banco</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData((f) => ({ ...f, bank_name: e.target.value }))}
                        placeholder="Ex: Banco do Brasil"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Agência</Label>
                      <Input
                        value={formData.agency}
                        onChange={(e) => setFormData((f) => ({ ...f, agency: e.target.value }))}
                        placeholder="Ex: 1234-5"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Conta</Label>
                      <Input
                        value={formData.account}
                        onChange={(e) => setFormData((f) => ({ ...f, account: e.target.value }))}
                        placeholder="Ex: 12345-6"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Data do Pedido</Label>
                    <Input
                      type="date"
                      value={formData.request_date}
                      className="h-11"
                      onChange={(e) => setFormData((f) => ({ ...f, request_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Alguma observação importante sobre este desembolso?"
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-11 px-6">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProposal || !formData.amount}
              className="h-11 px-8 font-bold"
            >
              {editingId ? "Finalizar Solicitação" : "Criar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o pedido de desembolso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteDisbursement(deleteId);
                  setIsDeleteAlertOpen(false);
                  setDeleteId(null);
                  if (selectedId === deleteId) {
                    setSelectedId(null);
                  }
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
