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
import { usePermissions } from "@/hooks/usePermissions";
import {
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_STATUS_LABELS,
  type TaskPriority, type TaskStatus,
} from "@/types/proposal";
import {
  Plus, ClipboardList, Loader2, Clock, User, ListFilter, AlertTriangle,
  CheckCircle2, MessageSquare, Send, ArrowRight, Columns3, Filter, Search,
} from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TaskCard } from "@/components/tasks/TaskCard";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { permissions } = usePermissions();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [taskMemberFilter, setTaskMemberFilter] = useState<string>("all");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
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
      const matchesSearch = !taskSearchTerm ||
        t.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(taskSearchTerm.toLowerCase()));
      return matchesStatus && matchesMember && matchesSearch;
    });
  }, [tasks, taskFilter, taskMemberFilter, taskSearchTerm]);

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

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Gestão de Tarefas</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Monitoramento de atividades e prazos internos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-background/50 backdrop-blur rounded-xl border border-border/40 shadow-inner mr-2">
            <Button
              variant={viewMode === "board" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("board")}
              className={`rounded-lg gap-1.5 text-[10px] font-black uppercase tracking-widest h-9 px-4 transition-all ${viewMode === 'board' ? 'shadow-lg shadow-primary/20' : ''}`}
            >
              <Columns3 className="h-3.5 w-3.5" /> Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`rounded-lg gap-1.5 text-[10px] font-black uppercase tracking-widest h-9 px-4 transition-all ${viewMode === 'list' ? 'shadow-lg shadow-primary/20' : ''}`}
            >
              <ListFilter className="h-3.5 w-3.5" /> Lista
            </Button>
          </div>

          {permissions.can_manage_tasks && (
            <Button
              onClick={() => setIsNewTaskOpen(true)}
              className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold text-xs px-5 h-11"
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
            </Button>
          )}
        </div>
      </header>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: ClipboardList, label: "Pendentes", value: pendingTasks, color: "text-amber-600", bg: "bg-amber-50" },
          { icon: Clock, label: "Em Andamento", value: inProgressTasks, color: "text-blue-600", bg: "bg-blue-50" },
          { icon: CheckCircle2, label: "Concluídas", value: completedTasks, color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: AlertTriangle, label: "Atrasadas", value: overdueTasks, color: "text-rose-600", bg: "bg-rose-50" },
          { icon: MessageSquare, label: "Eficiência", value: `${totalProgress}%`, color: "text-primary", bg: "bg-primary/10", isProgress: true },
        ].map((item, idx) => (
          <Card key={idx} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <item.icon className="h-5 w-5" />
                </div>
                {item.isProgress && <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Média</div>}
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</p>
                {item.isProgress ? (
                  <div className="space-y-2 mt-2">
                    <h3 className="font-heading font-extrabold text-2xl text-foreground">{item.value}</h3>
                    <Progress value={totalProgress} className="h-1.5" />
                  </div>
                ) : (
                  <h3 className="font-heading font-extrabold text-2xl text-foreground">
                    {item.value}
                  </h3>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card/40 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-premium flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Filter className="h-4 w-4" />
          </div>
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefa..."
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/40 bg-background/50 focus:bg-background transition-all font-medium"
              />
            </div>

            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="w-full md:w-56 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-premium">
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={taskMemberFilter} onValueChange={setTaskMemberFilter}>
              <SelectTrigger className="w-full md:w-56 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
                <SelectValue placeholder="Membro" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-premium">
                <SelectItem value="all">Todos os Membros</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-full md:w-auto">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">Resultados:</span>
          <span className="text-sm font-black text-primary">{filteredTasks.length}</span>
        </div>
      </div>

      {/* Board View */}
      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            const columnColor = col.key === 'pendente' ? 'from-amber-500/10' : col.key === 'em_andamento' ? 'from-blue-500/10' : 'from-emerald-500/10';

            return (
              <div
                key={col.key}
                className={`flex flex-col rounded-3xl bg-card/40 border border-border/50 shadow-premium overflow-hidden transition-all duration-500`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div className={`p-4 flex items-center justify-between border-b border-border/40 bg-gradient-to-r ${columnColor} to-transparent`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${col.key === 'pendente' ? 'text-amber-600 bg-amber-100' : col.key === 'em_andamento' ? 'text-blue-600 bg-blue-100' : 'text-emerald-600 bg-emerald-100'}`}>
                      {col.icon}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{col.label}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-background/80 shadow-sm border-0 font-bold px-2.5 h-6">
                    {colTasks.length}
                  </Badge>
                </div>

                <ScrollArea className="flex-1 min-h-[500px] p-4">
                  <div className="space-y-4">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        member={getMemberById(task.assigned_to)}
                        onClick={openTaskDetail}
                        onDragStart={handleDragStart}
                      />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="py-20 text-center space-y-3 opacity-40">
                        <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground mx-auto flex items-center justify-center">
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Arraste tarefas aqui</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 p-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted/20 mx-auto flex items-center justify-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const member = getMemberById(task.assigned_to);
              const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";
              return (
                <div
                  key={task.id}
                  className={`group flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/40 hover:bg-white hover:shadow-premium transition-all duration-300 cursor-pointer ${isOverdue ? "ring-1 ring-destructive/20 border-destructive/20" : ""}`}
                  onClick={() => openTaskDetail(task.id)}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'pendente' ? 'text-amber-600 bg-amber-100/50' : task.status === 'em_andamento' ? 'text-blue-600 bg-blue-100/50' : 'text-emerald-600 bg-emerald-100/50'}`}>
                    {task.status === 'pendente' ? <ClipboardList className="h-6 w-6" /> : task.status === 'em_andamento' ? <Clock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-base font-bold truncate group-hover:text-primary transition-colors ${task.status === "concluida" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-0 shadow-sm ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || "bg-muted text-muted-foreground"}`}>
                          {TASK_PRIORITY_LABELS[task.priority as TaskPriority] || task.priority}
                        </Badge>

                        <div className="hidden md:block">
                          <Select
                            value={task.status}
                            onValueChange={(v) => handleStatusChange(task.id, v)}
                            disabled={!permissions.can_manage_tasks}
                          >
                            <SelectTrigger className="h-9 w-40 rounded-xl border-border/40 bg-background/50 font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-premium">
                              {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      {member && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-primary/10">
                            <AvatarFallback className="text-[9px] font-black" style={{ backgroundColor: member.color, color: "white" }}>
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">{member.name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-muted/30 text-muted-foreground'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-mono font-bold">{format(parseISO(task.due_date), "dd/MM/yyyy")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-bold">Atividade</span>
                      </div>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/10">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )
      }

      {/* Task Detail Dialog with Comments */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTaskId(null); }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-background font-sans flex flex-col max-h-[90vh]">
          {selectedTask && (
            <>
              <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ClipboardList className="h-32 w-32 -mr-8 -mt-8" />
                </div>
                <DialogHeader className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-0 shadow-lg shadow-black/10 ${TASK_PRIORITY_COLORS[selectedTask.priority as TaskPriority]}`}>
                      {TASK_PRIORITY_LABELS[selectedTask.priority as TaskPriority]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border-primary-foreground/30 text-primary-foreground">
                      {TASK_STATUS_LABELS[selectedTask.status as TaskStatus]}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl font-bold font-heading">
                    {selectedTask.title}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-8 space-y-8">
                  {selectedTask.description && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</Label>
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status da Atividade</Label>
                      <Select
                        value={selectedTask.status}
                        onValueChange={(v) => handleStatusChange(selectedTask.id, v)}
                        disabled={!permissions.can_manage_tasks}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-border/40 bg-white font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-premium">
                          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prazo de Entrega</Label>
                      <div className={`h-12 rounded-xl border border-border/40 bg-muted/10 flex items-center px-4 gap-3 ${selectedTask.due_date && isPast(new Date(selectedTask.due_date)) && selectedTask.status !== 'concluida' ? 'text-destructive border-destructive/20 bg-destructive/5' : 'text-foreground'}`}>
                        <Clock className="h-4 w-4 opacity-60" />
                        <span className="text-sm font-bold font-mono">
                          {selectedTask.due_date ? format(parseISO(selectedTask.due_date), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Sem prazo definido"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/40" />

                  {/* Comments Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Atividade e Comentários
                      </h4>
                      <Badge variant="secondary" className="font-bold">{comments.length}</Badge>
                    </div>

                    <div className="space-y-4">
                      {loadingComments ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Carregando histórico...</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {comments.length === 0 && (
                            <div className="py-12 text-center bg-muted/10 rounded-2xl border border-dashed border-border/40">
                              <p className="text-sm text-muted-foreground italic">Nenhuma interação registrada ainda.</p>
                            </div>
                          )}
                          {comments.map((c) => {
                            const cmember = getMemberById(c.member_id);
                            const isMe = user?.id === c.user_id;
                            return (
                              <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="h-8 w-8 shrink-0 border border-border/40 shadow-sm">
                                  <AvatarFallback className="text-[10px] font-black" style={cmember ? { backgroundColor: cmember.color, color: "white" } : {}}>
                                    {cmember ? getInitials(cmember.name) : "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                                  <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20' : 'bg-muted/50 text-foreground rounded-tl-none border border-border/40'}`}>
                                    <p className="leading-relaxed">{c.content}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 px-1">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">{cmember?.name || "Usuário"}</span>
                                    <span className="text-[8px] font-medium text-muted-foreground/60">{format(parseISO(c.created_at), "HH:mm")}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="relative group pt-2">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendComment()}
                          placeholder="Escreva uma atualização para a equipe..."
                          className="pr-14 h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all"
                        />
                        <Button
                          size="icon"
                          onClick={sendComment}
                          disabled={!newComment.trim()}
                          className="absolute right-2 top-[calc(50%+4px)] -translate-y-1/2 h-8 w-8 rounded-xl shadow-lg shadow-primary/20"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-muted/30 border-t border-border/40">
                <Button variant="outline" onClick={() => setSelectedTaskId(null)} className="h-11 px-8 rounded-xl font-bold border-border/40">
                  Fechar Detalhes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-0 rounded-3xl shadow-2xl bg-background font-sans">
          <div className="bg-primary p-6 text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Plus className="h-32 w-32 -mr-8 -mt-8" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold font-heading">
                Nova Tarefa
              </DialogTitle>
              <p className="text-primary-foreground/80 text-sm">Organize as atividades da sua equipe de forma eficiente.</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título da Tarefa</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Coletar DAP atualizada..."
                className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Descreva os detalhes da tarefa..."
                className="rounded-2xl border-border/40 bg-muted/10 focus:bg-background resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Atribuir a</Label>
                <Select value={newTask.assigned_to || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, assigned_to: v || null }))}>
                  <SelectTrigger className="h-11 rounded-xl border-border/40"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    {members.map((m) => <SelectItem key={m.id} value={m.id} className="rounded-lg">{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger className="h-11 rounded-xl border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="rounded-lg">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Proposta Vinculada</Label>
                <Select value={newTask.proposal_id || ""} onValueChange={(v) => setNewTask((p) => ({ ...p, proposal_id: v || null }))}>
                  <SelectTrigger className="h-11 rounded-xl border-border/40"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40">
                    {proposals.map((p) => <SelectItem key={p.id} value={p.id} className="rounded-lg">{p.producer_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Limite</Label>
                <Input
                  type="date"
                  value={newTask.due_date || ""}
                  onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value || null }))}
                  className="h-11 rounded-xl border-border/40 bg-muted/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t border-border/40 gap-3">
            <Button variant="outline" onClick={() => setIsNewTaskOpen(false)} className="h-12 px-8 rounded-xl font-bold border-border/40">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTask.title.trim()}
              className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-extrabold text-xs uppercase tracking-widest"
            >
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
