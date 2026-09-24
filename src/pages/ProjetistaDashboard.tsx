import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderCheck,
  FileText,
  User,
  Phone,
  Mail,
  Award,
  MapPin,
  ExternalLink,
  LogOut,
  RefreshCw,
  Building2,
  DollarSign,
  Share2,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ProjetistaInfo {
  id: string;
  name: string;
  cpf: string;
  crea_cfta: string;
  phone: string;
  email: string;
  municipio: string;
  uf: string;
  status: string;
  validado_em?: string;
  documentos?: any[];
}

interface ProposalItem {
  id: string;
  producer_name: string;
  producer_cpf?: string;
  proposal_number?: string;
  credit_program?: string;
  linha_credito?: string;
  pronaf_line?: string;
  estimated_value?: number;
  status?: string;
  original_csv_status?: string;
  municipio?: string;
  pendencias?: string;
  projetista?: string;
  entry_date?: string;
  agency_name?: string;
  inversoes?: any[];
  notes?: string;
  updated_at?: string;
}

export default function ProjetistaDashboard() {
  const { user, signOut, displayName } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projetistaInfo, setProjetistaInfo] = useState<ProjetistaInfo | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);

  // Carregar dados do Projetista e suas Propostas
  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Buscar registro do projetista em public.projetistas
      let projQuery = supabase
        .from("projetistas")
        .select("*")
        .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: projData, error: projErr } = await projQuery;

      let currentProj: ProjetistaInfo | null = null;
      if (projData) {
        currentProj = {
          id: projData.id,
          name: projData.name,
          cpf: projData.cpf || "",
          crea_cfta: projData.crea_cfta || "",
          phone: projData.phone || "",
          email: projData.email || user.email || "",
          municipio: projData.municipio || "",
          uf: projData.uf || "",
          status: projData.status || "ativo",
          validado_em: projData.validado_em,
          documentos: Array.isArray(projData.documentos) ? projData.documentos : [],
        };
        setProjetistaInfo(currentProj);
      } else {
        // Fallback usando nome do perfil
        currentProj = {
          id: user.id,
          name: displayName || user.email || "Projetista",
          cpf: "",
          crea_cfta: "",
          phone: "",
          email: user.email || "",
          municipio: "",
          uf: "",
          status: "ativo",
        };
        setProjetistaInfo(currentProj);
      }

      // 2. Buscar propostas associadas a este projetista no estoque (stock_proposals)
      const projName = currentProj.name.trim();

      // Query stock_proposals
      let stockQuery = supabase
        .from("stock_proposals")
        .select("*")
        .order("updated_at", { ascending: false });

      if (projName) {
        stockQuery = stockQuery.ilike("projetista", `%${projName}%`);
      }

      const { data: stockData, error: stockErr } = await stockQuery;

      if (!stockErr && stockData) {
        setProposals(stockData);
      } else {
        // Fallback: se a query por nome não retornar, tenta buscar todas que o RLS permitiu
        const { data: rlsData } = await supabase
          .from("stock_proposals")
          .select("*")
          .order("updated_at", { ascending: false });
        if (rlsData) {
          setProposals(rlsData);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do painel do projetista:", err);
      toast({
        title: "Erro ao carregar propostas",
        description: err.message || "Não foi possível carregar suas propostas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Propostas Filtradas
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        (p.producer_name && p.producer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.producer_cpf && p.producer_cpf.includes(searchTerm)) ||
        (p.proposal_number && p.proposal_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.municipio && p.municipio.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === "pendencias") {
        matchStatus = !!(p.pendencias && p.pendencias.trim() !== "");
      } else if (statusFilter === "analise") {
        const s = (p.status || "").toLowerCase();
        matchStatus = s.includes("análise") || s.includes("analise") || s.includes("andamento");
      } else if (statusFilter === "concluidas") {
        const s = (p.status || "").toLowerCase();
        matchStatus = s.includes("contratad") || s.includes("conclu") || s.includes("aprovad");
      } else if (statusFilter !== "all") {
        matchStatus = (p.status || "").toLowerCase() === statusFilter.toLowerCase();
      }

      return matchSearch && matchStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  // Métricas
  const stats = useMemo(() => {
    const total = proposals.length;
    let comPendencia = 0;
    let concluidas = 0;
    let emAnalise = 0;
    let volumeTotal = 0;

    proposals.forEach((p) => {
      const valor = Number(p.estimated_value) || 0;
      volumeTotal += valor;

      if (p.pendencias && p.pendencias.trim() !== "") {
        comPendencia++;
      }

      const s = (p.status || "").toLowerCase();
      if (s.includes("contratad") || s.includes("conclu") || s.includes("aprovad")) {
        concluidas++;
      } else {
        emAnalise++;
      }
    });

    return { total, comPendencia, concluidas, emAnalise, volumeTotal };
  }, [proposals]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/15 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-16">
      {/* ── Header do Projetista ──────────────────────────────── */}
      <header className="border-b border-border/40 bg-card/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-teal-500/25 shrink-0 text-base">
              {projetistaInfo?.name?.substring(0, 2).toUpperCase() || "PR"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-black text-xl md:text-2xl text-foreground tracking-tight leading-tight">
                  {getGreeting()},{" "}
                  <span className="text-teal-700 dark:text-teal-400">
                    {projetistaInfo?.name || displayName || "Projetista"}
                  </span>
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Ativo & Credenciado
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                {projetistaInfo?.crea_cfta && (
                  <span className="flex items-center gap-1 font-mono font-semibold">
                    <Award className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.crea_cfta}
                  </span>
                )}
                {projetistaInfo?.municipio && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.municipio}{projetistaInfo.uf ? `/${projetistaInfo.uf}` : ""}
                  </span>
                )}
                {projetistaInfo?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl text-xs gap-1.5 border-border hover:bg-accent"
              title="Atualizar propostas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-50 font-bold"
            >
              <Link to="/enviar-documentacao">
                <FileCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>Enviar Documentos</span>
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5"
              title="Encerrar sessão"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Banner de Pendências (se houver) */}
        {stats.comPendencia > 0 && (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-rose-500/10 border border-amber-500/40 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                    <span>Atenção: Você possui {stats.comPendencia} proposta(s) com pendências</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 text-[10px]">
                      Ação Necessária
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    A agência bancária ou o analista registraram apontamentos em suas propostas. Verifique os detalhes e anexe os documentos complementares.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setStatusFilter("pendencias")}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-md shadow-amber-600/20"
              >
                Filtrar Propostas com Pendência
              </Button>
            </div>
          </div>
        )}

        {/* ── Cards de Métricas do Projetista ──────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total de Propostas
                </p>
                <h3 className="text-2xl font-black text-foreground">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Em Andamento
                </p>
                <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {stats.emAnalise}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-2xl border shadow-sm transition-all ${
            stats.comPendencia > 0
              ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20"
              : "border-border/60 bg-card"
          }`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Com Pendência
                </p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {stats.comPendencia}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Concluídas / Aprovadas
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {stats.concluidas}
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm bg-card col-span-2 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                  Volume de Crédito
                </p>
                <h3 className="text-lg md:text-xl font-black text-teal-700 dark:text-teal-300 truncate">
                  {formatCurrency(stats.volumeTotal)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Filtros e Busca ──────────────────────────────────── */}
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome do produtor, CPF, proposta ou município..."
                className="pl-9 rounded-xl h-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                Filtrar:
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[190px] rounded-xl h-10 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({stats.total})</SelectItem>
                  <SelectItem value="pendencias">Com Pendências ({stats.comPendencia})</SelectItem>
                  <SelectItem value="analise">Em Andamento ({stats.emAnalise})</SelectItem>
                  <SelectItem value="concluidas">Concluídas ({stats.concluidas})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabela de Propostas do Projetista ─────────────────── */}
        <Card className="rounded-3xl border border-border/60 shadow-md overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 p-5 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold font-heading flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-teal-600" />
                  Minhas Propostas de Crédito
                </CardTitle>
                <CardDescription className="text-xs">
                  {filteredProposals.length} proposta{filteredProposals.length !== 1 ? "s" : ""} encontrada{filteredProposals.length !== 1 ? "s" : ""} sob sua responsabilidade técnica
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredProposals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">
                  Nenhuma proposta encontrada
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca para encontrar suas propostas."
                    : "Você ainda não possui propostas vinculadas ao seu nome no estoque. Assim que uma nova proposta for associada ao seu registro, ela aparecerá automaticamente nesta central."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="pl-6 text-[10px] font-black uppercase tracking-wider">
                        Produtor / Cliente
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Nº Proposta
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Linha PRONAF
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Valor
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Município
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Status / Situação
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider">
                        Pendências
                      </TableHead>
                      <TableHead className="pr-6 text-right text-[10px] font-black uppercase tracking-wider">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((prop) => {
                      const hasPendencia = !!(prop.pendencias && prop.pendencias.trim() !== "");
                      const valor = Number(prop.estimated_value) || 0;

                      return (
                        <TableRow
                          key={prop.id}
                          className={`hover:bg-accent/40 transition-colors ${
                            hasPendencia ? "bg-amber-500/[0.04]" : ""
                          }`}
                        >
                          {/* Produtor */}
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {prop.producer_name?.substring(0, 2).toUpperCase() || "CL"}
                              </div>
                              <div>
                                <p className="font-extrabold text-sm text-foreground leading-tight">
                                  {prop.producer_name}
                                </p>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  {prop.producer_cpf || "CPF não informado"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Nº Proposta */}
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-foreground">
                              {prop.proposal_number || "—"}
                            </span>
                          </TableCell>

                          {/* Linha PRONAF */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            >
                              {prop.linha_credito || prop.credit_program || prop.pronaf_line || "PRONAF"}
                            </Badge>
                          </TableCell>

                          {/* Valor */}
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-foreground">
                              {valor > 0 ? formatCurrency(valor) : "—"}
                            </span>
                          </TableCell>

                          {/* Município */}
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {prop.municipio || "—"}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                            >
                              {prop.status || prop.original_csv_status || "Em Análise"}
                            </Badge>
                          </TableCell>

                          {/* Pendências */}
                          <TableCell>
                            {hasPendencia ? (
                              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold max-w-[200px]">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                <span className="truncate" title={prop.pendencias}>
                                  {prop.pendencias}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Regular
                              </span>
                            )}
                          </TableCell>

                          {/* Ações */}
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedProposal(prop)}
                                className="h-8 rounded-xl text-xs font-bold border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-50"
                              >
                                Ver Detalhes
                              </Button>

                              {hasPendencia && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                                  title="Resolver pendência enviando documentação complementar"
                                >
                                  <Link to="/enviar-documentacao">
                                    Corrigir
                                  </Link>
                                </Button>
                              )}
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
      </main>

      {/* ── Modal Detalhes da Proposta ────────────────────────── */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-foreground">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Detalhes da Proposta de Crédito
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informações completas do produtor e situação cadastral no banco
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4 py-2 text-xs">
              {/* Card Produtor */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-2">
                <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Dados do Produtor Rural
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-extrabold text-foreground text-sm">
                      {selectedProposal.producer_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.producer_cpf || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Município:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.municipio || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Linha de Crédito:</span>
                    <p className="font-semibold text-teal-700 dark:text-teal-300">
                      {selectedProposal.linha_credito || selectedProposal.credit_program || "PRONAF"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Financiamento */}
              <div className="bg-teal-500/5 p-4 rounded-2xl border border-teal-500/20 space-y-2">
                <span className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 text-[10px]">
                  Dados Financeiros & Bancários
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Valor Solicitado:</span>
                    <p className="font-black text-teal-700 dark:text-teal-300 text-base">
                      {formatCurrency(Number(selectedProposal.estimated_value) || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número da Proposta:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.proposal_number || "Aguardando geração"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Situação Atual:</span>
                    <Badge variant="outline" className="font-bold text-[10px] mt-0.5">
                      {selectedProposal.status || selectedProposal.original_csv_status || "Em Análise"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agência Bancária:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.agency_name || "Agência Regional"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pendências se houver */}
              {selectedProposal.pendencias && (
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Apontamentos e Pendências:
                  </div>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    {selectedProposal.pendencias}
                  </p>
                </div>
              )}

              {/* Inversões Cadastradas */}
              {selectedProposal.inversoes && selectedProposal.inversoes.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Itens Financiados (Inversões Cadastradas)
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedProposal.inversoes.map((inv: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40 text-xs"
                      >
                        <span className="font-semibold truncate max-w-[280px]">
                          {inv.descricao || inv.item || `Item ${idx + 1}`}
                        </span>
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-300 shrink-0">
                          {formatCurrency(Number(inv.valor_total || inv.valor || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedProposal.notes && (
                <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-muted-foreground">
                  <span className="font-bold text-foreground block mb-0.5">Observações:</span>
                  {selectedProposal.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              className="rounded-xl text-xs"
              onClick={() => setSelectedProposal(null)}
            >
              Fechar
            </Button>

            {selectedProposal?.pendencias && (
              <Button
                asChild
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                <Link to="/enviar-documentacao">
                  Enviar Documentação Complementar
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
