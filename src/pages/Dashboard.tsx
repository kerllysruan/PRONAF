import { useState, useMemo } from "react";
import {
  FileText, CheckCircle2, Search, DollarSign, TrendingUp, Loader2,
  Sparkles, AlertTriangle, Clock, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { STATUS_LABELS, PRONAF_LINE_LABELS, type ProposalStatus, type PronafLine } from "@/types/proposal";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";

const CHART_COLORS = [
  "hsl(215, 70%, 32%)", "hsl(210, 80%, 55%)", "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(199, 89%, 48%)", "hsl(280, 60%, 50%)",
];

export default function Dashboard() {
  const { proposals, loading: loadingP } = useProposals();
  const { tasks, members, loading: loadingT } = useTeam();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const availableYears = useMemo(() => {
    const years = new Set(proposals.map((p) => String(getYear(parseISO(p.created_at)))));
    return Array.from(years).sort().reverse();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const d = parseISO(p.created_at);
      if (filterMonth !== "all" && getMonth(d) + 1 !== Number(filterMonth)) return false;
      if (filterYear !== "all" && getYear(d) !== Number(filterYear)) return false;
      return true;
    });
  }, [proposals, filterMonth, filterYear]);

  const stats = useMemo(() => {
    const total = filteredProposals.length;
    const aprovadas = filteredProposals.filter((p) => p.status === "aprovada").length;
    const emAnalise = filteredProposals.filter((p) => p.status === "em_analise").length;
    const pendentes = filteredProposals.filter((p) => p.status === "documentacao_pendente").length;
    const novas = filteredProposals.filter((p) => p.status === "nova").length;
    const negadas = filteredProposals.filter((p) => p.status === "negada").length;
    const valorTotal = filteredProposals.reduce((sum, p) => sum + Number(p.requested_value), 0);
    const valorAprovado = filteredProposals.filter((p) => p.status === "aprovada").reduce((s, p) => s + Number(p.requested_value), 0);
    const taxaAprovacao = total > 0 ? Math.round((aprovadas / total) * 100) : 0;
    return { total, aprovadas, emAnalise, pendentes, novas, negadas, valorTotal, valorAprovado, taxaAprovacao };
  }, [filteredProposals]);

  const statusChartData = useMemo(() => [
    { name: "Novas", value: stats.novas, fill: "hsl(199, 89%, 48%)" },
    { name: "Em Análise", value: stats.emAnalise, fill: "hsl(38, 92%, 50%)" },
    { name: "Doc. Pend.", value: stats.pendentes, fill: "hsl(210, 80%, 55%)" },
    { name: "Aprovadas", value: stats.aprovadas, fill: "hsl(142, 71%, 35%)" },
    { name: "Negadas", value: stats.negadas, fill: "hsl(0, 72%, 51%)" },
  ], [stats]);

  const pieData = useMemo(() => statusChartData.filter((d) => d.value > 0), [statusChartData]);

  const monthlyData = useMemo(() => {
    const months: { name: string; propostas: number; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthProposals = filteredProposals.filter((p) =>
        isWithinInterval(parseISO(p.created_at), { start, end })
      );
      months.push({
        name: format(date, "MMM/yy", { locale: ptBR }),
        propostas: monthProposals.length,
        valor: monthProposals.reduce((s, p) => s + Number(p.requested_value), 0) / 1000,
      });
    }
    return months;
  }, [filteredProposals]);

  const lineData = useMemo(() => {
    const lines: Record<string, { count: number; valor: number }> = {};
    filteredProposals.forEach((p) => {
      if (!lines[p.pronaf_line]) lines[p.pronaf_line] = { count: 0, valor: 0 };
      lines[p.pronaf_line].count++;
      lines[p.pronaf_line].valor += Number(p.requested_value);
    });
    return Object.entries(lines).map(([key, val]) => ({
      name: PRONAF_LINE_LABELS[key as PronafLine] || key,
      propostas: val.count,
      valor: val.valor / 1000,
    })).sort((a, b) => b.valor - a.valor);
  }, [filteredProposals]);

  const docStats = useMemo(() => {
    const totalDocs = filteredProposals.reduce((a, p) => a + p.documents.length, 0);
    const completedDocs = filteredProposals.reduce((a, p) => a + p.documents.filter((d) => d.completed).length, 0);
    return { totalDocs, completedDocs, rate: totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0 };
  }, [filteredProposals]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    pendentes: tasks.filter((t) => t.status === "pendente").length,
    atrasadas: tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "concluida").length,
  }), [tasks]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (loadingP || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard Analítico</h1>
            <p className="text-sm text-muted-foreground">Visão estratégica das propostas PRONAF</p>
          </div>
        </div>
        <MonthYearFilter month={filterMonth} year={filterYear} onMonthChange={setFilterMonth} onYearChange={setFilterYear} years={availableYears} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Propostas</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.total}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{stats.novas} novas</Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Aprovadas</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.aprovadas}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success" />
                  <span className="text-[10px] text-success font-medium">{stats.taxaAprovacao}% taxa</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Valor Total</p>
                <p className="text-xl font-bold font-heading mt-1">{formatCurrency(stats.valorTotal)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Aprovado: {formatCurrency(stats.valorAprovado)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-warning/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Em Análise</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.emAnalise}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-warning" />
                  <span className="text-[10px] text-warning font-medium">{stats.pendentes} doc. pend.</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Documentação</p>
              <span className="text-sm font-bold text-primary">{docStats.rate}%</span>
            </div>
            <Progress value={docStats.rate} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">{docStats.completedDocs}/{docStats.totalDocs} documentos</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tarefas Pendentes</p>
            <p className="text-2xl font-bold font-heading mt-1">{taskStats.pendentes}</p>
            {taskStats.atrasadas > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-medium">{taskStats.atrasadas} atrasadas</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Equipe Ativa</p>
            <p className="text-2xl font-bold font-heading mt-1">{members.length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">membros cadastrados</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Negadas</p>
            <p className="text-2xl font-bold font-heading mt-1">{stats.negadas}</p>
            {stats.total > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-medium">{Math.round((stats.negadas / stats.total) * 100)}% do total</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Propostas por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" /> Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="propostas" name="Propostas" stroke="hsl(215, 70%, 32%)" fill="hsl(215, 70%, 32%)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Valores por Linha PRONAF (R$ mil)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {lineData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} formatter={(value: number) => [`R$ ${value.toFixed(1)}k`, "Valor"]} />
                    <Bar dataKey="valor" fill="hsl(210, 80%, 55%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Proposals */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Últimas Propostas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <Badge className={`text-[10px] ${
                    p.status === "aprovada" ? "bg-success text-success-foreground" :
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
    </div>
  );
}
