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
  PieChart, Pie, Cell, AreaChart, Area, Legend, LabelList,
} from "recharts";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { STATUS_LABELS, PRONAF_LINE_LABELS, type ProposalStatus, type PronafLine } from "@/types/proposal";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";

const CHART_COLORS = [
  "hsl(215, 70%, 32%)", "hsl(210, 80%, 55%)", "hsl(142, 71%, 35%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(199, 89%, 48%)", "hsl(280, 60%, 50%)",
];

const STATUS_CHART_COLORS: Record<string, string> = {
  nova: "hsl(199, 89%, 48%)", // sky
  em_analise: "hsl(215, 70%, 50%)", // blue
  documentacao_pendente: "hsl(38, 92%, 50%)", // amber
  avaliacao_risco: "hsl(346, 87%, 60%)", // rose
  consideracoes_gerenciais: "hsl(215, 16%, 47%)", // slate
  votacao_sinc: "hsl(220, 70%, 40%)", // darker blue
  contrato_liberado: "hsl(142, 71%, 45%)", // emerald
  desembolso: "hsl(175, 70%, 41%)", // teal
  desembolso_solicitado: "hsl(240, 70%, 65%)", // indigo
  em_andamento: "hsl(270, 70%, 60%)", // violet
  aprovada: "hsl(142, 71%, 35%)", // green legacy
  negada: "hsl(0, 72%, 51%)", // red legacy
};

