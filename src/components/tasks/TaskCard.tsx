import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MessageSquare, User, AlertCircle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, type TaskPriority } from "@/types/proposal";

interface TaskCardProps {
    task: any;
    member: any;
    onClick: (taskId: string) => void;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

export const TaskCard = memo(({ task, member, onClick, onDragStart }: TaskCardProps) => {
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "concluida";

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onClick={() => onClick(task.id)}
            className={`group p-5 rounded-3xl bg-white/70 backdrop-blur-sm border border-border/40 shadow-sm hover:shadow-premium-hover hover:border-primary/40 transition-all duration-300 cursor-pointer relative overflow-hidden ${isOverdue ? "ring-1 ring-destructive/20 border-destructive/20" : ""}`}
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <h4 className={`text-sm font-bold leading-snug group-hover:text-primary transition-colors ${task.status === "concluida" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                </h4>
                <Badge className={`text-[9px] font-black uppercase tracking-widest shrink-0 px-2.5 py-1 rounded-full border-0 shadow-sm transition-transform group-hover:scale-105 ${TASK_PRIORITY_COLORS[task.priority as TaskPriority] || "bg-muted text-muted-foreground"}`}>
                    {TASK_PRIORITY_LABELS[task.priority as TaskPriority] || task.priority}
                </Badge>
            </div>

            {task.description && (
                <p className="text-xs text-muted-foreground mb-5 line-clamp-2 leading-relaxed font-medium">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-border/60">
                <div className="flex items-center gap-2">
                    {member ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-primary/10 shadow-sm">
                                <AvatarFallback className="text-[9px] font-black" style={{ backgroundColor: member.color, color: "white" }}>
                                    {getInitials(member.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{member.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {task.due_date && (
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition-colors ${isOverdue ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-muted/50 text-muted-foreground border border-border/40'}`}>
                            {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span className="text-[10px] font-mono font-black">{format(parseISO(task.due_date), "dd/MM")}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                        <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>

            {isOverdue && (
                <div className="absolute top-0 right-0 h-1.5 w-full bg-gradient-to-r from-destructive/40 to-destructive/10" />
            )}
        </div>
    );
});

TaskCard.displayName = "TaskCard";
