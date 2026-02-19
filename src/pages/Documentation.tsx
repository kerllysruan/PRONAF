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
import { Separator } from "@/components/ui/separator";
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
      <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedProposalId(null)}
              className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-all"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-black shadow-lg shadow-primary/20">
                {selectedProposal.producer_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold font-heading text-foreground tracking-tight">{selectedProposal.producer_name}</h1>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{selectedProposal.producer_cpf}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-0 shadow-sm ${STATUS_COLORS[selectedProposal.status as ProposalStatus]}`}>
              {STATUS_LABELS[selectedProposal.status as ProposalStatus]}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Progresso do Checklist</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-black text-primary">{percent}%</span>
                  <span className="text-xs font-bold text-muted-foreground">{completed}/{selectedProposal.documents.length} itens</span>
                </div>
                <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden mb-4">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  {percent === 100 ? "Todos os documentos foram validados com sucesso." : "Alguns documentos ainda pendem validação técnica."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Linha de Crédito</p>
                  <p className="text-sm font-bold text-foreground">{PRONAF_LINE_LABELS[selectedProposal.pronaf_line as PronafLine]}</p>
                </div>
                <Separator className="bg-border/40" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Identificador</p>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground">{selectedProposal.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white/60 backdrop-blur-sm h-full">
              <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                  <ClipboardList className="h-4 w-4" /> Checklist de Documentação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {selectedProposal.documents.length === 0 ? (
                  <div className="py-20 text-center space-y-3 opacity-40">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">Nenhum documento necessário</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProposal.documents.map((doc) => {
                      const isCompleted = getDocCompleted(doc);
                      return (
                        <div
                          key={doc.id}
                          className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isCompleted
                            ? "bg-emerald-50/50 border-emerald-200/50"
                            : "bg-white border-border/40 hover:border-primary/40 hover:shadow-md"
                            }`}
                        >
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={(checked) => handleToggle(doc.id, !!checked)}
                            id={doc.id}
                            disabled={!permissions.can_edit_proposals}
                            className="h-6 w-6 rounded-lg transition-all"
                          />
                          <label
                            htmlFor={doc.id}
                            className={`flex-1 text-sm cursor-pointer transition-all duration-300 ${isCompleted ? "line-through text-muted-foreground opacity-60" : "font-bold text-foreground"}`}
                          >
                            {doc.name}
                          </label>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-muted/50 text-muted-foreground/30 group-hover:bg-primary/10 group-hover:text-primary/40'}`}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <ClipboardList className="h-4 w-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Documentação</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Gestão de conformidade e checklists técnicos
            </p>
          </div>
        </div>
      </header>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileCheck, label: "Total Documentos", value: `${completedDocs}/${totalDocs}`, subValue: `${completionRate}% concluído`, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: CheckCircle2, label: "Propostas OK", value: proposalsComplete, subValue: "100% documentos", color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: AlertTriangle, label: "Incompletas", value: proposalsIncomplete, subValue: "Aguardando envio", color: "text-amber-600", bg: "bg-amber-50" },
          { icon: XCircle, label: "Críticas", value: pendingDocs, subValue: "Pendência total", color: "text-rose-600", bg: "bg-rose-50" },
        ].map((item, idx) => (
          <Card key={idx} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</p>
                <h3 className="font-heading font-extrabold text-2xl text-foreground">
                  {item.value}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">{item.subValue}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold font-heading text-foreground">Progresso de Conformidade</h3>
              <p className="text-xs text-muted-foreground font-medium">Percentual de documentos aprovados em toda a carteira</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-primary">
                {completionRate}%
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global</span>
            </div>
          </div>
          <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-lg shadow-primary/20"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-card/40 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-premium flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-xl border-border/40 bg-background/50 font-bold flex-1"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={docFilter} onValueChange={setDocFilter}>
            <SelectTrigger className="w-full md:w-44 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
              <SelectValue placeholder="Conformidade" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="all">Todos os Graus</SelectItem>
              <SelectItem value="completo">Completos</SelectItem>
              <SelectItem value="incompleto">Incompletos</SelectItem>
              <SelectItem value="critico">Críticos (&lt;50%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/40">
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Produtor</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Status da Proposta</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Conformidade (Checklist)</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest hidden md:table-cell">Linha PRONAF</TableHead>
              <TableHead className="py-4 px-6 w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <ClipboardList className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">Nenhuma proposta encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const pct = getCompletionPercent(p);
                const completed = p.documents.filter((d) => getDocCompleted(d)).length;
                const isCritical = pct < 50;

                return (
                  <TableRow
                    key={p.id}
                    className="group hover:bg-white/60 transition-colors cursor-pointer border-b border-border/40 last:border-0"
                    onClick={() => setSelectedProposalId(p.id)}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner">
                          {p.producer_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.producer_name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.producer_cpf}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-0 shadow-sm ${STATUS_COLORS[p.status as ProposalStatus]}`}>
                        {STATUS_LABELS[p.status as ProposalStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="space-y-1.5 min-w-[180px]">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <span>{pct}%</span>
                          <span>{completed}/{p.documents.length}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${isCritical ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'} shadow-lg`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px] font-bold border-border/40 bg-background/50 rounded-lg">
                        {PRONAF_LINE_LABELS[p.pronaf_line as PronafLine]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
                          <Eye className="h-5 w-5" />
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
    </div>
  );
}
