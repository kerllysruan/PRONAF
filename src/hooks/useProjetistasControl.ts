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

const DEFAULT_PROJETISTAS: Projetista[] = [
  {
    id: "proj-1",
    name: "NEY MEDEIROS",
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
];

const STORAGE_KEY = "pronaf_projetistas_list_v1";

export function useProjetistasControl() {
  const [projetistas, setProjetistas] = useState<Projetista[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Erro ao carregar projetistas do localStorage", e);
    }
    return DEFAULT_PROJETISTAS;
  });

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

  // Adicionar Projetista
  const addProjetista = useCallback(
    (data: Omit<Projetista, "id" | "created_at">) => {
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
    (id: string, data: Partial<Omit<Projetista, "id" | "created_at">>) => {
      setProjetistas((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              ...(data.name && { name: data.name.trim().toUpperCase() }),
              ...(data.cpf !== undefined && { cpf: data.cpf.trim() }),
              ...(data.crea_cfta !== undefined && { crea_cfta: data.crea_cfta.trim().toUpperCase() }),
              ...(data.phone !== undefined && { phone: data.phone.trim() }),
              ...(data.email !== undefined && { email: data.email.trim() }),
              ...(data.status && { status: data.status }),
            };
          }
          return item;
        })
      );
      toast({
        title: "Projetista atualizado! ✏️",
        description: "Informações alteradas com sucesso.",
      });
    },
    [toast]
  );

  // Deletar / Eliminar Projetista
  const deleteProjetista = useCallback(
    (id: string) => {
      let deletedName = "";
      setProjetistas((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) deletedName = target.name;
        return prev.filter((p) => p.id !== id);
      });
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
      description: "Lista de projetistas restaurada para o padrão inicial.",
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
