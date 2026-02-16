import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "./use-toast";

export interface DbVisit {
  id: string;
  user_id: string;
  agency_id: string;
  producer_name: string;
  date: string;
  time: string;
  objective: string;
  status: string;
  proposal_id: string | null;
  created_at: string;
}

export function useVisits() {
  const { user, agencyId } = useAuth();
  const { selectedAgencyId } = useAgency();
  const { toast } = useToast();
  const [visits, setVisits] = useState<DbVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);

    let query = supabase
      .from("visits")
      .select("*")
      .order("date", { ascending: true });

    if (selectedAgencyId && selectedAgencyId !== "all") {
      query = query.eq("agency_id", selectedAgencyId);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Erro ao carregar visitas", description: error.message, variant: "destructive" });
    } else {
      setVisits(data || []);
    }
    if (!silent) setLoading(false);
  }, [user, toast, selectedAgencyId]);

  useEffect(() => {
    fetchVisits();

    const channel = supabase
      .channel('visits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits'
        },
        () => {
          fetchVisits(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisits]);

  const createVisit = async (data: Omit<DbVisit, "id" | "user_id" | "created_at" | "agency_id">) => {
    if (!user) return;
    const { error } = await supabase.from("visits").insert({ ...data, user_id: user.id, agency_id: agencyId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita agendada!" });
      await fetchVisits(true);
    }
  };

  const updateVisit = async (id: string, data: Partial<DbVisit>) => {
    const { error } = await supabase.from("visits").update(data).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita atualizada!" });
      await fetchVisits(true);
    }
  };

  const deleteVisit = async (id: string) => {
    const { error } = await supabase.from("visits").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita removida." });
      await fetchVisits(true);
    }
  };

  return { visits, loading, createVisit, updateVisit, deleteVisit, refetch: fetchVisits };
}
