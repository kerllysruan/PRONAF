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
    const { isDeveloper, agencyId: userAgencyId } = useAuth();
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | 'all'>(() => {
        return localStorage.getItem('selectedAgencyId') || 'all';
    });

    const fetchAgencies = useCallback(async () => {
        const { data, error } = await supabase
            .from('agencies')
            .select('id, name, code')
            .order('name');

        if (error) {
            console.error('Error fetching agencies:', error);
            toast({
                title: "Erro ao carregar agências",
                description: error.message,
                variant: "destructive"
            });
            return;
        }

        if (data) setAgencies(data as Agency[]);
    }, []);

    useEffect(() => {
        fetchAgencies();

        // Real-time subscription
        const channel = supabase
            .channel('public:agencies')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agencies' }, () => {
                fetchAgencies();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchAgencies]);

    useEffect(() => {
        localStorage.setItem('selectedAgencyId', selectedAgencyId);
    }, [selectedAgencyId]);

    // Effective agency: developers use selector freely, everyone else is locked to their own agency
    const effectiveAgencyId = isDeveloper ? selectedAgencyId : (userAgencyId || 'all');

    useEffect(() => {
        console.log('[AgencyContext] State changed:', {
            isDeveloper,
            userAgencyId,
            selectedAgencyId,
            effectiveAgencyId
        });
    }, [isDeveloper, userAgencyId, selectedAgencyId, effectiveAgencyId]);

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
