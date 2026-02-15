import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Plus, Trash2, Loader2, Users, Lock, AlertCircle,
  MoreVertical, CheckCircle2, UserPlus2, ShieldCheck, ShieldAlert,
  Info, Eye, Edit3, Settings2, Fingerprint
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";

interface User {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
  created_at: string;
}

type UserRole = "usuario" | "gerente" | "admin";

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
  can_view_visits?: boolean;
  can_manage_visits?: boolean;
  can_view_tasks?: boolean;
  can_manage_tasks?: boolean;
  can_view_disbursements?: boolean;
  can_manage_disbursements?: boolean;
  can_view_management?: boolean;
  can_manage_users?: boolean;
  read_only?: boolean;
}

const PERMISSIONS = [
  { key: "can_view_dashboard", label: "Ver Dashboard", description: "Visualizar gráficos e indicadores de desempenho.", group: "Visualização", icon: Eye },
  { key: "can_view_proposals", label: "Ver Propostas", description: "Acessar a listagem completa de propostas.", group: "Visualização", icon: Eye },
  { key: "can_view_kanban", label: "Ver Kanban", description: "Visualizar o quadro de propostas por fase.", group: "Visualização", icon: Eye },
  { key: "can_view_documentation", label: "Ver Documentação", description: "Acessar manuais e guias do sistema.", group: "Visualização", icon: Eye },
  { key: "can_view_tasks", label: "Ver Tarefas", description: "Visualizar o quadro de tarefas e atividades.", group: "Visualização", icon: Eye },
  { key: "can_view_disbursements", label: "Ver Desembolsos", description: "Visualizar listagem de pagamentos e solicitações.", group: "Visualização", icon: Eye },
  { key: "can_view_visits", label: "Ver Visitas", description: "Visualizar o calendário de visitas aos produtores.", group: "Visualização", icon: Eye },

  { key: "can_view_management", label: "Ver Gerenciamento", description: "Ver estatísticas avançadas e equipe.", group: "Administração", icon: Settings2 },
  { key: "can_view_access_control", label: "Controle de Acesso", description: "Gerenciar usuários e níveis de permissão.", group: "Administração", icon: ShieldCheck },
  { key: "can_manage_users", label: "Gestão Total", description: "Permissão para criar, excluir e resetar senhas.", group: "Administração", icon: ShieldAlert },

  { key: "can_create_proposals", label: "Criar Propostas", description: "Cadastrar novas propostas de crédito no sistema.", group: "Operacional", icon: Edit3 },
  { key: "can_edit_proposals", label: "Editar Propostas", description: "Modificar informações de propostas existentes.", group: "Operacional", icon: Edit3 },
  { key: "can_delete_proposals", label: "Deletar Propostas", description: "Remover propostas (requer cautela).", group: "Operacional", icon: Trash2 },
  { key: "can_approve_proposals", label: "Aprovar Propostas", description: "Mudar status para 'Contrato Assinado'.", group: "Operacional", icon: CheckCircle2 },

  { key: "can_manage_tasks", label: "Gerir Tarefas", description: "Criar, delegar e comentar em tarefas de equipe.", group: "Equipe", icon: Edit3 },
  { key: "can_manage_disbursements", label: "Gerir Desembolsos", description: "Aprovar ou rejeitar solicitações de pagamento.", group: "Equipe", icon: DollarSign },
  { key: "can_manage_visits", label: "Agendar Visitas", description: "Criar e modificar eventos no calendário de visitas.", group: "Equipe", icon: Edit3 },

  { key: "read_only", label: "Somente Leitura", description: "Bloqueia qualquer ação de escrita, independente das outras permissões.", group: "Segurança", icon: Lock },
];

