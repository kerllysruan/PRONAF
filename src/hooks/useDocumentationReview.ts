import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/contexts/AgencyContext";
import { useToast } from "@/hooks/use-toast";
import {
  DocumentationToken,
  DocumentationFile,
  DocumentationTokenWithProposal,
  DOCUMENTATION_REQUIRED,
} from "@/types/documentation";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Resilient date parser that handles microsecond timestamp fractions from PostgreSQL correctly in all browsers.
 */
export function parseSafeDate(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  try {
    const dotIdx = dateStr.indexOf('.');
    if (dotIdx !== -1) {
      const plusOrMinusIdx = dateStr.indexOf('+', dotIdx) !== -1 
        ? dateStr.indexOf('+', dotIdx) 
        : dateStr.indexOf('-', dotIdx);
        
      if (plusOrMinusIdx !== -1) {
        const fraction = dateStr.substring(dotIdx + 1, plusOrMinusIdx);
        const truncatedFraction = fraction.substring(0, 3).padEnd(3, '0');
        const timezone = dateStr.substring(plusOrMinusIdx);
        dateStr = dateStr.substring(0, dotIdx + 1) + truncatedFraction + timezone;
      } else if (dateStr.endsWith('Z')) {
        const fraction = dateStr.substring(dotIdx + 1, dateStr.length - 1);
        const truncatedFraction = fraction.substring(0, 3).padEnd(3, '0');
        dateStr = dateStr.substring(0, dotIdx + 1) + truncatedFraction + 'Z';
      }
    }
    const parsed = new Date(dateStr).getTime();
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

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
    credit_purpose: string | null;
    status: string;
    localizacao?: string;
    inversoes?: any;
  };
  files: DocumentationFile[];
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalFiles: number;
}

/** Proposal with status AUTORIZADO that appears on the Documentação page awaiting docs. */
export interface AuthorizedProposal {
  id: string;
  producer_name: string;
  producer_cpf: string | null;
  credit_program: string | null;
  municipio: string | null;
  estimated_value: number | null;
  projetista: string | null;
  linha_credito: string | null;
  credit_purpose: string | null;
  status: string;
  token: string | null; // null = token being generated
}

// Statuses that trigger auto-appearance on the Documentação page
const AUTORIZADO_STATUSES = [
  "AUTORIZADO ENVIO PARA CENTRAL",
  "AUTORIZADO ENVIO CENTRAL",
];

/**
 * Hook for the /documentacao management page (authenticated).
 * Handles fetching submitted proposals, reviewing files, and downloading.
 * Also fetches proposals with AUTORIZADO ENVIO status and auto-generates tokens.
 */
