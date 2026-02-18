import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import {
  Shield, Plus, Trash2, Loader2, Users, Lock, AlertCircle,
  CheckCircle2, UserPlus, ShieldCheck, ShieldAlert,
  Eye, Edit3, Settings2, Fingerprint, DollarSign, Search,
  KeyRound, UserCog, ChevronRight, Activity, Building2, CheckSquare, Code2, FileText
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
  created_at: string;
  agency_id?: string;
}


type UserRole = "usuario" | "manager" | "analyst" | "financial" | "admin" | "developer";

interface UserPermission {
  [key: string]: string | boolean | undefined;
  user_id: string;
  can_view_dashboard?: boolean;
  can_view_proposals?: boolean;
  can_create_proposals?: boolean;
  can_edit_proposals?: boolean;
  can_delete_proposals?: boolean;
  can_approve_proposals?: boolean;
  can_view_access_control?: boolean;
  can_view_kanban?: boolean;
  can_view_documentation?: boolean;
  can_view_tasks?: boolean;
  can_manage_tasks?: boolean;
  can_view_disbursements?: boolean;
  can_manage_disbursements?: boolean;
  can_view_management?: boolean;
  can_manage_users?: boolean;
  can_view_agencies?: boolean;
  can_manage_agencies?: boolean;
  read_only?: boolean;
}

const PERMISSIONS = [
  { key: "can_view_dashboard", label: "Dashboard", group: "Visualização", icon: Eye },
  { key: "can_view_proposals", label: "Propostas", group: "Visualização", icon: Eye },
  { key: "can_view_kanban", label: "Kanban", group: "Visualização", icon: Eye },
  { key: "can_view_documentation", label: "Documentação", group: "Visualização", icon: Eye },
  { key: "can_view_tasks", label: "Tarefas", group: "Visualização", icon: Eye },
  { key: "can_view_disbursements", label: "Desembolsos", group: "Visualização", icon: Eye },
  { key: "can_view_management", label: "Gerenciamento", group: "Administração", icon: Settings2 },
  { key: "can_view_access_control", label: "Controle Acesso", group: "Administração", icon: ShieldCheck },
  { key: "can_manage_users", label: "Gestão Usuários", group: "Administração", icon: ShieldAlert },
  { key: "can_view_agencies", label: "Visualizar Agências", group: "Administração", icon: Building2 },
  { key: "can_manage_agencies", label: "Gerir Agências", group: "Administração", icon: Building2 },
  { key: "can_create_proposals", label: "Criar Propostas", group: "Operacional", icon: Edit3 },
  { key: "can_edit_proposals", label: "Editar Propostas", group: "Operacional", icon: Edit3 },
  { key: "can_delete_proposals", label: "Deletar Propostas", group: "Operacional", icon: Trash2 },
  { key: "can_approve_proposals", label: "Aprovar Propostas", group: "Operacional", icon: CheckCircle2 },
  { key: "can_manage_tasks", label: "Gerir Tarefas", group: "Equipe", icon: Edit3 },
  { key: "can_manage_disbursements", label: "Gerir Desembolsos", group: "Equipe", icon: DollarSign },
  { key: "read_only", label: "Somente Leitura", group: "Segurança", icon: Lock },
];