export default function Dashboard() {
  const { proposals, loading: loadingP } = useProposals();
  const { tasks, members, loading: loadingT } = useTeam();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F8FAFC",
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finaleWidth = imgWidth * ratio;
      const finaleHeight = imgHeight * ratio;
      
      const x = (pdfWidth - finaleWidth) / 2;
      const y = 10; // Top margin

      // Header
      pdf.setFillColor(30, 58, 138); // Dark Blue
      pdf.rect(0, 0, pdfWidth, 25, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO DE GESTÃO - PRONAF", 10, 16);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const dateStr = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
      pdf.text(`Gerado em: ${dateStr}`, pdfWidth - 10, 16, { align: "right" });

      // Content
      pdf.addImage(imgData, "PNG", x, 30, finaleWidth, finaleHeight);
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text("PRONAF Plataforma de Gestão - Relatório Interno", pdfWidth / 2, pdfHeight - 10, { align: "center" });

      pdf.save(`Relatorio_PRONAF_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

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
    const aprovadas = filteredProposals.filter((p) => p.status === "aprovada" || p.status === "contrato_liberado").length;
    const ativos = filteredProposals.filter((p) => !["nova", "aprovada", "negada", "contrato_liberado"].includes(p.status)).length;
    const pendentes = filteredProposals.filter((p) => p.status === "documentacao_pendente").length;
    const novas = filteredProposals.filter((p) => p.status === "nova").length;
    const negadas = filteredProposals.filter((p) => p.status === "negada").length;
    const valorTotal = filteredProposals.reduce((sum, p) => sum + Number(p.requested_value), 0);
    const valorAprovado = filteredProposals.filter((p) => p.status === "aprovada" || p.status === "contrato_liberado").reduce((s, p) => s + Number(p.requested_value), 0);
    const taxaAprovacao = total > 0 ? Math.round((aprovadas / total) * 100) : 0;
    return { total, aprovadas, ativos, pendentes, novas, negadas, valorTotal, valorAprovado, taxaAprovacao };
  }, [filteredProposals]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProposals.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    
    // Sort array descending and filter empty
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as ProposalStatus] || status,
        value: count,
        fill: STATUS_CHART_COLORS[status] || "hsl(215, 16%, 47%)"
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  const pieData = useMemo(() => statusChartData, [statusChartData]);

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
        valor: monthProposals.reduce((s, p) => s + Number(p.requested_value), 0),
      });
    }
    return months;
  }, [filteredProposals]);

  const lineData = useMemo(() => {
    const programs: Record<string, { count: number; valor: number }> = {};
    filteredProposals.forEach((p) => {
      const progName = p.credit_program || 'Não Informado';
      if (!programs[progName]) programs[progName] = { count: 0, valor: 0 };
      programs[progName].count++;
      programs[progName].valor += Number(p.requested_value);
    });
    return Object.entries(programs)
      .map(([key, val]) => ({
        name: key,
        propostas: val.count,
        valor: val.valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Limita ao top 10 programas para não quebrar layout
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner group/icon transform transition-all duration-500 hover:rotate-6">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Dashboard Analítico</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Visão estratégica das propostas PRONAF
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-4 py-2.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-premium hover:shadow-premium-hover hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isExporting ? "Gerando..." : "Gerar Relatório PDF"}
          </button>
          <div className="bg-background/40 backdrop-blur-md p-1 rounded-xl border border-border/50 shadow-sm">
            <MonthYearFilter 
              month={filterMonth} 
              year={filterYear} 
              years={availableYears}
              onMonthChange={setFilterMonth} 
              onYearChange={setFilterYear} 
            />
          </div>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-8 p-1">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Propostas</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.total}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-0 text-[10px] font-bold">+{stats.novas} NOVAS</Badge>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                <FileText className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Contratos Assinados</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.aprovadas}</p>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-sm font-bold text-success drop-shadow-sm font-heading">
                    {formatCurrency(stats.valorAprovado)}
                  </p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-success" />
                    <span className="text-[10px] text-success font-bold">{stats.taxaAprovacao}% TAXA</span>
                  </div>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center text-success transform group-hover:scale-110 group-hover:-rotate-3 transition-all">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Volume Financeiro</p>
                <p className="text-2xl font-extrabold font-heading text-foreground mt-1">{formatCurrency(stats.valorTotal)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 flex items-center gap-1 italic">
                  <DollarSign className="h-3 w-3 opacity-50" /> TOTAL PROCESSADO
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent transform group-hover:scale-110 group-hover:rotate-6 transition-all">
                <DollarSign className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Processos Ativos</p>
                <p className="text-4xl font-extrabold font-heading text-foreground">{stats.ativos}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="px-2 py-0.5 rounded-lg bg-warning/10 text-warning border-0 text-[10px] font-bold flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {stats.pendentes} PEND. DOCS
                  </Badge>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center text-warning transform group-hover:scale-110 group-hover:-rotate-6 transition-all">
                <Search className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Documentação</p>
              <span className="text-sm font-black text-primary">{docStats.rate}%</span>
            </div>
            <Progress value={docStats.rate} className="h-1.5 bg-primary/10" />
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">{docStats.completedDocs}/{docStats.totalDocs} documentos validados</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pendências</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{taskStats.pendentes}</p>
            {taskStats.atrasadas > 0 && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-lg bg-destructive/10 w-fit">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-destructive font-black">{taskStats.atrasadas} EM ATRASO</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipe Ativa</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{members.length}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-tighter">analistas disponíveis</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium/50 rounded-2xl bg-background/40 backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Negadas</p>
            <p className="text-3xl font-extrabold font-heading mt-1 text-foreground">{stats.negadas}</p>
            {stats.total > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-1 w-12 rounded-full bg-destructive/20 overflow-hidden">
                  <div className="h-full bg-destructive" style={{ width: `${Math.round((stats.negadas / stats.total) * 100)}%` }} />
                </div>
                <span className="text-[10px] text-destructive font-black">{Math.round((stats.negadas / stats.total) * 100)}% DO TOTAL</span>
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
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(215, 70%, 32%)' }} />
                  </Bar>
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
              <DollarSign className="h-4 w-4 text-primary" /> Valores por Programa de Crédito (R$ mil)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {lineData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} layout="vertical" margin={{ top: 5, right: 10, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 11 }} 
                      tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10 }} 
                      width={120}
                      tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px", maxWidth: "250px", whiteSpace: "normal" }} 
                      formatter={(value: number) => [
                        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value), 
                        "Valor Total"
                      ]} 
                    />
                    <Bar dataKey="valor" fill="hsl(210, 80%, 55%)" radius={[0, 6, 6, 0]}>
                      <LabelList 
                        dataKey="valor" 
                        position="right" 
                        style={{ fontSize: '10px', fontWeight: 'bold', fill: 'hsl(210, 80%, 40%)' }}
                        formatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                    </Bar>
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
                  <Badge className={`text-[10px] ${p.status === "aprovada" ? "bg-success text-success-foreground" :
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
  </div>
);
}
