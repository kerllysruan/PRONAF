import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, UserPlus, Pencil, Trash2, Key, Loader2, Users, Lock, Eye, Search, Filter,
  CheckCircle2, Circle, AlertCircle, Mail, Calendar, Settings2, MoreVertical,
  ChevronRight, Plus, X,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ManagedUser {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  role: string;
  permissions: Record<string, boolean> | null;
}

type UserRole = "admin" | "gerente" | "usuario";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  usuario: "Usuário",
};

const ROLE_ICONS: Record<string, any> = {
  admin: Shield,
  gerente: Settings2,
  usuario: Users,
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
  gerente: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  usuario: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  gerente: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  usuario: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
  read_only: "Modo Somente Leitura",
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  can_view_dashboard: "Acesso à página inicial do sistema",
  can_view_proposals: "Visualizar lista de propostas",
  can_view_kanban: "Visualizar quadro Kanban",
  can_view_documentation: "Acessar documentação do projeto",
  can_view_visits: "Ver agenda de visitas",
  can_view_management: "Acessar área de gerenciamento",
  can_view_access_control: "Gerenciar controle de acesso",
  can_create_proposals: "Criar novas propostas",
  can_edit_proposals: "Modificar propostas existentes",
  can_delete_proposals: "Remover propostas",
  can_approve_proposals: "Aprovar ou rejeitar propostas",
  read_only: "Impede edições e exclusões",
};

