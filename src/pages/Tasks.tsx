import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import {
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS,
  type TaskPriority,
} from "@/types/proposal";
import {
  Plus, ClipboardList, Loader2, Clock, User, ListFilter, AlertTriangle, CheckCircle2, Trash2,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

export default function Tasks() {
  const { proposals, loading: loadingP } = useProposals();
  const { members, tasks, loading: loadingT, createTask, updateTaskStatus } = useTeam();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskMemberFilter, setTaskMemberFilter] = useState<string>("all");
  const [newTask, setNewTask] = useState({
    title: "", description: "", assigned_to: null as string | null,
    priority: "media", due_date: null as string | null, proposal_id: null as string | null,
    document_name: "", status: "pendente",
  });

  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;
  const inProgressTasks = tasks.filter((t) => t.status === "em_andamento").length;
  const completedTasks = tasks.filter((t) => t.status === "concluida").length;
  const overdueTasks = tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "concluida").length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesStatus = taskFilter === "all" || t.status === taskFilter;
      const matchesMember = taskMemberFilter === "all" || t.assigned_to === taskMemberFilter;
      return matchesStatus && matchesMember;
    });
  }, [tasks, taskFilter, taskMemberFilter]);

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
  const getMemberById = (id?: string | null) => members.find((m) => m.id === id);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask(newTask as any);
    setNewTask({ title: "", description: "", assigned_to: null, priority: "media", due_date: null, proposal_id: null, document_name: "", status: "pendente" });
    setIsNewTaskOpen(false);
  };

  if (loadingP || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Gestão de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle completo de atividades da equipe</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shadow-md shadow-primary/20"><Plus className="h-4 w-4" /> Nova Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-heading">Criar Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Título *</Label>
                <Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} placeholder="Ex: Coletar DAP atualizada" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Atribuir a</Label>
                  <Select value={newTask.assigned_to || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, assigned_to: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Proposta vinculada</Label>
                  <Select value={newTask.proposal_id || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, proposal_id: v || null }))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{proposals.map((p) => <SelectItem key={p.id} value={p.id}>{p.producer_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input type="date" value={newTask.due_date || ""} onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value || null }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>Criar Tarefa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendentes</p>
            </div>
            <p className="text-lg font-bold font-heading">{pendingTasks}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-info" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Em Andamento</p>
            </div>
            <p className="text-lg font-bold font-heading">{inProgressTasks}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concluídas</p>
            </div>
            <p className="text-lg font-bold font-heading">{completedTasks}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Atrasadas</p>
            </div>
            <p className="text-lg font-bold font-heading">{overdueTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <ListFilter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={taskMemberFilter} onValueChange={setTaskMemberFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <User className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Membros</SelectItem>
                {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-8 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tarefa encontrada</p>
              <p className="text-xs mt-1">Crie uma nova tarefa para começar</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const member = getMemberById(task.assigned_to);
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";
            const linkedProposal = task.proposal_id ? proposals.find((p) => p.id === task.proposal_id) : null;

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
                          <h3 className={`text-sm font-medium ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`text-[10px] ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || "bg-muted text-muted-foreground"}`}>
                            {TASK_PRIORITY_LABELS[task.priority as TaskPriority] || task.priority}
                          </Badge>
                          <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v)}>
                            <SelectTrigger className="h-7 w-28 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
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
                          <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            <Clock className="h-3 w-3" />
                            {format(parseISO(task.due_date), "dd/MM/yyyy")}
                          </span>
                        )}
                        {linkedProposal && (
                          <Badge variant="outline" className="text-[10px]">
                            {linkedProposal.producer_name}
                          </Badge>
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
    </div>
  );
}
