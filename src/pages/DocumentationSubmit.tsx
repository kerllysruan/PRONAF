import { useState, useEffect, useMemo } from "react";
// Trigger Vercel Build Sincronização 
import { useSearchParams } from "react-router-dom";
import { useDocumentationToken } from "@/hooks/useDocumentationToken";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  ExternalLink,
  Plus,
  Trash2,
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
  "car_coletivo",
  "certidao_obito",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

function getDispenseButtonLabel(docKey: string): string {
  switch (docKey) {
    case "certidao_casamento":
      return "DISPENSAR - CLIENTE SOLTEIRO/VIÚVO";
    case "certidao_obito":
      return "DISPENSAR - CLIENTE CASADO/SOLTEIRO";
    case "ficha_cadastro_esposa":
    case "rg_esposa":
      return "DISPENSAR - CLIENTE SOLTEIRO";
    default:
      return "DISPENSAR - CLIENTE NÃO POSSUI OU NÃO NECESSÁRIO NA OPERAÇÃO";
  }
}

// ─── Component ──────────────────────────────────────────────────
export default function DocumentationSubmit() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
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
  // Track which doc is being re-enabled (for mobile loading feedback)
  const [enablingDoc, setEnablingDoc] = useState<string | null>(null);
  // Track hovered card for instant paste (Ctrl+V) without click
  const [hoveredDocKey, setHoveredDocKey] = useState<string | null>(null);

  // States for CAR numbers
  const [carIndividualNumber, setCarIndividualNumber] = useState("");
  const [carColetivoNumber, setCarColetivoNumber] = useState("");
  const [carIndividualName, setCarIndividualName] = useState("");
  const [carColetivoName, setCarColetivoName] = useState("");
  const [atividadePlano, setAtividadePlano] = useState("");

  // Inversões state
  const [inversoes, setInversoes] = useState<{ quant: number; nome: string; valor: number }[]>([
    { quant: 1, nome: "", valor: 0 }
  ]);

  const formatInputMoney = (value: number) => {
    if (value === 0 || isNaN(value)) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleMoneyChange = (idx: number, rawValue: string) => {
    const cleanValue = rawValue.replace(/\D/g, "");
    if (!cleanValue) {
      const updated = [...inversoes];
      updated[idx].valor = 0;
      setInversoes(updated);
      return;
    }
    const numValue = parseFloat(cleanValue) / 100;
    const updated = [...inversoes];
    updated[idx].valor = numValue;
    setInversoes(updated);
  };

  // Global paste handler when mouse is hovering over a card
  useEffect(() => {
    function handleGlobalPaste(e: ClipboardEvent) {
      if (!hoveredDocKey) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") && !activeEl.classList.contains("hidden")) {
        return; // don't override input field pastes
      }

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
            e.preventDefault();
            e.stopPropagation();
            handleFileSelect(hoveredDocKey, file);
            break;
          }
        }
      }
    }

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [hoveredDocKey]);

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

      // Autofill CAR inputs if they already exist in database
      const carInd = existingFiles.find(f => f.document_type === "car_individual");
      const carCol = existingFiles.find(f => f.document_type === "car_coletivo");
      if (carInd?.ged_id) setCarIndividualNumber(carInd.ged_id);
      if (carCol?.ged_id) setCarColetivoNumber(carCol.ged_id);
      if (data.stock_proposals?.localizacao) {
        const parts = data.stock_proposals.localizacao.split("|").map(p => p.trim());
        if (parts.length > 1) {
          setCarIndividualName(parts[0]);
          setCarColetivoName(parts[1]);
        } else {
          setCarIndividualName(data.stock_proposals.localizacao);
          setCarColetivoName(data.stock_proposals.localizacao);
        }
      }
      if (data.stock_proposals?.credit_purpose) {
        setAtividadePlano(data.stock_proposals.credit_purpose);
      }
      if (data.stock_proposals?.inversoes && Array.isArray(data.stock_proposals.inversoes)) {
        setInversoes(data.stock_proposals.inversoes as any);
      }

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

  // Helper: is this file a re-enabled (previously dispensed) record?
  // file_path='habilitado' means "reset — needs upload" (UPDATE instead of DELETE for RLS safety)
  function isReenabledFile(f: DocumentationFile | undefined) {
    return f?.file_path === "habilitado";
  }

  const allApproved = useMemo(() => {
    return DOCUMENTATION_REQUIRED.every((doc) => {
      const f = dbFilesMap[doc.key];
      return f?.status === "aprovado" && f.file_path !== "habilitado";
    });
  }, [dbFilesMap]);

  const hasMissingFiles = useMemo(() => {
    return DOCUMENTATION_REQUIRED.some((doc) => {
      const f = dbFilesMap[doc.key];
      return !f || isReenabledFile(f);
    });
  }, [dbFilesMap]);

  const hasRejections = useMemo(() => {
    return files.some((f) => f.status === "reprovado" && !isReenabledFile(f));
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
      return !dbFile || isReenabledFile(dbFile) || dbFile.status === "reprovado";
    }).length;
  }, [dbFilesMap]);

  const approvedOrPendingCount = useMemo(() => {
    return files.filter((f) => {
      if (isReenabledFile(f)) return false; // treat as missing
      return f.status === "aprovado" || f.status === "pendente";
    }).length;
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

  function handlePaste(docKey: string, e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
          e.preventDefault();
          e.stopPropagation();
          handleFileSelect(docKey, file);
          break;
        }
      }
    }
  }

  async function handleSubmit() {
    if (!tokenData || !token || selectedCount < missingOrRejectedCount) return;

    // Validação das Inversões
    const totalInversoes = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    const estimatedValue = tokenData.stock_proposals?.estimated_value || 0;
    if (Math.abs(totalInversoes - estimatedValue) >= 0.01) {
      toast({
        title: "Soma das Inversões Divergente",
        description: `A soma das inversões (${formatCurrency(totalInversoes)}) deve ser exatamente igual ao valor proposto da operação (${formatCurrency(estimatedValue)})!`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const carNumbersMap: Record<string, string> = {};
    if (carIndividualNumber.trim()) carNumbersMap["car_individual"] = carIndividualNumber.trim();
    if (carColetivoNumber.trim()) carNumbersMap["car_coletivo"] = carColetivoNumber.trim();

    const success = await submitDocuments(
      tokenData.id,
      tokenData.stock_proposal_id,
      token,
      selectedFiles,
      carNumbersMap
    );

    if (success) {
      // Salva o Nome do Imóvel Rural / Nome do PA diretamente na proposta no Supabase
      const updateData: Record<string, any> = {};
      const indName = carIndividualName.trim();
      const colName = carColetivoName.trim();

      if (indName && colName) {
        updateData["localizacao"] = `${indName} | ${colName}`;
      } else if (indName) {
        updateData["localizacao"] = indName;
      } else if (colName) {
        updateData["localizacao"] = colName;
      }

      if (atividadePlano.trim()) {
        updateData["credit_purpose"] = atividadePlano.trim();
      }

      updateData["inversoes"] = inversoes;

      if (Object.keys(updateData).length > 0) {
        try {
          await supabase
            .from("stock_proposals")
            .update(updateData)
            .eq("id", tokenData.stock_proposal_id);
        } catch (dbErr) {
          console.error("Erro ao atualizar localizacao da proposta:", dbErr);
        }
      }

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

    // Validação das Inversões
    const totalInversoes = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    const estimatedValue = tokenData.stock_proposals?.estimated_value || 0;
    if (Math.abs(totalInversoes - estimatedValue) >= 0.01) {
      toast({
        title: "Soma das Inversões Divergente",
        description: `A soma das inversões (${formatCurrency(totalInversoes)}) deve ser exatamente igual ao valor proposto da operação (${formatCurrency(estimatedValue)})!`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const carNumbersMap: Record<string, string> = {};
    if (carIndividualNumber.trim()) carNumbersMap["car_individual"] = carIndividualNumber.trim();
    if (carColetivoNumber.trim()) carNumbersMap["car_coletivo"] = carColetivoNumber.trim();

    const success = await resubmitDocuments(
      tokenData.id,
      tokenData.stock_proposal_id,
      token,
      selectedFiles,
      existingFileIds,
      carNumbersMap
    );

    if (success) {
      // Salva o Nome do Imóvel Rural / Nome do PA diretamente na proposta no Supabase
      const updateData: Record<string, any> = {};
      const indName = carIndividualName.trim();
      const colName = carColetivoName.trim();

      if (indName && colName) {
        updateData["localizacao"] = `${indName} | ${colName}`;
      } else if (indName) {
        updateData["localizacao"] = indName;
      } else if (colName) {
        updateData["localizacao"] = colName;
      }

      if (atividadePlano.trim()) {
        updateData["credit_purpose"] = atividadePlano.trim();
      }

      updateData["inversoes"] = inversoes;

      if (Object.keys(updateData).length > 0) {
        try {
          await supabase
            .from("stock_proposals")
            .update(updateData)
            .eq("id", tokenData.stock_proposal_id);
        } catch (dbErr) {
          console.error("Erro ao atualizar localizacao da proposta no resubmit:", dbErr);
        }
      }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin relative z-10" />
          </div>
          <p className="text-slate-600 text-sm font-medium tracking-wide">
            Validando link...
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid token ─────────────────────────────────────────────
  if (isInvalid || !tokenData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="animate-fade-in w-full max-w-md">
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-lg">
            <CardContent className="flex flex-col items-center py-16 px-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-2xl" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-rose-500/10 border border-rose-200 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-rose-500" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-3">
                Link inválido ou expirado
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Este link de envio de documentação não é válido. Verifique se o
                link está correto ou solicite um novo link ao seu consultor.
              </p>
            </CardContent>
          </Card>
          <p className="text-center text-slate-400 text-xs mt-6 tracking-wider uppercase font-semibold">
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
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <BrandHeader />

          <div className="animate-fade-in">
            <Card className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
              <CardContent className="flex flex-col items-center py-16 px-8 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl scale-150" />
                  <div className="relative z-10 w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center">
                    <ShieldCheck className="h-12 w-12 text-emerald-500" />
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-400/30 px-4 py-1.5 text-sm font-bold mb-4 rounded-full">
                  DOCUMENTAÇÃO APROVADA ✅
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">
                  Todos os documentos foram aprovados
                </h2>
                <p className="text-slate-500 text-sm max-w-md">
                  A documentação do produtor foi analisada e aprovada com sucesso. Nenhuma ação adicional é necessária.
                </p>

                <ProposalInfoCard proposal={proposal} className="mt-10 w-full max-w-lg" />

                <div className="mt-8 w-full max-w-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-left">
                    Documentos aprovados
                  </p>
                  <div className="space-y-2">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-700 text-sm font-medium truncate">
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BrandHeader />

        <div className="animate-fade-in space-y-6">
          {/* Banner: Awaiting Analysis */}
          {isAwaitingAnalysis ? (
            <Card className="bg-emerald-50 border border-emerald-100 rounded-3xl shadow-md overflow-hidden">
              <div className="h-1.5 bg-emerald-500" />
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-emerald-900 mb-1">
                    ✅ Documentos Enviados — Aguardando Análise
                  </h2>
                  <p className="text-emerald-700/90 text-xs sm:text-sm leading-relaxed">
                    Seus documentos foram enviados e estão sendo analisados pela equipe.
                    {hasDispensedDocs && " Caso precise reenviar um documento dispensado, clique em \"Habilitar Envio\" abaixo."}
                  </p>
                  {tokenData?.submitted_at && (
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-600/80 text-xs font-semibold">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Enviado em {formatDate(tokenData.submitted_at)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Banner: Pending documents or review */
            <Card className="bg-amber-50 border border-amber-100 rounded-3xl shadow-md overflow-hidden">
              <div className="h-1.5 bg-amber-500" />
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-extrabold text-amber-900 mb-1">
                    Documentação Pendente
                  </h2>
                  <p className="text-amber-700/90 text-xs sm:text-sm leading-relaxed">
                    A proposta está <strong className="text-amber-800">Pendente</strong> porque restam documentos obrigatórios a serem enviados ou aprovados pela equipe. Por favor, anexe os documentos necessários abaixo.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposal info */}
          <ProposalInfoCard proposal={proposal} />

          {/* Progress */}
          <Card className="bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Progresso do envio
                </p>
                <span className="text-slate-700 text-sm font-bold">
                  {approvedOrPendingCount + selectedCount}/{totalDocs}
                </span>
              </div>
              <Progress
                value={progressPercent}
                className="h-2.5 bg-slate-100 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-indigo-600 [&>div]:to-blue-500 [&>div]:rounded-full [&>div]:transition-all [&>div]:duration-500"
              />
              <p className="text-slate-400 text-xs mt-2">
                {selectedCount === 0
                  ? "Selecione os documentos em PDF para enviar"
                  : `${selectedCount} documento${selectedCount !== 1 ? "s" : ""} selecionado${selectedCount !== 1 ? "s" : ""}`}
              </p>
            </CardContent>
          </Card>

          {/* ── Helper to render a single doc card ─────────────────── */}
          {(() => {
            const renderCard = (doc: (typeof DOCUMENTATION_REQUIRED)[0]) => {
              const selected = selectedFiles[doc.key];
              const dbFile = dbFilesMap[doc.key];
              // A 're-enabled' record (file_path='habilitado') or rejected file should be treated as needing upload
              const needsUpload = !dbFile || dbFile.file_path === "habilitado" || dbFile.status === "reprovado";
              const isApproved = !needsUpload && dbFile?.status === "aprovado";
              const isPending  = !needsUpload && dbFile?.status === "pendente";
              const isRejected = dbFile?.status === "reprovado";

              return (
                <div
                  key={doc.key}
                  tabIndex={(!isApproved && !isPending) ? 0 : undefined}
                  onPaste={(!isApproved && !isPending) ? (e) => handlePaste(doc.key, e) : undefined}
                  className={`group rounded-2xl border transition-all duration-300 overflow-hidden outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    isApproved
                      ? "border-emerald-200 bg-emerald-50/80"
                      : isPending
                      ? "border-amber-200 bg-amber-50/80"
                      : isRejected
                      ? "border-rose-200 bg-rose-50/80"
                      : selected
                      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/5"
                      : "border-dashed border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/10"
                  }`}
                  onDragOver={(!isApproved && !isPending) ? (e) => e.preventDefault() : undefined}
                  onDrop={(!isApproved && !isPending) ? (e) => handleDrop(doc.key, e) : undefined}
                  onMouseEnter={(!isApproved && !isPending) ? () => setHoveredDocKey(doc.key) : undefined}
                  onMouseLeave={(!isApproved && !isPending) ? () => setHoveredDocKey(null) : undefined}
                >
                  {isApproved ? (
                    <div className="flex flex-col items-center justify-center p-5 min-h-[140px] text-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${dbFile?.file_path === 'dispensado' ? 'bg-slate-200 border border-slate-300' : 'bg-emerald-100 border border-emerald-200'}`}>
                        {dbFile?.file_path === 'dispensado' ? (
                          <XCircle className="h-6 w-6 text-slate-500" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                      </p>
                      <p className={`${dbFile?.file_path === 'dispensado' ? 'text-slate-500' : 'text-emerald-600'} text-[10px] font-bold`}>
                        {dbFile?.file_path === 'dispensado' ? "Dispensado / Não possui 🚫" : "Aprovado ✅"}
                      </p>
                      {dbFile?.file_path === 'dispensado' && (
                        <button
                          type="button"
                          disabled={enablingDoc === doc.key}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (tokenData && enablingDoc !== doc.key) {
                              setEnablingDoc(doc.key);
                              try {
                                const ok = await dispenseDocument(tokenData.id, tokenData.stock_proposal_id, doc.key, false);
                                if (ok) {
                                  const refreshedFiles = await getFilesForToken(tokenData.id);
                                  setFiles(refreshedFiles);
                                }
                              } finally {
                                setEnablingDoc(null);
                              }
                            }
                          }}
                          className="mt-3 flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-100 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none"
                        >
                          {enablingDoc === doc.key ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Habilitando...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-3.5 w-3.5" />
                              Habilitar Envio
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : isPending ? (
                    <div className="flex flex-col items-center justify-center p-5 min-h-[140px] text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mb-3">
                        <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                      </div>
                      <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                      </p>
                      <p className="text-amber-600 text-[10px] font-bold">
                        Aguardando Análise ⏳
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-5 min-h-[140px]">
                      {(!needsUpload) ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mb-3">
                            <FileCheck className="h-6 w-6 text-indigo-600" />
                          </div>
                          <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                          </p>
                          <p className="text-indigo-600 text-[10px] truncate max-w-full px-2">
                            {dbFile?.file_name}
                          </p>
                        </>
                      ) : (
                        <>
                          {/* Alert & Input for CAR files */}
                          {(doc.key === "car_individual" || doc.key === "car_coletivo") && (
                            <div className="w-full space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                              <p className="text-rose-600 text-xs font-black text-center uppercase tracking-wide leading-snug mb-1">
                                ATENÇÃO: Digite o número do CAR e o Nome do Imóvel abaixo para liberar o envio do arquivo PDF!
                              </p>
                              <input
                                type="text"
                                placeholder={doc.key === "car_individual" ? "Número do CAR Individual (Ex: PA-1502406-D5C8.92AF.381E.E70B.8C54.1A6D.90B2.74F3)" : "Número do CAR Coletivo (Ex: TO-1721000-F8C4.73BD.190A.D25C.6B4E.5F83.10A4.7E9B)"}
                                value={doc.key === "car_individual" ? carIndividualNumber : carColetivoNumber}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  if (doc.key === "car_individual") setCarIndividualNumber(val);
                                  else setCarColetivoNumber(val);
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground mb-2 placeholder:text-slate-400 placeholder:font-normal"
                              />
                              <input
                                type="text"
                                placeholder={doc.key === "car_individual" ? "Nome do Imóvel Rural (Ex: Fazenda Santa Maria)" : "Nome do PA / Assentamento (Ex: PA Nova Fronteira)"}
                                value={doc.key === "car_individual" ? carIndividualName : carColetivoName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (doc.key === "car_individual") setCarIndividualName(val);
                                  else setCarColetivoName(val);
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground placeholder:text-slate-400 placeholder:font-normal"
                              />
                            </div>
                          )}

                           {doc.key === "cadastro_atividade_plano" && (
                             <div className="w-full space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                               <p className="text-rose-600 text-xs font-black text-center tracking-wide leading-snug mb-1">
                                 ATENÇÃO: Digite a Atividade Cadastrada no Plano de Negócios para liberar o envio do arquivo PDF!
                               </p>
                               <input
                                 type="text"
                                 placeholder="Ex: CRIAÇÃO DE BOVINOS CORTE EXTENSIVA"
                                 value={atividadePlano}
                                 onChange={(e) => setAtividadePlano(e.target.value)}
                                 className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background placeholder:text-slate-400 placeholder:font-normal"
                               />
                             </div>
                           )}

                          {/* Only enable upload if number is filled for CAR docs, activity is filled for cadastro_atividade_plano, or if it is not a special doc */}
                          {((doc.key === "car_individual" && carIndividualNumber.trim().length >= 10 && carIndividualName.trim().length >= 3) ||
                            (doc.key === "car_coletivo" && carColetivoNumber.trim().length >= 10 && carColetivoName.trim().length >= 3) ||
                            (doc.key === "cadastro_atividade_plano" && atividadePlano.trim().length >= 3) ||
                            (doc.key !== "car_individual" && doc.key !== "car_coletivo" && doc.key !== "cadastro_atividade_plano")) ? (
                              <label className="flex flex-col items-center justify-center cursor-pointer w-full">
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
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mb-3">
                                      <FileCheck className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                                    </p>
                                    <p className="text-indigo-600 text-[10px] truncate max-w-full px-2">
                                      {selected.name}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleFileSelect(doc.key, null);
                                      }}
                                      className="mt-2 text-[10px] text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Remover
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all duration-300">
                                      {isRejected ? (
                                        <XCircle className="h-5 w-5 text-rose-500" />
                                      ) : (
                                        <Upload className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                      )}
                                    </div>
                                    <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                                    </p>
                                    {isRejected ? (
                                      <p className="text-rose-600 text-[10px] text-center px-2 truncate max-w-full font-semibold">
                                        Reprovado: {dbFile.rejection_reason || "Reenviar"}
                                      </p>
                                    ) : (
                                      <p className="text-slate-400 text-[10px]">
                                        Clique, arraste ou cole (Ctrl+V)
                                      </p>
                                    )}
                                  </>
                                )}
                              </label>
                          ) : (
                            <div className="flex flex-col items-center justify-center cursor-not-allowed w-full">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 opacity-40"><Upload className="h-5 w-5 text-slate-300" />
                              </div>
                              <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                              </p>
                              <p className="text-slate-400 text-[9px] opacity-40">Envio Habilitado após preencher o número
                              </p>
                            </div>
                          )}

                          {/* Link de obtenção do documento */}
                          {doc.obtencaoUrl && !selected && (
                            <a
                              href={doc.obtencaoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3 flex items-center justify-center gap-1.5 w-full min-h-[40px] px-3 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 text-[11px] font-bold hover:bg-cyan-100 active:scale-95 transition-all duration-200 touch-manipulation select-none"
                            >
                              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                              Obter{doc.fonte ? ` — ${doc.fonte}` : " Documento"}
                            </a>
                          )}
                          {!selected && DISPENSABLE_DOCS.includes(doc.key) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (tokenData) {
                                    // Validação para os CARs: ao menos um deve ser enviado!
                                    if (doc.key === "car_individual" || doc.key === "car_coletivo") {
                                      const otherKey = doc.key === "car_individual" ? "car_coletivo" : "car_individual";
                                      const otherFile = files.find(f => f.document_type === otherKey);
                                      if (otherFile?.file_path === "dispensado") {
                                        toast({
                                          title: "Operação não permitida ⚠️",
                                          description: "Você não pode dispensar ambos os CARs. É necessário fornecer ao menos um (CAR Individual ou CAR Coletivo)!",
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                    }
                                    const ok = await dispenseDocument(tokenData.id, tokenData.stock_proposal_id, doc.key, true);
                                    if (ok) {
                                      const refreshedFiles = await getFilesForToken(tokenData.id);
                                      setFiles(refreshedFiles);
                                    }
                                  }
                              }}
                              className="mt-3 text-[9px] md:text-[10px] text-center text-amber-700 font-extrabold bg-amber-50 border border-amber-200 hover:bg-amber-100 px-3 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 w-full whitespace-normal leading-snug"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                              {getDispenseButtonLabel(doc.key)}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            };

            const ruralPropertyKeys = ["car_individual", "car_coletivo", "espelho_beneficiario"];
            const ruralPropertyDocs = DOCUMENTATION_REQUIRED.filter((d) => ruralPropertyKeys.includes(d.key));

            const identificationKeys = [
              "rg",
              "rg_esposa",
              "rg_procurador",
              "ficha_cadastro_cliente",
              "ficha_cadastro_esposa",
              "declaracoes_unificadas",
              "procuracao",
              "certidao_casamento",
              "certidao_obito"
            ];
            const identificationDocs = identificationKeys
              .map((key) => DOCUMENTATION_REQUIRED.find((d) => d.key === key))
              .filter((d): d is typeof DOCUMENTATION_REQUIRED[0] => d !== undefined);

            const enquadramentoKeys = [
              "caf_extrato",
              "carta_consulta"
            ];
            const enquadramentoDocs = DOCUMENTATION_REQUIRED
              .filter((d) => enquadramentoKeys.includes(d.key))
              .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

            const certidoesCivisKeys = [
              "certidao_improbidade",
              "certidao_embargo_ambiental",
              "declaracao_assistencia_tecnica"
            ];
            const certidoesCivisDocs = DOCUMENTATION_REQUIRED
              .filter((d) => certidoesCivisKeys.includes(d.key))
              .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

            const mainDocs = DOCUMENTATION_REQUIRED
              .filter((d) => d.group !== "ambiental" && !ruralPropertyKeys.includes(d.key) && !identificationKeys.includes(d.key) && !enquadramentoKeys.includes(d.key) && !certidoesCivisKeys.includes(d.key))
              .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
            const ambientalDocs = DOCUMENTATION_REQUIRED
              .filter((d) => d.group === "ambiental" && !ruralPropertyKeys.includes(d.key) && !identificationKeys.includes(d.key) && !enquadramentoKeys.includes(d.key) && !certidoesCivisKeys.includes(d.key))
              .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

            const totalInversoes = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
            const estimatedValue = tokenData?.stock_proposals?.estimated_value || 0;

            return (
              <>
                {/* DOCUMENTOS DE IDENTIFICAÇÃO grid */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
                      <span className="text-amber-600 text-base">🆔</span>
                      <p className="text-amber-700 text-xs font-black uppercase tracking-widest">
                        DOCUMENTOS DE IDENTIFICAÇÃO
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-amber-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {identificationDocs.map(renderCard)}
                  </div>
                </div>

                {/* IDENTIFICAÇÃO IMÓVEL RURAL grid */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm">
                      <span className="text-indigo-600 text-base">🏡</span>
                      <p className="text-indigo-700 text-xs font-black uppercase tracking-widest">
                        IDENTIFICAÇÃO IMÓVEL RURAL
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-indigo-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ruralPropertyDocs.map(renderCard)}
                  </div>
                </div>

                {/* DOCUMENTAÇÃO ENQUADRAMENTO AGRICULTURA FAMILIAR grid */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-teal-50 border border-teal-200 shadow-sm">
                      <span className="text-teal-600 text-base">🚜</span>
                      <p className="text-teal-700 text-xs font-black uppercase tracking-widest">
                        DOCUMENTAÇÃO ENQUADRAMENTO AGRICULTURA FAMILIAR
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-teal-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enquadramentoDocs.map(renderCard)}
                  </div>
                </div>

                {/* CERTIDÕES CIVIS E ADMINISTRATIVAS grid */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 shadow-sm">
                      <span className="text-blue-600 text-base">📜</span>
                      <p className="text-blue-700 text-xs font-black uppercase tracking-widest">
                        CERTIDÕES CIVIS E ADMINISTRATIVAS
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-blue-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certidoesCivisDocs.map(renderCard)}
                  </div>
                </div>

                {/* Main documents grid */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-slate-600 text-base">📄</span>
                      <p className="text-slate-700 text-xs font-black uppercase tracking-widest">
                        DOCUMENTAÇÃO DO PLANO DE INVESTIMENTO PROPOSTO
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mainDocs.map(renderCard)}
                  </div>
                </div>

                {/* INVERSÕES DO PLANO */}
                <div className="mb-8 p-6 rounded-3xl border border-slate-200 bg-slate-50/50 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm w-fit">
                      <span className="text-indigo-600 text-base">📊</span>
                      <p className="text-indigo-700 text-xs font-black uppercase tracking-widest">
                        INVERSÕES DO PLANO
                      </p>
                    </div>
                    {/* Validador de Valor da Proposta */}
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                      Math.abs(totalInversoes - estimatedValue) < 0.01 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      {Math.abs(totalInversoes - estimatedValue) < 0.01 ? (
                        <span>✅ Inversões validadas! Soma bate 100% com o valor proposto: {formatCurrency(estimatedValue)}</span>
                      ) : (
                        <span>⚠️ Soma divergente: {formatCurrency(totalInversoes)} (Proposta: {formatCurrency(estimatedValue)})</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 font-semibold">
                    Informe detalhadamente os itens de investimento que compõem o plano de negócio da operação. A soma total deve ser exatamente igual ao valor proposto da operação.
                  </p>

                  <div className="space-y-3">
                    {inversoes.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                        {/* Quantidade */}
                        <div className="col-span-3 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Qtd.</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quant}
                            onChange={(e) => {
                              const updated = [...inversoes];
                              updated[idx].quant = Math.max(1, parseInt(e.target.value) || 1);
                              setInversoes(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground"
                          />
                        </div>

                        {/* Nome / Descrição */}
                        <div className="col-span-5 md:col-span-6">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Item / Inversão</label>
                          <input
                            type="text"
                            placeholder="Ex: Aquisição de Bovinos de Leite"
                            value={item.nome}
                            onChange={(e) => {
                              const updated = [...inversoes];
                              updated[idx].nome = e.target.value;
                              setInversoes(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground"
                          />
                        </div>

                        {/* Valor Total */}
                        <div className="col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Valor Total (R$)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                            <input
                              type="text"
                              placeholder="0,00"
                              value={formatInputMoney(item.valor)}
                              onChange={(e) => handleMoneyChange(idx, e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground"
                            />
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="col-span-1 flex justify-center pt-5">
                          <button
                            type="button"
                            onClick={() => {
                              if (inversoes.length > 1) {
                                setInversoes(inversoes.filter((_, i) => i !== idx));
                              } else {
                                setInversoes([{ quant: 1, nome: "", valor: 0 }]);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setInversoes([...inversoes, { quant: 1, nome: "", valor: 0 }])}
                    className="mt-4 px-4 py-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto bg-background"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Item
                  </button>
                </div>

                {/* ── Declarações Ambientais section ────────────────── */}
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                      <span className="text-emerald-600 text-base">🌿</span>
                      <p className="text-emerald-700 text-xs font-black uppercase tracking-widest">
                        Declarações Ambientais
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-emerald-200" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ambientalDocs.map(renderCard)}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Submit button — only shown when there are docs to upload */}
          {(missingOrRejectedCount > 0 || selectedCount > 0) && (
            <div className="flex flex-col items-center gap-3 pt-4 pb-4">
              {selectedCount < missingOrRejectedCount && missingOrRejectedCount > 0 && (
                <p className="text-amber-800 text-xs font-bold tracking-wide animate-pulse bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mb-1 shadow-sm">
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
                <p className="text-slate-400 text-xs font-medium">
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
  return null;
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

  const valueFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(proposal.estimated_value) || 0);

  const infoFields = [
    { label: "Produtor", value: proposal.producer_name },
    { label: "CPF", value: formatCPF(proposal.producer_cpf) },
    { label: "Município", value: proposal.municipio || "—" },
    { label: "Programa", value: proposal.credit_program || "—" },
    { label: "Valor da Proposta", value: valueFormatted },
  ];

  return (
    <Card
      className={`bg-white border border-slate-200 rounded-3xl shadow-md overflow-hidden ${className}`}
    >
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
      <CardContent className="p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
          Dados da Proposta
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {infoFields.map((field) => (
            <div key={field.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                {field.label}
              </p>
              <p className="text-slate-800 text-sm font-semibold truncate">
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
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Super Gestão © {new Date().getFullYear()} — Todos os direitos reservados
      </p>
    </div>
  );
}


