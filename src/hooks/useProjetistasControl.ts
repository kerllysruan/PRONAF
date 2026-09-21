import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Projetista {
  id: string;
  name: string;
  cpf: string;
  crea_cfta: string;
  phone?: string;
  email?: string;
  status: "ativo" | "inativo";
  created_at: string;
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
  return list.filter(
    (p) => {
      const upper = p.name.toUpperCase().trim();
      return upper !== "NEY MEDEIROS" && upper !== "NEY MEDEIRO";
    }
  );
}

function loadInitialProjetistas(): Projetista[] {
  try {
    const savedV3 = localStorage.getItem(STORAGE_KEY);
    if (savedV3) {
      const parsed = JSON.parse(savedV3);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = cleanProjetistasList(parsed);
        const existingNames = new Set(cleaned.map((p: Projetista) => p.name.toUpperCase().trim()));
        const missingDefaults = DEFAULT_PROJETISTAS.filter(
          (d) => !existingNames.has(d.name.toUpperCase().trim())
        );
        return [...cleaned, ...missingDefaults];
      }
    }

    // Check legacy versions
    for (const key of LEGACY_STORAGE_KEYS) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = cleanProjetistasList(parsed);
          const existingNames = new Set(cleaned.map((p: Projetista) => p.name.toUpperCase().trim()));
          DEFAULT_PROJETISTAS.forEach((def) => {
            if (!existingNames.has(def.name.toUpperCase().trim())) {
              cleaned.push(def);
              existingNames.add(def.name.toUpperCase().trim());
            }
          });
          return cleaned;
        }
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

  // Carregar do Supabase (tabela projetistas) e sincronizar
  useEffect(() => {
    let isMounted = true;

    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("projetistas")
          .select("*")
          .order("name", { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
          setProjetistas((prev) => {
            const map = new Map<string, Projetista>();
            // Add defaults first
            DEFAULT_PROJETISTAS.forEach((p) => map.set(p.name.toUpperCase().trim(), p));
            // Add current state
            prev.forEach((p) => map.set(p.name.toUpperCase().trim(), p));
            // Overwrite/add with Supabase data
            data.forEach((row: any) => {
              const key = (row.name || "").toUpperCase().trim();
              if (key && key !== "NEY MEDEIROS" && key !== "NEY MEDEIRO") {
                map.set(key, {
                  id: row.id || `proj-${Date.now()}`,
                  name: row.name.toUpperCase().trim(),
                  cpf: row.cpf || "",
                  crea_cfta: row.crea_cfta || "",
                  phone: row.phone || "",
                  email: row.email || "",
                  status: (row.status as "ativo" | "inativo") || "ativo",
                  created_at: row.created_at || new Date().toISOString(),
                });
              }
            });
            map.delete("NEY MEDEIROS");
            map.delete("NEY MEDEIRO");
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("Tabela projetistas ainda não acessível via API direta:", err);
      }
    };

    // Sincronizar também com projetistas distintos de stock_proposals
    const syncFromStockProposals = async () => {
      try {
        const { data, error } = await supabase
          .from("stock_proposals")
          .select("projetista")
          .not("projetista", "is", null)
          .not("projetista", "eq", "");

        if (error || !data || !isMounted) return;

        const dbNames = [
          ...new Set(
            data
              .map((row) => (row.projetista || "").trim().toUpperCase())
              .filter((name) => Boolean(name) && name !== "NEY MEDEIROS" && name !== "NEY MEDEIRO")
          ),
        ];

        setProjetistas((prev) => {
          const existingKeys = new Set(prev.map((p) => p.name.toUpperCase().trim()));
          const newEntries: Projetista[] = [];

          dbNames.forEach((name) => {
            if (!existingKeys.has(name)) {
              newEntries.push({
                id: `proj-db-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: name,
                cpf: "",
                crea_cfta: "",
                phone: "",
                email: "",
                status: "ativo",
                created_at: new Date().toISOString(),
              });
              existingKeys.add(name);
            }
          });

          if (newEntries.length > 0) {
            return [...prev, ...newEntries];
          }
          return prev;
        });
      } catch (err) {
        console.error("Erro ao sincronizar projetistas de stock_proposals:", err);
      }
    };

    fetchFromSupabase().then(() => {
      if (isMounted) syncFromStockProposals();
    });

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
        status: data.status || "ativo",
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
          status: newProjetista.status,
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
              ...(data.status && { status: data.status }),
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
        if (data.status) updatePayload.status = data.status;

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
        if (target) deletedName = target.name;
        return prev.filter((p) => p.id !== id);
      });

      try {
        await supabase.from("projetistas").delete().eq("id", id);
        if (deletedName) {
          await supabase.from("projetistas").delete().ilike("name", deletedName);
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
        description: `${deletedName || "O projetista"} foi excluído do sistema.`,
      });
    },
    [toast]
  );

  // Restaurar padrão
  const resetToDefault = useCallback(() => {
    setProjetistas(DEFAULT_PROJETISTAS);
    toast({
      title: "Lista restaurada 🔄",
      description: "Lista de projetistas restaurada para o padrão completo com todos os projetistas.",
    });
  }, [toast]);

  return {
    projetistas,
    loading,
    addProjetista,
    updateProjetista,
    deleteProjetista,
    resetToDefault,
  };
}
