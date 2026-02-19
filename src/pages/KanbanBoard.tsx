import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProposals } from "@/hooks/useProposals";
import {
  ProposalStatus, STATUS_LABELS, STATUS_COLORS, PRONAF_LINE_LABELS, PronafLine, PROJECT_DESIGNER_LABELS,
} from "@/types/proposal";
import { GripVertical, Loader2, Kanban } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { MonthYearFilter } from "@/components/filters/MonthYearFilter";
import { getMonth, getYear, parseISO } from "date-fns";

const COLUMNS: ProposalStatus[] = ["nova", "em_analise", "documentacao_pendente", "aprovada", "negada"];

const COLUMN_GRADIENT: Record<ProposalStatus, string> = {
  nova: "from-info/20 to-transparent",
  em_analise: "from-warning/20 to-transparent",
  documentacao_pendente: "from-accent/20 to-transparent",
  aprovada: "from-success/20 to-transparent",
  negada: "from-destructive/20 to-transparent",
  avaliacao_risco: "from-primary/20 to-transparent",
  consideracoes_gerenciais: "from-primary/20 to-transparent",
  votacao_sinc: "from-primary/20 to-transparent",
  contrato_liberado: "from-primary/20 to-transparent",
  desembolso: "from-primary/20 to-transparent",
  desembolso_solicitado: "from-primary/20 to-transparent",
};

export default function KanbanBoard() {
  const { proposals, loading, updateProposal } = useProposals();
  const { permissions } = usePermissions();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [designerFilter, setDesignerFilter] = useState("all");

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const moveProposal = (id: string, newStatus: ProposalStatus) => {
    updateProposal(id, { status: newStatus });
  };

  const availableYears = useMemo(() => {
    const years = new Set(proposals.map((p) => String(getYear(parseISO(p.entry_date)))));
    return Array.from(years).sort().reverse();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const d = parseISO(p.entry_date);
      const matchesDesigner = designerFilter === "all" || p.project_designer === designerFilter;
      const matchesMonth = filterMonth === "all" || getMonth(d) + 1 === Number(filterMonth);
      const matchesYear = filterYear === "all" || getYear(d) === Number(filterYear);
      return matchesDesigner && matchesMonth && matchesYear;
    });
  }, [proposals, designerFilter, filterMonth, filterYear]);

  const getColumnProposals = (status: ProposalStatus) =>
    filteredProposals.filter((p) => p.status === status);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Kanban className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Fluxo de Trabalho</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Gestão visual de propostas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-background/40 backdrop-blur-md p-1 rounded-xl border border-border/50 flex gap-2">
            <MonthYearFilter
              month={filterMonth}
              year={filterYear}
              onMonthChange={setFilterMonth}
              onYearChange={setFilterYear}
              years={availableYears}
            />
          </div>
          <Select value={designerFilter} onValueChange={setDesignerFilter}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl bg-background/50 border-border/50 focus:border-primary/50 text-xs font-bold uppercase tracking-wider font-heading">
              <SelectValue placeholder="Projetista" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="all" className="rounded-lg">Todos os Projetistas</SelectItem>
              {Object.entries(PROJECT_DESIGNER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="rounded-lg">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scroll-smooth min-h-[calc(100vh-250px)]">
        {COLUMNS.map((status) => {
          const items = getColumnProposals(status);
          return (
            <div key={status} className="min-w-[320px] max-w-[320px] flex flex-col h-full group">
              <div className="mb-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full shadow-sm bg-gradient-to-br ${COLUMN_GRADIENT[status].replace('from-', 'to-').replace('/20', '')}`} />
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground font-heading">{STATUS_LABELS[status]}</h2>
                </div>
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {items.length}
                </Badge>
              </div>

              <div className="flex-1 space-y-4 p-4 rounded-3xl bg-muted/20 border border-border/40 backdrop-blur-sm min-h-[300px] group-hover:bg-muted/30 transition-colors">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/60 rounded-2xl opacity-40">
                    <Kanban className="h-6 w-6 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Vazio</p>
                  </div>
                ) : (
                  items.map((proposal) => (
                    <Card
                      key={proposal.id}
                      className="group/card relative overflow-hidden border-0 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-2xl bg-card/80 hover:-translate-y-1"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${COLUMN_GRADIENT[status]}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/20 mt-1 shrink-0 cursor-grab active:cursor-grabbing hover:text-primary transition-colors" />
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <p className="text-sm font-extrabold text-foreground group-hover/card:text-primary transition-colors truncate mb-1">
                                {proposal.producer_name}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                <span className="text-[10px] font-mono font-bold tracking-tighter">{proposal.producer_cpf}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter px-2 py-0 border-primary/20 bg-primary/5 text-primary rounded-md">
                                {PRONAF_LINE_LABELS[proposal.pronaf_line as PronafLine] || proposal.pronaf_line}
                              </Badge>
                            </div>

                            <p className="text-sm font-black text-foreground font-heading">
                              {formatCurrency(Number(proposal.requested_value))}
                            </p>

                            <div className="pt-3 border-t border-border/40">
                              <Select
                                value={proposal.status}
                                onValueChange={(v) => moveProposal(proposal.id, v as ProposalStatus)}
                                disabled={!permissions.can_edit_proposals}
                              >
                                <SelectTrigger className="h-8 text-[10px] font-black uppercase tracking-widest bg-background/40 border-0 rounded-lg shadow-inner ring-0 focus:ring-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50">
                                  {COLUMNS.map((s) => (
                                    <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase rounded-lg">
                                      {STATUS_LABELS[s]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
