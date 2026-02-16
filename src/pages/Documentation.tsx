import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProposals, DbDocument } from "@/hooks/useProposals";
import { usePermissions } from "@/hooks/usePermissions";
import {
  STATUS_LABELS, PRONAF_LINE_LABELS, STATUS_COLORS,
  type ProposalStatus, type PronafLine,
} from "@/types/proposal";
import {
  Search, FileCheck, Loader2, AlertTriangle, CheckCircle2, XCircle,
  ArrowLeft, Eye, ClipboardList,
} from "lucide-react";

export default function Documentation() {
  const { proposals, loading, toggleDocument } = useProposals();
  const { permissions } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [docFilter, setDocFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  // Optimistic local state for instant checkbox feedback
  const [optimisticDocs, setOptimisticDocs] = useState<Record<string, boolean>>({});

  const handleToggle = useCallback((docId: string, completed: boolean) => {
    // Instantly update local state
    setOptimisticDocs((prev) => ({ ...prev, [docId]: completed }));
    // Fire API in background
    toggleDocument(docId, completed);
  }, [toggleDocument]);

  const getDocCompleted = (doc: DbDocument) => {
    return optimisticDocs[doc.id] !== undefined ? optimisticDocs[doc.id] : doc.completed;
  };

  const totalDocs = proposals.reduce((a, p) => a + p.documents.length, 0);
  const completedDocs = proposals.reduce((a, p) => a + p.documents.filter((d) => getDocCompleted(d)).length, 0);
  const pendingDocs = totalDocs - completedDocs;
  const completionRate = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
  const proposalsComplete = proposals.filter((p) => p.documents.length > 0 && p.documents.every((d) => getDocCompleted(d))).length;
  const proposalsIncomplete = proposals.filter((p) => p.documents.length > 0 && !p.documents.every((d) => getDocCompleted(d))).length;

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch = p.producer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.producer_cpf.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      if (docFilter === "all") return matchesSearch && matchesStatus;
      if (docFilter === "completo") return matchesSearch && matchesStatus && p.documents.length > 0 && p.documents.every((d) => getDocCompleted(d));
      if (docFilter === "incompleto") return matchesSearch && matchesStatus && p.documents.length > 0 && !p.documents.every((d) => getDocCompleted(d));
      if (docFilter === "critico") {
        const pct = p.documents.length > 0 ? p.documents.filter((d) => getDocCompleted(d)).length / p.documents.length : 0;
        return matchesSearch && matchesStatus && pct < 0.5;
      }
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, docFilter, statusFilter, optimisticDocs]);

  const getCompletionPercent = (p: { documents: DbDocument[] }) => {
    if (p.documents.length === 0) return 0;
    return Math.round((p.documents.filter((d) => getDocCompleted(d)).length / p.documents.length) * 100);
  };

  const selectedProposal = selectedProposalId ? proposals.find((p) => p.id === selectedProposalId) : null;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (selectedProposal) {
    const percent = getCompletionPercent(selectedProposal);
    const completed = selectedProposal.documents.filter((d) => getDocCompleted(d)).length;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedProposalId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading">Checklist de Documentos</h1>
            <p className="text-sm text-muted-foreground">{selectedProposal.producer_name} — {selectedProposal.producer_cpf}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Status da Proposta</p>
              <Badge className={`${STATUS_COLORS[selectedProposal.status as ProposalStatus]} mt-1`}>
                {STATUS_LABELS[selectedProposal.status as ProposalStatus]}
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Linha PRONAF</p>
              <p className="font-semibold text-sm mt-1">{PRONAF_LINE_LABELS[selectedProposal.pronaf_line as PronafLine]}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Completude</p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={percent} className="h-2 flex-1" />
                <span className="text-sm font-bold text-primary">{percent}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{completed}/{selectedProposal.documents.length} documentos</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Documentos Necessários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProposal.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento vinculado</p>
            ) : (
              <div className="space-y-2">
                {selectedProposal.documents.map((doc) => {
                  const isCompleted = getDocCompleted(doc);
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 ${isCompleted
                          ? "bg-success/5 border-success/20"
                          : "bg-destructive/5 border-destructive/20"
                        }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => handleToggle(doc.id, !!checked)}
                        id={doc.id}
                        disabled={!permissions.can_edit_proposals}
                      />
                      <label
                        htmlFor={doc.id}
                        className={`text-sm cursor-pointer flex-1 transition-all duration-150 ${isCompleted ? "line-through text-muted-foreground" : "font-medium"}`}
                      >
                        {doc.name}
                      </label>
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading">Controle de Documentação</h1>
        <p className="text-sm text-muted-foreground mt-1">Checklist e acompanhamento dos documentos por proposta</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Documentos</p>
            </div>
            <p className="text-lg font-bold font-heading">{completedDocs}/{totalDocs}</p>
            <p className="text-[10px] text-muted-foreground">{completionRate}% completo</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Completas</p>
            </div>
            <p className="text-lg font-bold font-heading">{proposalsComplete}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Incompletas</p>
            </div>
            <p className="text-lg font-bold font-heading">{proposalsIncomplete}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
            </div>
            <p className="text-lg font-bold font-heading">{pendingDocs}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold font-heading">Progresso Geral</h3>
            <span className="text-sm font-bold text-primary">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={docFilter} onValueChange={setDocFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Docs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completo">Completos</SelectItem>
                <SelectItem value="incompleto">Incompletos</SelectItem>
                <SelectItem value="critico">Críticos (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produtor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead className="hidden md:table-cell">Linha</TableHead>
                  <TableHead className="w-20">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma proposta encontrada</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const pct = getCompletionPercent(p);
                    const completed = p.documents.filter((d) => getDocCompleted(d)).length;
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedProposalId(p.id)}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.producer_name}</p>
                            <p className="text-xs text-muted-foreground">{p.producer_cpf}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[p.status as ProposalStatus]} text-xs`}>
                            {STATUS_LABELS[p.status as ProposalStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-16 text-right">{completed}/{p.documents.length}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {PRONAF_LINE_LABELS[p.pronaf_line as PronafLine]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