function AccessControl() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Map<string, UserPermission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "usuario" as UserRole,
  });
  const [newPassword, setNewPassword] = useState("");
  const [editProfile, setEditProfile] = useState({ display_name: "" });
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
        };
      });

      setUsers(mappedUsers);
      setPermissions(permsMap);
    } catch (err: any) {
      console.error("Erro ao buscar usuários:", err);
      const msg = err.message || "Erro desconhecido ao carregar usuários";
      setError(msg);
      toast({
        title: "Erro de Sincronização",
        description: msg,
        variant: "destructive"
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();

    const profilesChannel = supabase.channel('profiles-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers(true)).subscribe();
    const rolesChannel = supabase.channel('roles-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers(true)).subscribe();
    const permsChannel = supabase.channel('perms-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'user_permissions' }, () => fetchUsers(true)).subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(permsChannel);
    };
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Erro", description: "Email e senha são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: formData.email,
          password: formData.password,
          display_name: formData.display_name,
          role: formData.role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: "Usuário criado com sucesso e perfil configurado." });
      setIsCreateOpen(false);
      setFormData({ email: "", password: "", display_name: "", role: "usuario" });
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_role', user_id: userId, role }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: "Perfil de acesso atualizado" });
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const { user_id, id, created_at, updated_at, ...permissionsData } = editPerms as any;

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_permissions', user_id: selectedUser.id, permissions: permissionsData }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Sucesso", description: "Permissões de rede atualizadas" });
      setIsPermOpen(false);
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao salvar permissões", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

      toast({ title: "Sucesso", description: "Senha redefinida com sucesso." });
      setIsPasswordOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser || !editProfile.display_name) return;
    try {
      setSaving(true);
      // Perfis são públicos, então podemos editar direto se o RLS permitir ou via RPC
      // Para manter a consistência, vamos via supabase direto se possível, 
      // mas como o usuário é admin aqui, ele tem bypass via política is_admin que criamos
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: editProfile.display_name })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso." });
      setIsProfileOpen(false);
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
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

      toast({ title: "Usuário removido", description: "Acesso e perfil excluídos permanentemente." });
      await fetchUsers(true);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
      setIsDeleteAlertOpen(false);
      setUserToDeleteId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 gap-1"><ShieldAlert className="h-3 w-3" /> Admin</Badge>;
      case "gerente": return <Badge className="bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 gap-1"><ShieldCheck className="h-3 w-3" /> Gerente</Badge>;
      default: return <Badge variant="secondary" className="gap-1"><Fingerprint className="h-3 w-3" /> Usuário</Badge>;
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);

  if (loading) {
    return <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">Sincronizando banco de dados...</p>
    </div>;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-20">
        <Card className="border-destructive shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Erro de Conexão</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">Não foi possível carregar a lista de usuários e permissões. Isso pode ocorrer se você não tiver privilégios de administrador.</p>
            <div className="p-4 bg-muted rounded-xl border font-mono text-xs overflow-auto max-h-32">
              {error}
            </div>
            <Button onClick={() => fetchUsers()} className="w-full gap-2">
              <Loader2 className="h-4 w-4" /> Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            Controle de Acesso
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Segurança e governança de dados da plataforma PRONAF.</p>
        </div>
        <Button size="lg" onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-xl shadow-primary/25 hover:shadow-2xl hover-lift">
          <UserPlus2 className="h-5 w-5" /> Adicionar Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Ativos</p>
            </div>
            <p className="text-4xl font-black font-heading">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admins</p>
            </div>
            <p className="text-4xl font-black font-heading text-red-500">{users.filter(u => u.role === "admin").length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl lg:col-span-2 bg-gradient-to-r from-muted/50 to-transparent">
          <CardContent className="pt-6 flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 mb-2 text-primary font-semibold italic text-sm">
              <Info className="h-4 w-4" />
              Dica Administrativa
            </div>
            <p className="text-sm text-muted-foreground">As permissões de rede são aplicadas em tempo real. Usuários administrativos têm bypass total.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-xl">
          <TabsTrigger value="list" className="rounded-lg gap-2 px-6">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-lg gap-2 px-6">
            <Lock className="h-4 w-4" /> Matriz de Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {users.map((user) => {
              const isCurrent = user.id === currentUser?.id;
              return (
                <Card key={user.id} className={clsx(
                  "border-0 shadow-lg hover:shadow-xl transition-all h-full overflow-hidden",
                  isCurrent && "ring-2 ring-primary"
                )}>
                  <CardContent className="p-0">
                    <div className="flex h-full">
                      <div className={clsx(
                        "w-2 shrink-0",
                        user.role === "admin" ? "bg-red-500" : user.role === "gerente" ? "bg-amber-500" : "bg-primary"
                      )} />
                      <div className="flex-1 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                          <AvatarFallback className="text-xl font-black bg-muted text-primary">
                            {getInitials(user.display_name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
                              {user.display_name}
                            </h3>
                            {getRoleBadge(user.role || "usuario")}
                            {isCurrent && <Badge variant="outline" className="border-primary text-primary bg-primary/5 uppercase text-[9px] font-black tracking-tighter">VOCÊ</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-mono uppercase">ID: {user.id}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/5">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl p-2">
                              <DropdownMenuItem className="rounded-lg gap-2 p-3 font-medium text-sm" onClick={() => {
                                setSelectedUser(user);
                                setEditPerms(permissions.get(user.id) || { user_id: user.id });
                                setIsPermOpen(true);
                              }}>
                                <ShieldCheck className="h-4 w-4 text-primary" /> Editar Permissões
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 p-3 font-medium text-sm" onClick={() => {
                                setSelectedUser(user);
                                setEditProfile({ display_name: user.display_name || "" });
                                setIsProfileOpen(true);
                              }}>
                                <Edit3 className="h-4 w-4 text-primary" /> Editar Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 p-3 font-medium text-sm" onClick={() => {
                                setSelectedUser(user);
                                setIsPasswordOpen(true);
                              }}>
                                <Lock className="h-4 w-4 text-primary" /> Alterar Senha
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase opacity-50">Mudar Cargo</div>
                              <DropdownMenuItem className="rounded-lg gap-2 text-sm" onClick={() => handleUpdateRole(user.id, "usuario")}>
                                <Fingerprint className="h-4 w-4" /> Tornar Usuário
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 text-sm" onClick={() => handleUpdateRole(user.id, "gerente")}>
                                <ShieldCheck className="h-4 w-4 text-amber-500" /> Tornar Gerente
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 text-sm" onClick={() => handleUpdateRole(user.id, "admin")}>
                                <ShieldAlert className="h-4 w-4 text-red-500" /> Tornar Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1" />
                              <DropdownMenuItem className="rounded-lg gap-2 p-3 font-medium text-destructive text-sm" onClick={() => {
                                setUserToDeleteId(user.id);
                                setIsDeleteAlertOpen(true);
                              }} disabled={isCurrent}>
                                <Trash2 className="h-4 w-4" /> Excluir Registro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/50">
              <CardTitle className="font-heading">Explicação de Permissões</CardTitle>
              <CardDescription>O sistema utiliza o modelo RBAC baseado em chaves individuais por usuário.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-8">
                  {Array.from(new Set(PERMISSIONS.map(p => p.group))).map((group) => (
                    <div key={group} className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-1 bg-primary rounded-full" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary/80">{group}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PERMISSIONS.filter(p => p.group === group).map((perm) => (
                          <div key={perm.key} className="flex gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm border">
                              <perm.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-sm">{perm.label}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{perm.description}</p>
                              <p className="text-[9px] font-mono text-muted-foreground/50 mt-2 uppercase tracking-tighter">CHAVE: {perm.key}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl">
          <DialogHeader className="p-6 bg-muted/50 border-b">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 shadow-lg">
                <AvatarFallback className="font-bold bg-primary text-primary-foreground">
                  {selectedUser ? getInitials(selectedUser.display_name || selectedUser.email) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-black font-heading tracking-tight italic">
                  Configurações de Rede
                </DialogTitle>
                <DialogDescription className="text-sm font-medium">Ajustando acessos de: {selectedUser?.display_name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-4">
              {Array.from(new Set(PERMISSIONS.map(p => p.group))).map((group) => (
                <div key={group} className="space-y-4">
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <Separator className="flex-1" />
                    {group}
                    <Separator className="flex-1" />
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERMISSIONS.filter(p => p.group === group).map((perm) => (
                      <label
                        key={perm.key}
                        className={clsx(
                          "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none",
                          editPerms[perm.key] ? "border-primary bg-primary/5" : "border-transparent bg-muted/40 hover:bg-muted/60"
                        )}
                      >
                        <div className={clsx(
                          "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                          editPerms[perm.key] ? "bg-primary border-primary" : "border-muted-foreground/30"
                        )}>
                          {editPerms[perm.key] && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={!!editPerms[perm.key]}
                          onChange={(e) => setEditPerms(p => ({ ...p, [perm.key]: e.target.checked }))}
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold leading-none">{perm.label}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 bg-muted/30 border-t gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPermOpen(false)} className="rounded-xl px-8 h-12 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">Cancelar</Button>
            <Button onClick={handleSavePermissions} disabled={saving} className="rounded-xl px-10 h-12 font-bold shadow-xl shadow-primary/20 hover-lift">
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
              Aplicar Mudanças
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-3xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <DialogTitle className="text-3xl font-black font-heading tracking-tight italic">
              Acesso à Rede
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-2 font-medium">Cadastrar nova credencial de acesso ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-card">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Email Oficial</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@pronaf.com.br" className="h-12 rounded-xl focus-visible:ring-primary shadow-inner bg-muted/20" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Senha Segura</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="h-12 rounded-xl focus-visible:ring-primary shadow-inner bg-muted/20" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nome de Exibição</Label>
                <Input value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} placeholder="Ex: João Silva" className="h-12 rounded-xl focus-visible:ring-primary shadow-inner bg-muted/20" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nível do Perfil</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl p-2 border-2">
                    <SelectItem value="usuario" className="rounded-lg h-10 mb-1">Usuário Padrão</SelectItem>
                    <SelectItem value="gerente" className="rounded-lg h-10 mb-1">Gerente de Area</SelectItem>
                    <SelectItem value="admin" className="rounded-lg h-10">Administrador Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button size="lg" onClick={handleCreateUser} disabled={saving} className="h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover-lift">
                {saving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <UserPlus2 className="h-6 w-6 mr-2" />}
                Autorizar Acesso
              </Button>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-11 text-muted-foreground hover:bg-muted/50 transition-all uppercase text-[10px] font-black tracking-widest">
                Descartar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-heading text-red-600 italic">Revogar Acesso?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Esta ação é rígida. Recomenda-se desativar permissões antes de excluir o registro permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Manter Credencial</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl h-12 font-bold shadow-xl shadow-red-600/20"
              onClick={executeDeleteUser}
            >
              Excluir Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para Alterar Senha */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-3xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8" />
              <div>
                <DialogTitle className="text-2xl font-black font-heading tracking-tight italic">
                  Redefinir Senha
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">Reset de credencial: {selectedUser?.display_name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-card">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 rounded-xl focus-visible:ring-primary shadow-inner bg-muted/20"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button size="lg" onClick={handleUpdatePassword} disabled={saving || newPassword.length < 6} className="h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover-lift">
                {saving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <ShieldCheck className="h-6 w-6 mr-2" />}
                Confirmar Nova Senha
              </Button>
              <Button variant="ghost" onClick={() => setIsPasswordOpen(false)} className="rounded-xl h-11 text-muted-foreground hover:bg-muted/50 transition-all uppercase text-[10px] font-black tracking-widest">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Perfil */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl shadow-3xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Edit3 className="h-8 w-8" />
              <div>
                <DialogTitle className="text-2xl font-black font-heading tracking-tight italic">
                  Editar Perfil
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">Atualizando dados de: {selectedUser?.email}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-card">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-70">Nome de Exibição</Label>
                <Input
                  value={editProfile.display_name}
                  onChange={(e) => setEditProfile({ display_name: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="h-12 rounded-xl focus-visible:ring-primary shadow-inner bg-muted/20"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button size="lg" onClick={handleUpdateProfile} disabled={saving || !editProfile.display_name} className="h-14 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover-lift">
                {saving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <CheckCircle2 className="h-6 w-6 mr-2" />}
                Salvar Alterações
              </Button>
              <Button variant="ghost" onClick={() => setIsProfileOpen(false)} className="rounded-xl h-11 text-muted-foreground hover:bg-muted/50 transition-all uppercase text-[10px] font-black tracking-widest">
                Descartar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccessControl;
