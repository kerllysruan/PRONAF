import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjetistasControl } from "@/hooks/useProjetistasControl";

// Projetistas originais conhecidos (mantidos como fallback garantido)
const PROJETISTAS_FIXOS = [
  "NEY MEDEIROS",
  "JAIRO SANTANA",
  "CLEDSON CLOVIS",
  "JAILSON",
  "OLIVEIRA",
  "CLEDSON CLOVIS DA SILVA",
  "NEY MEDEIROS DE ARAÚJO",
  "FRANCISCO DAS CHAGAS SOUSA OLIVEIRA",
  "JOSE FRANCISCO LIMA SEIXAS",
  "TANCREDO ANTONIO DA SILVA OLIVEIRA",
];

/**
 * Hook que retorna a lista de projetistas ativos:
 *  - Inclui projetistas fixos (fallback)
 *  - Inclui projetistas cadastrados no Controle de Projetistas (localStorage)
 *  - Busca dinamicamente usuários com role "projetista" da mesma agência
 *  - Busca projetistas distintos que existem nas propostas (stock_proposals)
 *  - Mescla todos sem duplicatas
 */
export function useProjetistas() {
  const { agencyId, isDeveloper } = useAuth();
  const { projetistas: managedProjetistas } = useProjetistasControl();
  const [dynamicProjetistas, setDynamicProjetistas] = useState<string[]>([]);
  const [stockProjetistas, setStockProjetistas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar projetistas de user_roles + profiles
  useEffect(() => {
    const fetchProjetistas = async () => {
      try {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "projetista");

        if (!roles || roles.length === 0) {
          setDynamicProjetistas([]);
          return;
        }

        const userIds = roles.map(r => r.user_id);

        let query = supabase
          .from("profiles")
          .select("display_name, agency_id")
          .in("user_id", userIds);

        if (!isDeveloper && agencyId) {
          query = query.eq("agency_id", agencyId);
        }

        const { data: profiles } = await query;
        const names = (profiles || [])
          .map(p => p.display_name)
          .filter(Boolean) as string[];
        
        setDynamicProjetistas(names);
      } catch (err) {
        console.error("Erro ao buscar projetistas de profiles:", err);
        setDynamicProjetistas([]);
      }
    };

    fetchProjetistas();

    const ch1 = supabase.channel('projetistas-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProjetistas)
      .subscribe();
    const ch2 = supabase.channel('projetistas-roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchProjetistas)
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [agencyId, isDeveloper]);

  // Buscar projetistas distintos que existem em stock_proposals
  useEffect(() => {
    const fetchStockProjetistas = async () => {
      try {
        const { data, error } = await supabase
          .from("stock_proposals")
          .select("projetista")
          .not("projetista", "is", null)
          .not("projetista", "eq", "");

        if (error) {
          console.error("Erro ao buscar projetistas de stock_proposals:", error);
          setStockProjetistas([]);
          return;
        }

        const names = [...new Set(
          (data || [])
            .map(row => (row.projetista || "").trim())
            .filter(Boolean)
        )];
        
        setStockProjetistas(names);
      } catch (err) {
        console.error("Erro ao buscar projetistas de stock_proposals:", err);
        setStockProjetistas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStockProjetistas();

    const ch3 = supabase.channel('projetistas-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_proposals' }, fetchStockProjetistas)
      .subscribe();

    return () => {
      supabase.removeChannel(ch3);
    };
  }, []);

  const projetistas = useMemo(() => {
    const activeManagedNames = managedProjetistas
      .filter((p) => p.status === "ativo")
      .map((p) => p.name);

    const allNames = [
      ...PROJETISTAS_FIXOS,
      ...activeManagedNames,
      ...dynamicProjetistas,
      ...stockProjetistas,
    ];
    const uniqueSet = new Map<string, string>();
    allNames.forEach(name => {
      const key = name.toUpperCase().trim();
      if (!uniqueSet.has(key)) {
        uniqueSet.set(key, name.toUpperCase().trim());
      }
    });
    return Array.from(uniqueSet.values()).sort((a, b) => a.localeCompare(b));
  }, [managedProjetistas, dynamicProjetistas, stockProjetistas]);

  return { projetistas, loading, PROJETISTAS_FIXOS };
}
