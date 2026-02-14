import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
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
}

export type DisbursementStatus = "pendente" | "aprovado" | "liberado" | "negado";

export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [disbursements, setDisbursements] = useState<DbDisbursement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisbursements = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("disbursements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar desembolsos", description: error.message, variant: "destructive" });
    } else {
      setDisbursements((data as DbDisbursement[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchDisbursements();
  }, [fetchDisbursements]);

  const createDisbursement = async (data: Omit<DbDisbursement, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { error } = await supabase.from("disbursements").insert({ ...data, user_id: user.id } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pedido de desembolso criado!" });
      await fetchDisbursements();
    }
  };

  const updateDisbursement = async (id: string, data: Partial<DbDisbursement>) => {
    const { error } = await supabase.from("disbursements").update(data as any).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Desembolso atualizado!" });
      await fetchDisbursements();
    }
  };

  const deleteDisbursement = async (id: string) => {
    const { error } = await supabase.from("disbursements").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Desembolso removido." });
      await fetchDisbursements();
    }
  };

  return { disbursements, loading, createDisbursement, updateDisbursement, deleteDisbursement, refetch: fetchDisbursements };
}
