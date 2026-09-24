import { useState, useMemo } from "react";
import { useProjetistasControl, Projetista, ProjetistaDocumento } from "@/hooks/useProjetistasControl";
import { useStockProposals } from "@/hooks/useStockProposals";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Award,
  IdCard,
  Phone,
  Mail,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  FileCheck,
  MapPin,
  MessageCircle,
  Download,
  AlertCircle,
} from "lucide-react";

export default function ProjetistasControl() {
  const {
    projetistas,
    pendingProjetistas,
    activeProjetistas,
    inactiveProjetistas,
    addProjetista,
    updateProjetista,
    approveProjetista,
    rejectProjetista,
    deleteProjetista,
    resetToDefault,
  } = useProjetistasControl();

  const { proposals: stockProposals } = useStockProposals();
  const { user } = useAuth();
  const { toast } = useToast();

  const proposalCountByProjetista = useMemo(() => {
    const counts = new Map<string, number>();
    stockProposals.forEach((p) => {
      if (p.projetista) {
        const key = p.projetista.trim().toUpperCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    return counts;
  }, [stockProposals]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProjetista, setEditingProjetista] = useState<Projetista | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [validatingProjetista, setValidatingProjetista] = useState<Projetista | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    crea_cfta: "",
    phone: "",
    email: "",
    municipio: "",
    uf: "",
    chave_pix: "",
    status: "ativo" as "ativo" | "inativo" | "pendente",
  });

  const openAddDialog = () => {
    setFormData({
      name: "",
      cpf: "",
      crea_cfta: "",
      phone: "",
      email: "",
      municipio: "",
      uf: "MA",
      chave_pix: "",
      status: "ativo",
    });
    setIsAddOpen(true);
  };

  const openEditDialog = (proj: Projetista) => {
    setEditingProjetista(proj);
    setFormData({
      name: proj.name,
      cpf: proj.cpf || "",
      crea_cfta: proj.crea_cfta || "",
      phone: proj.phone || "",
      email: proj.email || "",
      municipio: proj.municipio || "",
      uf: proj.uf || "MA",
      chave_pix: proj.chave_pix || "",
      status: proj.status || "ativo",
    });
  };

  const handleSaveAdd = () => {
    if (!formData.name.trim()) return;
    addProjetista(formData);
    setIsAddOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingProjetista || !formData.name.trim()) return;
    updateProjetista(editingProjetista.id, formData);
    setEditingProjetista(null);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteProjetista(deletingId);
      setDeletingId(null);
    }
  };

  const handleCopyRegisterLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/cadastro-projetista`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast({
      title: "Link Copiado! 📋",
      description: "Envie o link para novos projetistas realizarem o auto-cadastro com envio de documentos.",
    });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleApprove = async (proj: Projetista) => {
    await approveProjetista(proj.id, user?.email || "Administrador");
    setValidatingProjetista(null);
  };

  const handleRejectPrompt = (proj: Projetista) => {
    setRejectionReason("");
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!validatingProjetista) return;
    await rejectProjetista(
      validatingProjetista.id,
      rejectionReason || "Documentação pendente ou inconsistente",
      user?.email || "Administrador"
    );
    setIsRejectOpen(false);
    setValidatingProjetista(null);
  };

  // Filtered List
  const filteredProjetistas = useMemo(() => {
    return projetistas.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.crea_cfta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.municipio && p.municipio.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [projetistas, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = projetistas.length;
    const ativos = projetistas.filter((p) => p.status === "ativo").length;
    const pendentes = projetistas.filter((p) => p.status === "pendente").length;
    const inativos = projetistas.filter((p) => p.status === "inativo").length;
    const comCrea = projetistas.filter((p) => p.crea_cfta && p.crea_cfta.trim() !== "").length;
    return { total, ativos, pendentes, inativos, comCrea };
  }, [projetistas]);

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight text-foreground">
                Controle de Projetistas
              </h1>
              {stats.pendentes > 0 && (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs font-bold animate-pulse">
                  {stats.pendentes} pendente{stats.pendentes !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Gerenciamento, validação de documentos comprobatórios e credenciamento de projetistas técnicos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Copiar Link Público */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRegisterLink}
            className="rounded-xl border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-bold text-xs"
            title="Copiar link da página pública de cadastro"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
                Link Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1.5" />
                Copiar Link de Cadastro
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="rounded-xl border-border text-muted-foreground hover:text-foreground text-xs"
            title="Restaurar lista padrão"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Restaurar Padrão
          </Button>

          <Button
            onClick={openAddDialog}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2 shadow-lg shadow-teal-600/20"
          >
            <Plus className="h-4 w-4" />
            Novo Projetista
          </Button>
        </div>
      </div>

      {/* ── Banner de Pendências (Se houver projetistas pendentes) ── */}
      {stats.pendentes > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-teal-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <span>Novos Cadastros Aguardando Validação</span>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 text-[10px]">
                  Ação Necessária
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground">
                Existem <strong>{stats.pendentes} projetista(s)</strong> que preencheram o auto-cadastro com documentos anexados aguardando conferência e ativação.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setStatusFilter("pendente")}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-md shadow-amber-600/20"
          >
            Filtrar Pendentes
          </Button>
        </div>
      )}

      {/* ── Cards de Métricas ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</p>
              <h3 className="text-xl font-extrabold text-foreground">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Card Pendentes Destacado */}
        <Card className={`rounded-2xl border shadow-sm transition-all ${
          stats.pendentes > 0 
            ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" 
            : "border-border/50 bg-card"
        }`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Aguardando Validação
              </p>
              <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.pendentes}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativos</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.ativos}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inativos</p>
              <h3 className="text-xl font-extrabold text-muted-foreground">{stats.inativos}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Com Registro</p>
              <h3 className="text-xl font-extrabold text-violet-600 dark:text-violet-400">{stats.comCrea}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros e Busca ──────────────────────────────────── */}
      <Card className="rounded-2xl border border-border/50 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, CPF, CREA/CFTA ou Município..."
              className="pl-9 rounded-xl h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl h-10 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos ({stats.total})</SelectItem>
                <SelectItem value="pendente">Aguardando Validação ({stats.pendentes})</SelectItem>
                <SelectItem value="ativo">Ativo ({stats.ativos})</SelectItem>
                <SelectItem value="inativo">Inativo ({stats.inativos})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabela de Projetistas Cadastrados ────────────────── */}
      <Card className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 p-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold font-heading flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-teal-600" />
                Projetistas Cadastrados
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredProjetistas.length} projetista{filteredProjetistas.length !== 1 ? "s" : ""} exibido{filteredProjetistas.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredProjetistas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserCheck className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <h4 className="font-bold text-sm text-foreground">Nenhum projetista encontrado</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente ajustar a busca ou compartilhe o link de auto-cadastro com os técnicos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="pl-6 text-[10px] font-black uppercase tracking-wider">Nome do Projetista</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">CPF</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">CREA / CFTA</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Documentos</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Propostas</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Contato</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                    <TableHead className="pr-6 text-right text-[10px] font-black uppercase tracking-wider">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjetistas.map((proj) => {
                    const docs = proj.documentos || [];
                    const isPending = proj.status === "pendente";

                    return (
                      <TableRow
                        key={proj.id}
                        className={`hover:bg-accent/40 transition-colors ${
                          isPending ? "bg-amber-500/[0.03]" : ""
                        }`}
                      >
                        {/* Nome */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                              isPending
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30"
                                : "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                            }`}>
                              {proj.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-foreground leading-tight">{proj.name}</p>
                                {isPending && (
                                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] font-extrabold uppercase px-1.5 py-0">
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground">ID: {proj.id}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* CPF */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                            <IdCard className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{proj.cpf || "—"}</span>
                          </div>
                        </TableCell>

                        {/* CREA / CFTA */}
                        <TableCell>
                          {proj.crea_cfta ? (
                            <Badge variant="outline" className="text-xs font-bold bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                              <Award className="h-3 w-3 mr-1" />
                              {proj.crea_cfta}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Documentos */}
                        <TableCell>
                          {docs.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setValidatingProjetista(proj)}
                              className="rounded-xl h-7 px-2.5 text-xs gap-1.5 border-teal-500/40 bg-teal-500/5 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 font-bold"
                            >
                              <FileCheck className="h-3.5 w-3.5 text-teal-600" />
                              <span>{docs.length} doc{docs.length !== 1 ? "s" : ""}</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Nenhum</span>
                          )}
                        </TableCell>

                        {/* Propostas */}
                        <TableCell>
                          {(() => {
                            const count = proposalCountByProjetista.get(proj.name.trim().toUpperCase()) || 0;
                            return count > 0 ? (
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 text-xs font-semibold gap-1">
                                <Briefcase className="h-3 w-3" />
                                {count} {count === 1 ? "proposta" : "propostas"}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            );
                          })()}
                        </TableCell>

                        {/* Contato */}
                        <TableCell>
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            {proj.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-muted-foreground/60" />
                                <span>{proj.phone}</span>
                              </div>
                            )}
                            {proj.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground/60" />
                                <span className="truncate max-w-[140px]">{proj.email}</span>
                              </div>
                            )}
                            {proj.municipio && (
                              <div className="flex items-center gap-1 text-[11px]">
                                <MapPin className="h-3 w-3 text-muted-foreground/60" />
                                <span>{proj.municipio}{proj.uf ? `/${proj.uf}` : ""}</span>
                              </div>
                            )}
                            {!proj.phone && !proj.email && !proj.municipio && <span>—</span>}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {proj.status === "ativo" ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                              Ativo
                            </Badge>
                          ) : proj.status === "pendente" ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-bold animate-pulse">
                              Aguardando Validação
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 text-[10px] font-bold">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <Button
                                size="sm"
                                onClick={() => setValidatingProjetista(proj)}
                                className="h-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-1.5 shadow-sm shadow-teal-600/20"
                                title="Conferir documentos e validar projetista"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Validar e Ativar</span>
                              </Button>
                            ) : docs.length > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setValidatingProjetista(proj)}
                                className="h-8 rounded-xl text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold gap-1"
                                title="Ver documentos cadastrais"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Docs</span>
                              </Button>
                            ) : null}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                              title="Editar informações"
                              onClick={() => openEditDialog(proj)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar projetista"
                              onClick={() => setDeletingId(proj.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* ── Dialog Validação de Projetista e Documentos ──────── */}
      <Dialog
        open={!!validatingProjetista}
        onOpenChange={(open) => !open && setValidatingProjetista(null)}
      >
        <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="font-heading font-extrabold text-lg text-foreground flex items-center gap-2">
                  <span>Validação de Cadastro</span>
                  {validatingProjetista?.status === "pendente" && (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                      Aguardando Ativação
                    </Badge>
                  )}
                  {validatingProjetista?.status === "ativo" && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                      Ativo
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Conferência de documentos comprobatórios e ativação cadastral do técnico
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {validatingProjetista && (
            <div className="space-y-5 py-2">
              {/* Card Resumo do Técnico */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Dados do Profissional
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Cadastrado em: {new Date(validatingProjetista.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nome Completo:</span>
                    <p className="font-extrabold text-foreground text-sm">{validatingProjetista.name}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Registro Profissional:</span>
                    <p className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                      {validatingProjetista.crea_cfta || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-mono font-bold text-foreground">{validatingProjetista.cpf || "—"}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Localização:</span>
                    <p className="font-bold text-foreground">
                      {validatingProjetista.municipio || "—"}{validatingProjetista.uf ? ` / ${validatingProjetista.uf}` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Telefone / WhatsApp:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-foreground">{validatingProjetista.phone || "—"}</span>
                      {validatingProjetista.phone && (
                        <a
                          href={`https://wa.me/55${validatingProjetista.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline font-bold"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-bold text-foreground truncate">{validatingProjetista.email || "—"}</p>
                  </div>

                  {validatingProjetista.observacoes && (
                    <div className="sm:col-span-2 bg-card p-2.5 rounded-xl border border-border/40 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground block mb-0.5">Observações / Formação:</span>
                      {validatingProjetista.observacoes}
                    </div>
                  )}

                  {validatingProjetista.motivo_rejeicao && (
                    <div className="sm:col-span-2 bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 text-xs text-destructive">
                      <span className="font-bold block mb-0.5">Motivo da Recusa Anterior:</span>
                      {validatingProjetista.motivo_rejeicao}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Documentos Anexados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" />
                    Documentos Comprobatórios ({validatingProjetista.documentos?.length || 0})
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    Clique para visualizar ou baixar os arquivos
                  </span>
                </div>

                {(!validatingProjetista.documentos || validatingProjetista.documentos.length === 0) ? (
                  <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    Nenhum documento anexado para este projetista.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {validatingProjetista.documentos.map((doc: ProjetistaDocumento, idx: number) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-card border border-border/60 hover:border-teal-500/40 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="overflow-hidden">
                            <h5 className="font-extrabold text-xs text-foreground truncate">
                              {doc.titulo || doc.tipo}
                            </h5>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                              {doc.nome}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-8 text-xs font-bold gap-1 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-50"
                          >
                            <a href={doc.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Visualizar
                            </a>
                          </Button>

                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="rounded-xl h-8 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <a href={doc.url} download={doc.nome} target="_blank" rel="noreferrer">
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between w-full">
              {validatingProjetista?.status === "pendente" ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRejectPrompt(validatingProjetista)}
                  className="rounded-xl text-xs font-bold"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Recusar Cadastro
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-xl text-xs"
                  onClick={() => setValidatingProjetista(null)}
                >
                  Fechar
                </Button>

                {validatingProjetista?.status === "pendente" && (
                  <Button
                    onClick={() => handleApprove(validatingProjetista)}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 shadow-lg shadow-teal-600/20"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Aprovar e Ativar Projetista
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Recusar Cadastro ──────────────────────────── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Recusar Cadastro de Projetista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informe o motivo da recusa para constar no histórico e orientar o profissional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Motivo da Recusa / Inconsistência
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Documento do conselho vencido, certidão ilegível ou comprovante de endereço com mais de 90 dias..."
              className="rounded-xl text-xs min-h-[90px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl text-xs" onClick={() => setIsRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
            >
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Adicionar Projetista Manual ───────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <UserCheck className="h-5 w-5" />
              Novo Projetista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre as informações técnicas do projetista para enquadramento e geração de documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nome do Projetista <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: NEY MEDEIROS DE ARAÚJO"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CPF
                </label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CREA / CFTA
                </label>
                <Input
                  value={formData.crea_cfta}
                  onChange={(e) => setFormData({ ...formData, crea_cfta: e.target.value })}
                  placeholder="Ex: CREA-MA 12345/D"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telefone / Celular
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(98) 90000-0000"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "ativo" | "inativo" | "pendente") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Aguardando Validação</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Município
                </label>
                <Input
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder="Ex: Imperatriz"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  UF
                </label>
                <Input
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  placeholder="MA"
                  maxLength={2}
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                E-mail Profissional
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="projetista@email.com"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl text-xs" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAdd}
              disabled={!formData.name.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5"
            >
              Salvar Projetista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Editar Projetista ───────────────────────── */}
      <Dialog open={!!editingProjetista} onOpenChange={(open) => !open && setEditingProjetista(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Edit2 className="h-5 w-5" />
              Editar Projetista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Altere os dados cadastrais do projetista selecionado.
            </DialogDescription>
          </DialogHeader>

          {editingProjetista && (
            <div className="mx-6 mt-1 bg-indigo-50/80 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Briefcase className="h-3.5 w-3.5" />
                {proposalCountByProjetista.get(editingProjetista.name.trim().toUpperCase()) || 0} proposta(s) vinculada(s)
              </div>
              <p className="text-[11px] text-indigo-600/90 dark:text-indigo-300/80 leading-relaxed">
                Ao alterar o nome, CPF ou CREA/CFTA, todas as propostas vinculadas a este projetista no estoque e no sistema serão atualizadas e sincronizadas automaticamente.
              </p>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nome do Projetista <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: NEY MEDEIROS DE ARAÚJO"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CPF
                </label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CREA / CFTA
                </label>
                <Input
                  value={formData.crea_cfta}
                  onChange={(e) => setFormData({ ...formData, crea_cfta: e.target.value })}
                  placeholder="Ex: CREA-MA 12345/D"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telefone / Celular
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(98) 90000-0000"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "ativo" | "inativo" | "pendente") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Aguardando Validação</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Município
                </label>
                <Input
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                  placeholder="Ex: Imperatriz"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  UF
                </label>
                <Input
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                  placeholder="MA"
                  maxLength={2}
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                E-mail Profissional
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="projetista@email.com"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl text-xs" onClick={() => setEditingProjetista(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!formData.name.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Eliminar Projetista ────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading font-extrabold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Eliminar Projetista?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta ação removerá este projetista do cadastro do sistema. Esta alteração é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
            >
              Sim, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
