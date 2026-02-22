import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "./use-toast";
import { REQUIRED_DOCUMENTS } from "@/types/proposal";

export interface DbProposal {
  id: string;
  created_by: string;
  producer_name: string;
  producer_cpf: string;
  producer_address: string;
  producer_phone: string;
  pronaf_line: string;
  project_designer?: string;
  requested_value: number;
  status: string;
  entry_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  agency_id: string;
  // Campos extraídos do PDF
  sicad?: string;
  credit_program?: string;
  request_type?: string;
  agency_code?: string;
  agency_name?: string;
  task?: string;
  central_date?: string;
  activity_start_date?: string;
  last_analyst?: string;
  owner?: string;
  originator?: string;
  current_state?: string;
  category?: string;
  client_size?: string;
  proposal_number?: string;
  credit_purpose?: string;
  resource_application?: string;
  special_treatment?: string;
  central?: string;
  superintendence_code?: string;
  superintendence_name?: string;
  microcredit?: string;
  renegotiation_type?: string;
  guarantee_type?: string;
  registration_central_task?: string;
  registration_central_activity_start?: string;
  judicial_period?: string;
  requesting_unit?: string;
  agreement?: string;
  culture?: string;
  roc_type?: string;
  poa_prd_subject?: string;
  activity_id?: string;
}

export interface DbDocument {
  id: string;
  proposal_id: string;
  name: string;
  completed: boolean;
}

export function useProposals() {
  const { user, agencyId } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<(DbProposal & { documents: DbDocument[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);

    let query = supabase
      .from("proposals")
      .select("*, proposal_documents(*)")
      .order("created_at", { ascending: false });

    // Apply agency filter
    if (effectiveAgencyId && effectiveAgencyId !== "all") {
      // DEBUG: Toast to confirm filter application
      // toast({ title: "Filtro Ativo", description: `Filtrando por agência: ${effectiveAgencyId}` });
      query = query.eq("agency_id", effectiveAgencyId);
    } else {
      // toast({ title: "Sem Filtro", description: "Mostrando todas as propostas" });
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Erro ao carregar propostas", description: error.message, variant: "destructive" });
    } else {
      setProposals(
        (data || []).map((p: any) => ({
          ...p,
          documents: p.proposal_documents || [],
        }))
      );
    }
    if (!silent) setLoading(false);
  }, [user, toast, effectiveAgencyId]);

  useEffect(() => {
    fetchProposals();

    const channel = supabase
      .channel('proposals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals'
        },
        () => {
          fetchProposals(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProposals]);

  const createProposal = async (data: Omit<DbProposal, "id" | "created_by" | "created_at" | "updated_at" | "agency_id">) => {
    if (!user) return;
    if (!agencyId) {
      toast({ title: "Erro", description: "Agência não encontrada para o usuário.", variant: "destructive" });
      return null;
    }

    const { data: newProposal, error } = await supabase
      .from("proposals")
      .insert({ ...data, created_by: user.id, agency_id: agencyId })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao criar proposta", description: error.message, variant: "destructive" });
      return null;
    }

    // Create default documents
    const docs = REQUIRED_DOCUMENTS.map((name) => ({
      proposal_id: newProposal.id,
      name,
      completed: false,
    }));
    await supabase.from("proposal_documents").insert(docs);

    toast({ title: "Proposta cadastrada com sucesso!" });
    await fetchProposals(true);
    return newProposal;
  };

  const updateProposal = async (id: string, data: Partial<DbProposal>) => {
    const { error } = await supabase.from("proposals").update(data).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposta atualizada!", duration: 2000 });
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      // Ensure real-time consistency across files that may depend on this (like Disbursements)
      await fetchProposals(true);
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      if (!id) throw new Error("ID da proposta não é válido");

      // Remove da UI imediatamente para feedback visual rápido
      setProposals((prev) => prev.filter((p) => p.id !== id));

      // Deletar a proposta via função server-side (SECURITY DEFINER)
      // A função verifica permissões e executa o DELETE com CASCADE no servidor
      const { error } = await supabase.rpc("delete_proposal" as any, { proposal_id: id });
      if (error) throw error;

      toast({ title: "Sucesso", description: "Proposta e todos os registros vinculados removidos com sucesso", variant: "default" });

      // Atualiza para garantir sincronia
      await fetchProposals(true);
    } catch (error: any) {
      console.error("Erro ao deletar proposta:", error);
      toast({ title: "Erro ao excluir", description: error.message || "Erro ao deletar a proposta", variant: "destructive" });
      // Reverte/Recarrega em caso de erro
      await fetchProposals(true);
    }
  };

  const toggleDocument = async (docId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from("proposal_documents")
        .update({ completed })
        .eq("id", docId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: completed ? "Documento marcado como completo" : "Documento desmarcado",
        variant: "default"
      });
      await fetchProposals(true);
    } catch (error: any) {
      console.error("Erro ao atualizar documento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar documento",
        variant: "destructive"
      });
    }
  };

  return { proposals, loading, createProposal, updateProposal, deleteProposal, toggleDocument, refetch: fetchProposals };
}
