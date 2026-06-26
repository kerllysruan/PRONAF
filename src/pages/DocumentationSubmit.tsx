import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentationToken } from "@/hooks/useDocumentationToken";
import {
  DOCUMENTATION_REQUIRED,
  DocumentationFile,
  DocumentationTokenWithProposal,
  getDocLabel,
} from "@/types/documentation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Upload,
  FileCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Send,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

// List of document keys that can be dispensed
const DISPENSABLE_DOCS = [
  "ficha_cadastro_esposa",
  "rg_esposa",
  "certidao_casamento",
  "procuracao",
  "rg_procurador",
  "titulo_dominio",
  "car_individual",
];

// ─── Component ──────────────────────────────────────────────────
export default function DocumentationSubmit() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const {
    loading,
    getTokenData,
    getFilesForToken,
    submitDocuments,
    resubmitDocuments,
    dispenseDocument,
  } = useDocumentationToken();

  const [tokenData, setTokenData] = useState<DocumentationTokenWithProposal | null>(null);
  const [files, setFiles] = useState<DocumentationFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isInvalid, setIsInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // ── Load token data on mount ──────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!token) {
        setIsInvalid(true);
        setPageLoading(false);
        return;
      }

      const data = await getTokenData(token);
      if (!data) {
        setIsInvalid(true);
        setPageLoading(false);
        return;
      }

      setTokenData(data);
      const existingFiles = await getFilesForToken(data.id);
      setFiles(existingFiles);
      setPageLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Derived state ─────────────────────────────────────────────
  const selectedCount = Object.keys(selectedFiles).length;
  const totalDocs = DOCUMENTATION_REQUIRED.length;

  const dbFilesMap = useMemo(() => {
    return files.reduce((acc, f) => {
      acc[f.document_type] = f;
      return acc;
    }, {} as Record<string, DocumentationFile>);
  }, [files]);

  const allApproved = useMemo(() => {
    return DOCUMENTATION_REQUIRED.every((doc) => dbFilesMap[doc.key]?.status === "aprovado");
  }, [dbFilesMap]);

  const hasMissingFiles = useMemo(() => {
    return DOCUMENTATION_REQUIRED.some((doc) => !dbFilesMap[doc.key]);
  }, [dbFilesMap]);

  const hasRejections = useMemo(() => {
    return files.some((f) => f.status === "reprovado");
  }, [files]);

  const isAwaitingAnalysis = useMemo(() => {
    // True when all submitted docs are pending review (no missing, no rejections, not yet all approved)
    return !!(tokenData?.documents_submitted && !hasRejections && !hasMissingFiles && !allApproved);
  }, [tokenData, hasRejections, hasMissingFiles, allApproved]);

  // Dispensed docs that are currently "approved" but marked as dispensed (file_path === 'dispensado')
  const hasDispensedDocs = useMemo(() => {
    return files.some((f) => f.file_path === "dispensado");
  }, [files]);

  const missingOrRejectedCount = useMemo(() => {
    return DOCUMENTATION_REQUIRED.filter((doc) => {
      const dbFile = dbFilesMap[doc.key];
      return !dbFile || dbFile.status === "reprovado";
    }).length;
  }, [dbFilesMap]);

  const approvedOrPendingCount = useMemo(() => {
    return files.filter((f) => f.status === "aprovado" || f.status === "pendente").length;
  }, [files]);

  const progressPercent = Math.round(
    ((approvedOrPendingCount + selectedCount) / totalDocs) * 100
  );

  const rejectedFiles = useMemo(
    () => files.filter((f) => f.status === "reprovado"),
    [files]
  );

  const existingFileIds = useMemo(() => {
    const map: Record<string, string> = {};
    files.forEach((f) => {
      map[f.document_type] = f.id;
    });
    return map;
  }, [files]);

  // ── File handling ─────────────────────────────────────────────
  function handleFileSelect(docKey: string, file: File | null) {
    setSelectedFiles((prev) => {
      if (!file) {
        const next = { ...prev };
        delete next[docKey];
        return next;
      }
      return { ...prev, [docKey]: file };
    });
  }

  function handleDrop(docKey: string, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      handleFileSelect(docKey, droppedFile);
    }
  }

  async function handleSubmit() {
    if (!tokenData || !token || selectedCount < missingOrRejectedCount) return;
    setIsSubmitting(true);

    const success = await submitDocuments(
      tokenData.id,
      tokenData.stock_proposal_id,
      token,
      selectedFiles
    );

    if (success) {
      const refreshedData = await getTokenData(token);
      if (refreshedData) {
        setTokenData(refreshedData);
        const refreshedFiles = await getFilesForToken(refreshedData.id);
        setFiles(refreshedFiles);
      }
      setSelectedFiles({});
    }

    setIsSubmitting(false);
  }

  // ── Resubmit rejected ─────────────────────────────────────────
  async function handleResubmit() {
    if (!tokenData || !token || selectedCount === 0) return;
    setIsSubmitting(true);

    const success = await resubmitDocuments(
      tokenData.id,
      tokenData.stock_proposal_id,
      token,
      selectedFiles,
      existingFileIds
    );

    if (success) {
      const refreshedData = await getTokenData(token);
      if (refreshedData) {
        setTokenData(refreshedData);
        const refreshedFiles = await getFilesForToken(refreshedData.id);
        setFiles(refreshedFiles);
      }
      setSelectedFiles({});
    }

    setIsSubmitting(false);
  }

  // ── Helpers ───────────────────────────────────────────────────
  function formatCPF(cpf: string | null) {
    if (!cpf) return "—";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  // ── Loading state ─────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-indigo-400 animate-spin relative z-10" />
          </div>
          <p className="text-white/60 text-sm font-medium tracking-wide">
            Validando link...
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid token ─────────────────────────────────────────────
  if (isInvalid || !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="animate-fade-in w-full max-w-md">
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
            <CardContent className="flex flex-col items-center py-16 px-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-rose-400" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-3">
                Link inválido ou expirado
              </h2>
              <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                Este link de envio de documentação não é válido. Verifique se o
                link está correto ou solicite um novo link ao seu consultor.
              </p>
            </CardContent>
          </Card>
          <p className="text-center text-white/20 text-xs mt-6 tracking-wider uppercase font-semibold">
            Super Gestão © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  const proposal = tokenData.stock_proposals;

  // ── All documents approved ────────────────────────────────────
  if (tokenData.documents_submitted && allApproved && files.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <BrandHeader />

          <div className="animate-fade-in">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
              <CardContent className="flex flex-col items-center py-16 px-8 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-150" />
                  <div className="relative z-10 w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center">
                    <ShieldCheck className="h-12 w-12 text-emerald-400" />
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-4 py-1.5 text-sm font-bold mb-4 rounded-full">
                  DOCUMENTAÇÃO APROVADA ✅
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  Todos os documentos foram aprovados
                </h2>
                <p className="text-white/50 text-sm max-w-md">
                  A documentação do produtor foi analisada e aprovada com sucesso. Nenhuma ação adicional é necessária.
                </p>

                <ProposalInfoCard proposal={proposal} className="mt-10 w-full max-w-lg" />

                <div className="mt-8 w-full max-w-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 text-left">
                    Documentos aprovados
                  </p>
                  <div className="space-y-2">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-4 py-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm truncate">
                          {getDocLabel(f.document_type)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Footer />
        </div>
      </div>
    );
  }

  // NOTE: isAwaitingAnalysis is now used as a banner inside the main form
  // (not an early return) so users can still interact with dispensed docs

  // ── Main/Unified submission layout (initial, awaiting analysis, missing files, or rejected)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BrandHeader />

        <div className="animate-fade-in space-y-6">
          {/* Banner: Awaiting Analysis */}
          {isAwaitingAnalysis ? (
            <Card className="bg-indigo-500/10 backdrop-blur-xl border border-indigo-400/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500" />
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-white mb-1">
                    ✅ Documentos Enviados — Aguardando Análise
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                    Seus documentos foram enviados e estão sendo analisados pela equipe.
                    {hasDispensedDocs && " Caso precise reenviar um documento dispensado, clique em \"Habilitar Envio\" abaixo."}
                  </p>
                  {tokenData?.submitted_at && (
                    <div className="mt-2 flex items-center gap-1.5 text-indigo-300/60 text-xs">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Enviado em {formatDate(tokenData.submitted_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Banner: Pending documents or review */
            <Card className="bg-amber-500/10 backdrop-blur-xl border border-amber-400/20 rounded-3xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-white mb-1">
                    Documentação Pendente
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                    A proposta está <strong className="text-amber-300">Pendente</strong> porque restam documentos obrigatórios a serem enviados ou aprovados pela equipe. Por favor, anexe os documentos necessários abaixo.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposal info */}
          <ProposalInfoCard proposal={proposal} />

          {/* Progress */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Progresso do envio
                </p>
                <span className="text-white/70 text-sm font-bold">
                  {approvedOrPendingCount + selectedCount}/{totalDocs}
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2.5 bg-white/10 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-blue-400 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-500"
              />
              <p className="text-white/30 text-xs mt-2">
                {selectedCount === 0
                  ? "Selecione os documentos em PDF para enviar"
                  : `${selectedCount} documento${selectedCount !== 1 ? "s" : ""} selecionado${selectedCount !== 1 ? "s" : ""}`}
              </p>
            </CardContent>
          </Card>

          {/* Upload grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENTATION_REQUIRED.map((doc) => {
              const selected = selectedFiles[doc.key];
              const dbFile = dbFilesMap[doc.key];
              const isApproved = dbFile?.status === "aprovado";
              const isPending = dbFile?.status === "pendente";
              const isRejected = dbFile?.status === "reprovado";

              return (
                <div
                  key={doc.key}
                  className={`group rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                    isApproved
                      ? "border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl"
                      : isPending
                      ? "border-amber-500/20 bg-amber-500/5 backdrop-blur-xl"
                      : isRejected
                      ? "border-rose-500/20 bg-rose-500/5 backdrop-blur-xl"
                      : selected
                      ? "border-indigo-400/40 bg-indigo-500/10 backdrop-blur-xl shadow-lg shadow-indigo-500/10"
                      : "border-dashed border-white/15 bg-white/5 backdrop-blur-xl hover:border-white/30 hover:bg-white/10"
                  }`}
                  onDragOver={(!isApproved && !isPending) ? (e) => e.preventDefault() : undefined}
                  onDrop={(!isApproved && !isPending) ? (e) => handleDrop(doc.key, e) : undefined}
                >
                  {isApproved ? (
                    <div className="flex flex-col items-center justify-center p-5 min-h-[140px] text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${dbFile?.file_path === 'dispensado' ? 'bg-slate-500/20 border border-slate-400/30' : 'bg-emerald-500/20 border border-emerald-400/30 animate-pulse'}`}>
                        {dbFile?.file_path === 'dispensado' ? (
                          <XCircle className="h-6 w-6 text-slate-400" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-white/90 text-xs font-bold leading-snug mb-1">
                        {doc.label}
                      </p>
                      <p className={`${dbFile?.file_path === 'dispensado' ? 'text-slate-400' : 'text-emerald-300/80'} text-[10px] font-bold`}>
                        {dbFile?.file_path === 'dispensado' ? "Dispensado / Não possui 🚫" : "Aprovado ✅"}
                      </p>
                      {dbFile?.file_path === 'dispensado' && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (tokenData) {
                              const ok = await dispenseDocument(tokenData.id, tokenData.stock_proposal_id, doc.key, false);
                              if (ok) {
                                const refreshedFiles = await getFilesForToken(tokenData.id);
                                setFiles(refreshedFiles);
                              }
                            }
                          }}
                          className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 underline transition-colors"
                        >
                          Habilitar Envio
                        </button>
                      )}
                    </div>
                  ) : isPending ? (
                    <div className="flex flex-col items-center justify-center p-5 min-h-[140px] text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-3">
                        <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                      </div>
                      <p className="text-white/90 text-xs font-bold leading-snug mb-1">
                        {doc.label}
                      </p>
                      <p className="text-amber-300/80 text-[10px] font-bold">
                        Aguardando Análise ⏳
                      </p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 cursor-pointer min-h-[140px]">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(doc.key, e.target.files?.[0] || null)
                        }
                      />

                      {selected ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-3">
                            <FileCheck className="h-6 w-6 text-indigo-400" />
                          </div>
                          <p className="text-white/90 text-xs font-bold text-center leading-snug mb-1.5">
                            {doc.label}
                          </p>
                          <p className="text-indigo-300/70 text-[10px] truncate max-w-full px-2">
                            {selected.name}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleFileSelect(doc.key, null);
                            }}
                            className="mt-2 text-[10px] text-white/30 hover:text-rose-400 transition-colors flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Remover
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                            {isRejected ? (
                              <XCircle className="h-5 w-5 text-rose-400" />
                            ) : (
                              <Upload className="h-5 w-5 text-white/25 group-hover:text-white/50 transition-colors" />
                            )}
                          </div>
                          <p className="text-white/70 text-xs font-bold text-center leading-snug mb-1">
                            {doc.label}
                          </p>
                          {isRejected ? (
                            <p className="text-rose-300/80 text-[10px] text-center px-2 truncate max-w-full font-semibold">
                              Reprovado: {dbFile.rejection_reason || "Reenviar"}
                            </p>
                          ) : (
                            <p className="text-white/25 text-[10px]">
                              Clique ou arraste PDF
                            </p>
                          )}
                          {!selected && DISPENSABLE_DOCS.includes(doc.key) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (tokenData) {
                                  const ok = await dispenseDocument(tokenData.id, tokenData.stock_proposal_id, doc.key, true);
                                  if (ok) {
                                    const refreshedFiles = await getFilesForToken(tokenData.id);
                                    setFiles(refreshedFiles);
                                  }
                                }
                              }}
                              className="mt-3 text-[11px] text-amber-300 font-extrabold bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 hover:border-amber-400/60 px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              NÃO POSSUI
                            </button>
                          )}
                        </>
                      )}
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button — only shown when there are docs to upload */}
          {(missingOrRejectedCount > 0 || selectedCount > 0) && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-4">
              {selectedCount < missingOrRejectedCount && missingOrRejectedCount > 0 && (
                <p className="text-amber-400/90 text-xs font-bold tracking-wide animate-pulse bg-amber-500/10 border border-amber-500/25 px-4 py-2 rounded-xl mb-1">
                  ⚠️ Selecione todos os {missingOrRejectedCount} documentos obrigatórios ({missingOrRejectedCount - selectedCount} ainda pendentes) para habilitar o envio.
                </p>
              )}
              <Button
                onClick={hasRejections ? handleResubmit : handleSubmit}
                disabled={selectedCount < missingOrRejectedCount || selectedCount === 0 || isSubmitting}
                className="w-full sm:w-auto min-w-[280px] h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enviando documentos...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    {hasRejections ? "Reenviar Documentos" : "Enviar Documentação"}
                    {selectedCount > 0 && (
                      <Badge className="ml-2 bg-white/20 text-white border-0 rounded-full text-xs">
                        {selectedCount}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
              {selectedCount === 0 && missingOrRejectedCount > 0 && (
                <p className="text-white/30 text-xs">
                  Selecione os documentos necessários para continuar
                </p>
              )}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function BrandHeader() {
  return (
    <div className="text-center mb-10 animate-fade-in">
      <div className="inline-flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
            SUPER GESTÃO
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300/60">
            Portal de Documentação
          </p>
        </div>
      </div>
    </div>
  );
}

function ProposalInfoCard({
  proposal,
  className = "",
}: {
  proposal: DocumentationTokenWithProposal["stock_proposals"];
  className?: string;
}) {
  function formatCPF(cpf: string | null) {
    if (!cpf) return "—";
    const clean = cpf.replace(/\D/g, "");
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }

  const infoFields = [
    { label: "Produtor", value: proposal.producer_name },
    { label: "CPF", value: formatCPF(proposal.producer_cpf) },
    { label: "Município", value: proposal.municipio || "—" },
    { label: "Programa", value: proposal.credit_program || "—" },
  ];

  return (
    <Card
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden ${className}`}
    >
      <div className="h-1 bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500" />
      <CardContent className="p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">
          Dados da Proposta
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoFields.map((field) => (
            <div key={field.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">
                {field.label}
              </p>
              <p className="text-white/90 text-sm font-semibold truncate">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Footer() {
  return (
    <div className="text-center mt-10">
      <p className="text-white/15 text-[10px] font-bold uppercase tracking-widest">
        Super Gestão © {new Date().getFullYear()} — Todos os direitos reservados
      </p>
    </div>
  );
}
