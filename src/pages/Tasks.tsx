import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS,
  type TaskPriority, type TaskStatus,
} from "@/types/proposal";
import {
  Plus, ClipboardList, Loader2, Clock, User, ListFilter, AlertTriangle,
  CheckCircle2, MessageSquare, Send, ArrowRight, Columns3,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  member_id: string | null;
  content: string;
  created_at: string;
}

export default function Tasks() {
  const { user } = useAuth();
  const { proposals, loading: loadingP } = useProposals();
  const { members, tasks, loading: loadingT, createTask, updateTaskStatus } = useTeam();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskMemberFilter, setTaskMemberFilter] = useState<string>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("board");
  const [newTask, setNewTask] = useState({
    title: "", description: "", assigned_to: null as string | null,
    priority: "media", due_date: null as string | null, proposal_id: null as string | null,
    document_name: "", status: "pendente",
  });

  const pendingTasks = tasks.filter((t) => t.status === "pendente").length;
  const inProgressTasks = tasks.filter((t) => t.status === "em_andamento").length;
  const completedTasks = tasks.filter((t) => t.status === "concluida").length;
  const overdueTasks = tasks.filter((t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "concluida").length;
  const totalProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

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

  const openTaskDetail = useCallback(async (taskId: string) => {
    setSelectedTaskId(taskId);
    setLoadingComments(true);
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setComments((data as TaskComment[]) || []);
    setLoadingComments(false);
  }, []);

  const sendComment = async () => {
    if (!newComment.trim() || !selectedTaskId || !user) return;
    const { data, error } = await supabase.from("task_comments").insert({
      task_id: selectedTaskId,
      user_id: user.id,
      content: newComment.trim(),
    }).select().single();
    if (!error && data) {
      setComments((prev) => [...prev, data as TaskComment]);
      setNewComment("");
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await updateTaskStatus(taskId, status);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) await handleStatusChange(taskId, status);
  };

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  if (loadingP || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statusColumns: { key: TaskStatus; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "pendente", label: "Pendente", icon: <ClipboardList className="h-4 w-4" />, color: "border-t-warning" },
    { key: "em_andamento", label: "Em Andamento", icon: <ArrowRight className="h-4 w-4" />, color: "border-t-info" },
    { key: "concluida", label: "Concluída", icon: <CheckCircle2 className="h-4 w-4" />, color: "border-t-success" },
  ];

  const renderTaskCard = (task: typeof tasks[0]) => {
    const member = getMemberById(task.assigned_to);
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => openTaskDetail(task.id)}
        className={`p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer ${isOverdue ? "ring-1 ring-destructive/30" : ""}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className={`text-sm font-medium leading-tight ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </h4>
          <Badge className={`text-[9px] shrink-0 ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || "bg-muted text-muted-foreground"}`}>
            {TASK_PRIORITY_LABELS[task.priority as TaskPriority] || task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {member && (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[8px] font-medium" style={{ backgroundColor: member.color, color: "white" }}>
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
            )}
            {task.due_date && (
              <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                <Clock className="h-3 w-3" />
                {format(parseISO(task.due_date), "dd/MM")}
              </span>
            )}
          </div>
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Gestão de Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle completo com interação da equipe</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button variant={viewMode === "board" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("board")} className="rounded-none gap-1">
              <Columns3 className="h-4 w-4" /> Kanban
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-none gap-1">
              <ListFilter className="h-4 w-4" /> Lista
            </Button>
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
      </div>

      {/* Stats + Progress */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <Card className="border-0 shadow-md col-span-2 md:col-span-1">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Progresso</p>
            <div className="flex items-center gap-2">
              <Progress value={totalProgress} className="h-2 flex-1" />
              <span className="text-xs font-bold text-primary">{totalProgress}%</span>
            </div>
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

      {/* Board View */}
      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className={`rounded-xl border-t-4 ${col.color} bg-muted/20 p-3 min-h-[300px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h3 className="text-sm font-semibold font-heading">{col.label}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colTasks.map(renderTaskCard)}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">Arraste tarefas aqui</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma tarefa encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => {
              const member = getMemberById(task.assigned_to);
              const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";
              return (
                <Card key={task.id} className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isOverdue ? "ring-1 ring-destructive/30" : ""}`}
                  onClick={() => openTaskDetail(task.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`text-sm font-medium ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={`text-[10px] ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || "bg-muted text-muted-foreground"}`}>
                              {TASK_PRIORITY_LABELS[task.priority as TaskPriority] || task.priority}
                            </Badge>
                            <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                              <SelectTrigger className="h-7 w-28 text-xs" onClick={(e) => e.stopPropagation()}>
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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Task Detail Dialog with Comments */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg">{selectedTask.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge className={`text-xs ${TASK_PRIORITY_COLORS[selectedTask.priority as TaskPriority]}`}>
                    {TASK_PRIORITY_LABELS[selectedTask.priority as TaskPriority]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {TASK_STATUS_LABELS[selectedTask.status as TaskStatus]}
                  </Badge>
                  {selectedTask.due_date && (
                    <Badge variant="outline" className={`text-xs ${isPast(new Date(selectedTask.due_date)) && selectedTask.status !== "concluida" ? "border-destructive text-destructive" : ""}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {format(parseISO(selectedTask.due_date), "dd/MM/yyyy")}
                    </Badge>
                  )}
                </div>

                {/* Status change */}
                <div>
                  <Label className="text-xs">Alterar Status</Label>
                  <Select value={selectedTask.status} onValueChange={(v) => handleStatusChange(selectedTask.id, v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Comments */}
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Atividade da Equipe ({comments.length})
                  </h4>

                  {loadingComments ? (
                    <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {comments.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhum comentário ainda. Inicie a discussão!</p>
                      )}
                      {comments.map((c) => {
                        const cmember = getMemberById(c.member_id);
                        return (
                          <div key={c.id} className="flex gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="text-[8px]" style={cmember ? { backgroundColor: cmember.color, color: "white" } : {}}>
                                {cmember ? getInitials(cmember.name) : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted/50 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{cmember?.name || "Usuário"}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {format(parseISO(c.created_at), "dd/MM HH:mm")}
                                </span>
                              </div>
                              <p className="text-xs mt-1">{c.content}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="text-sm"
                      onKeyDown={(e) => e.key === "Enter" && sendComment()}
                    />
                    <Button size="icon" onClick={sendComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
