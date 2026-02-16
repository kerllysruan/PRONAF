import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AgencyContextType {
    selectedAgencyId: string | 'all';
    setSelectedAgencyId: (id: string | 'all') => void;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
    const [selectedAgencyId, setSelectedAgencyId] = useState<string | 'all'>(() => {
        // Persistent selection
        return localStorage.getItem('selectedAgencyId') || 'all';
    });

    useEffect(() => {
        localStorage.setItem('selectedAgencyId', selectedAgencyId);
    }, [selectedAgencyId]);

    return (
        <AgencyContext.Provider value={{ selectedAgencyId, setSelectedAgencyId }}>
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
