import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, UserPlus, Pencil, Trash2, Key, Loader2, Users, Lock, Eye,
} from "lucide-react";

interface ManagedUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  role: string;
  permissions: Record<string, boolean> | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  usuario: "Usuário",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  gerente: "bg-warning/10 text-warning border-warning/20",
  usuario: "bg-info/10 text-info border-info/20",
};

const PERMISSION_LABELS: Record<string, string> = {
  can_view_dashboard: "Ver Dashboard",
  can_view_proposals: "Ver Propostas",
  can_view_kanban: "Ver Kanban",
  can_view_documentation: "Ver Documentação",
  can_view_visits: "Ver Agenda",
  can_view_management: "Ver Gerenciamento",
  can_view_access_control: "Ver Controle de Acesso",
  can_create_proposals: "Criar Propostas",
  can_edit_proposals: "Editar Propostas",
  can_delete_proposals: "Excluir Propostas",
  can_approve_proposals: "Aprovar/Negar Propostas",
  read_only: "Somente Leitura",
};

const PERMISSION_GROUPS = {
  "Acesso às Páginas": [
    "can_view_dashboard", "can_view_proposals", "can_view_kanban",
    "can_view_documentation", "can_view_visits", "can_view_management", "can_view_access_control",
  ],
  "Ações em Propostas": [
    "can_create_proposals", "can_edit_proposals", "can_delete_proposals", "can_approve_proposals",
  ],
  "Modo": ["read_only"],
};

export default function AccessControl() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, boolean>>({});
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", display_name: "", role: "usuario" });
  const [saving, setSaving] = useState(false);

  const callAdmin = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-users", {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ action: "list" });
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) return;
    setSaving(true);
    try {
      await callAdmin({ action: "create", ...newUser });
      toast({ title: "Usuário criado com sucesso!" });
      setIsCreateOpen(false);
      setNewUser({ email: "", password: "", display_name: "", role: "usuario" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await callAdmin({ action: "update_role", user_id: userId, role });
      toast({ title: "Perfil atualizado!" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const openPermissions = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditPerms(user.permissions || {});
    setIsPermOpen(true);
  };

  const handleSavePerms = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const { id, user_id, created_at, updated_at, ...perms } = editPerms as any;
      await callAdmin({ action: "update_permissions", user_id: selectedUser.id, permissions: perms });
      toast({ title: "Permissões atualizadas!" });
      setIsPermOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const openPassword = (user: ManagedUser) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsPasswordOpen(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    setSaving(true);
    try {
      await callAdmin({ action: "update_password", user_id: selectedUser.id, password: newPassword });
      toast({ title: "Senha alterada com sucesso!" });
      setIsPasswordOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await callAdmin({ action: "delete", user_id: userId });
      toast({ title: "Usuário excluído." });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const getInitials = (name: string) => name?.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase() || "?";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">Controle de Acesso</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerenciamento de usuários e permissões</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Usuários", value: users.length, icon: Users },
          { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Shield },
          { label: "Somente Leitura", value: users.filter((u) => u.permissions?.read_only).length, icon: Eye },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold font-heading">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="w-48">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                            {getInitials(u.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{u.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Permissões" onClick={() => openPermissions(u)}>
                          <Lock className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Alterar Senha" onClick={() => openPassword(u)}>
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Excluir" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Criar Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nome</Label><Input value={newUser.display_name} onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))} placeholder="Nome completo" /></div>
            <div><Label>E-mail *</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            <div><Label>Senha *</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="Mínimo 6 caracteres" minLength={6} /></div>
            <div><Label>Perfil</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving || !newUser.email || !newUser.password}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Permissões — {selectedUser?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group}</h3>
                <div className="space-y-3">
                  {keys.map((key) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm font-normal">{PERMISSION_LABELS[key]}</Label>
                      <Switch
                        checked={!!editPerms[key]}
                        onCheckedChange={(v) => setEditPerms((p) => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePerms} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Permissões"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Alterar Senha — {selectedUser?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={saving || newPassword.length < 6}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
