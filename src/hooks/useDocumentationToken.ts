import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DocumentationToken,
  DocumentationFile,
  DocumentationTokenWithProposal,
  DOCUMENTATION_REQUIRED,
} from "@/types/documentation";

/**
 * Hook for managing documentation tokens.
 * Used by StockProposals (generate link) and DocumentationSubmit (public page).
 */
export function useDocumentationToken() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Generate a new token for a stock proposal, or return existing one.
   */
  const generateToken = useCallback(async (stockProposalId: string, proposalStatus?: string): Promise<string | null> => {
    try {
      setLoading(true);

      // Check if token already exists
      const { data: existing, error: fetchError } = await supabase
        .from("documentation_tokens")
        .select("token")
        .eq("stock_proposal_id", stockProposalId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing?.token) {
        return existing.token;
      }

      // Create new token
      const newToken = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("documentation_tokens")
        .insert({
          token: newToken,
          stock_proposal_id: stockProposalId,
          previous_status: proposalStatus || null,
        });

      if (insertError) throw insertError;

      return newToken;
    } catch (err: any) {
      console.error("Error generating token:", err);
      toast({
        title: "Erro ao gerar link",
        description: err.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get token data + proposal info (used by public page, no auth required).
   * Uses a raw supabase client without auth session.
   */
  const getTokenData = useCallback(async (token: string): Promise<DocumentationTokenWithProposal | null> => {
    try {
      setLoading(true);

      const { data, error } = await supabase
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
            status
          )
        `)
        .eq("token", token)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return data as unknown as DocumentationTokenWithProposal;
    } catch (err: any) {
      console.error("Error fetching token data:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get files associated with a token (used by public page).
   */
  const getFilesForToken = useCallback(async (tokenId: string): Promise<DocumentationFile[]> => {
    try {
      const { data, error } = await supabase
        .from("documentation_files")
        .select("*")
        .eq("token_id", tokenId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as DocumentationFile[];
    } catch (err: any) {
      console.error("Error fetching files for token:", err);
      return [];
    }
  }, []);

  /**
   * Submit documents (upload PDFs to storage + insert file records).
   * Called from public page (no auth).
   */
  const submitDocuments = useCallback(async (
    tokenId: string,
    stockProposalId: string,
    tokenStr: string,
    files: Record<string, File>
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const fileEntries = Object.entries(files);
      if (fileEntries.length === 0) return false;

      for (const [docType, file] of fileEntries) {
        const fileExt = file.name.split(".").pop() || "pdf";
        const filePath = `documentation/${tokenStr}/${docType}.${fileExt}`;

        // Check if file record already exists for this token and document type
        const { data: existing } = await supabase
          .from("documentation_files")
          .select("id, file_path")
          .eq("token_id", tokenId)
          .eq("document_type", docType)
          .maybeSingle();

        if (existing) {
          // If the path is different, delete the old file to save space
          if (existing.file_path !== filePath) {
            await supabase.storage
              .from("proposals_documents")
              .remove([existing.file_path]);
          }
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("proposals_documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        if (existing) {
          // Update file record
          const { error: dbError } = await supabase
            .from("documentation_files")
            .update({
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              status: "pendente",
              rejection_reason: null,
              reviewed_at: null,
              reviewed_by: null,
            })
            .eq("id", existing.id);

          if (dbError) throw dbError;
        } else {
          // Insert file record
          const { error: dbError } = await supabase
            .from("documentation_files")
            .insert({
              token_id: tokenId,
              stock_proposal_id: stockProposalId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              document_type: docType,
              status: "pendente",
            });

          if (dbError) throw dbError;
        }
      }

      // Mark token as submitted
      const { error: updateError } = await supabase
        .from("documentation_tokens")
        .update({
          documents_submitted: true,
          submitted_at: new Date().toISOString(),
          has_rejections: false,
        })
        .eq("id", tokenId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error("Error submitting documents:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Resubmit rejected documents only.
   */
  const resubmitDocuments = useCallback(async (
    tokenId: string,
    stockProposalId: string,
    tokenStr: string,
    files: Record<string, File>,
    existingFileIds: Record<string, string>
  ): Promise<boolean> => {
    try {
      setLoading(true);

      for (const [docType, file] of Object.entries(files)) {
        const fileExt = file.name.split(".").pop() || "pdf";
        const filePath = `documentation/${tokenStr}/${docType}.${fileExt}`;

        // Check if file record already exists for this token and document type
        const { data: existing } = await supabase
          .from("documentation_files")
          .select("id, file_path")
          .eq("token_id", tokenId)
          .eq("document_type", docType)
          .maybeSingle();

        if (existing) {
          // If the path is different, delete the old file to save space
          if (existing.file_path !== filePath) {
            await supabase.storage
              .from("proposals_documents")
              .remove([existing.file_path]);
          }
        }

        // Upload new file (overwrite)
        const { error: uploadError } = await supabase.storage
          .from("proposals_documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        if (existing) {
          // Update file record
          const { error: dbError } = await supabase
            .from("documentation_files")
            .update({
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              status: "pendente",
              rejection_reason: null,
              reviewed_at: null,
              reviewed_by: null,
            })
            .eq("id", existing.id);

          if (dbError) throw dbError;
        } else {
          // Insert new record if no existing one
          const { error: dbError } = await supabase
            .from("documentation_files")
            .insert({
              token_id: tokenId,
              stock_proposal_id: stockProposalId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              document_type: docType,
              status: "pendente",
            });

          if (dbError) throw dbError;
        }
      }

      // Clear rejections flag
      const { error: updateError } = await supabase
        .from("documentation_tokens")
        .update({
          has_rejections: false,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", tokenId);

      if (updateError) throw updateError;

      return true;
    } catch (err: any) {
      console.error("Error resubmitting documents:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    generateToken,
    getTokenData,
    getFilesForToken,
    submitDocuments,
    resubmitDocuments,
  };
}
