import { useState, useMemo } from "react";
import {
  Plus, DollarSign, Loader2, Trash2, Eye, ArrowUpRight,
  CheckCircle2, Clock, XCircle, FileText, Filter, Search,
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

  // Propostas com Contrato Assinado (status 'aprovada')
  const signedContractProposals = useMemo(() => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const searchRaw = proposalSearch.trim();

    if (!searchRaw) return proposals.filter((p) => p.status === "aprovada").sort((a, b) => a.producer_name.localeCompare(b.producer_name));

    const search = normalize(searchRaw);
    const searchNums = searchRaw.replace(/\D/g, '');

    return proposals
      .filter((p) => p.status === "aprovada")
      .filter((p) => {
        const name = normalize(p.producer_name);
        const cpf = p.producer_cpf.replace(/\D/g, '');

        const nameMatch = name.includes(search);
        const cpfMatch = searchNums.length > 0 && cpf.includes(searchNums);

        return nameMatch || cpfMatch;
      })
      .sort((a, b) => a.producer_name.localeCompare(b.producer_name));
  }, [proposals, proposalSearch]);

  const getProposalStats = (proposalId: string, totalValue: number) => {
    const proposalDisbursements = disbursements.filter(
      d => d.proposal_id === proposalId && d.status !== 'negado'
    );
    const used = proposalDisbursements.reduce((acc, d) => acc + Number(d.amount), 0);
    const remaining = Math.max(0, totalValue - used);

    const last = proposalDisbursements.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return { used, remaining, last, count: proposalDisbursements.length };
  };

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

    await createDisbursement({
      ...formData,
      amount: amount,
      disbursement_type: disbursementType,
    } as any);

    // Automação: Mudar status da proposta para 'desembolso' se ainda não estiver
    if (selectedProp && selectedProp.status !== 'desembolso' && selectedProp.status !== 'contrato_liberado' && selectedProp.status !== 'liberado' && selectedProp.status !== 'concluida') {
      await updateProposal(selectedProp.id, { status: 'desembolso' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      proposal_id: null, requested_by: null, amount: "", status: "pendente",
      disbursement_type: "total",
      request_date: new Date().toISOString().split("T")[0], expected_date: null,
      disbursed_date: null, bank_name: "", agency: "", account: "", notes: "",
    });
    setProposalSearch("");
    setSelectedProposal(null);
    setDisbursementType('total');
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
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground">Banco</p><p className="text-sm font-medium">{selectedDisbursement.bank_name || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Agência</p><p className="text-sm font-medium">{selectedDisbursement.agency || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Conta</p><p className="text-sm font-medium">{selectedDisbursement.account || "—"}</p></div>
            </div>
            {selectedDisbursement.notes && (
              <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm mt-1">{selectedDisbursement.notes}</p></div>
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Projetista</TableHead>
                  <TableHead className="hidden lg:table-cell w-32">Progresso</TableHead>
                  <TableHead className="hidden md:table-cell">Data Pedido</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
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
                          <p className="font-medium text-sm">{proposal?.producer_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{proposal?.producer_cpf || ""}</p>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">{formatCurrency(Number(d.amount))}</TableCell>
                        <TableCell>
                          <Badge className={`${DISBURSEMENT_STATUS_COLORS[d.status as DisbursementStatus]} text-xs`}>
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
                          {proposal && (
                            <div className="w-full max-w-[120px]">
                              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                <span>{Math.round((getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100)}%</span>
                              </div>
                              <Progress value={(getProposalStats(proposal.id, Number(proposal.requested_value)).used / Number(proposal.requested_value)) * 100} className="h-1.5" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {format(parseISO(d.request_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedId(d.id); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Novo Pedido de Desembolso</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione uma proposta com contrato assinado
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Campo de Pesquisa */}
            <div>
              <Label>Buscar Proposta por Nome ou CPF</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou CPF do produtor..."
                  value={proposalSearch}
                  onChange={(e) => setProposalSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Lista de Propostas */}
            <div>
              <Label className="text-xs text-muted-foreground">
                {signedContractProposals.length} proposta(s) com contrato assinado
              </Label>
              <ScrollArea className="h-64 mt-2 border rounded-md">
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
                      const isFullyPaid = stats.remaining <= 0;

                      return (
                        <Card
                          key={p.id}
                          className={`cursor-pointer transition-all border-2 ${selectedProposal === p.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            } ${isFullyPaid ? 'opacity-60 grayscale' : ''}`}
                          onClick={() => {
                            if (isFullyPaid) return;
                            setSelectedProposal(p.id);
                            setDisbursementType('total');
                            setFormData((f) => ({
                              ...f,
                              proposal_id: p.id,
                              amount: String(stats.remaining), // Pega só o RESTANTE
                              disbursement_type: 'total',
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
                                  </div>
                                  {isFullyPaid && <Badge variant="secondary" className="text-xs">Quitado</Badge>}
                                </div>

                                <div className="mt-3 space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Progresso do Desembolso</span>
                                    <span className="font-medium">{Math.round(progress)}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                  <div className="flex justify-between text-xs mt-1 font-medium">
                                    <span className="text-blue-600">Usado: {formatCurrency(stats.used)}</span>
                                    <span className="text-green-600">Restante: {formatCurrency(stats.remaining)}</span>
                                  </div>
                                </div>

                                {stats.last && (
                                  <p className="text-[10px] text-muted-foreground mt-2 border-t pt-1">
                                    Último: {format(parseISO(stats.last.created_at), "dd/MM/yy")} por {getMemberById(stats.last.requested_by)?.name || "Sistema"}
                                  </p>
                                )}

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

            {/* Resto do Formulário - Aparece quando proposta selecionada */}
            {selectedProposal && (
              <>
                <Separator />
                <div className="space-y-4">
                  {/* Tipo de Desembolso */}
                  <div>
                    <Label>Tipo de Desembolso *</Label>
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
                          // Se total, usa valor RESTANTE da proposta
                          amount: v === 'total'
                            ? String(remaining)
                            : f.amount
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Desembolso Total (Restante)</span>
                            <span className="text-xs text-muted-foreground">- Quitar saldo</span>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor do Desembolso *</Label>
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
                        className={disbursementType === 'total' ? 'bg-muted/50 font-medium' : ''}
                      />
                      {disbursementType === 'total' && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-primary" /> Valor integral automático
                        </p>
                      )}
                      {disbursementType === 'parcial' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Máximo disponível: {formatCurrency(
                            getProposalStats(
                              selectedProposal!,
                              Number(signedContractProposals.find(p => p.id === selectedProposal)?.requested_value || 0)
                            ).remaining
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Solicitado por</Label>
                      <Select
                        value={formData.requested_by || ""}
                        onValueChange={(v) => setFormData((f) => ({ ...f, requested_by: v || null }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Membro" /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data do Pedido</Label>
                      <Input
                        type="date"
                        value={formData.request_date}
                        onChange={(e) => setFormData((f) => ({ ...f, request_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Previsão Liberação</Label>
                      <Input
                        type="date"
                        value={formData.expected_date || ""}
                        onChange={(e) => setFormData((f) => ({ ...f, expected_date: e.target.value || null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Banco</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData((f) => ({ ...f, bank_name: e.target.value }))}
                        placeholder="Ex: BNB"
                      />
                    </div>
                    <div>
                      <Label>Agência</Label>
                      <Input
                        value={formData.agency}
                        onChange={(e) => setFormData((f) => ({ ...f, agency: e.target.value }))}
                        placeholder="0001"
                      />
                    </div>
                    <div>
                      <Label>Conta</Label>
                      <Input
                        value={formData.account}
                        onChange={(e) => setFormData((f) => ({ ...f, account: e.target.value }))}
                        placeholder="12345-6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Detalhes adicionais..."
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProposal || !formData.amount}
            >
              Criar Pedido
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
