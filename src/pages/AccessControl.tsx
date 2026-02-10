import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Plus, Trash2, Edit2, Loader2, Users, Lock, AlertCircle,
  MoreVertical, CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
  created_at: string;
}

type UserRole = "usuario" | "gerente" | "admin";

interface UserPermission {
  [key: string]: string | boolean;
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
  can_view_management?: boolean;
  read_only?: boolean;
}

const PERMISSIONS = [
  { key: "can_view_dashboard", label: "Ver Dashboard", group: "Visualização" },
  { key: "can_view_proposals", label: "Ver Propostas", group: "Visualização" },
  { key: "can_view_kanban", label: "Ver Kanban", group: "Visualização" },
  { key: "can_view_documentation", label: "Ver Documentação", group: "Visualização" },
  { key: "can_view_visits", label: "Ver Visitas", group: "Visualização" },
  { key: "can_view_management", label: "Ver Gerenciamento", group: "Visualização" },
  { key: "can_view_access_control", label: "Controle de Acesso", group: "Visualização" },
  { key: "can_create_proposals", label: "Criar Propostas", group: "Edição" },
  { key: "can_edit_proposals", label: "Editar Propostas", group: "Edição" },
  { key: "can_delete_proposals", label: "Deletar Propostas", group: "Edição" },
  { key: "can_approve_proposals", label: "Aprovar Propostas", group: "Edição" },
  { key: "read_only", label: "Somente Leitura", group: "Segurança" },
];

function AccessControl() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Map<string, UserPermission>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "usuario" as UserRole,
  });
  const [editPerms, setEditPerms] = useState<UserPermission>({ user_id: "" });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const { data: permsData, error: permsError } = await supabase
        .from("user_permissions")
        .select("*");

      if (permsError) throw permsError;

      const rolesMap = new Map((rolesData || []).map((r: any) => [r.user_id, r.role]));
      const permsMap = new Map((permsData || []).map((p: any) => [p.user_id, p]));

      const mappedUsers: User[] = (profilesData || []).map((profile: any) => ({
        id: profile.user_id,
        email: profile.user_id,
        display_name: profile.display_name || "Sem nome",
        role: rolesMap.get(profile.user_id) || "usuario",
        created_at: profile.created_at,
      }));

      setUsers(mappedUsers);
      setPermissions(permsMap);
    } catch (err: any) {
      console.error("Erro ao buscar usuários:", err);
      setError(err.message || "Erro ao carregar dados");
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Erro", description: "Email e senha são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário");

      await supabase.from("profiles").insert({
        user_id: userId,
        display_name: formData.display_name || formData.email,
      });

      await supabase.from("user_roles").insert({
        user_id: userId,
        role: formData.role as UserRole,
      });

      await supabase.from("user_permissions").insert({
        user_id: userId,
      });

      toast({ title: "Sucesso", description: "Usuário criado com sucesso" });
      setIsCreateOpen(false);
      setFormData({ email: "", password: "", display_name: "", role: "usuario" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: role as UserRole })
        .eq("user_id", userId);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Perfil atualizado" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from("user_permissions")
        .update(editPerms)
        .eq("user_id", selectedUser.id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Permissões atualizadas" });
      setIsPermOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      await supabase.from("user_permissions").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Usuário deletado" });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      gerente: "bg-amber-100 text-amber-800",
      usuario: "bg-blue-100 text-blue-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      gerente: "Gerente",
      usuario: "Usuário",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-destructive">Erro</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchUsers} variant="outline" size="sm" className="mt-3">
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Controle de Acesso
          </h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões</p>
        </div>
        <Button onClick={() => {
          setFormData({ email: "", password: "", display_name: "", role: "usuario" });
          setIsCreateOpen(true);
        }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-muted-foreground">Usuários</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter(u => u.role === "admin").length}</div>
            <p className="text-sm text-muted-foreground">Administradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.filter(u => u.role === "gerente").length}</div>
            <p className="text-sm text-muted-foreground">Gerentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuários</TabsTrigger>
          <TabsTrigger value="permissions"><Lock className="h-4 w-4 mr-2" />Permissões</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum usuário encontrado
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {(user.display_name || user.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{user.display_name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getRoleColor(user.role || "usuario")}>
                              {getRoleLabel(user.role || "usuario")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setEditPerms(permissions.get(user.id) || { user_id: user.id });
                            setIsPermOpen(true);
                          }}>
                            <Lock className="h-4 w-4 mr-2" />
                            Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {users.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum usuário encontrado
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {users.map((user) => {
                const userPerms = permissions.get(user.id) || { user_id: user.id };
                const permCount = Object.values(userPerms).filter(v => v === true).length;
                
                return (
                  <Card key={user.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{user.display_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {permCount} permissões ativas
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditPerms(userPerms);
                          setIsPermOpen(true);
                        }}
                      >
                        Ver Permissões
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@example.com"
              />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <Label>Nome Completo</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="João Silva"
              />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermOpen} onOpenChange={setIsPermOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões: {selectedUser?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {Array.from(new Set(PERMISSIONS.map(p => p.group))).map((group) => (
              <div key={group}>
                <h4 className="font-semibold mb-3 text-sm">{group}</h4>
                <div className="space-y-2">
                  {PERMISSIONS.filter(p => p.group === group).map((perm) => (
                    <div key={perm.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={perm.key}
                        checked={(editPerms[perm.key] === true) || false}
                        onChange={(e) => setEditPerms({
                          ...editPerms,
                          user_id: selectedUser?.id || "",
                          [perm.key]: e.target.checked,
                        })}
                        className="rounded"
                      />
                      <label htmlFor={perm.key} className="text-sm cursor-pointer">
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccessControl;
