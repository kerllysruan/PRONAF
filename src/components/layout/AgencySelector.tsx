import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/contexts/AgencyContext";
import { useAuth } from "@/hooks/useAuth";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function AgencySelector() {
    const { isDeveloper, isAdmin } = useAuth();
    const { selectedAgencyId, setSelectedAgencyId, agencies } = useAgency();

    // Only developers and admins can switch between agencies
    if (!isDeveloper && !isAdmin) return null;

    return (
        <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select
                value={selectedAgencyId}
                onValueChange={(value) => setSelectedAgencyId(value)}
            >
                <SelectTrigger className="w-[180px] h-8 text-xs bg-background/50 border-muted-foreground/20">
                    <SelectValue placeholder="Selecionar Agência" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Agências</SelectItem>
                    {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
