import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProjetistasControl } from "@/hooks/useProjetistasControl";

// Projetistas originais (sempre mantidos como fallback)
const PROJETISTAS_FIXOS = ["NEY MEDEIROS", "JAIRO SANTANA", "CLEDSON CLOVIS", "JAILSON", "OLIVEIRA"];

/**
 * Hook que retorna a lista de projetistas ativos:
 *  - Inclui projetistas cadastrados no Controle de Projetistas
 *  - Busca dinamicamente usuários com role "projetista" da mesma agência
 *  - Mescla ambos sem duplicatas
 */
export function useProjetistas() {
  const { agencyId, isDeveloper } = useAuth();
  const { projetistas: managedProjetistas } = useProjetistasControl();
  const [dynamicProjetistas, setDynamicProjetistas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Erro ao buscar projetistas:", err);
        setDynamicProjetistas([]);
      } finally {
        setLoading(false);
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

  const projetistas = useMemo(() => {
    const activeManagedNames = managedProjetistas
      .filter((p) => p.status === "ativo")
      .map((p) => p.name);

    const allNames = [...PROJETISTAS_FIXOS, ...activeManagedNames, ...dynamicProjetistas];
    const uniqueSet = new Map<string, string>();
    allNames.forEach(name => {
      const key = name.toUpperCase().trim();
      if (!uniqueSet.has(key)) {
        uniqueSet.set(key, name);
      }
    });
    return Array.from(uniqueSet.values()).sort((a, b) => a.localeCompare(b));
  }, [managedProjetistas, dynamicProjetistas]);

  return { projetistas, loading, PROJETISTAS_FIXOS };
}
