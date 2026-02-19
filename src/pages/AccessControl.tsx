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
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">Controle de Acesso</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Gestão de usuários, permissões e níveis de segurança
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold h-11 px-6">
          <UserPlus className="h-5 w-5" /> Novo Usuário
        </Button>
      </header>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[
          { label: "Total Usuários", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Gerentes Geral", value: stats.admins, icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "G. Negócios", value: stats.managers, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Analistas", value: stats.analysts, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Desembolsos", value: stats.financials, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, idx) => (
          <Card key={idx} className="group border-border/40 shadow-premium hover:shadow-premium-hover transition-all duration-300 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`h-10 w-10 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1">{s.label}</p>
                <h3 className="font-heading font-extrabold text-2xl text-foreground">
                  {s.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-card/40 backdrop-blur-md p-4 rounded-3xl border border-border/50 shadow-premium flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 rounded-xl border-border/40 bg-background/50 font-bold flex-1"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-44 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
              <SelectValue placeholder="Filtrar cargo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="all">Todos os Cargos</SelectItem>
              <SelectItem value="admin">Gerente Geral</SelectItem>
              <SelectItem value="manager">Gerente Negócios</SelectItem>
              <SelectItem value="analyst">Analista</SelectItem>
              <SelectItem value="financial">Desembolso</SelectItem>
              <SelectItem value="usuario">Usuário</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAgency} onValueChange={setFilterAgency}>
            <SelectTrigger className="w-full md:w-44 h-11 rounded-xl border-border/40 bg-background/50 font-bold">
              <SelectValue placeholder="Filtrar agência" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="all">Todas Agências</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card/40 backdrop-blur-md rounded-3xl border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/40 hover:bg-muted/30">
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Usuário</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Nível de Acesso</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Agência Vinculada</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black uppercase tracking-widest hidden md:table-cell">Permissões</TableHead>
              <TableHead className="py-4 px-6 text-right w-[240px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Users className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground italic uppercase tracking-widest">Nenhum usuário encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isCurrent = user.id === currentUser?.id;
                const roleConfig = getRoleConfig(user.role || "usuario");
                const userPerms = permissions.get(user.id);
                const activePermsCount = userPerms ? PERMISSIONS.filter(p => userPerms[p.key] === true).length : 0;

                return (
                  <TableRow key={user.id} className="group hover:bg-white/60 transition-colors border-b border-border/40 last:border-0 h-20">
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-11 w-11 rounded-2xl border-2 border-background shadow-premium transform group-hover:scale-110 transition-transform duration-300">
                          <AvatarFallback className="text-xs font-black bg-muted/50 text-foreground">
                            {getInitials(user.display_name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                              {user.display_name}
                            </p>
                            {isCurrent && (
                              <Badge className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20 animate-pulse">
                                Você
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium truncate opacity-70">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Select
                        value={user.role || "usuario"}
                        onValueChange={(v) => handleUpdateRole(user.id, v as UserRole)}
                      >
                        <SelectTrigger className={`h-9 w-[160px] rounded-xl text-[10px] font-black uppercase tracking-widest border-border/40 shadow-sm transition-all focus:ring-primary ${roleConfig.color}`}>
                          <div className="flex items-center gap-2">
                            <roleConfig.icon className="h-4 w-4" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-premium">
                          <SelectItem value="usuario" className="rounded-lg">Usuário</SelectItem>
                          <SelectItem value="manager" className="rounded-lg">Gerente Negócios</SelectItem>
                          <SelectItem value="analyst" className="rounded-lg">Analista</SelectItem>
                          <SelectItem value="financial" className="rounded-lg">Desembolso</SelectItem>
                          {isDeveloper && <SelectItem value="admin" className="rounded-lg">Gerente Geral</SelectItem>}
                          {isDeveloper && <SelectItem value="developer" className="rounded-lg">Desenvolvedor</SelectItem>}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Select
                        value={user.agency_id || "none"}
                        onValueChange={(v) => handleUpdateAgency(user.id, v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-9 w-[180px] rounded-xl text-[10px] font-black uppercase tracking-widest border-border/40 bg-background/50 font-bold">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Sem agência" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40 shadow-premium">
                          <SelectItem value="none" className="rounded-lg">Sem agência</SelectItem>
                          {agencies.map(a => (
                            <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4 px-6 hidden md:table-cell">
                      <div className="flex items-center gap-2 group/pct">
                        <div className="h-8 w-14 rounded-lg bg-muted/30 flex items-center justify-center border border-border/40 group-hover/pct:bg-primary/10 group-hover/pct:border-primary/20 transition-all">
                          <span className="text-[10px] font-black text-primary">
                            {Math.round((activePermsCount / PERMISSIONS.length) * 100)}%
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {activePermsCount} de {PERMISSIONS.length}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                        <Button
                          variant="ghost" size="icon"
                          className="h-10 w-10 rounded-xl text-primary hover:bg-primary/10 transition-all"
                          title="Editar Permissões"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditPerms(permissions.get(user.id) || { user_id: user.id });
                            setIsPermOpen(true);
                          }}
                        >
                          <UserCog className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-10 w-10 rounded-xl text-amber-500 hover:bg-amber-50 transition-all"
                          title="Redefinir Senha"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewPassword("");
                            setIsPasswordOpen(true);
                          }}
                        >
                          <KeyRound className="h-5 w-5" />
                        </Button>
                        {!isCurrent && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                            title="Excluir Usuário"
                            onClick={() => {
                              setUserToDeleteId(user.id);
                              setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
          <DialogHeader className="p-6 bg-primary text-primary-foreground">
            <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
              <UserPlus className="h-6 w-6" /> Novo Usuário
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-medium">Cadastre uma nova credencial de acesso ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Acesso</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@email.com" className="pl-11 h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Inicial</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres" className="pl-11 h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome de Exibição</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Ex: João Silva" className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold px-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nível de Acesso</Label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}>
                    <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 shadow-premium">
                      <SelectItem value="usuario" className="rounded-lg">Usuário</SelectItem>
                      <SelectItem value="manager" className="rounded-lg">Gerente Negócios</SelectItem>
                      <SelectItem value="analyst" className="rounded-lg">Analista</SelectItem>
                      <SelectItem value="financial" className="rounded-lg">Desembolso</SelectItem>
                      {isDeveloper && <SelectItem value="admin" className="rounded-lg">Gerente Geral</SelectItem>}
                      {isDeveloper && <SelectItem value="developer" className="rounded-lg">Desenvolvedor</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Agência</Label>
                  <Select value={formData.agency_id || "none"} onValueChange={(v) => setFormData({ ...formData, agency_id: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/10 font-bold">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 shadow-premium">
                      <SelectItem value="none" className="rounded-lg">Sem agência</SelectItem>
                      {agencies.map(a => (
                        <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold">Cancelar</Button>
              <Button
                onClick={handleCreateUser}
                disabled={saving}
                className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-black gap-2"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Confirmar Criação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="max-w-xl h-[85vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden border-border/40 shadow-premium bg-card/95 backdrop-blur-xl rounded-3xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border-4 border-primary-foreground/20 shadow-lg">
                  <AvatarFallback className="text-lg font-black bg-white text-primary">
                    {selectedUser ? getInitials(selectedUser.display_name || selectedUser.email) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-2xl font-black font-heading tracking-tight">Permissões de Acesso</DialogTitle>
                  <DialogDescription className="text-primary-foreground/80 font-medium">
                    {selectedUser?.display_name} • {selectedUser?.email}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-white/10 border-white/20 hover:bg-white/20 text-white transition-all shadow-inner"
                onClick={() => {
                  const allTrue = PERMISSIONS.every(p => !!editPerms[p.key]);
                  const newState = { ...editPerms };
                  PERMISSIONS.forEach(p => newState[p.key] = !allTrue);
                  setEditPerms(newState);
                }}
              >
                <CheckSquare className="h-4 w-4" />
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
        <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-sm p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
          <DialogHeader className="p-6 bg-amber-500 text-white">
            <DialogTitle className="font-heading font-black text-xl flex items-center gap-2">
              <KeyRound className="h-6 w-6" /> Redefinir Senha
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium">
              Definindo nova senha para {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha de Acesso</Label>
              <Input
                type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold px-4"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="outline" onClick={() => setIsPasswordOpen(false)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold">Cancelar</Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={saving || newPassword.length < 6}
                className="flex-1 h-12 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20 font-black gap-2 text-white"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-3xl border-border/40 shadow-premium p-0 overflow-hidden bg-card/95 backdrop-blur-xl max-w-md">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-black font-heading text-foreground">Excluir Usuário?</h2>
                <p className="text-sm text-muted-foreground font-medium mt-1">Essa ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/40">
              O usuário será removido permanentemente do sistema, perdendo acesso a todas as funcionalidades e registros vinculados.
            </p>

            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 h-12 rounded-2xl border-border/40 font-bold bg-white m-0">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 m-0"
                onClick={executeDeleteUser}
              >
                Sim, Excluir
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}

export default AccessControl;
