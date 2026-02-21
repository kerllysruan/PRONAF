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
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/10">
                <Building2 className="h-[18px] w-[18px]" />
            </div>
            <Select
                value={selectedAgencyId}
                onValueChange={(value) => setSelectedAgencyId(value)}
            >
                <SelectTrigger className="w-[220px] h-10 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/30 transition-all font-bold text-xs">
                    <SelectValue placeholder="Selecionar Agência" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-premium">
                    <SelectItem value="all" className="rounded-xl font-bold py-2.5">Todas as Agências</SelectItem>
                    {agencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id} className="rounded-xl font-bold py-2.5">
                            {agency.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
