import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "./use-toast";
import { StockProposal, InsertStockProposal, UpdateStockProposal } from "@/types/stock";

export function useStockProposals() {
  const [proposals, setProposals] = useState<StockProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("stock_proposals")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (effectiveAgencyId !== "all") {
        query = query.eq("agency_id", effectiveAgencyId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProposals(data || []);
    } catch (err: any) {
      console.error("Error fetching stock proposals:", err);
      setError(err.message);
      toast({
        title: "Erro ao buscar propostas em estoque",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, effectiveAgencyId, toast]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const addProposal = async (proposal: InsertStockProposal) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("stock_proposals")
        .insert([{
          ...proposal,
          agency_id: effectiveAgencyId === "all" ? undefined : effectiveAgencyId,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setProposals((prev) => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Proposta adicionada ao estoque com sucesso.",
      });
      return data;
    } catch (err: any) {
      console.error("Error adding stock proposal:", err);
      toast({
        title: "Erro ao adicionar proposta",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProposal = async (id: string, updates: UpdateStockProposal) => {
    try {
      const { data, error } = await supabase
        .from("stock_proposals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      toast({
        title: "Sucesso",
        description: "Proposta atualizada com sucesso.",
      });
      return data;
    } catch (err: any) {
      console.error("Error updating stock proposal:", err);
      toast({
        title: "Erro ao atualizar proposta",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("stock_proposals")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Sucesso",
        description: "Proposta removida do estoque.",
      });
      return true;
    } catch (err: any) {
      console.error("Error deleting stock proposal:", err);
      toast({
        title: "Erro ao remover proposta",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAllProposals = async () => {
    try {
      let query = supabase.from("stock_proposals").delete();

      if (effectiveAgencyId !== "all") {
        query = query.eq("agency_id", effectiveAgencyId);
      } else {
        // Delete all — need a always-true filter for Supabase
        query = query.gte("created_at", "1970-01-01");
      }

      const { error } = await query;
      if (error) throw error;

      setProposals([]);
      toast({
        title: "Sucesso",
        description: "Todas as propostas foram removidas do estoque.",
      });
      return true;
    } catch (err: any) {
      console.error("Error deleting all stock proposals:", err);
      toast({
        title: "Erro ao apagar propostas",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    proposals,
    loading,
    error,
    addProposal,
    updateProposal,
    deleteProposal,
    deleteAllProposals,
    refreshProposals: fetchProposals,
  };
}
