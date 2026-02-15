import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface DbTeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  color: string;
}

export interface DbDocumentTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  proposal_id: string | null;
  document_name: string;
  created_at: string;
}

export function useTeam() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<DbTeamMember[]>([]);
  const [tasks, setTasks] = useState<DbDocumentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    const [membersRes, tasksRes] = await Promise.all([
      supabase.from("team_members").select("*").order("created_at"),
      supabase.from("document_tasks").select("*").order("created_at", { ascending: false }),
    ]);
    setMembers(membersRes.data || []);
    setTasks(tasksRes.data || []);
    if (!silent) setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();

    const membersChannel = supabase
      .channel('team-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => fetchAll(true))
      .subscribe();

    const tasksChannel = supabase
      .channel('task-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_tasks' }, () => fetchAll(true))
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchAll]);

  const addMember = async (data: { name: string; role: string; color: string }) => {
    if (!user) return;
    const { error } = await supabase.from("team_members").insert({ ...data, user_id: user.id });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Membro adicionado!" }); await fetchAll(true); }
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (!error) { toast({ title: "Membro removido." }); await fetchAll(true); }
  };

  const createTask = async (data: Omit<DbDocumentTask, "id" | "user_id" | "created_at">) => {
    if (!user) return;
    const { error } = await supabase.from("document_tasks").insert({ ...data, user_id: user.id });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Tarefa criada!" }); await fetchAll(true); }
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("document_tasks").update({ status }).eq("id", id);
    if (!error) await fetchAll(true);
  };

  return { members, tasks, loading, addMember, removeMember, createTask, updateTaskStatus, refetch: fetchAll };
}
