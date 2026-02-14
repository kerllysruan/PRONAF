import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { REQUIRED_DOCUMENTS } from "@/types/proposal";

export interface DbProposal {
  id: string;
  user_id: string;
  producer_name: string;
  producer_cpf: string;
  producer_address: string;
  producer_phone: string;
  pronaf_line: string;
  requested_value: number;
  status: string;
  entry_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbDocument {
  id: string;
  proposal_id: string;
  name: string;
  completed: boolean;
}

export function useProposals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<(DbProposal & { documents: DbDocument[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("*, proposal_documents(*)")
      .order("created_at", { ascending: false });

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
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const createProposal = async (data: Omit<DbProposal, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return;
    const { data: newProposal, error } = await supabase
      .from("proposals")
      .insert({ ...data, user_id: user.id })
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
    await fetchProposals();
    return newProposal;
  };

  const updateProposal = async (id: string, data: Partial<DbProposal>) => {
    const { error } = await supabase.from("proposals").update(data).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposta atualizada!" });
      await fetchProposals();
    }
  };

  const deleteProposal = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta proposta e todos os registros vinculados?")) return;
    try {
      if (!user) throw new Error("Usuário não autenticado");
      if (!id) throw new Error("ID da proposta não é válido");

      // Remove da UI imediatamente para feedback visual rápido
      setProposals((prev) => prev.filter((p) => p.id !== id));

      // 1. Deletar comentários de tarefas vinculadas a esta proposta
      // Primeiro buscamos as IDs das tarefas da proposta
      const { data: proposalTasks } = await supabase
        .from("document_tasks")
        .select("id")
        .eq("proposal_id", id);
      
      const taskIds = proposalTasks?.map(t => t.id) || [];
      
      if (taskIds.length > 0) {
        const { error: commentsError } = await supabase
          .from("task_comments")
          .delete()
          .in("task_id", taskIds);
        if (commentsError) console.warn("Erro ao deletar comentários:", commentsError);
      }

      // 2. Deletar tarefas (document_tasks)
      const { error: tasksError } = await supabase
        .from("document_tasks")
        .delete()
        .eq("proposal_id", id);
      if (tasksError) console.warn("Erro ao deletar tarefas:", tasksError);

      // 3. Deletar desembolsos
      const { error: disError } = await supabase
        .from("disbursements")
        .delete()
        .eq("proposal_id", id);
      if (disError) console.warn("Erro ao deletar desembolsos:", disError);

      // 4. Deletar visitas
      const { error: visitsError } = await supabase
        .from("visits")
        .delete()
        .eq("proposal_id", id);
      if (visitsError) console.warn("Erro ao deletar visitas:", visitsError);

      // 5. Deletar documentos de checklist
      const { error: docsError } = await supabase
        .from("proposal_documents")
        .delete()
        .eq("proposal_id", id);
      if (docsError && docsError.code !== "PGRST116") throw docsError;

      // 6. Por fim, deletar a proposta
      const { error: proposalError } = await supabase
        .from("proposals")
        .delete()
        .eq("id", id);
      if (proposalError) throw proposalError;

      toast({ title: "Sucesso", description: "Proposta e todos os registros vinculados removidos com sucesso", variant: "default" });
      
      // Atualiza para garantir sincronia
      await fetchProposals();
    } catch (error: any) {
      console.error("Erro ao deletar proposta:", error);
      toast({ title: "Erro ao excluir", description: error.message || "Erro ao deletar a proposta", variant: "destructive" });
      // Reverte/Recarrega em caso de erro
      await fetchProposals();
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
      await fetchProposals();
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
