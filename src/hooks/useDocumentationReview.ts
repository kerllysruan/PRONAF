import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "@/hooks/use-toast";
import {
  DocumentationToken,
  DocumentationFile,
  DocumentationTokenWithProposal,
} from "@/types/documentation";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface SubmittedProposal {
  token: DocumentationToken;
  proposal: {
    id: string;
    producer_name: string;
    producer_cpf: string | null;
    credit_program: string | null;
    municipio: string | null;
    estimated_value: number | null;
    projetista: string | null;
    linha_credito: string | null;
    status: string;
  };
  files: DocumentationFile[];
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalFiles: number;
}

/**
 * Hook for the /documentacao management page (authenticated).
 * Handles fetching submitted proposals, reviewing files, and downloading.
 */
export function useDocumentationReview() {
  const { user } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmittedProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);

    try {
      // Fetch tokens with submitted docs
      let query = supabase
        .from("documentation_tokens")
        .select(`
          *,
          stock_proposals (
            id,
            producer_name,
            producer_cpf,
            credit_program,
            municipio,
            estimated_value,
            projetista,
            linha_credito,
            status,
            agency_id
          )
        `)
        .eq("documents_submitted", true)
        .order("submitted_at", { ascending: false });

      const { data: tokens, error: tokensError } = await query;
      if (tokensError) throw tokensError;

      if (!tokens || tokens.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Filter by agency if needed
      const filteredTokens = tokens.filter((t: any) => {
        if (effectiveAgencyId === "all") return true;
        return t.stock_proposals?.agency_id === effectiveAgencyId;
      });

      // Fetch all files for these tokens
      const tokenIds = filteredTokens.map((t: any) => t.id);
      const { data: allFiles, error: filesError } = await supabase
        .from("documentation_files")
        .select("*")
        .in("token_id", tokenIds)
        .order("document_type", { ascending: true });

      if (filesError) throw filesError;

      const filesByToken = new Map<string, DocumentationFile[]>();
      (allFiles || []).forEach((f: any) => {
        const list = filesByToken.get(f.token_id) || [];
        list.push(f as DocumentationFile);
        filesByToken.set(f.token_id, list);
      });

      const result: SubmittedProposal[] = filteredTokens.map((t: any) => {
        const files = filesByToken.get(t.id) || [];
        const approved = files.filter((f) => f.status === "aprovado").length;
        const rejected = files.filter((f) => f.status === "reprovado").length;
        const pending = files.filter((f) => f.status === "pendente").length;

        return {
          token: {
            id: t.id,
            token: t.token,
            stock_proposal_id: t.stock_proposal_id,
            created_at: t.created_at,
            documents_submitted: t.documents_submitted,
            submitted_at: t.submitted_at,
            has_rejections: t.has_rejections,
          },
          proposal: t.stock_proposals,
          files,
          approvedCount: approved,
          rejectedCount: rejected,
          pendingCount: pending,
          totalFiles: files.length,
        };
      });

      setSubmissions(result);
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
      toast({
        title: "Erro ao carregar documentações",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, effectiveAgencyId, toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  /**
   * Approve a single document file.
   */
  const approveDocument = useCallback(async (fileId: string) => {
    try {
      const { error } = await supabase
        .from("documentation_files")
        .update({
          status: "aprovado",
          rejection_reason: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", fileId);

      if (error) throw error;

      toast({ title: "Documento aprovado ✅" });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error approving document:", err);
      toast({
        title: "Erro ao aprovar",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions]);

  /**
   * Reject a document file with a reason.
   * Also sets has_rejections on the token so the link reopens.
   */
  const rejectDocument = useCallback(async (fileId: string, reason: string, tokenId: string) => {
    try {
      // Update file status
      const { error: fileError } = await supabase
        .from("documentation_files")
        .update({
          status: "reprovado",
          rejection_reason: reason || "Documento reprovado",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", fileId);

      if (fileError) throw fileError;

      // Mark token as having rejections (reopens link)
      const { error: tokenError } = await supabase
        .from("documentation_tokens")
        .update({ has_rejections: true })
        .eq("id", tokenId);

      if (tokenError) throw tokenError;

      toast({ title: "Documento reprovado ❌", description: "O link foi reaberto para reenvio." });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error rejecting document:", err);
      toast({
        title: "Erro ao reprovar",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions]);

  /**
   * Approve the entire proposal (all docs must be approved first).
   */
  const approveProposal = useCallback(async (tokenId: string, stockProposalId: string) => {
    try {
      // Verify all docs are approved
      const { data: files, error: filesError } = await supabase
        .from("documentation_files")
        .select("status")
        .eq("token_id", tokenId);

      if (filesError) throw filesError;

      const allApproved = files && files.length > 0 && files.every((f: any) => f.status === "aprovado");
      if (!allApproved) {
        toast({
          title: "Não é possível aprovar",
          description: "Todos os documentos precisam estar aprovados.",
          variant: "destructive",
        });
        return;
      }

      // Update token
      const { error: tokenError } = await supabase
        .from("documentation_tokens")
        .update({ has_rejections: false })
        .eq("id", tokenId);

      if (tokenError) throw tokenError;

      // Update stock proposal status
      const { error: proposalError } = await supabase
        .from("stock_proposals")
        .update({ status: "DOCUMENTAÇÃO APROVADA" })
        .eq("id", stockProposalId);

      if (proposalError) throw proposalError;

      toast({ title: "Proposta aprovada! ✅", description: "Todos os documentos foram validados." });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error approving proposal:", err);
      toast({
        title: "Erro ao aprovar proposta",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions]);

  /**
   * Download a single file from storage.
   */
  const downloadFile = useCallback(async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("proposals_documents")
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      toast({
        title: "Erro ao baixar arquivo",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Get a temporary signed URL for viewing a PDF inline.
   */
  const getFileUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("proposals_documents")
        .createSignedUrl(filePath, 3600); // 1 hour

      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err: any) {
      console.error("Error getting file URL:", err);
      return null;
    }
  }, []);

  /**
   * Download all files for a submission as a ZIP.
   */
  const downloadAllAsZip = useCallback(async (submission: SubmittedProposal) => {
    try {
      toast({ title: "Gerando ZIP...", description: "Aguarde enquanto os arquivos são compilados." });

      const zip = new JSZip();
      const producerName = submission.proposal.producer_name.replace(/[^a-zA-Z0-9\s]/g, "").trim();

      for (const file of submission.files) {
        const { data, error } = await supabase.storage
          .from("proposals_documents")
          .download(file.file_path);

        if (error) {
          console.error(`Error downloading ${file.file_name}:`, error);
          continue;
        }

        zip.file(file.file_name, data);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `Documentacao_${producerName}.zip`);

      toast({ title: "Download concluído! 📥" });
    } catch (err: any) {
      console.error("Error generating ZIP:", err);
      toast({
        title: "Erro ao gerar ZIP",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    submissions,
    loading,
    approveDocument,
    rejectDocument,
    approveProposal,
    downloadFile,
    getFileUrl,
    downloadAllAsZip,
    refetch: fetchSubmissions,
  };
}
