import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | 'all'>(() => {
        return localStorage.getItem('selectedAgencyId') || 'all';
    });

    const fetchAgencies = useCallback(async () => {
        const { data } = await supabase
            .from('agencies')
            .select('id, name, code')
            .order('name');
        if (data) setAgencies(data);
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

    return (
        <AgencyContext.Provider value={{
            selectedAgencyId,
            setSelectedAgencyId,
            agencies,
            refreshAgencies: fetchAgencies
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
