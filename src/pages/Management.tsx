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
import { useVisits } from "@/hooks/useVisits";
import { useTeam } from "@/hooks/useTeam";
import { usePermissions } from "@/hooks/usePermissions";
import { STATUS_LABELS } from "@/types/proposal";
import {
  Settings, Users, BarChart3, Plus, Trash2, FileText, CalendarDays, TrendingUp, UserPlus, Bell, Loader2,
} from "lucide-react";

export default function Management() {
  const { proposals, loading: lp } = useProposals();
  const { visits, loading: lv } = useVisits();
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

  if (lp || lv || lt) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const totalValue = proposals.reduce((a, p) => a + Number(p.requested_value), 0);
  const statusCounts = proposals.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-heading">Gerenciamento</h1>
        <p className="text-sm text-muted-foreground mt-1">Controle e administração</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" /><span className="hidden sm:inline">Visão Geral</span></TabsTrigger>
          <TabsTrigger value="team" className="gap-2" disabled={!permissions.can_manage_users}><Users className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span></TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" disabled={!permissions.can_manage_users}><Settings className="h-4 w-4" /><span className="hidden sm:inline">Config</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: "Propostas", value: proposals.length, color: "primary" },
              { icon: TrendingUp, label: "Valor Total", value: `${(totalValue / 1000).toFixed(0)}k`, color: "success" },
              { icon: CalendarDays, label: "Visitas", value: visits.length, color: "info" },
              { icon: Users, label: "Membros", value: members.length, color: "warning" },
            ].map((item) => (
              <Card key={item.label} className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-${item.color}/10 flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 text-${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold font-heading">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-sm font-heading">Propostas por Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm w-32 text-muted-foreground">{STATUS_LABELS[status as keyof typeof STATUS_LABELS]}</span>
                  <div className="flex-1"><Progress value={(count / proposals.length) * 100} className="h-2" /></div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-heading font-semibold">Membros da Equipe</h2>
            {permissions.can_manage_users && (
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> Adicionar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-heading">Novo Membro</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div><Label>Nome</Label><Input value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} placeholder="Nome completo" /></div>
                    <div><Label>Cargo</Label>
                      <Select value={newMember.role} onValueChange={(v) => setNewMember((p) => ({ ...p, role: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecionar cargo" /></SelectTrigger>
                        <SelectContent>
                          {["Gerente", "Analista", "Técnico", "Assistente", "Estagiário"].map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddMember} disabled={!newMember.name || !newMember.role} className="w-full">Adicionar Membro</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <Card className="border-0 shadow-md"><CardContent className="p-8 text-center text-muted-foreground">Nenhum membro cadastrado</CardContent></Card>
            ) : (
              members.map((member) => (
                <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="font-bold text-sm" style={{ backgroundColor: member.color, color: "white" }}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-sm">{member.name}</h3>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{member.role}</Badge>
                      {permissions.can_manage_users && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeMember(member.id)}>
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

        <TabsContent value="settings" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle className="text-sm font-heading flex items-center gap-2"><Bell className="h-4 w-4" /> Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Notificações por E-mail", desc: "Receber alertas por e-mail" },
                { label: "Lembretes de Tarefas", desc: "Avisos de prazos próximos" },
                { label: "Relatório Semanal", desc: "Resumo semanal por e-mail" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch disabled={!permissions.can_manage_users} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
