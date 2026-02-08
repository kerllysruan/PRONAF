import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import {
  STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS,
  PRONAF_LINE_LABELS, STATUS_COLORS, ProposalStatus, PronafLine,
} from "@/types/proposal";
import {
  Search, Plus, ClipboardList, Users, ListFilter, FileCheck, Clock, User, Loader2,
  AlertTriangle, CheckCircle2, XCircle, BarChart3, ArrowLeft, Eye,
} from "lucide-react";

export default function Documentation() {
  const { proposals, loading: loadingP, toggleDocument } = useProposals();
  const { members, tasks, loading: loadingT, createTask, updateTaskStatus } = useTeam();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskMemberFilter, setTaskMemberFilter] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: "", description: "", assigned_to: null as string | null,
    priority: "media", due_date: null as string | null, proposal_id: null as string | null,
    document_name: "", status: "pendente",
  });

  // Panorama calculations
  const totalDocs = proposals.reduce((a, p) => a + p.documents.length, 0);
  const completedDocs = proposals.reduce((a, p) => a + p.documents.filter((d) => d.completed).length, 0);
  const pendingDocs = totalDocs - completedDocs;
  const completionRate = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  const proposalsComplete = proposals.filter((p) => p.documents.length > 0 && p.documents.every((d) => d.completed)).length;
  const proposalsIncomplete = proposals.filter((p) => p.documents.length > 0 && !p.documents.every((d) => d.completed)).length;
  const proposalsNoDoc = proposals.filter((p) => p.documents.length === 0).length;

  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;
  const overdueTasks = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "concluida").length;

  // Proposals with critical doc issues (< 50% complete)
  const criticalProposals = proposals.filter((p) => {
    if (p.documents.length === 0) return false;
    const pct = p.documents.filter((d) => d.completed).length / p.documents.length;
    return pct < 0.5;
  });

  // Filter proposals list
  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const matchesSearch = p.producer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.producer_cpf.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      if (filter === "all") return matchesSearch && matchesStatus;
      if (filter === "completo") return matchesSearch && matchesStatus && p.documents.every((d) => d.completed);
      if (filter === "incompleto") return matchesSearch && matchesStatus && !p.documents.every((d) => d.completed);
      if (filter === "critico") {
        const pct = p.documents.length > 0 ? p.documents.filter((d) => d.completed).length / p.documents.length : 0;
        return matchesSearch && matchesStatus && pct < 0.5;
      }
      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, filter, statusFilter]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesStatus = taskFilter === "all" || t.status === taskFilter;
      const matchesMember = taskMemberFilter === "all" || t.assigned_to === taskMemberFilter;
      return matchesStatus && matchesMember;
    });
  }, [tasks, taskFilter, taskMemberFilter]);

  const getCompletionPercent = (p: any) => {
    if (p.documents.length === 0) return 0;
    return Math.round((p.documents.filter((d: any) => d.completed).length / p.documents.length) * 100);
  };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  const getMemberById = (id?: string | null) => members.find((m) => m.id === id);

  const selectedProposal = selectedProposalId ? proposals.find((p) => p.id === selectedProposalId) : null;

  const handleCreateTask = async () => {
    await createTask(newTask as any);
    setNewTask({ title: "", description: "", assigned_to: null, priority: "media", due_date: null, proposal_id: null, document_name: "", status: "pendente" });
    setIsNewTaskOpen(false);
  };

  if (loadingP || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Individual proposal document view
  if (selectedProposal) {
    const percent = getCompletionPercent(selectedProposal);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedProposalId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading">Documentos da Proposta</h1>
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
              <p className="text-xs text-muted-foreground">Completude dos Documentos</p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={percent} className="h-2 flex-1" />
                <span className="text-sm font-bold text-primary">{percent}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-heading">Checklist de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedProposal.documents.map((doc) => (
                <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border ${doc.completed ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
                  <Checkbox
                    checked={doc.completed}
                    onCheckedChange={(checked) => toggleDocument(doc.id, !!checked)}
                    id={doc.id}
                  />
                  <label htmlFor={doc.id} className={`text-sm cursor-pointer flex-1 ${doc.completed ? "line-through text-muted-foreground" : "font-medium"}`}>
                    {doc.name}
                  </label>
                  {doc.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading">Controle de Documentação</h1>
          <p className="text-sm text-muted-foreground mt-1">Panorama completo e gestão de documentos</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shadow-md shadow-primary/20"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Criar Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Título</Label><Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Coletar DAP atualizada" /></div>
              <div><Label>Descrição</Label><Textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Atribuir a</Label>
                  <Select value={newTask.assigned_to || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, assigned_to: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Proposta</Label>
                  <Select value={newTask.proposal_id || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, proposal_id: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{proposals.map((p) => (<SelectItem key={p.id} value={p.id}>{p.producer_name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Prazo</Label><Input type="date" value={newTask.due_date || ""} onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value || null }))} /></div>
              </div>
              <Button onClick={handleCreateTask} disabled={!newTask.title} className="w-full">Criar Tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Panorama Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: FileCheck, label: "Documentos", value: `${completedDocs}/${totalDocs}`, sub: `${completionRate}% completo` },
          { icon: CheckCircle2, label: "Propostas Completas", value: proposalsComplete, sub: "todos docs OK" },
          { icon: AlertTriangle, label: "Incompletas", value: proposalsIncomplete, sub: "faltam docs" },
          { icon: ClipboardList, label: "Tarefas Pendentes", value: pendingTasks, sub: "a fazer" },
          { icon: Clock, label: "Atrasadas", value: overdueTasks, sub: "prazo vencido" },
          { icon: Users, label: "Equipe", value: members.length, sub: "membros" },
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

      {/* Overall Progress */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold font-heading">Progresso Geral de Documentação</h3>
            <span className="text-sm font-bold text-primary">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedDocs} entregues</span>
            <span>{pendingDocs} pendentes</span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {criticalProposals.length > 0 && (
        <Card className="border-0 shadow-md ring-1 ring-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Propostas com Documentação Crítica (&lt;50%)</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalProposals.map((p) => (
                <Badge
                  key={p.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-destructive/10 border-destructive/30"
                  onClick={() => setSelectedProposalId(p.id)}
                >
                  {p.producer_name} — {getCompletionPercent(p)}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Propostas</span></TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">Tarefas</span></TabsTrigger>
          <TabsTrigger value="overview" className="gap-2"><FileCheck className="h-4 w-4" /><span className="hidden sm:inline">Visão Geral</span></TabsTrigger>
        </TabsList>

        {/* Proposals Tab - Search first, then select */}
        <TabsContent value="proposals" className="space-y-4">
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
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filter} onValueChange={setFilter}>
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
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma proposta encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((p) => {
                        const pct = getCompletionPercent(p);
                        const completed = p.documents.filter((d) => d.completed).length;
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
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={taskFilter} onValueChange={setTaskFilter}>
                  <SelectTrigger className="w-full sm:w-48"><ListFilter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={taskMemberFilter} onValueChange={setTaskMemberFilter}>
                  <SelectTrigger className="w-full sm:w-48"><User className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Membros</SelectItem>
                    {members.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <Card className="border-0 shadow-md"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma tarefa encontrada</CardContent></Card>
            ) : (
              filteredTasks.map((task) => {
                const member = getMemberById(task.assigned_to);
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "concluida";
                return (
                  <Card key={task.id} className={`border-0 shadow-sm hover:shadow-md transition-all ${isOverdue ? "ring-1 ring-destructive/30" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.status === "concluida"}
                          onCheckedChange={(checked) => updateTaskStatus(task.id, checked ? "concluida" : "pendente")}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className={`text-sm font-medium ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                              {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                            </div>
                            <Badge className={`text-[10px] ${TASK_PRIORITY_COLORS[task.priority as keyof typeof TASK_PRIORITY_COLORS] || ""}`}>
                              {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS] || task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {member && (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px] font-medium" style={{ backgroundColor: member.color, color: "white" }}>
                                    {getInitials(member.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{member.name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                📅 {task.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Overview Tab - All proposals with doc progress */}
        <TabsContent value="overview" className="space-y-4">
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <Card className="border-0 shadow-md"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma proposta cadastrada</CardContent></Card>
            ) : (
              proposals.map((p) => {
                const pct = getCompletionPercent(p);
                const completed = p.documents.filter((d) => d.completed).length;
                const pending = p.documents.filter((d) => !d.completed);
                return (
                  <Card key={p.id} className={`border-0 shadow-md ${pct < 50 ? "ring-1 ring-destructive/20" : pct === 100 ? "ring-1 ring-success/20" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">{p.producer_name}</h3>
                            <p className="text-xs text-muted-foreground">{p.producer_cpf}</p>
                          </div>
                          <Badge className={`${STATUS_COLORS[p.status as ProposalStatus]} text-[10px]`}>
                            {STATUS_LABELS[p.status as ProposalStatus]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{pct}%</span>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedProposalId(p.id)} className="gap-1">
                            <Eye className="h-3 w-3" /> Ver
                          </Button>
                        </div>
                      </div>
                      <Progress value={pct} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{completed}/{p.documents.length} documentos</span>
                        {pending.length > 0 && (
                          <span className="text-destructive">
                            Faltam: {pending.slice(0, 3).map((d) => d.name).join(", ")}{pending.length > 3 ? ` +${pending.length - 3}` : ""}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
