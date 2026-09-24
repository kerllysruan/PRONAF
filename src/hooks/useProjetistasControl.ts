import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ProjetistaDocumento {
  tipo: string;
  titulo: string;
  nome: string;
  url: string;
  file_path: string;
  tamanho?: number;
  uploaded_at: string;
}

export interface Projetista {
  id: string;
  name: string;
  cpf: string;
  crea_cfta: string;
  phone?: string;
  email?: string;
  municipio?: string;
  uf?: string;
  chave_pix?: string;
  status: "ativo" | "inativo" | "pendente";
  documentos?: ProjetistaDocumento[];
  observacoes?: string;
  motivo_rejeicao?: string;
  validado_por?: string;
  validado_em?: string;
  created_at: string;
  updated_at?: string;
}

export const DEFAULT_PROJETISTAS: Projetista[] = [
  {
    id: "proj-7",
    name: "NEY MEDEIROS DE ARAÚJO",
    cpf: "123.456.789-01",
    crea_cfta: "CREA-MA 12345/D",
    phone: "(98) 98123-4567",
    email: "ney.medeiros@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "proj-2",
    name: "JAIRO SANTANA",
    cpf: "234.567.890-12",
    crea_cfta: "CFTA-MA 67890/P",
    phone: "(98) 98234-5678",
    email: "jairo.santana@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-01-16T11:00:00.000Z",
  },
  {
    id: "proj-3",
    name: "CLEDSON CLOVIS",
    cpf: "345.678.901-23",
    crea_cfta: "CREA-MA 54321/D",
    phone: "(98) 98345-6789",
    email: "cledson.clovis@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-01-17T12:00:00.000Z",
  },
  {
    id: "proj-4",
    name: "JAILSON",
    cpf: "456.789.012-34",
    crea_cfta: "CFTA-MA 09876/P",
    phone: "(98) 98456-7890",
    email: "jailson@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-01-18T13:00:00.000Z",
  },
  {
    id: "proj-5",
    name: "OLIVEIRA",
    cpf: "567.890.123-45",
    crea_cfta: "CREA-MA 13579/D",
    phone: "(98) 98567-8901",
    email: "oliveira@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-01-19T14:00:00.000Z",
  },
  {
    id: "proj-6",
    name: "CLEDSON CLOVIS DA SILVA",
    cpf: "345.678.901-23",
    crea_cfta: "CREA-MA 54321/D",
    phone: "(98) 98345-6789",
    email: "cledson.clovis@pronaf.gov.br",
    status: "ativo",
    created_at: "2024-02-01T10:00:00.000Z",
  },
  {
    id: "proj-8",
    name: "FRANCISCO DAS CHAGAS SOUSA OLIVEIRA",
    cpf: "",
    crea_cfta: "",
    phone: "",
    email: "",
    status: "ativo",
    created_at: "2024-02-01T10:00:00.000Z",
  },
  {
    id: "proj-9",
    name: "JOSE FRANCISCO LIMA SEIXAS",
    cpf: "",
    crea_cfta: "",
    phone: "",
    email: "",
    status: "ativo",
    created_at: "2024-02-01T10:00:00.000Z",
  },
  {
    id: "proj-10",
    name: "TANCREDO ANTONIO DA SILVA OLIVEIRA",
    cpf: "",
    crea_cfta: "",
    phone: "",
    email: "",
    status: "ativo",
    created_at: "2024-02-01T10:00:00.000Z",
  },
];

const STORAGE_KEY = "pronaf_projetistas_list_v3";
const LEGACY_STORAGE_KEYS = ["pronaf_projetistas_list_v2", "pronaf_projetistas_list_v1"];

function cleanProjetistasList(list: Projetista[]): Projetista[] {
  return list
    .filter((p) => {
      const upper = p.name.toUpperCase().trim();
      return upper !== "NEY MEDEIROS" && upper !== "NEY MEDEIRO";
    })
    .map((p) => {
      const upper = p.name.toUpperCase().trim();
      if (upper === "CLEDSON CLOVISSSS" || upper === "CLEDSON CLOVIS DA SILVAAAAAA") {
        return { ...p, name: "CLEDSON CLOVIS" };
      }
      return p;
    });
}

