import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "./use-toast";

export interface DbDisbursement {
  id: string;
  user_id: string;
  proposal_id: string | null;
  requested_by: string | null;
  amount: number;
  disbursement_type: 'total' | 'parcial';
  status: string;
  request_date: string;
  expected_date: string | null;
  disbursed_date: string | null;
  bank_name: string;
  agency: string;
  account: string;
  notes: string;
  created_at: string;
  updated_at: string;
  agency_id: string;
}

export type DisbursementStatus = "pendente" | "aprovado" | "liberado" | "negado";

export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementStatus, string> = {
  pendente: "Pendente de solicitação desembolso",
  aprovado: "Solicitado",
  liberado: "Liberado",
  negado: "Negado",
};

export const DISBURSEMENT_STATUS_COLORS: Record<DisbursementStatus, string> = {
  pendente: "bg-warning text-warning-foreground",
  aprovado: "bg-info text-info-foreground",
  liberado: "bg-success text-success-foreground",
  negado: "bg-destructive text-destructive-foreground",
};

export function useDisbursements() {
  const { user, agencyId } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();
  const [disbursements, setDisbursements] = useState<DbDisbursement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisbursements = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);

    let query = supabase
      .from("disbursements")
      .select("*")
      .order("created_at", { ascending: false });

    if (effectiveAgencyId && effectiveAgencyId !== "all") {
      query = query.eq("agency_id", effectiveAgencyId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Erro ao carregar desembolsos", description: error.message, variant: "destructive" });
    } else {
      setDisbursements((data as DbDisbursement[]) || []);
    }
    if (!silent) setLoading(false);
  }, [user, toast, effectiveAgencyId]);

  useEffect(() => {
    fetchDisbursements();

    const channel = supabase
      .channel('disbursements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'disbursements'
        },
        () => {
          fetchDisbursements(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDisbursements]);

  const createDisbursement = async (data: Omit<DbDisbursement, "id" | "user_id" | "created_at" | "updated_at" | "agency_id">) => {
    if (!user) return;
    const { error } = await supabase.from("disbursements").insert({ ...data, user_id: user.id, agency_id: agencyId } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pedido de desembolso criado!" });
      await fetchDisbursements(true);
    }
  };

  const updateDisbursement = async (id: string, data: Partial<DbDisbursement>) => {
    const { error } = await supabase.from("disbursements").update(data as any).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Desembolso atualizado!" });
      await fetchDisbursements(true);
    }
  };

  const deleteDisbursement = async (id: string) => {
    const { error } = await supabase.from("disbursements").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Desembolso removido." });
      await fetchDisbursements(true);
    }
  };

  return { disbursements, loading, createDisbursement, updateDisbursement, deleteDisbursement, refetch: fetchDisbursements };
}
