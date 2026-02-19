import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useProposals } from "@/hooks/useProposals";
import { useTeam } from "@/hooks/useTeam";
import { usePermissions } from "@/hooks/usePermissions";
import { STATUS_LABELS } from "@/types/proposal";
import {
  Settings, Users, BarChart3, Plus, Trash2, FileText, CalendarDays, TrendingUp, UserPlus, Bell, Loader2,
} from "lucide-react";

export default function Management() {
  const { proposals, loading: lp } = useProposals();
  const { members, loading: lt, addMember, removeMember } = useTeam();
  const { permissions } = usePermissions();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "" });

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) return;
    const colors = ["hsl(215, 70%, 32%)", "hsl(142, 71%, 35%)", "hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(0, 72%, 51%)", "hsl(280, 60%, 50%)"];
    await addMember({ ...newMember, color: colors[members.length % colors.length] });
    setNewMember({ name: "", role: "" });
    setIsAddMemberOpen(false);
  };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  if (lp || lt) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalValue = proposals.reduce((a, p) => a + Number(p.requested_value), 0);
  const statusCounts = proposals.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Gerenciamento</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Administração de equipe e métricas de desempenho
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-muted/40 p-1 text-muted-foreground backdrop-blur-md border border-border/50">
          <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md gap-2">
            <BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md gap-2" disabled={!permissions.can_manage_users}>
            <Users className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md gap-2" disabled={!permissions.can_manage_users}>
            <Settings className="h-4 w-4" /><span className="hidden sm:inline">Configuração</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, label: "Propostas Ativas", value: proposals.length, subValue: "Checklists em andamento", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: TrendingUp, label: "Volume Financeiro", value: `R$ ${(totalValue / 1000).toFixed(0)}k`, subValue: "Valor total solicitado", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Users, label: "Membros Ativos", value: members.length, subValue: "Equipe operacional", color: "text-amber-600", bg: "bg-amber-50" },
            ].map((item, idx) => (
              <Card key={idx} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-transform group-hover:rotate-12 duration-300 shrink-0`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{item.label}</p>
                    <h3 className="font-heading font-extrabold text-2xl text-foreground">
                      {item.value}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{item.subValue}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white/60 backdrop-blur-sm">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Distribuição de Propostas por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percentage = (count / proposals.length) * 100;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary/40" />
                        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{percentage.toFixed(0)}%</span>
                        <span className="text-xs font-black text-primary w-8 text-right">{count}</span>
                      </div>
                    </div>
                    <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden shadow-inner border border-border/20">
                      <div
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-lg shadow-primary/20"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
            <div>
              <h2 className="text-lg font-extrabold font-heading text-foreground">Membros da Equipe</h2>
              <p className="text-xs text-muted-foreground font-medium">Gerencie permissões e perfis de acesso</p>
            </div>
            {permissions.can_manage_users && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                    <UserPlus className="h-4 w-4" /> Novo Membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
                  <DialogHeader className="p-6 bg-primary text-primary-foreground">
                    <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
                      <UserPlus className="h-6 w-6" /> Adicionar Membro
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-8 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                      <Input
                        value={newMember.name}
                        onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: João Silva"
                        className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Função Operacional</Label>
                      <Select value={newMember.role} onValueChange={(v) => setNewMember((p) => ({ ...p, role: v }))}>
                        <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/10 font-bold">
                          <SelectValue placeholder="Selecione o cargo..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-premium">
                          {["Gerente", "Analista", "Técnico", "Assistente", "Estagiário"].map((r) => (
                            <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold">Cancelar</Button>
                      <Button
                        onClick={handleAddMember}
                        disabled={!newMember.name || !newMember.role}
                        className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-black"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.length === 0 ? (
              <div className="md:col-span-2 py-20 text-center bg-muted/10 rounded-3xl border border-dashed border-border/60">
                <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">Nenhum membro cadastrado</p>
              </div>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-white/60 backdrop-blur-sm border border-border/40">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                          <AvatarFallback className="font-black text-sm rounded-2xl" style={{ backgroundColor: member.color, color: "white" }}>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{member.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-bold h-7 px-3 border-border/20 bg-muted/30 rounded-lg">
                        {member.role}
                      </Badge>
                      {permissions.can_manage_users && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 animate-in slide-in-from-bottom-2">
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-white/60 backdrop-blur-sm">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Bell className="h-5 w-5" /> Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[
                { label: "Alertas Críticos", desc: "Receber notificações urgentes sobre propostas pendentes ou atrasadas." },
                { icon: FileText, label: "Relatórios de Desempenho", desc: "Resumo semanal automatizado das atividades da equipe." },
                { icon: Users, label: "Atualizações do Time", desc: "Notificar quando novos membros forem adicionados ou removidos." },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start justify-between group p-3 rounded-2xl hover:bg-muted/30 transition-all">
                  <div className="space-y-1">
                    <p className="font-extrabold text-foreground text-sm flex items-center gap-2">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium max-w-md">{item.desc}</p>
                  </div>
                  <Switch
                    disabled={!permissions.can_manage_users}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
