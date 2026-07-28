import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/contexts/AgencyContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppStockProposal {
  id: string;
  producer_name: string;
  producer_cpf: string | null;
  credit_program: string | null;
  estimated_value: number | null;
  status: string;
  municipio: string | null;
  projetista: string | null;
  created_at: string;
  updated_at: string;
  agency_id: string;
  [key: string]: any;
}

export interface AppMainProposal {
  id: string;
  producer_name: string;
  producer_cpf: string;
  status: string;
  credit_program?: string;
  requested_value: number;
  entry_date: string;
  project_designer?: string;
  [key: string]: any;
}

export interface AppDocSubmission {
  id: string;
  proposal_id: string;
  producer_name: string;
  status: string;
  approvedCount: number;
  totalFiles: number;
}

interface AppDataContextValue {
  stockProposals: AppStockProposal[];
  mainProposals: AppMainProposal[];
  stockLoading: boolean;
  mainLoading: boolean;
  /** Count of stock proposals not in CONCLUÍDO that need attention */
  pendingStockCount: number;
  /** Count of stock proposals in AUTORIZADO ENVIO CENTRAL waiting for doc review */
  pendingDocCount: number;
  /** Count of main proposals (concluded) */
  concludedCount: number;
  refreshAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextValue>({
  stockProposals: [],
  mainProposals: [],
  stockLoading: false,
  mainLoading: false,
  pendingStockCount: 0,
  pendingDocCount: 0,
  concludedCount: 0,
  refreshAll: () => {},
});

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { effectiveAgencyId } = useAgency();

  const [stockProposals, setStockProposals] = useState<AppStockProposal[]>([]);
  const [mainProposals, setMainProposals] = useState<AppMainProposal[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [mainLoading, setMainLoading] = useState(false);

  const userId = user?.id;
  const loadedRef = useRef(false);

  const fetchStock = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setStockLoading(true);
    try {
      let q = supabase
        .from("stock_proposals")
        .select("id,producer_name,producer_cpf,credit_program,estimated_value,status,municipio,projetista,created_at,updated_at,agency_id")
        .order("updated_at", { ascending: false });
      if (effectiveAgencyId !== "all") {
        q = q.eq("agency_id", effectiveAgencyId);
      }
      const { data } = await q;
      setStockProposals((data as AppStockProposal[]) || []);
    } finally {
      if (!silent) setStockLoading(false);
    }
  }, [userId, effectiveAgencyId]);

  const fetchMain = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setMainLoading(true);
    try {
      let q = supabase
        .from("proposals")
        .select("id,producer_name,producer_cpf,status,credit_program,requested_value,entry_date,project_designer")
        .order("created_at", { ascending: false });
      if (effectiveAgencyId && effectiveAgencyId !== "all") {
        q = q.eq("agency_id", effectiveAgencyId);
      }
      const { data } = await q;
      setMainProposals((data as AppMainProposal[]) || []);
    } finally {
      if (!silent) setMainLoading(false);
    }
  }, [userId, effectiveAgencyId]);

  const refreshAll = useCallback(() => {
    fetchStock(true);
    fetchMain(true);
  }, [fetchStock, fetchMain]);

  useEffect(() => {
    if (!userId) return;
    if (!loadedRef.current) {
      fetchStock();
      fetchMain();
      loadedRef.current = true;
    } else {
      fetchStock(true);
      fetchMain(true);
    }

    // Real-time subscriptions
    const stockChannel = supabase
      .channel("app-data-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_proposals" }, () => {
        fetchStock(true);
      })
      .subscribe();

    const proposalChannel = supabase
      .channel("app-data-proposals")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => {
        fetchMain(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stockChannel);
      supabase.removeChannel(proposalChannel);
    };
  }, [userId, effectiveAgencyId, fetchStock, fetchMain]);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const pendingStockCount = stockProposals.filter((p) => {
    const s = (p.status || "").toUpperCase();
    return s !== "CONCLUÍDO" && s !== "CONCLUIDO";
  }).length;

  const pendingDocCount = stockProposals.filter((p) => {
    const s = (p.status || "").toUpperCase();
    return s === "AUTORIZADO ENVIO CENTRAL" || s === "DOCUMENTAÇÃO PENDENTE" || s === "DOCUMENTAÇÃO APROVADA";
  }).length;

  const concludedCount = stockProposals.filter((p) => {
    const s = (p.status || "").toUpperCase();
    return s === "CONCLUÍDO" || s === "CONCLUIDO";
  }).length + mainProposals.filter((p) => p.status === "aprovada").length;

  return (
    <AppDataContext.Provider
      value={{
        stockProposals,
        mainProposals,
        stockLoading,
        mainLoading,
        pendingStockCount,
        pendingDocCount,
        concludedCount,
        refreshAll,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