function loadInitialProjetistas(): Projetista[] {
  try {
    const savedV3 = localStorage.getItem(STORAGE_KEY);
    if (savedV3) {
      const parsed = JSON.parse(savedV3);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return cleanProjetistasList(parsed);
      }
    }
  } catch (e) {
    console.error("Erro ao carregar projetistas do localStorage", e);
  }
  return DEFAULT_PROJETISTAS;
}

export function useProjetistasControl() {
  const [projetistas, setProjetistas] = useState<Projetista[]>(loadInitialProjetistas);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projetistas));
    } catch (e) {
      console.error("Erro ao salvar projetistas no localStorage", e);
    }
  }, [projetistas]);

  // Carregar do Supabase (tabela projetistas) como fonte da verdade
  useEffect(() => {
    let isMounted = true;

    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("projetistas")
          .select("*")
          .order("name", { ascending: true });

        if (!error && data && isMounted) {
          const list: Projetista[] = data
            .filter((row: any) => {
              const upper = (row.name || "").toUpperCase().trim();
              return upper && upper !== "NEY MEDEIROS" && upper !== "NEY MEDEIRO";
            })
            .map((row: any) => ({
              id: row.id,
              name: (row.name || "").toUpperCase().trim(),
              cpf: row.cpf || "",
              crea_cfta: row.crea_cfta || "",
              phone: row.phone || "",
              email: row.email || "",
              status: (row.status as "ativo" | "inativo" | "pendente") || "ativo",
              municipio: row.municipio || "",
              uf: row.uf || "",
              chave_pix: row.chave_pix || "",
              documentos: Array.isArray(row.documentos) ? row.documentos : [],
              observacoes: row.observacoes || "",
              motivo_rejeicao: row.motivo_rejeicao || "",
              validado_por: row.validado_por || "",
              validado_em: row.validado_em || "",
              created_at: row.created_at || new Date().toISOString(),
              updated_at: row.updated_at || "",
            }));

          setProjetistas(list);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          } catch (e) {
            console.error("Erro ao salvar projetistas no localStorage", e);
          }
        }
      } catch (err) {
        console.warn("Tabela projetistas ainda não acessível via API direta:", err);
      }
    };

    fetchFromSupabase();

    // Realtime channel para a tabela projetistas
    const channel = supabase
      .channel("realtime-projetistas-control")
      .on("postgres_changes", { event: "*", schema: "public", table: "projetistas" }, () => {
        fetchFromSupabase();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Adicionar Projetista
  const addProjetista = useCallback(
    async (data: Omit<Projetista, "id" | "created_at">) => {
      const newProjetista: Projetista = {
        id: `proj-${Date.now()}`,
        name: data.name.trim().toUpperCase(),
        cpf: data.cpf.trim(),
        crea_cfta: data.crea_cfta.trim().toUpperCase(),
        phone: data.phone?.trim() || "",
        email: data.email?.trim() || "",
        municipio: data.municipio?.trim() || "",
        uf: data.uf?.trim().toUpperCase() || "",
        chave_pix: data.chave_pix?.trim() || "",
        status: data.status || "ativo",
        documentos: data.documentos || [],
        observacoes: data.observacoes || "",
        motivo_rejeicao: data.motivo_rejeicao || "",
        validado_por: data.validado_por || "",
        validado_em: data.validado_em || "",
        created_at: new Date().toISOString(),
      };

      setProjetistas((prev) => [newProjetista, ...prev]);

      // Tentar persistir no Supabase em segundo plano
      try {
        await supabase.from("projetistas").insert({
          id: newProjetista.id,
          name: newProjetista.name,
          cpf: newProjetista.cpf,
          crea_cfta: newProjetista.crea_cfta,
          phone: newProjetista.phone,
          email: newProjetista.email,
          municipio: newProjetista.municipio,
          uf: newProjetista.uf,
          chave_pix: newProjetista.chave_pix,
          status: newProjetista.status,
          documentos: newProjetista.documentos,
          observacoes: newProjetista.observacoes,
          created_at: newProjetista.created_at,
        });
      } catch (err) {
        console.warn("Persistência no Supabase falhou, mantido localmente:", err);
      }

      toast({
        title: "Projetista cadastrado! 👷",
        description: `${newProjetista.name} foi adicionado à lista de projetistas.`,
      });
      return newProjetista;
    },
    [toast]
  );

  // Editar Projetista
  const updateProjetista = useCallback(
    async (id: string, data: Partial<Omit<Projetista, "id" | "created_at">>) => {
      let oldName = "";
      let newName = "";

      setProjetistas((prev) => {
        const currentItem = prev.find((p) => p.id === id);
        if (currentItem) {
          oldName = currentItem.name.trim().toUpperCase();
        }
        newName = data.name ? data.name.trim().toUpperCase() : oldName;

        return prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              ...(data.name && { name: newName }),
              ...(data.cpf !== undefined && { cpf: data.cpf.trim() }),
              ...(data.crea_cfta !== undefined && {
                crea_cfta: data.crea_cfta.trim().toUpperCase(),
              }),
              ...(data.phone !== undefined && { phone: data.phone.trim() }),
              ...(data.email !== undefined && { email: data.email.trim() }),
              ...(data.municipio !== undefined && { municipio: data.municipio.trim() }),
              ...(data.uf !== undefined && { uf: data.uf.trim().toUpperCase() }),
              ...(data.chave_pix !== undefined && { chave_pix: data.chave_pix.trim() }),
              ...(data.status && { status: data.status }),
              ...(data.documentos && { documentos: data.documentos }),
              ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
              ...(data.motivo_rejeicao !== undefined && { motivo_rejeicao: data.motivo_rejeicao }),
              ...(data.validado_por !== undefined && { validado_por: data.validado_por }),
              ...(data.validado_em !== undefined && { validado_em: data.validado_em }),
            };
          }
          return item;
        });
      });

      // Sincronizar no banco de dados Supabase
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (data.name) updatePayload.name = data.name.trim().toUpperCase();
        if (data.cpf !== undefined) updatePayload.cpf = data.cpf.trim();
        if (data.crea_cfta !== undefined)
          updatePayload.crea_cfta = data.crea_cfta.trim().toUpperCase();
        if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
        if (data.email !== undefined) updatePayload.email = data.email.trim();
        if (data.municipio !== undefined) updatePayload.municipio = data.municipio.trim();
        if (data.uf !== undefined) updatePayload.uf = data.uf.trim().toUpperCase();
        if (data.chave_pix !== undefined) updatePayload.chave_pix = data.chave_pix.trim();
        if (data.status) updatePayload.status = data.status;
        if (data.documentos) updatePayload.documentos = data.documentos;
        if (data.observacoes !== undefined) updatePayload.observacoes = data.observacoes;
        if (data.motivo_rejeicao !== undefined) updatePayload.motivo_rejeicao = data.motivo_rejeicao;
        if (data.validado_por !== undefined) updatePayload.validado_por = data.validado_por;
        if (data.validado_em !== undefined) updatePayload.validado_em = data.validado_em;

        const { data: updatedRows, error: updateErr } = await supabase
          .from("projetistas")
          .update(updatePayload)
          .eq("id", id)
          .select();

        // Se o registro não existia com esse id no banco, tenta localizar por nome ou faz upsert
        if (!updateErr && (!updatedRows || updatedRows.length === 0)) {
          if (oldName) {
            const { data: byNameRows } = await supabase
              .from("projetistas")
              .update(updatePayload)
              .ilike("name", oldName)
              .select();

            if (!byNameRows || byNameRows.length === 0) {
              await supabase.from("projetistas").upsert({
                id: id,
                name: newName,
                cpf: data.cpf?.trim() || "",
                crea_cfta: data.crea_cfta?.trim().toUpperCase() || "",
                phone: data.phone?.trim() || "",
                email: data.email?.trim() || "",
                status: data.status || "ativo",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          }
        }

        // Se houve alteração de nome, propaga explicitamente para todas as tabelas de propostas
        if (oldName && newName && oldName !== newName) {
          await Promise.allSettled([
            supabase
              .from("stock_proposals")
              .update({ projetista: newName })
              .ilike("projetista", oldName),
            supabase
              .from("proposals")
              .update({ project_designer: newName })
              .ilike("project_designer", oldName),
            supabase
              .from("team_members")
              .update({ name: newName })
              .ilike("name", oldName),
          ]);
        }
      } catch (err) {
        console.warn("Atualização no Supabase falhou:", err);
      }

      // Disparar evento global para atualização imediata dos componentes e hooks
      window.dispatchEvent(
        new CustomEvent("projetista-updated", {
          detail: {
            id,
            oldName,
            newName,
            cpf: data.cpf,
            crea_cfta: data.crea_cfta,
            phone: data.phone,
            email: data.email,
            status: data.status,
          },
        })
      );

      toast({
        title: "Projetista atualizado! ✏️",
        description:
          oldName && newName && oldName !== newName
            ? `Informações alteradas e propostas de "${oldName}" atualizadas para "${newName}".`
            : "Informações alteradas com sucesso e refletidas nas propostas associadas.",
      });
    },
    [toast]
  );

  // Deletar / Eliminar Projetista
  const deleteProjetista = useCallback(
    async (id: string) => {
      let deletedName = "";
      setProjetistas((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) deletedName = target.name.trim().toUpperCase();
        const updated = prev.filter(
          (p) => p.id !== id && (deletedName ? p.name.trim().toUpperCase() !== deletedName : true)
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error("Erro ao salvar no localStorage", e);
        }
        return updated;
      });

      try {
        await supabase.from("projetistas").delete().eq("id", id);
        if (deletedName) {
          await supabase.from("projetistas").delete().ilike("name", deletedName);

          // Desvincular propostas associadas para que não fiquem presas a um projetista excluído
          await Promise.allSettled([
            supabase
              .from("stock_proposals")
              .update({ projetista: null })
              .ilike("projetista", deletedName),
            supabase
              .from("proposals")
              .update({ project_designer: null })
              .ilike("project_designer", deletedName),
            supabase
              .from("team_members")
              .delete()
              .ilike("name", deletedName),
          ]);
        }
      } catch (err) {
        console.warn("Exclusão no Supabase falhou:", err);
      }

      window.dispatchEvent(
        new CustomEvent("projetista-deleted", {
          detail: { id, deletedName },
        })
      );

      toast({
        title: "Projetista removido 🗑️",
        description: `${deletedName || "O projetista"} foi excluído com sucesso do sistema.`,
      });
    },
    [toast]
  );

  // Aprovar e Ativar Projetista
  const approveProjetista = useCallback(
    async (id: string, validatorName?: string) => {
      const now = new Date().toISOString();
      await updateProjetista(id, {
        status: "ativo",
        validado_por: validatorName || "Administrador",
        validado_em: now,
        motivo_rejeicao: "",
      });

      toast({
        title: "Projetista Aprovado e Ativado! ✅",
        description: "O profissional agora está ativo e disponível para vinculação a projetos.",
      });
    },
    [updateProjetista, toast]
  );

  // Recusar / Rejeitar Cadastro de Projetista
  const rejectProjetista = useCallback(
    async (id: string, reason: string, validatorName?: string) => {
      const now = new Date().toISOString();
      await updateProjetista(id, {
        status: "inativo",
        motivo_rejeicao: reason || "Documentação pendente ou dados inconclusivos",
        validado_por: validatorName || "Administrador",
        validado_em: now,
      });

      toast({
        title: "Cadastro Recusado ❌",
        description: "O status do projetista foi definido como inativo com o motivo informado.",
        variant: "destructive",
      });
    },
    [updateProjetista, toast]
  );

  // Restaurar padrão
  const resetToDefault = useCallback(async () => {
    setProjetistas(DEFAULT_PROJETISTAS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJETISTAS));
      await supabase.from("projetistas").upsert(
        DEFAULT_PROJETISTAS.map((p) => ({
          id: p.id,
          name: p.name,
          cpf: p.cpf,
          crea_cfta: p.crea_cfta,
          phone: p.phone || "",
          email: p.email || "",
          status: p.status,
          created_at: p.created_at,
          updated_at: new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.warn("Erro ao restaurar no Supabase:", err);
    }
    toast({
      title: "Lista restaurada 🔄",
      description: "Lista de projetistas restaurada para o padrão completo com todos os projetistas.",
    });
  }, [toast]);

  const pendingProjetistas = projetistas.filter((p) => p.status === "pendente");
  const activeProjetistas = projetistas.filter((p) => p.status === "ativo");
  const inactiveProjetistas = projetistas.filter((p) => p.status === "inativo");

  return {
    projetistas,
    pendingProjetistas,
    activeProjetistas,
    inactiveProjetistas,
    loading,
    addProjetista,
    updateProjetista,
    approveProjetista,
    rejectProjetista,
    deleteProjetista,
    resetToDefault,
  };
}
