

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";

export interface Agency {
    id: string;
    name: string;
    code: string | null;
}

interface AgencyContextType {
    selectedAgencyId: string | 'all';
    setSelectedAgencyId: (id: string | 'all') => void;
    agencies: Agency[];
    refreshAgencies: () => Promise<void>;
    /** The effective agency filter: for developers it follows the selector, for everyone else it's their bound agency */
    effectiveAgencyId: string | 'all';
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const { isDeveloper, isAdmin, agencyId: userAgencyId } = useAuth();
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | 'all'>(() => {
        return localStorage.getItem('selectedAgencyId') || 'all';
    });

    const fetchAgencies = useCallback(async () => {
        const { data, error } = await supabase
            .from('agencies')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching agencies:', error);
            toast({
                title: "Erro ao carregar agências",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        if (data) {
            const hasNunes = data.some(a => a.name.toUpperCase().includes("NUNES FREIRE"));
            if (!hasNunes) {
                setAgencies([{ id: "nunes-freire-291", name: "GOVERNADOR NUNES FREIRE", code: "291" }, ...data]);
            } else {
                setAgencies(data);
            }
        } else {
            setAgencies([{ id: "nunes-freire-291", name: "GOVERNADOR NUNES FREIRE", code: "291" }]);
        }
    }, [toast]);

    useEffect(() => {
        fetchAgencies();
    }, [fetchAgencies]);

    // Effective agency: developers AND admins use selector freely, everyone else is locked to their own agency
    const canSelectAgency = isDeveloper || isAdmin;
    const effectiveAgencyId = canSelectAgency ? selectedAgencyId : (userAgencyId || 'all');

    return (
        <AgencyContext.Provider value={{
            selectedAgencyId,
            setSelectedAgencyId,
            agencies,
            refreshAgencies: fetchAgencies,
            effectiveAgencyId,
        }}>
            {children}
        </AgencyContext.Provider>
    );
}

export function useAgency() {
    const context = useContext(AgencyContext);
    if (context === undefined) {
        throw new Error('useAgency must be used within an AgencyProvider');
    }
    return context;
}
