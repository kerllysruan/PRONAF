import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "./use-toast";
import {
  CertidaoProdutor,
  InsertCertidaoProdutor,
  UpdateCertidaoProdutor,
} from "@/types/certificates";
import { StockProposal } from "@/types/stock";

export function useCertificates() {
  const [certificates, setCertificates] = useState<CertidaoProdutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();
  const hasLoadedRef = useRef(false);

  const fetchCertificates = useCallback(
    async (silent = false) => {
      if (!user?.id) return;

      try {
        if (!silent && !hasLoadedRef.current) {
          setLoading(true);
        }
        setError(null);

        let query = (supabase as any)
          .from("certidoes_produtores")
          .select("*")
          .order("atualizado_em", { ascending: false });

        if (effectiveAgencyId && effectiveAgencyId !== "all") {
          query = query.eq("agency_id", effectiveAgencyId);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        setCertificates(data || []);
        hasLoadedRef.current = true;
      } catch (err: any) {
        console.error("Erro ao buscar certidões:", err);
        setError(err.message);
        toast({
          title: "Erro ao buscar certidões",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user?.id, effectiveAgencyId, toast]
  );

  // Real-time updates
  useEffect(() => {
    fetchCertificates();

    const channel = supabase
      .channel("certidoes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "certidoes_produtores",
        },
        () => {
          fetchCertificates(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCertificates]);

  const insertCertificate = async (item: InsertCertidaoProdutor) => {
    try {
      const payload = {
        ...item,
        created_by: user?.id,
        agency_id: item.agency_id || (effectiveAgencyId !== "all" ? effectiveAgencyId : null),
        atualizado_em: new Date().toISOString(),
      };

      const { data, error: insertError } = await (supabase as any)
        .from("certidoes_produtores")
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setCertificates((prev) => [data, ...prev]);
      toast({
        title: "Consulta adicionada com sucesso",
        description: `${item.nome} (${item.tipo}: ${item.identificador})`,
      });
      return data;
    } catch (err: any) {
      console.error("Erro ao criar certidão:", err);
      toast({
        title: "Falha ao adicionar certidão",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const insertBatch = async (items: InsertCertidaoProdutor[]) => {
    if (items.length === 0) return [];
    try {
      const payloads = items.map((item) => ({
        ...item,
        created_by: user?.id,
        agency_id: item.agency_id || (effectiveAgencyId !== "all" ? effectiveAgencyId : null),
        atualizado_em: new Date().toISOString(),
      }));

      const { data, error: batchError } = await (supabase as any)
        .from("certidoes_produtores")
        .insert(payloads)
        .select();

      if (batchError) throw batchError;

      fetchCertificates(true);
      toast({
        title: "Lote importado com sucesso",
        description: `${items.length} itens adicionados à fila de certidões.`,
      });
      return data || [];
    } catch (err: any) {
      console.error("Erro ao importar lote de certidões:", err);
      toast({
        title: "Falha na importação em lote",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateCertificate = async (id: string, updates: UpdateCertidaoProdutor) => {
    try {
      const payload = {
        ...updates,
        atualizado_em: new Date().toISOString(),
      };

      const { data, error: updateError } = await (supabase as any)
        .from("certidoes_produtores")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCertificates((prev) => prev.map((c) => (c.id === id ? data : c)));
      return data;
    } catch (err: any) {
      console.error("Erro ao atualizar certidão:", err);
      toast({
        title: "Falha ao atualizar certidão",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteCertificate = async (id: string) => {
    try {
      const { error: delError } = await (supabase as any)
        .from("certidoes_produtores")
        .delete()
        .eq("id", id);

      if (delError) throw delError;

      setCertificates((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Registro removido com sucesso",
      });
    } catch (err: any) {
      console.error("Erro ao excluir certidão:", err);
      toast({
        title: "Falha ao excluir registro",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const { error: delError } = await (supabase as any)
        .from("certidoes_produtores")
        .delete()
        .in("id", ids);

      if (delError) throw delError;

      setCertificates((prev) => prev.filter((c) => !ids.includes(c.id)));
      toast({
        title: `${ids.length} certidões removidas com sucesso`,
      });
    } catch (err: any) {
      console.error("Erro ao excluir lote:", err);
      toast({
        title: "Falha ao excluir lote",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const importFromStock = async (proposals: StockProposal[]) => {
    const validProposals = proposals.filter((p) => p.producer_name && p.producer_cpf);
    if (validProposals.length === 0) {
      toast({
        title: "Nenhuma proposta com CPF válido encontrada no estoque",
        variant: "destructive",
      });
      return 0;
    }

    // Filter out existing identificadores already in certificates
    const existingIds = new Set(certificates.map((c) => c.identificador.replace(/\D/g, "")));
    const toInsert: InsertCertidaoProdutor[] = [];

    for (const p of validProposals) {
      const cleanCpf = (p.producer_cpf || "").replace(/\D/g, "");
      if (cleanCpf && !existingIds.has(cleanCpf)) {
        existingIds.add(cleanCpf);
        toInsert.push({
          agency_id: p.agency_id || (effectiveAgencyId !== "all" ? effectiveAgencyId : null),
          proposal_id: p.id,
          tipo: "CPF",
          identificador: p.producer_cpf || "",
          nome: p.producer_name,
          data_nascimento: null,
          situacao: "PENDENTE",
          data_emissao: null,
          data_validade: null,
          codigo_controle: null,
          observacoes: p.municipio ? `Município: ${p.municipio}` : null,
          status_consulta: "PENDENTE",
          motivo_erro: null,
          pdf_url: null,
          arquivo_nome: null,
          created_by: user?.id || null,
        });
      }
    }

    if (toInsert.length === 0) {
      toast({
        title: "Todas as propostas do estoque já estão na lista de certidões",
      });
      return 0;
    }

    await insertBatch(toInsert);
    return toInsert.length;
  };

  return {
    certificates,
    loading,
    error,
    refresh: fetchCertificates,
    insertCertificate,
    insertBatch,
    updateCertificate,
    deleteCertificate,
    deleteBatch,
    importFromStock,
  };
}
