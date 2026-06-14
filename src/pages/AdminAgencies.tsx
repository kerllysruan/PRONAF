import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAgency } from "@/contexts/AgencyContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Plus, Building2, Users, ArrowRightLeft, Loader2, Trash2, Settings } from "lucide-react";
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

import { Agency } from "@/contexts/AgencyContext";

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    cpf: string | null;
    agency_id: string | null;
}

export default function AdminAgencies() {
    const { agencies, refreshAgencies } = useAgency();
    const { permissions } = usePermissions();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Create Agency Dialog
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAgencyName, setNewAgencyName] = useState("");
    const [newAgencyCode, setNewAgencyCode] = useState("");

    // Move User Dialog
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [targetAgencyId, setTargetAgencyId] = useState("");

    // Delete Agency Dialog
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
    const [configAgency, setConfigAgency] = useState<Agency | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        const { data: usersData, error: usersError } = await supabase
            .from("profiles")
            .select("id, full_name, email, cpf, agency_id");

        if (usersError) {
            toast({ title: "Erro", description: "Falha ao carregar usuários: " + usersError.message, variant: "destructive" });
        } else {
            setUsers(usersData || []);
        }
        setLoading(false);
    };

    const handleCreateAgency = async () => {
        if (!newAgencyName.trim()) {
            toast({ title: "Erro", description: "Nome da agência é obrigatório", variant: "destructive" });
            return;
        }
        setSaving(true);
        const { error } = await supabase
            .from("agencies")
            .insert({ name: newAgencyName.trim(), code: newAgencyCode.trim() || null });

        if (error) {
            toast({ title: "Erro", description: "Falha ao criar agência: " + error.message, variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: `Agência "${newAgencyName}" criada com sucesso!` });
            setNewAgencyName("");
            setNewAgencyCode("");
            setIsCreateOpen(false);
            refreshAgencies();
            fetchData();
        }
        setSaving(false);
    };

    const handleMoveUser = async () => {
        if (!selectedUser || !targetAgencyId) return;
        setSaving(true);

        const { error } = await supabase
            .from("profiles")
            .update({ agency_id: targetAgencyId })
            .eq("id", selectedUser.id);

        if (error) {
            toast({ title: "Erro", description: "Falha ao mover usuário: " + error.message, variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: `Usuário movido com sucesso!` });
            setIsMoveOpen(false);
            setSelectedUser(null);
            setTargetAgencyId("");
            fetchData();
        }
        setSaving(false);
    };

    const handleDeleteAgency = async () => {
        if (!agencyToDelete) return;
        setSaving(true);

        const { error } = await supabase
            .from("agencies")
            .delete()
            .eq("id", agencyToDelete.id);

        if (error) {
            toast({ title: "Erro", description: "Falha ao excluir agência: " + error.message, variant: "destructive" });
        } else {
            toast({ title: "Sucesso", description: `Agência "${agencyToDelete.name}" excluída com sucesso!` });
            setIsDeleteOpen(false);
            setAgencyToDelete(null);
            refreshAgencies();
            fetchData();
        }
        setSaving(false);
    };

    const openMoveDialog = (user: UserProfile) => {
        setSelectedUser(user);
        setTargetAgencyId(user.agency_id || "");
        setIsMoveOpen(true);
    };

    const getUsersForAgency = (agencyId: string) => users.filter(u => u.agency_id === agencyId);
    const unassignedUsers = users.filter(u => !u.agency_id);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-xl p-6 rounded-3xl border border-border/50 shadow-premium">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                        <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black font-heading tracking-tight text-foreground">Gestão de Agências</h1>
                        <p className="text-sm text-muted-foreground font-medium">Administração de unidades e vinculação de usuários.</p>
                    </div>
                </div>
                {permissions.can_manage_agencies && (
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="h-12 px-6 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black gap-2"
                    >
                        <Plus className="h-5 w-5" /> Nova Agência
                    </Button>
                )}
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-premium overflow-hidden transition-all hover:translate-y-[-4px]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Building2 className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-3xl font-black font-heading tracking-tight">{agencies.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Agências Ativas</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-premium overflow-hidden transition-all hover:translate-y-[-4px]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                            <Users className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-3xl font-black font-heading tracking-tight">{users.filter(u => u.agency_id).length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Usuários Vinculados</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-premium overflow-hidden transition-all hover:translate-y-[-4px]">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                            <Users className="h-7 w-7" />
                        </div>
                        <div>
                            <p className="text-3xl font-black font-heading tracking-tight text-amber-600">{unassignedUsers.length}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Pendentes de Alocação</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unassigned Users */}
            {unassignedUsers.length > 0 && (
                <Card className="overflow-hidden rounded-3xl border-amber-500/30 bg-amber-50/10 shadow-premium">
                    <CardHeader className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20">
                        <CardTitle className="text-base font-black font-heading flex items-center gap-2 text-amber-700 uppercase tracking-tight">
                            <Users className="h-5 w-5" />
                            Usuários aguardando vínculo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto scrollbar-thin text-foreground">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-amber-500/5 hover:bg-amber-500/5 transition-none border-b border-amber-500/20">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 h-10 px-6 whitespace-nowrap">Nome Completo</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 h-10 px-6 whitespace-nowrap">E-mail</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 h-10 px-6 text-right whitespace-nowrap">Ações Rápidas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {unassignedUsers.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-amber-500/5 transition-colors border-b border-amber-500/10 h-16">
                                            <TableCell className="px-6 font-bold text-amber-900 whitespace-nowrap">{user.full_name || "Sem nome definido"}</TableCell>
                                            <TableCell className="px-6 font-medium text-amber-700/80 whitespace-nowrap">{user.email || "-"}</TableCell>
                                            <TableCell className="px-6 text-right whitespace-nowrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 px-4 rounded-xl border-amber-200 bg-white hover:bg-amber-100 text-amber-700 font-bold gap-2 transition-all"
                                                    onClick={() => openMoveDialog(user)}
                                                    disabled={!permissions.can_manage_agencies}
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" /> Atribuir Unidade
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agency Cards */}
            <div className="grid gap-8">
                {agencies.map((agency) => {
                    const agencyUsers = getUsersForAgency(agency.id);
                    return (
                        <Card key={agency.id} className="overflow-hidden rounded-3xl border-border/40 bg-card/40 backdrop-blur-md shadow-premium">
                            <CardHeader className="bg-muted/30 px-6 py-6 border-b border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black font-heading tracking-tight flex items-center gap-3">
                                                {agency.name}
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                                                    {agency.code || "S/C"}
                                                </Badge>
                                            </CardTitle>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {agencyUsers.length} Membros Vinculados
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {permissions.can_manage_agencies && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-11 rounded-2xl border-border/40 font-bold gap-2 hover:bg-muted/50 transition-all shadow-sm"
                                                onClick={() => setConfigAgency(agency)}
                                            >
                                                <Settings className="h-4 w-4" /> Configurar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                                                onClick={() => {
                                                    setAgencyToDelete(agency);
                                                    setIsDeleteOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            {/* Create Agency Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-2xl font-black font-heading tracking-tight flex items-center gap-3">
                            <Building2 className="h-8 w-8" /> Nova Unidade
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">
                            Cadastre uma nova agência no sistema para alocação de profissionais.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Agência *</Label>
                                <Input
                                    placeholder="Ex: Agência Central"
                                    value={newAgencyName}
                                    onChange={(e) => setNewAgencyName(e.target.value)}
                                    className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold px-4"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Código Identificador</Label>
                                <Input
                                    placeholder="Ex: 002-X"
                                    value={newAgencyCode}
                                    onChange={(e) => setNewAgencyCode(e.target.value)}
                                    className="h-12 rounded-xl border-border/40 bg-muted/10 focus:bg-background transition-all font-bold px-4"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold">Cancelar</Button>
                            <Button onClick={handleCreateAgency} disabled={saving} className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-black gap-2">
                                {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                                Criar Agência
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move User Dialog */}
            <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-sm p-0 overflow-hidden bg-card/95 backdrop-blur-xl">
                    <DialogHeader className="p-8 bg-amber-500 text-white">
                        <DialogTitle className="text-2xl font-black font-heading tracking-tight flex items-center gap-3">
                            <ArrowRightLeft className="h-8 w-8" /> Alocação
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-medium pt-2">
                            Mover <strong>{selectedUser?.full_name || selectedUser?.email}</strong> para outra unidade.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unidade de Destino</Label>
                            <Select value={targetAgencyId} onValueChange={setTargetAgencyId}>
                                <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/10 font-bold">
                                    <SelectValue placeholder="Selecione a agência" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/40 shadow-premium">
                                    {agencies.map((a) => (
                                        <SelectItem key={a.id} value={a.id} className="rounded-lg">
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" onClick={() => setIsMoveOpen(false)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold">Cancelar</Button>
                            <Button onClick={handleMoveUser} disabled={saving || !targetAgencyId} className="flex-1 h-12 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 font-black gap-2">
                                {saving && <Loader2 className="h-5 w-5 animate-spin" />}
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Agency Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="rounded-3xl border-border/40 shadow-premium p-0 overflow-hidden bg-card/95 backdrop-blur-xl max-w-md">
                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
                                <Trash2 className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black font-heading text-foreground">Excluir Unidade?</h2>
                                <p className="text-sm text-muted-foreground font-medium mt-1">Essa ação removerá a agência "{agencyToDelete?.name}" permanentemente.</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/40">
                            Os usuários e dados vinculados a ela serão desvinculados, mas não serão excluídos. Esta operação não pode ser revertida.
                        </p>

                        <div className="flex gap-3">
                            <AlertDialogCancel onClick={() => setAgencyToDelete(null)} className="flex-1 h-12 rounded-2xl border-border/40 font-bold bg-white m-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                className="flex-1 h-12 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 m-0"
                                onClick={handleDeleteAgency}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirmar Exclusão
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
            {/* Agency Config Dialog */}
            <Dialog open={!!configAgency} onOpenChange={(open) => !open && setConfigAgency(null)}>
                <DialogContent className="rounded-3xl border-border/40 shadow-premium max-w-4xl p-0 overflow-hidden bg-card/95 backdrop-blur-xl max-h-[85vh] flex flex-col">
                    <DialogHeader className="p-8 bg-muted/30 border-b border-border/50 shrink-0">
                        <DialogTitle className="text-2xl font-black font-heading tracking-tight flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-primary" /> 
                            Configuração: {configAgency?.name}
                        </DialogTitle>
                        <DialogDescription className="font-medium mt-2">
                            Gerencie os profissionais alocados nesta agência.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-auto p-0 scrollbar-thin">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10 shadow-sm">
                                <TableRow className="border-b border-border/40 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 h-12 px-6 whitespace-nowrap">Profissional</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 h-12 px-6 whitespace-nowrap">Contato Corporativo</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 h-12 px-6 whitespace-nowrap">Identificação (CPF)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 h-12 px-6 text-right whitespace-nowrap">Controle</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {configAgency && getUsersForAgency(configAgency.id).map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-white/60 transition-colors border-b border-border/40 last:border-0 h-16">
                                        <TableCell className="px-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                                            {user.full_name || "Colaborador sem nome"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 font-medium text-muted-foreground whitespace-nowrap">{user.email || "-"}</TableCell>
                                        <TableCell className="px-6 py-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{user.cpf || "-"}</TableCell>
                                        <TableCell className="px-6 py-4 text-right whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-4 rounded-xl text-xs font-black uppercase tracking-widest gap-2 text-primary hover:bg-primary/10 transition-all"
                                                onClick={() => {
                                                    // Fechar o dialog atual antes de abrir o de reatribuir para evitar sobreposição bugada visualmente
                                                    setConfigAgency(null);
                                                    setTimeout(() => openMoveDialog(user), 150);
                                                }}
                                                disabled={!permissions.can_manage_agencies}
                                            >
                                                <ArrowRightLeft className="h-3.5 w-3.5" /> Reatribuir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {configAgency && getUsersForAgency(configAgency.id).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2 opacity-50">
                                                <Users className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Nenhum profissional alocado</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
