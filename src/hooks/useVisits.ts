import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface DbVisit {
  id: string;
  user_id: string;
  producer_name: string;
  date: string;
  time: string;
  objective: string;
  status: string;
  proposal_id: string | null;
  created_at: string;
}

export function useVisits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visits, setVisits] = useState<DbVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar visitas", description: error.message, variant: "destructive" });
    } else {
      setVisits(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const createVisit = async (data: Omit<DbVisit, "id" | "user_id" | "created_at">) => {
    if (!user) return;
    const { error } = await supabase.from("visits").insert({ ...data, user_id: user.id });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita agendada!" });
      await fetchVisits();
    }
  };

  const updateVisit = async (id: string, data: Partial<DbVisit>) => {
    const { error } = await supabase.from("visits").update(data).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita atualizada!" });
      await fetchVisits();
    }
  };

  const deleteVisit = async (id: string) => {
    const { error } = await supabase.from("visits").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Visita removida." });
      await fetchVisits();
    }
  };

  return { visits, loading, createVisit, updateVisit, deleteVisit, refetch: fetchVisits };
}