function AccessControl() {
  const { toast } = useToast();
  const { user: currentUser, isDeveloper } = useAuth();
  const { agencies } = useAgency();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Map<string, UserPermission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterAgency, setFilterAgency] = useState<string>("all");

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "", password: "", display_name: "", role: "usuario" as UserRole, agency_id: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [editPerms, setEditPerms] = useState<UserPermission>({ user_id: "" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [profilesRes, rolesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("updated_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("user_permissions").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (permsRes.error) throw permsRes.error;

      const rolesMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
      const permsMap = new Map((permsRes.data || []).map((p: any) => [p.user_id, p]));

      const mappedUsers: User[] = (profilesRes.data || []).map((profile: any) => {
        const uid = profile.user_id || profile.id;
        return {
          id: uid,
          email: profile.email || "(sem email)",
          display_name: profile.display_name || profile.full_name || "Sem nome",
          role: rolesMap.get(uid) || "usuario",
          created_at: profile.created_at || profile.updated_at,
          agency_id: profile.agency_id,
        };
      });
      setUsers(mappedUsers);
      setPermissions(permsMap);
    } catch (err: any) {
      const msg = err.message || "Erro ao carregar usuários";
      setError(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
    const ch1 = supabase.channel('ac-profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers(true)).subscribe();
    const ch2 = supabase.channel('ac-roles').on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers(true)).subscribe();
    const ch3 = supabase.channel('ac-perms').on('postgres_changes', { event: '*', schema: 'public', table: 'user_permissions' }, () => fetchUsers(true)).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Erro", description: "Email e senha são obrigatórios.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'create', email: formData.email, password: formData.password, display_name: formData.display_name, role: formData.role, agency_id: formData.agency_id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Sucesso", description: "Usuário criado e configurado." });
      setIsCreateOpen(false);
      setFormData({ email: "", password: "", display_name: "", role: "usuario", agency_id: "" });
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro ao criar", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    // Optimistic update
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role } : u));

    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_role', user_id: userId, role }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Cargo atualizado", description: `Definido como ${role}.` });
      await fetchUsers(true);
    } catch (err: any) {
      setUsers(previousUsers); // Rollback
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      await fetchUsers(true);
    }
  };

  const handleUpdateAgency = async (userId: string, agencyId: string) => {
    // Optimistic update
    const previousUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, agency_id: agencyId || undefined } : u));

    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_agency', user_id: userId, agency_id: agencyId || null }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Agência atualizada", description: "Usuário vinculado à nova agência." });
      await fetchUsers(true);
    } catch (err: any) {
      setUsers(previousUsers); // Rollback
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      await fetchUsers(true);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);

    // Optimistic update
    const previousPerms = new Map(permissions);
    const newPermsMap = new Map(permissions);
    newPermsMap.set(selectedUser.id, editPerms);
    setPermissions(newPermsMap);

    try {
      const { user_id, id, created_at, updated_at, ...permissionsData } = editPerms as any;
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_permissions', user_id: selectedUser.id, permissions: permissionsData }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Permissões salvas", description: "Alterações aplicadas com sucesso." });
      setIsPermOpen(false);
      await fetchUsers(true);
    } catch (err: any) {
      setPermissions(previousPerms); // Rollback
      toast({ title: "Erro", description: err.message || "Erro ao salvar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_password', user_id: selectedUser.id, password: newPassword }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Senha redefinida", description: "Nova senha ativa." });
      setIsPasswordOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const executeDeleteUser = async () => {
    if (!userToDeleteId) return;
    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', user_id: userToDeleteId }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Usuário excluído", description: "Registro removido permanentemente." });
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setIsDeleteAlertOpen(false);
      setUserToDeleteId(null);
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin": return { label: "Gerente Geral", color: "bg-rose-500/10 text-rose-600 border-rose-200", dot: "bg-rose-500", icon: ShieldAlert };
      case "manager": return { label: "Gerente de Negócios", color: "bg-amber-500/10 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: ShieldCheck };
      case "analyst": return { label: "Analista", color: "bg-blue-500/10 text-blue-600 border-blue-200", dot: "bg-blue-500", icon: FileText };
      case "financial": return { label: "Desembolso", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", dot: "bg-emerald-500", icon: DollarSign };
      case "developer": return { label: "Desenvolvedor", color: "bg-indigo-500/10 text-indigo-700 border-indigo-200", dot: "bg-indigo-500", icon: Code2 };
      default: return { label: "Usuário", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", icon: Fingerprint };
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchTerm ||
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchAgency = filterAgency === "all" || u.agency_id === filterAgency;
    return matchSearch && matchRole && matchAgency;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin" || u.role === "developer").length,
    managers: users.filter(u => u.role === "manager").length,
    analysts: users.filter(u => u.role === "analyst").length,
    financials: users.filter(u => u.role === "financial").length,
    usuarios: users.filter(u => u.role === "usuario").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">Carregando dados de acesso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <Card className="border-destructive/30">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Erro de conexão</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => fetchUsers()} variant="outline" className="gap-2">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            Controle de Acesso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie usuários, permissões e níveis de acesso.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-10 px-5 shadow-sm">
          <UserPlus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Users, accent: "text-primary" },
          { label: "Gerentes Gerais", value: stats.admins, icon: ShieldAlert, accent: "text-rose-500" },
          { label: "G. de Agência", value: stats.gerentes, icon: ShieldCheck, accent: "text-amber-600" },
          { label: "Técnicos", value: stats.tecnicos, icon: Shield, accent: "text-blue-600" },
        ].map(s => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.accent}`} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-background"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 bg-background">
                <SelectValue placeholder="Filtrar cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="admin">Gerente Geral</SelectItem>
                <SelectItem value="manager">Gerente de Negócios</SelectItem>
                <SelectItem value="analyst">Analista</SelectItem>
                <SelectItem value="financial">Desembolso</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAgency} onValueChange={setFilterAgency}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-background">
                <SelectValue placeholder="Filtrar agência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as agências</SelectItem>
                {agencies.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px]">Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead className="hidden md:table-cell">Permissões</TableHead>
                <TableHead className="text-right w-[220px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Nenhum usuário encontrado</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                const roleConfig = getRoleConfig(user.role || "usuario");
                const userPerms = permissions.get(user.id);
                const activePermsCount = userPerms ? PERMISSIONS.filter(p => userPerms[p.key] === true).length : 0;

                return (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="text-xs font-semibold bg-muted">
                            {getInitials(user.display_name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate max-w-[160px]">{user.display_name}</p>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                                Você
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || "usuario"}
                        onValueChange={(v) => handleUpdateRole(user.id, v as UserRole)}
                      >
                        <SelectTrigger className={`h-7 w-[120px] text-xs font-medium border rounded-md ${roleConfig.color}`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${roleConfig.dot}`} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usuario">Usuário</SelectItem>
                          <SelectItem value="manager">Gerente de Negócios</SelectItem>
                          <SelectItem value="analyst">Analista</SelectItem>
                          <SelectItem value="financial">Desembolso</SelectItem>
                          {isDeveloper && <SelectItem value="admin">Gerente Geral</SelectItem>}
                          {isDeveloper && <SelectItem value="developer">Desenvolvedor</SelectItem>}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.agency_id || "none"}
                        onValueChange={(v) => handleUpdateAgency(user.id, v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-7 w-[160px] text-xs border rounded-md">
                          <SelectValue placeholder="Sem agência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem agência</SelectItem>
                          {agencies.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {activePermsCount}/{PERMISSIONS.length} ativas
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 px-2.5 text-xs gap-1.5"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditPerms(permissions.get(user.id) || { user_id: user.id });
                            setIsPermOpen(true);
                          }}
                        >
                          <UserCog className="h-3.5 w-3.5" /> Permissões
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 px-2.5 text-xs gap-1.5"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword("");
                            setIsPasswordOpen(true);
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Senha
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isCurrent}
                          onClick={() => {
                            setUserToDeleteId(user.id);
                            setIsDeleteAlertOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" /> Novo Usuário
            </DialogTitle>
            <DialogDescription>Cadastre uma nova credencial de acesso ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@email.com" className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Senha</Label>
              <Input
                type="password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres" className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nome de exibição</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Ex: João Silva" className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Cargo</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="manager">Gerente de Negócios</SelectItem>
                  <SelectItem value="analyst">Analista</SelectItem>
                  <SelectItem value="financial">Desembolso</SelectItem>
                  {isDeveloper && <SelectItem value="admin">Gerente Geral</SelectItem>}
                  {isDeveloper && <SelectItem value="developer">Desenvolvedor</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Agência</Label>
              <Select value={formData.agency_id || "none"} onValueChange={(v) => setFormData({ ...formData, agency_id: v === "none" ? "" : v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma agência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem agência</SelectItem>
                  {agencies.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="max-w-xl h-[85vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden border-2 shadow-2xl">
          <DialogHeader className="p-5 pb-3 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {selectedUser ? getInitials(selectedUser.display_name || selectedUser.email) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-base font-bold">Permissões de Acesso</DialogTitle>
                  <DialogDescription className="text-xs">{selectedUser?.display_name} • {selectedUser?.email}</DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] gap-1.5 font-bold uppercase tracking-wider"
                onClick={() => {
                  const allTrue = PERMISSIONS.every(p => !!editPerms[p.key]);
                  const newState = { ...editPerms };
                  PERMISSIONS.forEach(p => newState[p.key] = !allTrue);
                  setEditPerms(newState);
                }}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {PERMISSIONS.every(p => !!editPerms[p.key]) ? "Desmarcar Tudo" : "Marcar Tudo"}
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-muted/20 border-b min-h-0 [scrollbar-width:thin] [scrollbar-color:theme(colors.primary/40)_transparent]">
            <div className="space-y-6 pb-4">
              {Array.from(new Set(PERMISSIONS.map(p => p.group))).map((group) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-3">
                    <Separator className="flex-1" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">{group}</p>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSIONS.filter(p => p.group === group).map((perm) => {
                      const isActive = !!editPerms[perm.key];
                      const Icon = perm.icon;
                      return (
                        <label
                          key={perm.key}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border-2 cursor-pointer transition-all duration-200 group/perm ${isActive
                            ? "border-primary bg-primary/[0.04] shadow-sm"
                            : "border-transparent bg-background hover:border-primary/20 hover:bg-primary/[0.01]"
                            }`}
                        >
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover/perm:bg-primary/10 group-hover/perm:text-primary"
                            }`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className={`text-xs font-bold block truncate transition-colors ${isActive ? "text-primary" : "text-foreground/80"}`}>{perm.label}</span>
                          </div>

                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-primary border-primary scale-110 shadow-sm" : "border-muted-foreground/20"
                            }`}>
                            {isActive && <CheckCircle2 className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <input
                            type="checkbox" className="hidden"
                            checked={isActive}
                            onChange={(e) => setEditPerms(p => ({ ...p, [perm.key]: e.target.checked }))}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPermOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSavePermissions} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-xs">
              Definir nova senha para {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs font-medium text-muted-foreground">Nova senha</Label>
            <Input
              type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" className="h-10"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsPasswordOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleUpdatePassword} disabled={saving || newPassword.length < 6} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" /> Excluir usuário?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário será removido do sistema junto com todas as suas permissões, roles e perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={executeDeleteUser}
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AccessControl;
