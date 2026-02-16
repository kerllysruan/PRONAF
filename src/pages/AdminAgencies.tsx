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
import { Plus, Building2, Users, ArrowRightLeft, Loader2, Trash2 } from "lucide-react";
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
    const { agencies } = useAgency();
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
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Gestão de Agências
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administração de agências e usuários vinculados
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-md shadow-primary/20">
                    <Plus className="h-4 w-4" /> Nova Agência
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{agencies.length}</p>
                            <p className="text-xs text-muted-foreground">Agências</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{users.filter(u => u.agency_id).length}</p>
                            <p className="text-xs text-muted-foreground">Usuários vinculados</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{unassignedUsers.length}</p>
                            <p className="text-xs text-muted-foreground">Sem agência</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unassigned Users */}
            {unassignedUsers.length > 0 && (
                <Card className="overflow-hidden border-amber-500/30">
                    <CardHeader className="bg-amber-500/10 pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                            <Users className="h-4 w-4" />
                            Usuários sem agência vinculada
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unassignedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
                                        <TableCell>{user.email || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="gap-1" onClick={() => openMoveDialog(user)}>
                                                <ArrowRightLeft className="h-3 w-3" /> Atribuir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Agency Cards */}
            <div className="grid gap-6">
                {agencies.map((agency) => {
                    const agencyUsers = getUsersForAgency(agency.id);
                    return (
                        <Card key={agency.id} className="overflow-hidden border-0 shadow-md">
                            <CardHeader className="bg-muted/30 pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        {agency.name}
                                        <Badge variant="outline" className="text-xs font-normal ml-2">
                                            {agency.code || "N/A"}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {agencyUsers.length} usuário{agencyUsers.length !== 1 ? "s" : ""}
                                        </Badge>
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setAgencyToDelete(agency);
                                            setIsDeleteOpen(true);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>CPF</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {agencyUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.full_name || "Sem nome"}</TableCell>
                                                <TableCell>{user.email || "-"}</TableCell>
                                                <TableCell>{user.cpf || "-"}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => openMoveDialog(user)}>
                                                        <ArrowRightLeft className="h-3 w-3" /> Mover
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {agencyUsers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                                    Nenhum usuário vinculado a esta agência.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Create Agency Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Agência</DialogTitle>
                        <DialogDescription>
                            Crie uma nova agência. Todas as configurações de banco de dados serão aplicadas automaticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="agency-name">Nome da Agência *</Label>
                            <Input
                                id="agency-name"
                                placeholder="Ex: Agência Centro"
                                value={newAgencyName}
                                onChange={(e) => setNewAgencyName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agency-code">Código (opcional)</Label>
                            <Input
                                id="agency-code"
                                placeholder="Ex: 002"
                                value={newAgencyCode}
                                onChange={(e) => setNewAgencyCode(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateAgency} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Criar Agência
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move User Dialog */}
            <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Atribuir Agência</DialogTitle>
                        <DialogDescription>
                            Mover <strong>{selectedUser?.full_name || selectedUser?.email}</strong> para outra agência.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Agência de destino</Label>
                            <Select value={targetAgencyId} onValueChange={setTargetAgencyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a agência" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agencies.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMoveOpen(false)}>Cancelar</Button>
                        <Button onClick={handleMoveUser} disabled={saving || !targetAgencyId} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Agency Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" /> Excluir Agência?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a agência <strong>{agencyToDelete?.name}</strong>?
                            Os usuários e dados vinculados a ela serão desvinculados, mas não serão excluídos.
                            Esta ação é irreversível.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAgencyToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteAgency}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Excluir permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
