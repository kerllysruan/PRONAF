import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProposals } from "@/hooks/useProposals";
import {
  ProposalStatus, STATUS_LABELS, STATUS_COLORS, PRONAF_LINE_LABELS, PronafLine,
} from "@/types/proposal";
import { GripVertical, Loader2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const COLUMNS: ProposalStatus[] = ["nova", "em_analise", "documentacao_pendente", "aprovada", "negada"];

const COLUMN_GRADIENT: Record<ProposalStatus, string> = {
  nova: "from-info/20 to-transparent",
  em_analise: "from-warning/20 to-transparent",
  documentacao_pendente: "from-accent/20 to-transparent",
  aprovada: "from-success/20 to-transparent",
  negada: "from-destructive/20 to-transparent",
};

export default function KanbanBoard() {
  const { proposals, loading, updateProposal } = useProposals();
  const { permissions } = usePermissions();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const moveProposal = (id: string, newStatus: ProposalStatus) => {
    updateProposal(id, { status: newStatus });
  };

  const getColumnProposals = (status: ProposalStatus) =>
    proposals.filter((p) => p.status === status);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading">Quadro Kanban</h1>
        <p className="text-sm text-muted-foreground mt-1">Visualize e mova propostas entre status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map((status) => {
          const items = getColumnProposals(status);
          return (
            <div key={status} className="min-w-[280px] flex-1">
              <Card className="border-0 shadow-md overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${COLUMN_GRADIENT[status]}`} />
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-heading">{STATUS_LABELS[status]}</CardTitle>
                    <Badge variant="secondary" className="text-xs font-bold">{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 min-h-[200px]">
                  {items.length === 0 ? (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">Nenhuma proposta</p>
                    </div>
                  ) : (
                    items.map((proposal) => (
                      <Card key={proposal.id} className="shadow-sm hover:shadow-md transition-all border-0 bg-muted/30">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{proposal.producer_name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                                {PRONAF_LINE_LABELS[proposal.pronaf_line as PronafLine] || proposal.pronaf_line}
                              </Badge>
                              <p className="text-sm font-semibold text-primary mt-2">
                                {formatCurrency(Number(proposal.requested_value))}
                              </p>
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <Select
                                  value={proposal.status}
                                  onValueChange={(v) => moveProposal(proposal.id, v as ProposalStatus)}
                                  disabled={!permissions.can_edit_proposals}
                                >
                                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {COLUMNS.map((s) => (
                                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
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
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