const PERMISSION_GROUPS = {
  "📊 Acesso às Páginas": [
    "can_view_dashboard", "can_view_proposals", "can_view_kanban",
    "can_view_documentation", "can_view_visits", "can_view_management", "can_view_access_control",
  ],
  "✏️ Ações em Propostas": [
    "can_create_proposals", "can_edit_proposals", "can_delete_proposals", "can_approve_proposals",
  ],
  "🔒 Segurança": ["read_only"],
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
  const [newUser, setNewUser] = useState({ email: "", password: "", display_name: "", role: "usuario" as UserRole });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("users");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar usuários das tabelas (não usar admin.listUsers que requer token especial)
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: permissions } = await supabase.from("user_permissions").select("*");

      // Combinar dados
      const enriched = profiles?.map((profile) => ({
        id: profile.user_id,
        email: profile.user_id, // Email será extraído do UUID para preview
        display_name: profile.display_name,
        created_at: profile.created_at,
        role: roles?.find((r) => r.user_id === profile.user_id)?.role || "usuario",
        permissions: permissions?.find((p) => p.user_id === profile.user_id) || {},
      })) || [];

      setUsers(enriched);
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
      console.error("Erro ao buscar usuários:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password) return;
    setSaving(true);
    try {
      // Usar função alternativa para criar usuário
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      // Criar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          display_name: newUser.display_name || newUser.email,
        });
      if (profileError && !profileError.message.includes("duplicate")) throw profileError;

      // Criar role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert([{
          user_id: userId,
          role: newUser.role as UserRole,
        }]);
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      // Criar permissions
      const { error: permError } = await supabase
        .from("user_permissions")
        .insert({
          user_id: userId,
        });
      if (permError && !permError.message.includes("duplicate")) throw permError;

      toast({ title: "✓ Usuário criado com sucesso!" });
      setIsCreateOpen(false);
      setNewUser({ email: "", password: "", display_name: "", role: "usuario" as UserRole });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
      console.error("Erro ao criar usuário:", err);
    }
    setSaving(false);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;

      // Se admin, dar acesso ao controle de acesso
      if (role === "admin") {
        await supabase
          .from("user_permissions")
          .update({ 
            can_view_access_control: true,
            can_approve_proposals: true,
          })
          .eq("user_id", userId);
      }

      toast({ title: "✓ Perfil atualizado!" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
      console.error("Erro ao atualizar role:", err);
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
      const { error } = await supabase
        .from("user_permissions")
        .update(editPerms)
        .eq("user_id", selectedUser.id);
      if (error) throw error;

      toast({ title: "✓ Permissões atualizadas!" });
      setIsPermOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
      console.error("Erro ao atualizar permissões:", err);
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
      // Não é possível alterar senha de outro usuário sem admin token
      // Mostrar aviso ao usuário
      toast({
        title: "⚠️ Funcionalidade Limitada",
        description: "Para alterar senha, o usuário deve fazer reset de senha via email",
        variant: "default",
      });
      setIsPasswordOpen(false);
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) return;
    try {
      // Deletar dados das tabelas (não podemos deletar do auth sem admin token)
      const { error: permError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId);
      if (permError) throw permError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (roleError) throw roleError;

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      if (profileError) throw profileError;

      toast({ title: "✓ Usuário excluído." });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "❌ Erro", description: err.message, variant: "destructive" });
      console.error("Erro ao deletar usuário:", err);
    }
  };

  const getInitials = (name: string) => name?.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase() || "?";
  
  const getAvatarColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      gerente: "bg-amber-500",
      usuario: "bg-blue-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const countUserPermissions = (user: ManagedUser) => {
    return Object.values(user.permissions || {}).filter(Boolean).length;
  };

  const stats = [
    { label: "Total de Usuários", value: users.length, icon: Users, color: "text-blue-600" },
    { label: "Administradores", value: users.filter((u) => u.role === "admin").length, icon: Shield, color: "text-red-600" },
    { label: "Gerentes", value: users.filter((u) => u.role === "gerente").length, icon: Settings2, color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Controle de Acesso</h1>
            <p className="text-sm text-muted-foreground">Gerencie usuários, perfis e permissões da plataforma</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md h-10 px-6">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Lista de Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Lock className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="usuario">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className={`border-l-4 transition-all hover:shadow-md ${
                  user.role === "admin" ? "border-l-red-500" :
                  user.role === "gerente" ? "border-l-amber-500" :
                  "border-l-blue-500"
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className={`h-10 w-10 ${getAvatarColor(user.role)} flex-shrink-0`}>
                          <AvatarFallback className="text-white font-bold text-sm">
                            {getInitials(user.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{user.display_name}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPermissions(user)}>
                            <Lock className="h-4 w-4 mr-2" /> Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPassword(user)}>
                            <Key className="h-4 w-4 mr-2" /> Alterar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Perfil</Label>
                      <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {countUserPermissions(user)} permissões
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-10 w-10 ${getAvatarColor(user.role)}`}>
                          <AvatarFallback className="text-white font-bold text-sm">
                            {getInitials(user.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissions(user)}
                        className="gap-1 mt-2 sm:mt-0"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar Permissões
                      </Button>
                    </div>
                    <div className="border-t">
                      <div className="p-4 space-y-3">
                        {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
                          <div key={group}>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">{group}</p>
                            <div className="space-y-2">
                              {keys.map((key) => (
                                <div key={key} className="flex items-center gap-2">
                                  {user.permissions?.[key] ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                                  )}
                                  <span className="text-sm text-muted-foreground">{PERMISSION_LABELS[key]}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário na plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-medium">Nome Completo</Label>
              <Input
                id="display_name"
                value={newUser.display_name}
                onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Perfil</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser((p) => ({ ...p, role: v as UserRole }))}>
                <SelectTrigger id="role" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !newUser.email || !newUser.password}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Gerenciar Permissões</DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {Object.entries(PERMISSION_GROUPS).map(([group, keys]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>{group}</span>
                </h3>
                <div className="space-y-3">
                  {keys.map((key) => (
                    <div
                      key={key}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <Switch
                        checked={!!editPerms[key]}
                        onCheckedChange={(v) => setEditPerms((p) => ({ ...p, [key]: v }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label className="text-sm font-medium cursor-pointer">
                          {PERMISSION_LABELS[key]}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {PERMISSION_DESCRIPTIONS[key]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsPermOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePerms} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Alterar Senha</DialogTitle>
            <DialogDescription>
              {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-sm font-medium">Nova Senha *</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleChangePassword}
              disabled={saving || newPassword.length < 6}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
