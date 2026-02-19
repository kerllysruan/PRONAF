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
import { usePermissions } from "@/hooks/usePermissions";

import { DisbursementCharts } from "@/components/dashboard/DisbursementCharts";
import { PROJECT_DESIGNER_LABELS } from "@/types/proposal";

export default function Disbursements() {
  const { disbursements, loading: loadingD, createDisbursement, updateDisbursement, deleteDisbursement } = useDisbursements();
  const { proposals, loading: loadingP, updateProposal } = useProposals();
  const { members, loading: loadingM } = useTeam();
  const { permissions } = usePermissions();
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
      <div className="space-y-6 animate-fade-in max-w-[1200px] mx-auto pb-10">
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-premium">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedId(null)}
              className="rounded-xl hover:bg-primary/10 text-primary"
            >
              <ArrowUpRight className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-xl font-extrabold font-heading text-foreground">Detalhes do Desembolso</h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{selectedDisbursement.id.split('-')[0]}</p>
            </div>
          </div>

          <Badge className={`${DISBURSEMENT_STATUS_COLORS[selectedDisbursement.status as DisbursementStatus]} text-xs font-bold px-4 py-1 rounded-full border-0 shadow-lg shadow-primary/10`}>
            {DISBURSEMENT_STATUS_LABELS[selectedDisbursement.status as DisbursementStatus]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white group hover:shadow-premium-hover transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Valor Liberado</p>
              </div>
              <p className="text-3xl font-black font-heading text-primary tracking-tight">
                {formatCurrency(Number(selectedDisbursement.amount))}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white group hover:shadow-premium-hover transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Produtor</p>
              </div>
              <p className="text-xl font-extrabold font-heading text-foreground leading-tight truncate">
                {proposal?.producer_name || "—"}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{proposal?.producer_cpf || ""}</p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white group hover:shadow-premium-hover transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Data Pedido</p>
              </div>
              <p className="text-2xl font-extrabold font-heading text-foreground">
                {format(parseISO(selectedDisbursement.request_date), "dd/MM/yyyy")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/40 backdrop-blur-md">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" /> Informações Detalhadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Previsão</p>
                  <p className="text-sm font-bold text-foreground">{selectedDisbursement.expected_date ? format(parseISO(selectedDisbursement.expected_date), "dd/MM/yyyy") : "Não definida"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Data Efetiva</p>
                  <p className="text-sm font-bold text-foreground font-mono">{selectedDisbursement.disbursed_date ? format(parseISO(selectedDisbursement.disbursed_date), "dd/MM/yyyy") : "Em espera"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Solicitado por</p>
                  <div className="flex items-center gap-2 mt-1">
                    {member ? (
                      <>
                        <Avatar className="h-6 w-6 border border-primary/20">
                          <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: member.color, color: "white" }}>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-foreground">{member.name}</span>
                      </>
                    ) : <span className="text-sm font-bold text-muted-foreground">Suporte</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Banco / Ag / Conta</p>
                  <p className="text-sm font-bold text-foreground">{selectedDisbursement.bank_name || "—"} / {selectedDisbursement.agency || "—"} / {selectedDisbursement.account || "—"}</p>
                </div>
              </div>

              {selectedDisbursement.notes && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Observações Técnicas</p>
                  <p className="text-sm text-foreground italic leading-relaxed">{selectedDisbursement.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border/40 flex flex-wrap gap-3">
                <Select
                  value={selectedDisbursement.status}
                  onValueChange={(v) => updateDisbursement(selectedDisbursement.id, { status: v })}
                  disabled={!permissions.can_manage_disbursements}
                >
                  <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-premium">
                    {Object.entries(DISBURSEMENT_STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {permissions.can_manage_disbursements && (
                  <Button
                    variant="destructive"
                    className="rounded-xl font-bold h-11 px-6 shadow-lg shadow-destructive/10"
                    onClick={() => {
                      setDeleteId(selectedDisbursement.id);
                      setIsDeleteAlertOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir Registro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/40 backdrop-blur-md">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Histórico de Desembolsos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {proposal ? (
                    <>
                      {disbursements
                        .filter(d => d.proposal_id === proposal.id && d.id !== selectedDisbursement.id)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(other => (
                          <div
                            key={other.id}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedId(other.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${DISBURSEMENT_STATUS_COLORS[other.status as DisbursementStatus]} bg-opacity-10`}>
                                <DollarSign className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-foreground">{formatCurrency(other.amount)}</p>
                                <p className="text-[10px] font-bold text-muted-foreground">{format(parseISO(other.request_date), "dd/MM/yyyy")}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="group-hover:bg-primary/10 group-hover:text-primary rounded-lg transition-colors">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                      {disbursements.filter(d => d.proposal_id === proposal.id && d.id !== selectedDisbursement.id).length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic">Apenas este desembolso registrado</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center py-12 text-xs text-muted-foreground italic">Propriedades da proposta não disponíveis</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Desembolsos</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Gestão de fluxos financeiros e liberações
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {permissions.can_manage_disbursements && (
            <Button
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
              className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold text-xs px-5 h-11"
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Pedido
            </Button>
          )}
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { icon: FileText, label: "Total Pedidos", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: Clock, label: "Pendentes", value: stats.pendentes, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: CheckCircle2, label: "Aprovados", value: stats.aprovados, color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: ArrowUpRight, label: "Liberados", value: stats.liberados, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: XCircle, label: "Negados", value: stats.negados, color: "text-rose-600", bg: "bg-rose-50" },
          { icon: DollarSign, label: "Total Liberado", value: formatCurrency(stats.valorLiberado), color: "text-primary", bg: "bg-primary/10", isLarge: true },
        ].map((item, idx) => (
          <Card key={idx} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <item.icon className="h-5 w-5" />
                </div>
                {item.isLarge && <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Acumulado</div>}
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</p>
                <h3 className={`font-heading font-extrabold tracking-tight ${item.isLarge ? 'text-xl' : 'text-2xl'} text-foreground`}>
                  {item.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <DisbursementCharts disbursements={filtered} proposals={proposals} />

      {/* Progress */}
      {stats.total > 0 && (
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-foreground">Taxa de Liberação</h3>
                <p className="text-xs text-muted-foreground font-medium">Percentual de recursos efetivamente entregues aos produtores</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-primary">
                  {stats.total > 0 ? Math.round((stats.liberados / stats.total) * 100) : 0}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Concluído</span>
              </div>
            </div>
            <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-lg shadow-primary/20"
                style={{ width: `${stats.total > 0 ? (stats.liberados / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-card/40 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-premium flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-56 h-11 rounded-xl border-border/40 bg-background/50">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-premium">
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(DISBURSEMENT_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={designerFilter} onValueChange={setDesignerFilter}>
              <SelectTrigger className="w-full md:w-56 h-11 rounded-xl border-border/40 bg-background/50">
                <SelectValue placeholder="Projetista" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-premium">
                <SelectItem value="all">Todos os Projetistas</SelectItem>
                {Object.entries(PROJECT_DESIGNER_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-full md:w-auto">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">Resultados:</span>
          <span className="text-sm font-black text-primary">{filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/40 bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Produtor</TableHead>
                  <TableHead className="hidden sm:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Vlr Proposta</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest text-indigo-600 h-12 font-bold">Acumulado</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Pedido Atual</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Status</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Projetista</TableHead>
                  <TableHead className="hidden lg:table-cell w-32 text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Progresso</TableHead>
                  <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12">Data</TableHead>
                  <TableHead className="w-24 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground h-12 px-6">Ações</TableHead>
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
                      <TableRow
                        key={d.id}
                        className="group border-b border-border/40 hover:bg-primary/5 cursor-pointer transition-colors"
                        onClick={() => setSelectedId(d.id)}
                      >
                        <TableCell className="px-6 py-4">
                          <p className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">{proposal?.producer_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{proposal?.producer_cpf || ""}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-4">
                          <span className="text-xs font-bold text-muted-foreground/60">{formatCurrency(Number(proposal?.requested_value || 0))}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-4">
                          <span className="text-xs font-black text-indigo-600">{formatCurrency(getProposalStats(d.proposal_id || "", Number(proposal?.requested_value || 0)).used)}</span>
                        </TableCell>
                        <TableCell className="py-4 font-black text-sm text-primary">{formatCurrency(Number(d.amount))}</TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${DISBURSEMENT_STATUS_COLORS[d.status as DisbursementStatus]} text-[9px] font-bold h-5 px-2 rounded-lg border-0 shadow-sm`}>
                            {DISBURSEMENT_STATUS_LABELS[d.status as DisbursementStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-4">
                          {proposal?.project_designer ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-primary/20">
                                <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">{getInitials(PROJECT_DESIGNER_LABELS[proposal.project_designer])}</AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-bold text-muted-foreground">{PROJECT_DESIGNER_LABELS[proposal.project_designer]}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-4">
                          {proposal && d.status !== 'pendente' && (
                            <div className="w-full max-w-[100px]">
                              {Number(proposal.requested_value) > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                    <span>{Math.min(100, Math.round((getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100))}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${Math.min(100, (getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-destructive italic">Valor n/d</span>
                              )}
                            </div>
                          )}
                          {d.status === 'pendente' && (
                            <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest italic">Pendente</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-[11px] font-bold text-muted-foreground/60 py-4">
                          {format(parseISO(d.request_date), "dd/MM/yy")}
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.status === 'pendente' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10 rounded-xl"
                                onClick={(e) => { e.stopPropagation(); openEdit(d); }}
                                title="Iniciar Desembolso"
                                disabled={!permissions.can_manage_disbursements}
                              >
                                <Play className="h-4 w-4 fill-current" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-xl" onClick={(e) => { e.stopPropagation(); setSelectedId(d.id); }}>
                                <Eye className="h-4 w-4 text-primary" />
                              </Button>
                            )}

                            {permissions.can_manage_disbursements && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl" onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(d.id);
                                setIsDeleteAlertOpen(true);
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-background font-sans">
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <DollarSign className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold font-heading flex items-center gap-2">
                {editingId ? `Iniciar Desembolso` : "Novo Pedido de Desembolso"}
              </DialogTitle>
              <p className="text-primary-foreground/80 text-sm">
                {!editingId
                  ? "Selecione uma proposta elegível e informe os dados bancários."
                  : `Processando liberação para ${selectedProp?.producer_name || ""}`}
              </p>
            </DialogHeader>
          </div>

          <div className="p-8 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-8">
              {/* Seleção de Proposta ou Resumo */}
              {(!selectedProposal || (!isProposalLocked && !editingId)) ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Buscar Proposta por Nome ou CPF</Label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Identifique o produtor..."
                        value={proposalSearch}
                        onChange={(e) => setProposalSearch(e.target.value)}
                        className="pl-11 h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {signedContractProposals.length} propostas elegíveis
                    </Label>
                    <ScrollArea className="h-64 rounded-2xl border border-border/40 bg-muted/10 p-2">
                      <div className="space-y-2">
                        {signedContractProposals.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-sm text-muted-foreground font-medium italic">Nenhuma proposta encontrada</p>
                          </div>
                        ) : (
                          signedContractProposals.map((p) => {
                            const stats = getProposalStats(p.id, Number(p.requested_value));
                            const progress = (stats.used / Number(p.requested_value)) * 100;
                            return (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setSelectedProposal(p.id);
                                  const existing = disbursements.filter(d => d.proposal_id === p.id);
                                  const lastD = existing.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                                  const hasHistory = existing.length > 0;
                                  setDisbursementType(hasHistory ? 'parcial' : 'total');
                                  setFormData(f => ({
                                    ...f,
                                    proposal_id: p.id,
                                    amount: String(stats.remaining),
                                    disbursement_type: hasHistory ? 'parcial' : 'total',
                                    bank_name: lastD?.bank_name || "",
                                    agency: lastD?.agency || "",
                                    account: lastD?.account || "",
                                  }));
                                }}
                                className={`p-4 rounded-xl border transition-all cursor-pointer group ${selectedProposal === p.id
                                  ? 'bg-primary/10 border-primary shadow-sm'
                                  : 'bg-white border-border/40 hover:border-primary/40 hover:bg-primary/5'
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.producer_name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] font-mono text-muted-foreground">{p.producer_cpf}</span>
                                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Saldo: {formatCurrency(stats.remaining)}</span>
                                    </div>
                                  </div>
                                  {selectedProposal === p.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                selectedProp && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shadow-lg shadow-primary/20">
                          {getInitials(selectedProp.producer_name)}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground leading-none">{selectedProp.producer_name}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-widest">{selectedProp.producer_cpf}</p>
                        </div>
                      </div>
                      {!editingId && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedProposal(null); setIsProposalLocked(false); }} className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg h-8">
                          Trocar Proposta
                        </Button>
                      )}
                    </div>

                    {(() => {
                      const stats = getProposalStats(selectedProp.id, Number(selectedProp.requested_value));
                      return (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white border border-border/40 shadow-sm transition-all hover:shadow-md">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Restante</p>
                            <p className="text-xl font-black text-primary font-heading tracking-tight">{formatCurrency(stats.remaining)}</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-border/40 shadow-sm transition-all hover:shadow-md">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Proposta</p>
                            <p className="text-xl font-black text-foreground font-heading tracking-tight">{formatCurrency(Number(selectedProp.requested_value))}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )
              )}

              {selectedProposal && (
                <div className="space-y-8 animate-fade-in pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Liberação</Label>
                      <Select
                        value={disbursementType}
                        onValueChange={(v: 'total' | 'parcial') => {
                          setDisbursementType(v);
                          const p = signedContractProposals.find(p => p.id === selectedProposal);
                          if (p) {
                            const s = getProposalStats(p.id, Number(p.requested_value));
                            setFormData(f => ({ ...f, disbursement_type: v, amount: v === 'total' ? s.remaining.toFixed(2) : f.amount }));
                          }
                        }}
                        disabled={disbursements.some(d => d.proposal_id === selectedProposal && !editingId)}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-border/40 bg-white font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          <SelectItem value="total" className="rounded-lg">Liberação Total</SelectItem>
                          <SelectItem value="parcial" className="rounded-lg">Liberação Parcial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor do Pedido (R$)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <Input
                          value={formatCurrencyInput(formData.amount || '0')}
                          onChange={(e) => {
                            if (disbursementType === 'parcial') {
                              const val = e.target.value.replace(/\D/g, '');
                              setFormData(f => ({ ...f, amount: (Number(val) / 100).toFixed(2) }));
                            }
                          }}
                          className={`pl-11 h-12 rounded-xl border-border/40 font-black text-lg font-heading ${disbursementType === 'total' ? 'bg-muted/30 text-muted-foreground' : 'bg-white text-primary'}`}
                          disabled={disbursementType === 'total'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Banco</Label>
                      <Input value={formData.bank_name} onChange={e => setFormData(f => ({ ...f, bank_name: e.target.value }))} className="h-11 rounded-xl border-border/40" placeholder="Ex: BB" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Agência</Label>
                      <Input value={formData.agency} onChange={e => setFormData(f => ({ ...f, agency: e.target.value }))} className="h-11 rounded-xl border-border/40" placeholder="0000-0" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conta Corrente</Label>
                      <Input value={formData.account} onChange={e => setFormData(f => ({ ...f, account: e.target.value }))} className="h-11 rounded-xl border-border/40" placeholder="00.000-0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data do Pedido</Label>
                      <Input type="date" value={formData.request_date} onChange={e => setFormData(f => ({ ...f, request_date: e.target.value }))} className="h-11 rounded-xl border-border/40" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Solicitante</Label>
                      <Select value={formData.requested_by || ""} onValueChange={v => setFormData(f => ({ ...f, requested_by: v || null }))}>
                        <SelectTrigger className="h-11 rounded-xl border-border/40"><SelectValue placeholder="Responsável" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          {members.map(m => (
                            <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações Operacionais</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                      className="rounded-2xl border-border/40 bg-white min-h-[100px] resize-none focus:ring-primary/20"
                      placeholder="Descreva observações relevantes para o processo de liberação..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t border-border/40 gap-3">
            <Button
              variant="outline"
              onClick={() => { setIsDialogOpen(false); resetForm(); }}
              className="h-12 px-8 rounded-xl font-bold border-border/40 hover:bg-background/80 transition-all text-xs uppercase tracking-widest"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProposal || !formData.amount}
              className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-extrabold text-xs uppercase tracking-widest"
            >
              {editingId ? "Finalizar Solicitação" : "Criar Pedido de Desembolso"}
            </Button>
          </DialogFooter>
        </DialogContent >
      </Dialog >

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