export function useDocumentationReview() {
  const { user } = useAuth();
  const { effectiveAgencyId } = useAgency();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmittedProposal[]>([]);
  const [authorizedProposals, setAuthorizedProposals] = useState<AuthorizedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const autoGeneratingRef = useRef<Set<string>>(new Set());

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
            credit_purpose,
            status,
            agency_id,
            localizacao,
            inversoes
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
        .order("created_at", { ascending: false })
        .range(0, 4999);

      if (filesError) throw filesError;

      // Sort files manually to guarantee sorting consistency across environments
      const sortedFiles = [...(allFiles || [])].sort((a, b) => {
        if (a.document_type !== b.document_type) {
          return a.document_type.localeCompare(b.document_type);
        }
        return parseSafeDate(b.created_at) - parseSafeDate(a.created_at);
      });

      const filesByToken = new Map<string, DocumentationFile[]>();
      const rawFilesByToken = new Map<string, any[]>();
      sortedFiles.forEach((f: any) => {
        const list = rawFilesByToken.get(f.token_id) || [];
        list.push(f);
        rawFilesByToken.set(f.token_id, list);
      });

      rawFilesByToken.forEach((filesList, tokenId) => {
        const typeMap = new Map<string, DocumentationFile>();
        filesList.forEach((f) => {
          // Normalize: if file_path is "dispensado" or "preenchido", force status to "aprovado"
          const isDispPath = f.file_path === "dispensado" || f.file_path === "preenchido";
          const normalizedFile = isDispPath
            ? { ...f, status: "aprovado" }
            : f;

          const existing = typeMap.get(f.document_type);
          if (!existing || parseSafeDate(f.created_at) > parseSafeDate(existing.created_at)) {
            typeMap.set(f.document_type, normalizedFile as DocumentationFile);
          }
        });
        filesByToken.set(tokenId, Array.from(typeMap.values()));
      });

      const result: SubmittedProposal[] = filteredTokens.map((t: any) => {
        const files = filesByToken.get(t.id) || [];

        // Group files by document_type and pick the latest/most-favorable status per type
        // This prevents double-counting when multiple files exist for the same doc type
        const typeMap = new Map<string, { status: string; isDispensado: boolean; isHabilitado: boolean; created_at: string }>();
        const requiredKeys = DOCUMENTATION_REQUIRED.map(d => d.key);
        
        // Group files by type
        const grouped = new Map<string, typeof files>();
        files.forEach((f) => {
          if (!requiredKeys.includes(f.document_type)) return;
          const list = grouped.get(f.document_type) || [];
          list.push(f);
          grouped.set(f.document_type, list);
        });

        grouped.forEach((fileList, docType) => {
          const sorted = [...fileList].sort((a, b) => parseSafeDate(b.created_at) - parseSafeDate(a.created_at));
          const selectedFile = sorted[0];
          const isDispensado = selectedFile.file_path === "dispensado" || selectedFile.file_path === "preenchido";
          const isHabilitado = selectedFile.file_path === "habilitado";
          const currentStatus = isDispensado ? "aprovado" : selectedFile.status;
          typeMap.set(docType, { status: currentStatus, isDispensado, isHabilitado, created_at: selectedFile.created_at });
        });

        let approved = 0;
        let rejected = 0;
        let pending = 0;
        let dispensedCount = 0;

        const estimatedVal = Number(t.stock_proposals?.estimated_value) || 0;
        const invData = t.stock_proposals?.inversoes;
        if (invData) {
          let totalInv = 0;
          if (Array.isArray(invData)) {
            totalInv = invData.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0);
          } else if (typeof invData === "object") {
            const obj = invData as any;
            const items = Array.isArray(obj.items) ? obj.items : [];
            const custo = typeof obj.custoAssessoria === "number" ? obj.custoAssessoria : 0;
            totalInv = items.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0) + custo;
          }
          const isInvValida = (Math.abs(totalInv - estimatedVal) < 0.01) && (invData as any)?.status === "aprovado";
          if (isInvValida) {
            approved = 1;
          } else if ((invData as any)?.status === "reprovado") {
            rejected = 1;
          } else if ((invData as any)?.status === "pendente") {
            pending = 1;
          }
        }

        requiredKeys.forEach((key) => {
          const fileInfo = typeMap.get(key);
          if (!fileInfo) {
            // Not uploaded
          } else if (fileInfo.isDispensado) {
            dispensedCount++;
          } else if (fileInfo.status === "aprovado" && !fileInfo.isHabilitado) {
            approved++;
          } else if (fileInfo.status === "reprovado") {
            rejected++;
          } else if (fileInfo.status === "pendente" && !fileInfo.isHabilitado) {
            pending++;
          }
        });

        const totalFiles = requiredKeys.length + 1 - dispensedCount;

        return {
          token: {
            id: t.id,
            token: t.token,
            stock_proposal_id: t.stock_proposal_id,
            created_at: t.created_at,
            documents_submitted: t.documents_submitted,
            submitted_at: t.submitted_at,
            has_rejections: t.has_rejections,
            previous_status: t.previous_status,
          },
          proposal: t.stock_proposals,
          files,
          approvedCount: approved,
          rejectedCount: rejected,
          pendingCount: pending,
          totalFiles,
        };
      });

      // Automate status syncing retroactively and lazily
      for (const res of result) {
        if (!res.proposal) continue;
        const allOk = res.totalFiles > 0 && res.approvedCount === res.totalFiles;
        const currentStatus = res.proposal.status;

        if (allOk) {
          if (currentStatus !== "DOCUMENTAÇÃO APROVADA" && currentStatus !== "ENVIADO PARA CENTRAL" && currentStatus !== "CONCLUÍDO") {
            const today = new Date().toLocaleDateString('pt-BR');
            supabase
              .from("stock_proposals")
              .update({
                status: "DOCUMENTAÇÃO APROVADA",
                documentation_approved_date: today
              })
              .eq("id", res.proposal.id)
              .then(({ error }) => {
                if (error) console.error("Error updating status to approved:", error);
              });
            res.proposal.status = "DOCUMENTAÇÃO APROVADA";
          }
        } else {
          if (currentStatus === "DOCUMENTAÇÃO APROVADA" || currentStatus === "ENVIADO PARA CENTRAL") {
            supabase
              .from("stock_proposals")
              .update({ status: "documentacao_pendente" })
              .eq("id", res.proposal.id)
              .then(({ error }) => {
                if (error) console.error("Error reverting status to pending:", error);
              });
            res.proposal.status = "documentacao_pendente";
          }
        }
      }

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

  /**
   * Fetch stock_proposals with AUTORIZADO ENVIO status that don't have submitted docs yet.
   * Auto-generates tokens for proposals that don't have one.
   */
  const fetchAuthorizedProposals = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Fetch all stock_proposals with AUTORIZADO status
      let query = supabase
        .from("stock_proposals")
        .select("id, producer_name, producer_cpf, credit_program, municipio, estimated_value, projetista, linha_credito, credit_purpose, status, agency_id")
        .in("status", AUTORIZADO_STATUSES);

      if (effectiveAgencyId !== "all") {
        query = query.eq("agency_id", effectiveAgencyId);
      }

      const { data: proposals, error: propError } = await query;
      if (propError) throw propError;
      if (!proposals || proposals.length === 0) {
        setAuthorizedProposals([]);
        return;
      }

      // 2. Check which already have tokens
      const proposalIds = proposals.map((p: any) => p.id);
      const { data: existingTokens, error: tokenError } = await supabase
        .from("documentation_tokens")
        .select("stock_proposal_id, token, documents_submitted")
        .in("stock_proposal_id", proposalIds);

      if (tokenError) throw tokenError;

      const tokenMap = new Map<string, { token: string; submitted: boolean }>();
      (existingTokens || []).forEach((t: any) => {
        tokenMap.set(t.stock_proposal_id, {
          token: t.token,
          submitted: t.documents_submitted,
        });
      });

      // 3. Filter out proposals that already submitted docs (they show in "Propostas Recebidas")
      const pendingProposals = proposals.filter((p: any) => {
        const tok = tokenMap.get(p.id);
        return !tok?.submitted; // keep those without token or with token but no docs submitted
      });

      // 4. Build result with existing tokens
      const result: AuthorizedProposal[] = pendingProposals.map((p: any) => ({
        id: p.id,
        producer_name: p.producer_name,
        producer_cpf: p.producer_cpf,
        credit_program: p.credit_program,
        municipio: p.municipio,
        estimated_value: p.estimated_value,
        projetista: p.projetista,
        linha_credito: p.linha_credito,
        credit_purpose: p.credit_purpose,
        status: p.status,
        token: tokenMap.get(p.id)?.token || null,
      }));

      setAuthorizedProposals(result);

      // 5. Auto-generate tokens for proposals that don't have one (fire-and-forget)
      const needsToken = result.filter(
        (p) => !p.token && !autoGeneratingRef.current.has(p.id)
      );

      if (needsToken.length > 0) {
        // Mark as generating to avoid duplicates
        needsToken.forEach((p) => autoGeneratingRef.current.add(p.id));

        // Generate tokens sequentially to avoid race conditions
        for (const p of needsToken) {
          try {
            const newToken = crypto.randomUUID();
            const { error: insertError } = await supabase
              .from("documentation_tokens")
              .insert({
                token: newToken,
                stock_proposal_id: p.id,
                previous_status: p.status,
              });

            if (!insertError) {
              // Update the item in state with the new token
              setAuthorizedProposals((prev) =>
                prev.map((ap) =>
                  ap.id === p.id ? { ...ap, token: newToken } : ap
                )
              );
            }
          } catch (err) {
            console.error(`Error auto-generating token for ${p.id}:`, err);
          } finally {
            autoGeneratingRef.current.delete(p.id);
          }
        }
      }
    } catch (err: any) {
      console.error("Error fetching authorized proposals:", err);
    }
  }, [user, effectiveAgencyId]);

  useEffect(() => {
    fetchSubmissions();
    fetchAuthorizedProposals();
  }, [fetchSubmissions, fetchAuthorizedProposals]);

  /**
   * Approve a single document file.
   */
  const approveDocument = useCallback(async (fileId: string, tokenId?: string) => {
    try {
      let activeTokenId = "";
      if (fileId.startsWith("temp_")) {
        const documentType = fileId.substring(5);
        let submissionId: string | null = null;
        let proposalId: string | null = null;
        
        const targetSub = submissions.find(s => s.token.id === tokenId);
        if (targetSub) {
          submissionId = targetSub.token.id;
          proposalId = targetSub.proposal?.id || null;
        }

        if (!submissionId || !proposalId) {
          throw new Error("Não foi possível encontrar a proposta correspondente.");
        }
        activeTokenId = submissionId;

        const { error } = await supabase
          .from("documentation_files")
          .insert({
            token_id: submissionId,
            stock_proposal_id: proposalId,
            file_name: "Pendente de envio",
            file_path: "habilitado",
            file_size: 0,
            document_type: documentType,
            status: "aprovado",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
          });

        if (error) throw error;
      } else {
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

        // Fetch token_id
        const { data: fileData } = await supabase
          .from("documentation_files")
          .select("token_id")
          .eq("id", fileId)
          .single();
        activeTokenId = fileData?.token_id || "";
      }

      // Check if all files for this token are now approved
      if (activeTokenId) {
        const { data: files } = await supabase
          .from("documentation_files")
          .select("status, document_type")
          .eq("token_id", activeTokenId);

        // Ensure we check against all required files
        const requiredKeys = DOCUMENTATION_REQUIRED.map(d => d.key);
        const fileStatusMap = new Map<string, string>();
        (files || []).forEach(f => fileStatusMap.set(f.document_type, f.status));

        const allApproved = requiredKeys.every(key => fileStatusMap.get(key) === "aprovado");
        if (allApproved) {
          const { data: tokenData } = await supabase
            .from("documentation_tokens")
            .select("stock_proposal_id")
            .eq("id", activeTokenId)
            .maybeSingle();

          if (tokenData?.stock_proposal_id) {
            const today = new Date().toLocaleDateString('pt-BR');
            await supabase
              .from("stock_proposals")
              .update({
                status: "DOCUMENTAÇÃO APROVADA",
                documentation_approved_date: today
              })
              .eq("id", tokenData.stock_proposal_id);
          }
        }
      }

      toast({ title: "Documento aprovado ✅" });
      await new Promise(resolve => setTimeout(resolve, 250));
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error approving document:", err);
      toast({
        title: "Erro ao aprovar",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions, submissions]);

  /**
   * Reject a document file with a reason.
   * Also sets has_rejections on the token so the link reopens.
   */
  const rejectDocument = useCallback(async (fileId: string, reason: string, tokenId: string) => {
    try {
      let activeFileId = fileId;
      if (fileId.startsWith("temp_")) {
        const documentType = fileId.substring(5);
        let submissionId: string | null = null;
        let proposalId: string | null = null;
        
        const targetSub = submissions.find(s => s.token.id === tokenId);
        if (targetSub) {
          submissionId = targetSub.token.id;
          proposalId = targetSub.proposal?.id || null;
        }

        if (!submissionId || !proposalId) {
          throw new Error("Não foi possível encontrar a proposta correspondente.");
        }

        const { data: newFile, error } = await supabase
          .from("documentation_files")
          .insert({
            token_id: submissionId,
            stock_proposal_id: proposalId,
            file_name: "Pendente de envio",
            file_path: "habilitado",
            file_size: 0,
            document_type: documentType,
            status: "reprovado",
            rejection_reason: reason || "Documento reprovado",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        activeFileId = newFile.id;
      } else {
        const { data: currentFile } = await supabase
          .from("documentation_files")
          .select("file_path")
          .eq("id", fileId)
          .maybeSingle();

        const isDisp = currentFile?.file_path === "dispensado";

        const { error: fileError } = await supabase
          .from("documentation_files")
          .update({
            status: "reprovado",
            rejection_reason: reason || "Documento reprovado",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            ...(isDisp ? { file_path: "habilitado", file_name: "Pendente de envio" } : {})
          })
          .eq("id", fileId);

        if (fileError) throw fileError;
      }

      // Mark token as having rejections (reopens link)
      const { error: tokenError } = await supabase
        .from("documentation_tokens")
        .update({ has_rejections: true })
        .eq("id", tokenId);

      if (tokenError) throw tokenError;

      // Get stock_proposal_id from the token
      const { data: tokenData } = await supabase
        .from("documentation_tokens")
        .select("stock_proposal_id")
        .eq("id", tokenId)
        .maybeSingle();

      if (tokenData?.stock_proposal_id) {
        const { error: proposalError } = await supabase
          .from("stock_proposals")
          .update({ status: "documentacao_pendente" })
          .eq("id", tokenData.stock_proposal_id);

        if (proposalError) throw proposalError;
      }

      toast({ title: "Documento reprovado ❌", description: "O link foi reaberto para reenvio." });
      await new Promise(resolve => setTimeout(resolve, 250));
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error rejecting document:", err);
      toast({
        title: "Erro ao reprovar",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions, submissions]);

  /**
   * Save a GED identifier for a specific documentation file.
   * The GED ID is assigned by the authenticated reviewer (not auto-generated).
   */
  const updateGedId = useCallback(async (fileId: string, gedId: string) => {
    try {
      if (fileId.startsWith("temp_")) {
        const documentType = fileId.substring(5);
        let submissionId: string | null = null;
        let proposalId: string | null = null;
        
        for (const sub of submissions) {
          const isTarget = !sub.files.some(f => f.document_type === documentType);
          if (isTarget) {
            submissionId = sub.token.id;
            proposalId = sub.proposal?.id || null;
            break;
          }
        }

        if (!submissionId || !proposalId) {
          throw new Error("Não foi possível encontrar a proposta correspondente.");
        }

        const { data: newFile, error } = await supabase
          .from("documentation_files")
          .insert({
            token_id: submissionId,
            stock_proposal_id: proposalId,
            file_name: "Pendente de envio",
            file_path: "habilitado",
            file_size: 0,
            document_type: documentType,
            status: "pendente",
            ged_id: gedId || null
          })
          .select()
          .single();

        if (error) throw error;

        setSubmissions((prev) =>
          prev.map((sub) => {
            if (sub.token.id === submissionId) {
              return {
                ...sub,
                files: [...sub.files, newFile as DocumentationFile]
              };
            }
            return sub;
          })
        );
      } else {
        const { error } = await supabase
          .from("documentation_files")
          .update({ ged_id: gedId || null })
          .eq("id", fileId);

        if (error) throw error;

        // Optimistically update local state so UI reflects immediately
        setSubmissions((prev) =>
          prev.map((sub) => ({
            ...sub,
            files: sub.files.map((f) =>
              f.id === fileId ? { ...f, ged_id: gedId || null } : f
            ),
          }))
        );
      }
    } catch (err: any) {
      console.error("Error saving GED ID:", err);
      toast({
        title: "Erro ao salvar ID-GED",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast, submissions]);

  /**
   * Approve the entire proposal (all docs must be approved first).
   */
  const approveProposal = useCallback(async (tokenId: string, stockProposalId: string) => {
    try {
      // Verify all docs are approved
      const { data: files, error: filesError } = await supabase
        .from("documentation_files")
        .select("status, document_type")
        .eq("token_id", tokenId);

      if (filesError) throw filesError;

      const filesMap = (files || []).reduce((acc, f: any) => {
        acc[f.document_type] = f.status;
        return acc;
      }, {} as Record<string, string>);

      // Check if ALL 21 required documents in DOCUMENTATION_REQUIRED are uploaded and approved
      const allApproved = DOCUMENTATION_REQUIRED.every(
        (doc) => filesMap[doc.key] === "aprovado"
      );

      if (!allApproved) {
        // Force the proposal status to documentacao_pendente if not all approved
        await supabase
          .from("stock_proposals")
          .update({ status: "documentacao_pendente" })
          .eq("id", stockProposalId);

        toast({
          title: "Não é possível aprovar",
          description: "Todos os 21 documentos obrigatórios precisam estar aprovados.",
          variant: "destructive",
        });
        await fetchSubmissions(true);
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

  const approveInversoes = useCallback(async (proposalId: string, currentInversoes: any) => {
    try {
      const items = Array.isArray(currentInversoes) ? currentInversoes : (currentInversoes?.items || []);
      const custoAssessoria = typeof currentInversoes?.custoAssessoria === "number" ? currentInversoes.custoAssessoria : 0;
      
      const newInversoes = {
        items,
        custoAssessoria,
        status: "aprovado",
        rejection_reason: null
      };

      const { error } = await supabase
        .from("stock_proposals")
        .update({
          inversoes: newInversoes
        })
        .eq("id", proposalId);

      if (error) throw error;
      toast({ title: "Inversões do plano aprovadas ✅" });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error approving inversions:", err);
      toast({
        title: "Erro ao aprovar inversões",
        description: err.message,
        variant: "destructive"
      });
    }
  }, [toast, fetchSubmissions]);

  const rejectInversoes = useCallback(async (proposalId: string, currentInversoes: any, reason: string) => {
    try {
      const items = Array.isArray(currentInversoes) ? currentInversoes : (currentInversoes?.items || []);
      const custoAssessoria = typeof currentInversoes?.custoAssessoria === "number" ? currentInversoes.custoAssessoria : 0;
      
      const newInversoes = {
        items,
        custoAssessoria,
        status: "reprovado",
        rejection_reason: reason
      };

      const { error } = await supabase
        .from("stock_proposals")
        .update({
          inversoes: newInversoes
        })
        .eq("id", proposalId);

      if (error) throw error;
      toast({ title: "Inversões do plano reprovadas ❌" });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error reproving inversions:", err);
      toast({
        title: "Erro ao reprovar inversões",
        description: err.message,
        variant: "destructive"
      });
    }
  }, [toast, fetchSubmissions]);

  /**
   * Revert the proposal to its previous status (before documentation flow).
   * Deletes files, token, and restores original status.
   */
  const revertProposal = useCallback(async (submission: SubmittedProposal) => {
    try {
      const previousStatus = submission.token.previous_status || "CADASTRADA";

      // Delete all documentation files from storage
      for (const file of submission.files) {
        await supabase.storage
          .from("proposals_documents")
          .remove([file.file_path]);
      }

      // Delete file records from database
      const { error: filesDeleteError } = await supabase
        .from("documentation_files")
        .delete()
        .eq("token_id", submission.token.id);

      if (filesDeleteError) throw filesDeleteError;

      // Delete the token
      const { error: tokenDeleteError } = await supabase
        .from("documentation_tokens")
        .delete()
        .eq("id", submission.token.id);

      if (tokenDeleteError) throw tokenDeleteError;

      // Revert the proposal status
      const { error: proposalError } = await supabase
        .from("stock_proposals")
        .update({ status: previousStatus })
        .eq("id", submission.proposal.id);

      if (proposalError) throw proposalError;

      toast({
        title: "Proposta revertida ✅",
        description: `Status restaurado para: ${previousStatus}`,
      });

      // Go back to list view
      await fetchSubmissions(true);
      return true;
    } catch (err: any) {
      console.error("Error reverting proposal:", err);
      toast({
        title: "Erro ao reverter",
        description: err.message,
        variant: "destructive",
      });
      return false;
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
      const producerName = submission.proposal.producer_name.replace(/[^a-zA-Z0-9\s]/g, "").trim().toUpperCase();

      // Create a subfolder inside ZIP for environmental declarations
      const ambientalFolder = zip.folder("Declarações Ambientais");
      const ambientalSubZip = new JSZip();
      let hasAmbientalFiles = false;

      // Filter downloadable files (skip dispensed/placeholder records)
      const downloadableFiles = submission.files.filter(
        (f) => f.file_path !== "dispensado" && f.file_path !== "habilitado"
      );

      // Download in parallel batches of 5 for speed
      const BATCH_SIZE = 5;
      for (let i = 0; i < downloadableFiles.length; i += BATCH_SIZE) {
        const batch = downloadableFiles.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(
          batch.map(async (file) => {
            const { data, error } = await supabase.storage
              .from("proposals_documents")
              .download(file.file_path);

            if (error) {
              console.error(`Error downloading ${file.file_name}:`, error);
              return null;
            }

            return { file, data };
          })
        );

        for (const result of results) {
          if (!result) continue;

          const { file, data } = result;

          // Use the document label (e.g. "RG", "CAF - Extrato Completo") as the
          // ZIP entry name instead of the original file_name. This prevents
          // overwrites when the same physical file is uploaded to multiple cards.
          const docDef = DOCUMENTATION_REQUIRED.find((d) => d.key === file.document_type);
          const isAmbiental = docDef?.group === "ambiental" || file.document_type === "car_individual" || file.document_type === "car_coletivo";
          const ext = file.file_name.split(".").pop() || "pdf";
          
          // Replace slashes in document label to prevent JSZip from creating subfolders
          const safeLabel = (docDef?.label || file.document_type).replace(/\//g, "-");
          const zipName = `${safeLabel}.${ext}`;

          const isCar = file.document_type === "car_individual" || file.document_type === "car_coletivo";

          if (isAmbiental && ambientalFolder) {
            ambientalFolder.file(zipName, data);
            ambientalSubZip.file(zipName, data);
            hasAmbientalFiles = true;
          }
          
          if (!isAmbiental || isCar) {
            zip.file(zipName, data);
          }
        }
      }

      // Generate and add the sub-zip inside the environmental declarations folder
      if (hasAmbientalFiles && ambientalFolder) {
        const subZipBlob = await ambientalSubZip.generateAsync({ type: "blob" });
        ambientalFolder.file("CERTIFICAÇÃO SOCIO AMBIENTAL.zip", subZipBlob);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${producerName}.zip`);

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

  /**
   * Approve all pending/rejected documents for this token.
   */
  const approveAllDocuments = useCallback(async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from("documentation_files")
        .update({
          status: "aprovado",
          rejection_reason: null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("token_id", tokenId)
        .neq("status", "aprovado");

      if (error) throw error;

      // Update proposal status to DOCUMENTAÇÃO APROVADA since all are approved
      const { data: tokenData } = await supabase
        .from("documentation_tokens")
        .select("stock_proposal_id")
        .eq("id", tokenId)
        .maybeSingle();

      if (tokenData?.stock_proposal_id) {
        const today = new Date().toLocaleDateString('pt-BR');
        await supabase
          .from("stock_proposals")
          .update({
            status: "DOCUMENTAÇÃO APROVADA",
            documentation_approved_date: today
          })
          .eq("id", tokenData.stock_proposal_id);
      }

      toast({ title: "Todos os documentos foram aprovados! ✅" });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error approving all documents:", err);
      toast({
        title: "Erro ao aprovar todos",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions]);

  /**
   * Reject all documents for this token.
   */
  const rejectAllDocuments = useCallback(async (tokenId: string, reason: string) => {
    try {
      // 1. Update all files to rejected status
      const { error: filesError } = await supabase
        .from("documentation_files")
        .update({
          status: "reprovado",
          rejection_reason: reason || "Documentos reprovados na análise geral",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("token_id", tokenId)
        .neq("status", "reprovado");

      if (filesError) throw filesError;

      // 2. Mark token as having rejections
      const { error: tokenError } = await supabase
        .from("documentation_tokens")
        .update({ has_rejections: true })
        .eq("id", tokenId);

      if (tokenError) throw tokenError;

      // 3. Update proposal status to documentacao_pendente
      const { data: tokenData } = await supabase
        .from("documentation_tokens")
        .select("stock_proposal_id")
        .eq("id", tokenId)
        .maybeSingle();

      if (tokenData?.stock_proposal_id) {
        const { error: proposalError } = await supabase
          .from("stock_proposals")
          .update({ status: "documentacao_pendente" })
          .eq("id", tokenData.stock_proposal_id);

        if (proposalError) throw proposalError;
      }

      toast({ title: "Todos os documentos foram reprovados ❌", description: "O link foi reaberto para reenvio." });
      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error rejecting all documents:", err);
      toast({
        title: "Erro ao reprovar todos",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [user, toast, fetchSubmissions]);

  const sendToCentral = useCallback(async (stockProposalId: string) => {
    try {
      const today = new Date().toLocaleDateString('pt-BR'); // DD/MM/YYYY
      const { error } = await supabase
        .from("stock_proposals")
        .update({
          status: "ENVIADO PARA CENTRAL",
          central_date: today
        })
        .eq("id", stockProposalId);

      if (error) throw error;

      toast({
        title: "Enviado para a Central! 🚀",
        description: "A proposta foi marcada como enviada para a central nesta data.",
      });

      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error sending to central:", err);
      toast({
        title: "Erro ao enviar para central",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast, fetchSubmissions]);

  const saveAgencyGedId = useCallback(async (tokenId: string, stockProposalId: string, documentType: string, gedId: string, existingFileId?: string) => {
    try {
      if (existingFileId) {
        const { error } = await supabase
          .from("documentation_files")
          .update({ ged_id: gedId || null })
          .eq("id", existingFileId);

        if (error) throw error;

        setSubmissions((prev) =>
          prev.map((sub) => {
            if (sub.token.id !== tokenId) return sub;
            return {
              ...sub,
              files: sub.files.map((f) =>
                f.id === existingFileId ? { ...f, ged_id: gedId || null } : f
              ),
            };
          })
        );
      } else {
        const { data, error } = await supabase
          .from("documentation_files")
          .insert({
            token_id: tokenId,
            stock_proposal_id: stockProposalId,
            document_type: documentType,
            file_name: "Responsabilidade da Agência",
            file_path: "agencia",
            file_size: 0,
            status: "aprovado",
            ged_id: gedId || null,
          })
          .select()
          .single();

        if (error) throw error;

        setSubmissions((prev) =>
          prev.map((sub) => {
            if (sub.token.id !== tokenId) return sub;
            return {
              ...sub,
              files: [...sub.files, data as DocumentationFile],
            };
          })
        );
      }
      toast({
        title: "ID-GED Atualizado",
        description: "O ID-GED do documento da agência foi salvo com sucesso.",
      });
    } catch (err: any) {
      console.error("Error saving Agency GED ID:", err);
      toast({
        title: "Erro ao salvar ID-GED",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const dispenseDocument = useCallback(async (
    tokenId: string,
    stockProposalId: string,
    docType: string,
    dispense: boolean
  ) => {
    try {
      const { data: records } = await supabase
        .from("documentation_files")
        .select("id, file_path")
        .eq("token_id", tokenId)
        .eq("document_type", docType)
        .order("created_at", { ascending: false })
        .limit(1);
      const existing = records && records.length > 0 ? records[0] : null;

      if (dispense) {
        if (existing) {
          const { error } = await supabase
            .from("documentation_files")
            .update({
              file_name: "DISPENSADO PELO ANALISTA",
              file_path: "dispensado",
              file_size: 0,
              status: "aprovado",
              rejection_reason: null,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id,
              created_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("documentation_files")
            .insert({
              token_id: tokenId,
              stock_proposal_id: stockProposalId,
              file_name: "DISPENSADO PELO ANALISTA",
              file_path: "dispensado",
              file_size: 0,
              document_type: docType,
              status: "aprovado",
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id,
              created_at: new Date().toISOString(),
            });
          if (error) throw error;
        }
      } else {
        if (existing) {
          const { error } = await supabase
            .from("documentation_files")
            .update({
              file_name: "Pendente de envio",
              file_path: "habilitado",
              file_size: 0,
              status: "pendente",
              rejection_reason: null,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user?.id,
              created_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          if (error) throw error;
        }
      }

      toast({ title: dispense ? "Documento dispensado ✅" : "Dispensa desfeita 🔄" });

      // Optimistic update of the local state submissions to reflect instantly on the screen
      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.token.id !== tokenId) return sub;

          let updatedFiles = [...sub.files];
          const existingFileIdx = updatedFiles.findIndex(f => f.document_type === docType);

          const mockFile = {
            id: existingFileIdx >= 0 ? updatedFiles[existingFileIdx].id : `disp_${docType}_${Date.now()}`,
            token_id: tokenId,
            stock_proposal_id: stockProposalId,
            file_name: dispense ? "DISPENSADO PELO ANALISTA" : "Pendente de envio",
            file_path: dispense ? "dispensado" : "habilitado",
            file_size: 0,
            document_type: docType,
            status: dispense ? "aprovado" : "pendente",
            rejection_reason: null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user?.id,
            created_at: new Date().toISOString(),
            ged_id: existingFileIdx >= 0 ? updatedFiles[existingFileIdx].ged_id : null
          } as DocumentationFile;

          if (existingFileIdx >= 0) {
            updatedFiles[existingFileIdx] = mockFile;
          } else {
            updatedFiles.push(mockFile);
          }

          const requiredKeys = DOCUMENTATION_REQUIRED.map(d => d.key);
          const typeMap = new Map<string, { status: string; isDispensado: boolean; isHabilitado: boolean; created_at: string }>();
          
          updatedFiles.forEach((f) => {
            if (!requiredKeys.includes(f.document_type)) return;
            const isDisp = f.file_path === "dispensado" || f.file_path === "preenchido";
            const isHab = f.file_path === "habilitado";
            const statusVal = isDisp ? "aprovado" : f.status;
            
            const existingInMap = typeMap.get(f.document_type);
            if (!existingInMap || parseSafeDate(f.created_at) > parseSafeDate(existingInMap.created_at)) {
              typeMap.set(f.document_type, { status: statusVal, isDispensado: isDisp, isHabilitado: isHab, created_at: f.created_at });
            }
          });

          let approved = 0;
          let rejected = 0;
          let pending = 0;
          let dispensedCount = 0;

          const estimatedVal = Number(sub.proposal?.estimated_value) || 0;
          const invData = sub.proposal?.inversoes;
          if (invData) {
            let totalInv = 0;
            if (Array.isArray(invData)) {
              totalInv = invData.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0);
            } else if (typeof invData === "object") {
              const obj = invData as any;
              const items = Array.isArray(obj.items) ? obj.items : [];
              const custo = typeof obj.custoAssessoria === "number" ? obj.custoAssessoria : 0;
              totalInv = items.reduce((acc: number, item: any) => acc + (Number(item.valor) || 0), 0) + custo;
            }
            const isInvValida = (Math.abs(totalInv - estimatedVal) < 0.01) && (invData as any)?.status === "aprovado";
            if (isInvValida) {
              approved = 1;
            } else if ((invData as any)?.status === "reprovado") {
              rejected = 1;
            } else if ((invData as any)?.status === "pendente") {
              pending = 1;
            }
          }

          requiredKeys.forEach((key) => {
            const fileInfo = typeMap.get(key);
            if (!fileInfo) {
              // Not uploaded
            } else if (fileInfo.isDispensado) {
              dispensedCount++;
            } else if (fileInfo.status === "aprovado" && !fileInfo.isHabilitado) {
              approved++;
            } else if (fileInfo.status === "reprovado") {
              rejected++;
            } else if (fileInfo.status === "pendente" && !fileInfo.isHabilitado) {
              pending++;
            }
          });

          const totalFiles = requiredKeys.length + 1 - dispensedCount;

          return {
            ...sub,
            files: updatedFiles,
            approvedCount: approved,
            rejectedCount: rejected,
            pendingCount: pending,
            totalFiles
          };
        })
      );

      await new Promise(resolve => setTimeout(resolve, 250));
      await fetchSubmissions(true);
      return true;
    } catch (err: any) {
      console.error("Error dispensing document:", err);
      toast({
        title: "Erro ao dispensar",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, fetchSubmissions]);

  const completeProposal = useCallback(async (stockProposalId: string, tokenId: string, currentStatus: string) => {
    try {
      if (tokenId && currentStatus) {
        await supabase
          .from("documentation_tokens")
          .update({ previous_status: currentStatus })
          .eq("id", tokenId);
      }

      const { error } = await supabase
        .from("stock_proposals")
        .update({
          status: "CONCLUÍDO"
        })
        .eq("id", stockProposalId);

      if (error) throw error;

      toast({
        title: "Proposta Concluída! 🎉",
        description: "A proposta foi marcada como concluída e arquivada.",
      });

      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error completing proposal:", err);
      toast({
        title: "Erro ao concluir proposta",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast, fetchSubmissions]);

  const revertConclusion = useCallback(async (stockProposalId: string, tokenId: string, previousStatus: string) => {
    try {
      const targetStatus = previousStatus || "ENVIADO PARA CENTRAL";
      const { error } = await supabase
        .from("stock_proposals")
        .update({
          status: targetStatus
        })
        .eq("id", stockProposalId);

      if (error) throw error;

      toast({
        title: "Conclusão Revertida! 🔄",
        description: `A proposta voltou para o status: ${targetStatus}`,
      });

      await fetchSubmissions(true);
    } catch (err: any) {
      console.error("Error reverting conclusion:", err);
      toast({
        title: "Erro ao reverter conclusão",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast, fetchSubmissions]);

  const refetchAll = useCallback(async () => {
    await fetchSubmissions();
    await fetchAuthorizedProposals();
  }, [fetchSubmissions, fetchAuthorizedProposals]);

  return {
    submissions,
    authorizedProposals,
    loading,
    approveDocument,
    rejectDocument,
    dispenseDocument,
    updateGedId,
    approveProposal,
    approveInversoes,
    rejectInversoes,
    sendToCentral,
    revertProposal,
    downloadFile,
    getFileUrl,
    downloadAllAsZip,
    approveAllDocuments,
    rejectAllDocuments,
    saveAgencyGedId,
    completeProposal,
    revertConclusion,
    refetch: refetchAll,
  };
}
