import { useState, useMemo } from "react";
import { useProjetistasControl, Projetista } from "@/hooks/useProjetistasControl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Award,
  IdCard,
  Phone,
  Mail,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Briefcase,
  Users,
} from "lucide-react";

export default function ProjetistasControl() {
  const {
    projetistas,
    addProjetista,
    updateProjetista,
    deleteProjetista,
    resetToDefault,
  } = useProjetistasControl();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProjetista, setEditingProjetista] = useState<Projetista | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    crea_cfta: "",
    phone: "",
    email: "",
    status: "ativo" as "ativo" | "inativo",
  });

  const openAddDialog = () => {
    setFormData({
      name: "",
      cpf: "",
      crea_cfta: "",
      phone: "",
      email: "",
      status: "ativo",
    });
    setIsAddOpen(true);
  };

  const openEditDialog = (proj: Projetista) => {
    setEditingProjetista(proj);
    setFormData({
      name: proj.name,
      cpf: proj.cpf || "",
      crea_cfta: proj.crea_cfta || "",
      phone: proj.phone || "",
      email: proj.email || "",
      status: proj.status || "ativo",
    });
  };

  const handleSaveAdd = () => {
    if (!formData.name.trim()) return;
    addProjetista(formData);
    setIsAddOpen(false);
  };

  const handleSaveEdit = () => {
    if (!editingProjetista || !formData.name.trim()) return;
    updateProjetista(editingProjetista.id, formData);
    setEditingProjetista(null);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteProjetista(deletingId);
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredProjetistas = useMemo(() => {
    return projetistas.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.crea_cfta.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [projetistas, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = projetistas.length;
    const ativos = projetistas.filter((p) => p.status === "ativo").length;
    const inativos = projetistas.filter((p) => p.status === "inativo").length;
    const comCrea = projetistas.filter((p) => p.crea_cfta && p.crea_cfta.trim() !== "").length;
    return { total, ativos, inativos, comCrea };
  }, [projetistas]);

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight text-foreground">
              Controle de Projetistas
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerenciamento e cadastro de projetistas técnicos (Nome, CPF e CREA/CFTA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
            className="rounded-xl border-border text-muted-foreground hover:text-foreground"
            title="Restaurar lista padrão"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Restaurar Padrão
          </Button>

          <Button
            onClick={openAddDialog}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2 shadow-lg shadow-teal-600/20"
          >
            <Plus className="h-4 w-4" />
            Novo Projetista
          </Button>
        </div>
      </div>

      {/* ── Cards de Métricas ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Projetistas</p>
              <h3 className="text-xl font-extrabold text-foreground">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ativos</p>
              <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.ativos}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Inativos</p>
              <h3 className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{stats.inativos}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/50 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Com Registro CREA/CFTA</p>
              <h3 className="text-xl font-extrabold text-violet-600 dark:text-violet-400">{stats.comCrea}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros e Busca ──────────────────────────────────── */}
      <Card className="rounded-2xl border border-border/50 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, CPF ou CREA/CFTA..."
              className="pl-9 rounded-xl h-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] rounded-xl h-10 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Tabela de Projetistas Cadastrados ────────────────── */}
      <Card className="rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 p-5 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold font-heading flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-teal-600" />
                Projetistas Cadastrados
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredProjetistas.length} projetista{filteredProjetistas.length !== 1 ? "s" : ""} encontrado{filteredProjetistas.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredProjetistas.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserCheck className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <h4 className="font-bold text-sm text-foreground">Nenhum projetista encontrado</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente ajustar a busca ou adicione um novo projetista clicando no botão acima.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="pl-6 text-[10px] font-black uppercase tracking-wider">Nome do Projetista</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">CPF</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">CREA / CFTA</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Contato</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Status</TableHead>
                  <TableHead className="pr-6 text-right text-[10px] font-black uppercase tracking-wider">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjetistas.map((proj) => (
                  <TableRow key={proj.id} className="hover:bg-accent/40 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {proj.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground leading-tight">{proj.name}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {proj.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                        <IdCard className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{proj.cpf || "—"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {proj.crea_cfta ? (
                        <Badge variant="outline" className="text-xs font-bold bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                          <Award className="h-3 w-3 mr-1" />
                          {proj.crea_cfta}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {proj.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground/60" />
                            <span>{proj.phone}</span>
                          </div>
                        )}
                        {proj.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground/60" />
                            <span className="truncate max-w-[150px]">{proj.email}</span>
                          </div>
                        )}
                        {!proj.phone && !proj.email && <span>—</span>}
                      </div>
                    </TableCell>

                    <TableCell>
                      {proj.status === "ativo" ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-bold">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px] font-bold">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
                          title="Editar informações"
                          onClick={() => openEditDialog(proj)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar projetista"
                          onClick={() => setDeletingId(proj.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Dialog Adicionar Projetista ──────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <UserCheck className="h-5 w-5" />
              Novo Projetista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre as informações técnicas do projetista para enquadramento e geração de documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nome do Projetista <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: NEY MEDEIROS"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CPF
                </label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CREA / CFTA
                </label>
                <Input
                  value={formData.crea_cfta}
                  onChange={(e) => setFormData({ ...formData, crea_cfta: e.target.value })}
                  placeholder="Ex: CREA-MA 12345/D"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telefone / Celular
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(98) 90000-0000"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "ativo" | "inativo") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                E-mail Profissional
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="projetista@email.com"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl text-xs" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAdd}
              disabled={!formData.name.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5"
            >
              Salvar Projetista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Editar Projetista ───────────────────────── */}
      <Dialog open={!!editingProjetista} onOpenChange={(open) => !open && setEditingProjetista(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-teal-700 dark:text-teal-400">
              <Edit2 className="h-5 w-5" />
              Editar Projetista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Altere os dados cadastrais do projetista selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Nome do Projetista <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: NEY MEDEIROS"
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CPF
                </label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  CREA / CFTA
                </label>
                <Input
                  value={formData.crea_cfta}
                  onChange={(e) => setFormData({ ...formData, crea_cfta: e.target.value })}
                  placeholder="Ex: CREA-MA 12345/D"
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telefone / Celular
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(98) 90000-0000"
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "ativo" | "inativo") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                E-mail Profissional
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="projetista@email.com"
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-xl text-xs" onClick={() => setEditingProjetista(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!formData.name.trim()}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog Eliminar Projetista ────────────────── */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading font-extrabold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Eliminar Projetista?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Esta ação removerá este projetista do cadastro do sistema. Esta alteração é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
            >
              Sim, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
