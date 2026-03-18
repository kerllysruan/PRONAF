import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ExchangeFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  uploaded_by: string;
  agency_id: string;
  created_at: string;
  expires_at: string | null;
}

export function useFileExchange() {
  const [files, setFiles] = useState<ExchangeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Get user's agency first
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.agency_id) {
        setFiles([]);
        return;
      }

      const { data, error } = await supabase
        .from("file_exchange")
        .select("*")
        .eq("agency_id", profile.agency_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error("Error fetching exchange files:", error);
      toast({
        title: "Erro ao carregar arquivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      // Get user's agency
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();

      if (!profile?.agency_id) throw new Error("Agência não encontrada para o usuário");

      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.agency_id}/${crypto.randomUUID()}.${fileExt}`;

      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("proposals_documents") // Using existing bucket or will try to create if needed. 
                                     // Actually, user context usually has one. 
                                     // User mentioned "minimum space", so we'll use storage but delete immediately.
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Insert metadata
      const { error: dbError } = await supabase
        .from("file_exchange")
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          content_type: file.type,
          agency_id: profile.agency_id,
          uploaded_by: user.id
        });

      if (dbError) {
        // Cleanup storage on DB error
        await supabase.storage.from("proposals_documents").remove([filePath]);
        throw dbError;
      }

      toast({
        title: "Sucesso",
        description: "Arquivo enviado para troca",
      });
      
      await fetchFiles();
      return true;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const downloadAndDestroy = async (exchangeFile: ExchangeFile) => {
    try {
      // 1. Get the file
      const { data, error: downloadError } = await supabase.storage
        .from("proposals_documents")
        .download(exchangeFile.file_path);

      if (downloadError) throw downloadError;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exchangeFile.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // 2. Destroy immediately
      // Delete from storage
      await supabase.storage.from("proposals_documents").remove([exchangeFile.file_path]);
      
      // Delete from database
      await supabase.from("file_exchange").delete().eq("id", exchangeFile.id);

      toast({
        title: "Arquivo baixado",
        description: "O arquivo e seus registros foram destruídos conforme solicitado.",
      });

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== exchangeFile.id));
    } catch (error: any) {
      console.error("Error in download and destroy:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  return { files, loading, uploadFile, downloadAndDestroy, refetch: fetchFiles };
}
