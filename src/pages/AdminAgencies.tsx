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
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Pencil } from "lucide-react";

interface Agency {
    id: string;
    name: string;
    code: string;
    created_at: string;
}

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: string; // Ensure this exists on profile, or join with user_roles
    agency_id: string;
}

export default function AdminAgencies() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Agencies
        const { data: agenciesData, error: agenciesError } = await supabase
            .from("agencies")
            .select("*")
            .order("name");

        if (agenciesError) {
            toast({ title: "Erro", description: "Falha ao carregar agências", variant: "destructive" });
        } else {
            setAgencies(agenciesData || []);
        }

        // Fetch Users with Agency Info
        // Assuming profiles has email (verified) and agency_id
        // But role is in user_roles. Let's just fetch profiles for now and maybe join roles if possible or needed.
        // Displaying role is nice but let's focus on Agency assignment first.
        const { data: usersData, error: usersError } = await supabase
            .from("profiles")
            .select("*"); // Select all for now

        if (usersError) {
            toast({ title: "Erro", description: "Falha ao carregar usuários", variant: "destructive" });
        } else {
            setUsers(usersData || []);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-heading">Gestão de Agências</h1>
                    <p className="text-sm text-muted-foreground">Administração de agências e usuários</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Agência
                </Button>
            </div>

            <div className="grid gap-6">
                {agencies.map((agency) => (
                    <Card key={agency.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {agency.name}
                                    <Badge variant="outline" className="text-xs font-normal">Code: {agency.code || 'N/A'}</Badge>
                                </CardTitle>
                                <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>CPF</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(u => u.agency_id === agency.id).map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name || 'Sem nome'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.cpf || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {users.filter(u => u.agency_id === agency.id).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                Nenhum usuário vinculado a esta agência.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
