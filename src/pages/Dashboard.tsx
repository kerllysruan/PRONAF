import { useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  Search,
  DollarSign,
  CalendarDays,
  TrendingUp,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useProposals } from "@/hooks/useProposals";
import { useVisits } from "@/hooks/useVisits";
import { STATUS_LABELS, VISIT_STATUS_LABELS } from "@/types/proposal";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { proposals, loading: loadingP } = useProposals();
  const { visits, loading: loadingV } = useVisits();

  const stats = useMemo(() => {
    const total = proposals.length;
    const aprovadas = proposals.filter((p) => p.status === "aprovada").length;
    const emAnalise = proposals.filter((p) => p.status === "em_analise").length;
    const pendentes = proposals.filter((p) => p.status === "documentacao_pendente").length;
    const novas = proposals.filter((p) => p.status === "nova").length;
    const negadas = proposals.filter((p) => p.status === "negada").length;
    const valorTotal = proposals.reduce((sum, p) => sum + Number(p.requested_value), 0);
    return { total, aprovadas, emAnalise, pendentes, novas, negadas, valorTotal };
  }, [proposals]);

  const statusChartData = useMemo(
    () => [
      { name: "Novas", value: stats.novas, fill: "hsl(199, 89%, 48%)" },
      { name: "Em Análise", value: stats.emAnalise, fill: "hsl(38, 92%, 50%)" },
      { name: "Doc. Pend.", value: stats.pendentes, fill: "hsl(210, 80%, 55%)" },
      { name: "Aprovadas", value: stats.aprovadas, fill: "hsl(142, 71%, 35%)" },
      { name: "Negadas", value: stats.negadas, fill: "hsl(0, 72%, 51%)" },
    ],
    [stats]
  );

  const upcomingVisits = useMemo(
    () =>
      visits
        .filter((v) => v.status === "agendada")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [visits]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (loadingP || loadingV) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das propostas PRONAF
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Propostas</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.total}</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aprovadas</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.aprovadas}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-warning/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Análise</p>
                <p className="text-3xl font-bold font-heading mt-1">{stats.emAnalise}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Total</p>
                <p className="text-xl font-bold font-heading mt-1">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Propostas por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Próximas Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingVisits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma visita agendada
                </p>
              ) : (
                upcomingVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border border-border/50 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col items-center min-w-[48px] rounded-lg bg-primary/10 p-2">
                      <span className="text-[10px] font-semibold text-primary uppercase">
                        {format(parseISO(visit.date), "MMM", { locale: ptBR })}
                      </span>
                      <span className="text-lg font-bold text-primary leading-none">
                        {format(parseISO(visit.date), "dd")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{visit.producer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{visit.objective}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">🕐 {visit.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
