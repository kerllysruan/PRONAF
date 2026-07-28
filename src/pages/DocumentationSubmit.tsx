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

const CAR_REGEX = /^[A-Z]{2}-\d{7}-[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}\.[A-F0-9]{4}$/;

function formatCAR(val: string): string {
  const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  let formatted = "";
  
  if (clean.length > 0) {
    const ufPart = clean.substring(0, Math.min(2, clean.length)).replace(/[^A-Z]/g, "");
    formatted += ufPart;
  }
  if (clean.length > 2) {
    const munPart = clean.substring(2, Math.min(9, clean.length)).replace(/[^0-9]/g, "");
    if (munPart.length > 0) {
      formatted += "-" + munPart;
    }
  }
  if (clean.length > 9) {
    const hashPart = clean.substring(9, Math.min(41, clean.length)).replace(/[^A-F0-9]/g, "");
    if (hashPart.length > 0) {
      formatted += "-";
      const chunks: string[] = [];
      for (let i = 0; i < hashPart.length; i += 4) {
        chunks.push(hashPart.substring(i, Math.min(i + 4, hashPart.length)));
      }
      formatted += chunks.join(".");
    }
  }
  return formatted.substring(0, 50);
}

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
  const [inversoes, setInversoes] = useState<{ quant: number; nome: string; valor: number; unid?: string }[]>([
    { quant: 1, nome: "", valor: 0, unid: "UNID" }
  ]);
  const [custoAssessoria, setCustoAssessoria] = useState<number>(0);

  const totalInversoes = useMemo(() => {
    const sumItems = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    return sumItems + custoAssessoria;
  }, [inversoes, custoAssessoria]);

  const estimatedValue = tokenData?.stock_proposals?.estimated_value || 0;
  const isInversõesValidadas = Math.abs(totalInversoes - estimatedValue) < 0.01;

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
        const savedAtividade = data.stock_proposals.credit_purpose;
        setAtividadePlano(savedAtividade);
        if (savedAtividade.trim().length >= 3) {
          setSelectedFiles((prev) => ({
            ...prev,
            cadastro_atividade_plano: new File(["Habilitado"], "atividade_plano.pdf", { type: "application/pdf" })
          }));
        }
      }
      if (data.stock_proposals?.inversoes) {
        const inv = data.stock_proposals.inversoes;
        if (Array.isArray(inv)) {
          setInversoes(inv as any);
          setCustoAssessoria(0);
        } else if (inv && typeof inv === "object") {
          const obj = inv as any;
          if (Array.isArray(obj.items)) {
            setInversoes(obj.items);
          }
          if (typeof obj.custoAssessoria === "number") {
            setCustoAssessoria(obj.custoAssessoria);
          }
        }
      }

      setPageLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Derived state ─────────────────────────────────────────────
  const totalDocs = DOCUMENTATION_REQUIRED.length + 1; // +1 for inversões

  const dbFilesMap = useMemo(() => {
    const map = new Map<string, DocumentationFile>();
    
    // Group files by type
    const grouped = new Map<string, DocumentationFile[]>();
    files.forEach((f) => {
      const list = grouped.get(f.document_type) || [];
      list.push(f);
      grouped.set(f.document_type, list);
    });

    grouped.forEach((fileList, docType) => {
      const sorted = [...fileList].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      map.set(docType, sorted[0]);
    });

    const result: Record<string, DocumentationFile> = {};
    map.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [files]);

  // Helper: is this file a re-enabled (previously dispensed) record?
  // file_path='habilitado' means "reset — needs upload" (UPDATE instead of DELETE for RLS safety)
  function isReenabledFile(f: DocumentationFile | undefined) {
    return f?.file_path === "habilitado";
  }

  // ── Per-key progress calculation (prevents double counting) ──
  // For each required doc key, determine its "effective status":
  //   - "ready"    = in selectedFiles (new upload chosen) OR in DB as aprovado/pendente/preenchido/dispensado (not re-enabled)
  //   - "rejected" = in DB as reprovado AND no new file selected
  //   - "missing"  = not in DB and not selected

  const perDocStatus = useMemo(() => {
    const result: Record<string, "ready" | "rejected" | "missing"> = {};
    for (const doc of DOCUMENTATION_REQUIRED) {
      const dbFile = dbFilesMap[doc.key];
      const hasNewSelection = doc.key in selectedFiles;

      if (hasNewSelection) {
        // User selected a new file (or virtual placeholder for atividade) — counts as ready
        result[doc.key] = "ready";
      } else if (dbFile && !isReenabledFile(dbFile)) {
        if (dbFile.status === "reprovado") {
          result[doc.key] = "rejected";
        } else {
          // aprovado, pendente, dispensado, preenchido
          result[doc.key] = "ready";
        }
      } else {
        result[doc.key] = "missing";
      }
    }
    return result;
  }, [dbFilesMap, selectedFiles]);

  const readyCount = useMemo(() => {
    let count = Object.values(perDocStatus).filter(s => s === "ready").length;
    count += isInversõesValidadas ? 1 : 0;
    return count;
  }, [perDocStatus, isInversõesValidadas]);

  const selectedCount = Object.keys(selectedFiles).length;

  const missingOrRejectedCount = useMemo(() => {
    const docsCount = Object.values(perDocStatus).filter(s => s !== "ready").length;
    return docsCount + (isInversõesValidadas ? 0 : 1);
  }, [perDocStatus, isInversõesValidadas]);

  // How many NEW file selections are for docs that actually need uploading
  // (not already ready in DB)
  const newSelectionsForMissing = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(selectedFiles)) {
      const dbFile = dbFilesMap[key];
      // Only count if this doc was missing or rejected (i.e., genuinely needs this selection)
      if (!dbFile || isReenabledFile(dbFile) || dbFile.status === "reprovado") {
        count++;
      }
    }
    return count;
  }, [selectedFiles, dbFilesMap]);

  const approvedOrPendingCount = useMemo(() => {
    const docsCount = files.filter((f) => {
      if (isReenabledFile(f)) return false;
      return f.status === "aprovado" || f.status === "pendente";
    }).length;
    return docsCount + (isInversõesValidadas ? 1 : 0);
  }, [files, isInversõesValidadas]);

  const progressPercent = Math.round(
    (readyCount / totalDocs) * 100
  );

  const allApproved = useMemo(() => {
    const docsApproved = DOCUMENTATION_REQUIRED.every((doc) => {
      const f = dbFilesMap[doc.key];
      return f?.status === "aprovado" && f.file_path !== "habilitado";
    });
    return docsApproved && isInversõesValidadas;
  }, [dbFilesMap, isInversõesValidadas]);

  const hasMissingFiles = useMemo(() => {
    const docsMissing = DOCUMENTATION_REQUIRED.some((doc) => {
      const f = dbFilesMap[doc.key];
      return !f || isReenabledFile(f);
    });
    return docsMissing || !isInversõesValidadas;
  }, [dbFilesMap, isInversõesValidadas]);

  const hasRejections = useMemo(() => {
    return files.some((f) => f.status === "reprovado" && !isReenabledFile(f));
  }, [files]);

  const isAwaitingAnalysis = useMemo(() => {
    return !!(tokenData?.documents_submitted && !hasRejections && !hasMissingFiles && !allApproved);
  }, [tokenData, hasRejections, hasMissingFiles, allApproved]);

  const hasDispensedDocs = useMemo(() => {
    return files.some((f) => f.file_path === "dispensado");
  }, [files]);

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

  function handleAtividadeChange(val: string) {
    setAtividadePlano(val);
    if (val.trim().length >= 3) {
      setSelectedFiles((prev) => ({
        ...prev,
        cadastro_atividade_plano: new File(["Habilitado"], "atividade_plano.pdf", { type: "application/pdf" })
      }));
    } else {
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next.cadastro_atividade_plano;
        return next;
      });
    }
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
    const totalInversoes = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) + custoAssessoria;
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

      updateData["inversoes"] = { items: inversoes, custoAssessoria: custoAssessoria };

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
    const totalInversoes = inversoes.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) + custoAssessoria;
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

      updateData["inversoes"] = { items: inversoes, custoAssessoria: custoAssessoria };

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
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl" />
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
                  {readyCount}/{totalDocs}
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
              // When rejected + new file selected: we're in "replacing" mode
              const isReplacingRejected = isRejected && !!selected;

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
                      : isReplacingRejected
                      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/5"
                      : isRejected
                      ? "border-rose-400 bg-rose-50/80 shadow-sm shadow-rose-200"
                      : selected
                      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/5"
                      : "border-dashed border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/10"
                  }`}
                  onDragOver={(!isApproved && !isPending) ? (e) => e.preventDefault() : undefined}
                  onDrop={(!isApproved && !isPending) ? (e) => handleDrop(doc.key, e) : undefined}
                  onMouseEnter={(!isApproved && !isPending) ? () => setHoveredDocKey(doc.key) : undefined}
                  onMouseLeave={(!isApproved && !isPending) ? () => setHoveredDocKey(null) : undefined}
                >
                  {/* ── Rejection Banner (always shown when rejected) ─── */}
                  {isRejected && (
                    <div className={`px-4 py-2.5 flex items-start gap-2.5 ${
                      isReplacingRejected
                        ? "bg-indigo-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {isReplacingRejected ? (
                          <FileCheck className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider leading-tight">
                          {isReplacingRejected ? "✅ Novo arquivo selecionado — pronto para enviar" : "❌ DOCUMENTO REPROVADO — Reenvio necessário"}
                        </p>
                        {dbFile?.rejection_reason && !isReplacingRejected && (
                          <p className="text-[10px] mt-0.5 opacity-90 leading-snug">
                            <span className="font-bold">Motivo:</span> {dbFile.rejection_reason}
                          </p>
                        )}
                        {isReplacingRejected && (
                          <p className="text-[10px] mt-0.5 opacity-90 leading-snug truncate">
                            Substituindo: <span className="font-semibold">{dbFile?.file_name || "arquivo anterior"}</span>
                          </p>
                        )}
                      </div>
                      {isReplacingRejected && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFileSelect(doc.key, null); }}
                          className="flex-shrink-0 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          title="Cancelar seleção"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  {/* ── Rejection Reason (shown below banner when rejected+selecting) ─── */}
                  {isReplacingRejected && dbFile?.rejection_reason && (
                    <div className="px-4 py-2 bg-rose-50 border-b border-rose-200">
                      <p className="text-[10px] text-rose-700 leading-snug">
                        <span className="font-bold">Motivo da reprovação:</span> {dbFile.rejection_reason}
                      </p>
                    </div>
                  )}
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
                          {(!tokenData?.documents_submitted) && dbFile?.file_path !== "dispensado" && dbFile?.file_path !== "preenchido" && (
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
                              className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 text-[10px] font-bold active:scale-95 transition-all duration-200 disabled:opacity-50"
                            >
                              {enablingDoc === doc.key ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Removendo...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3 w-3" />
                                  Habilitar Reenvio / Remover
                                </>
                              )}
                            </button>
                          )}
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
                                  const val = formatCAR(e.target.value);
                                  if (doc.key === "car_individual") setCarIndividualNumber(val);
                                  else setCarColetivoNumber(val);
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground placeholder:text-slate-400 placeholder:font-normal uppercase"
                              />
                              <input
                                type="text"
                                placeholder={doc.key === "car_individual" ? "Nome do Imóvel Rural (Ex: Fazenda Santa Maria)" : "Nome do PA / Assentamento (Ex: PA Nova Fronteira)"}
                                value={doc.key === "car_individual" ? carIndividualName : carColetivoName}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  if (doc.key === "car_individual") setCarIndividualName(val);
                                  else setCarColetivoName(val);
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground placeholder:text-slate-400 placeholder:font-normal uppercase"
                              />
                            </div>
                          )}

                          {doc.key === "cadastro_atividade_plano" && (
                              <div className="w-full space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
                                <p className="text-slate-600 text-xs font-black text-center tracking-wide leading-snug mb-1">
                                  Informe detalhadamente a Atividade Cadastrada no Plano de Negócios da operação.
                                </p>
                                <input
                                  type="text"
                                  placeholder="Ex: CRIAÇÃO DE BOVINOS CORTE EXTENSIVA"
                                  value={atividadePlano}
                                  onChange={(e) => handleAtividadeChange(e.target.value.toUpperCase())}
                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background placeholder:text-slate-400 placeholder:font-normal uppercase"
                                />
                              </div>
                           )}

                          {/* Atividade card: somente preenchimento, sem envio de arquivo */}
                          {doc.key === "cadastro_atividade_plano" ? (
                            <div className="w-full text-center py-3">
                              {atividadePlano.trim().length >= 3 ? (
                                <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                                  ✅ Atividade preenchida com sucesso!
                                </p>
                              ) : (
                                <p className="text-xs font-bold text-rose-500">
                                  ⚠️ Preencha a atividade acima para continuar.
                                </p>
                              )}
                            </div>
                          ) : (
                          /* Upload de arquivo normal para os outros cards */
                          ((doc.key === "car_individual" && CAR_REGEX.test(carIndividualNumber) && carIndividualName.trim().length >= 3) ||
                            (doc.key === "car_coletivo" && CAR_REGEX.test(carColetivoNumber) && carColetivoName.trim().length >= 3) ||
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
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mb-2">
                                      <FileCheck className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                                    </p>
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-1.5 text-center max-w-full">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400 mb-0.5">Novo arquivo</p>
                                      <p className="text-indigo-700 text-[10px] font-bold truncate max-w-full">
                                        {selected.name}
                                      </p>
                                      <p className="text-[9px] text-indigo-400 mt-0.5">
                                        {(selected.size / 1024).toFixed(0)} KB
                                      </p>
                                    </div>
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
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                                      isRejected
                                        ? "bg-rose-100 border border-rose-300"
                                        : "bg-slate-100 border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-200"
                                    }`}>
                                      {isRejected ? (
                                        <XCircle className="h-5 w-5 text-rose-600" />
                                      ) : (
                                        <Upload className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                      )}
                                    </div>
                                    <p className="text-slate-800 text-xs font-black text-center leading-snug mb-1">{doc.label.toUpperCase()}
                                    </p>
                                    {isRejected ? (
                                      <>
                                        {dbFile?.file_name && dbFile.file_name !== "Pendente de envio" && (
                                          <div className="bg-rose-100 border border-rose-200 rounded-lg px-2 py-1 text-center mb-1">
                                            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Arquivo reprovado</p>
                                            <p className="text-rose-700 text-[10px] font-semibold truncate">{dbFile.file_name}</p>
                                          </div>
                                        )}
                                        <p className="text-rose-500 text-[10px] text-center font-bold">
                                          👆 Clique para enviar novo arquivo
                                        </p>
                                      </>
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
                          ))}

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

            const ruralPropertyKeys = ["car_individual", "car_coletivo", "espelho_beneficiario", "titulo_dominio"];
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

                  <p className="text-xs text-slate-500 mb-4 font-semibold leading-relaxed">
                    Informe detalhadamente os itens de investimento que compõem o plano de negócio da operação. O total, a quantidade e a nomenclatura dos itens devem ser exatamente iguais ao proposto no plano assinado e eletrônico!
                  </p>

                  <div className="space-y-3">
                    {inversoes.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                        {/* Quantidade */}
                        <div className="col-span-2 md:col-span-1">
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
                            className="w-full px-1 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground text-center"
                          />
                        </div>

                        {/* Unidade */}
                        <div className="col-span-3 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Unid.</label>
                          <select
                            value={item.unid || "UNID"}
                            onChange={(e) => {
                              const updated = [...inversoes];
                              updated[idx].unid = e.target.value;
                              setInversoes(updated);
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground cursor-pointer h-[32px]"
                          >
                            <option value="UNID">UNID</option>
                            <option value="CX">CX</option>
                            <option value="SC">SC</option>
                            <option value="T">T</option>
                            <option value="HECT">HECT</option>
                          </select>
                        </div>

                        {/* Nome / Descrição */}
                        <div className="col-span-3 md:col-span-5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 block mb-1">Item / Inversão</label>
                          <input
                            type="text"
                            placeholder="Ex: Aquisição de Bovinos de Leite"
                            value={item.nome}
                            onChange={(e) => {
                              const updated = [...inversoes];
                              updated[idx].nome = e.target.value.toUpperCase();
                              setInversoes(updated);
                            }}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground uppercase"
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
                    onClick={() => setInversoes([...inversoes, { quant: 1, nome: "", valor: 0, unid: "UNID" }])}
                    className="mt-4 px-4 py-2 border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 w-full md:w-auto bg-background"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Item
                  </button>

                  {/* Custo Assessoria Empresarial e Técnica com o mesmo layout dos itens */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Custos de Assessoria da Operação
                    </p>
                    <div className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                      {/* Nome / Descrição (Fixo) */}
                      <div className="col-span-8 md:col-span-8">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Item / Inversão</label>
                        <input
                          type="text"
                          value="CUSTO ASSESSORIA EMPRESARIAL E TÉCNICA"
                          disabled
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 font-bold cursor-not-allowed focus:outline-none"
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
                            value={formatInputMoney(custoAssessoria)}
                            onChange={(e) => {
                              const cleanValue = e.target.value.replace(/\D/g, "");
                              if (!cleanValue) {
                                setCustoAssessoria(0);
                                return;
                              }
                              setCustoAssessoria(parseFloat(cleanValue) / 100);
                            }}
                            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-background text-foreground"
                          />
                        </div>
                      </div>
                      {/* Coluna de Ações vazia apenas para manter o alinhamento de 12 colunas */}
                      <div className="col-span-1" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-semibold leading-relaxed">
                      Informe o valor do custo da assessoria empresarial e técnica que compõem o plano de negócio da operação. O valor deve ser exatamente igual ao valor contido no plano assinado e eletrônico!
                    </p>
                  </div>
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

          {/* Submit button — only shown when there are docs to upload or inversions to validate */}
          {(() => {
            // Count how many docs are NOT ready (missing or rejected) excluding inversões
            const docsNotReady = Object.values(perDocStatus).filter(s => s !== "ready").length;
            const needsUploads = docsNotReady > 0;
            const showButton = needsUploads || selectedCount > 0 || !isInversõesValidadas;

            if (!showButton) return null;

            // Count how many missing/rejected docs DON'T have a new selection yet
            const docsStillNeeded = Object.entries(perDocStatus)
              .filter(([key, status]) => status !== "ready" && !(key in selectedFiles))
              .length;

            // Count rejected docs that still need replacement
            const rejectedStillNeeded = Object.entries(perDocStatus)
              .filter(([key, status]) => status === "rejected" && !(key in selectedFiles))
              .length;

            return (
              <div className="flex flex-col items-center gap-3 pt-4 pb-4">
                {/* Alert for rejected docs still needing replacement */}
                {rejectedStillNeeded > 0 && (
                  <div className="w-full max-w-lg bg-rose-50 border border-rose-300 rounded-2xl p-4 mb-1">
                    <p className="text-rose-800 text-xs font-bold tracking-wide mb-2">
                      ❌ {rejectedStillNeeded} documento{rejectedStillNeeded > 1 ? "s" : ""} reprovado{rejectedStillNeeded > 1 ? "s" : ""} aguardando substituição:
                    </p>
                    <div className="space-y-1">
                      {Object.entries(perDocStatus)
                        .filter(([key, status]) => status === "rejected" && !(key in selectedFiles))
                        .map(([key]) => {
                          const docDef = DOCUMENTATION_REQUIRED.find(d => d.key === key);
                          const dbFile = dbFilesMap[key];
                          return (
                            <div key={key} className="flex items-start gap-2 bg-white rounded-xl px-3 py-2 border border-rose-200">
                              <XCircle className="h-3 w-3 text-rose-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-rose-700 truncate">{docDef?.label || key}</p>
                                {dbFile?.rejection_reason && (
                                  <p className="text-[9px] text-rose-500">{dbFile.rejection_reason}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                {docsStillNeeded > 0 && docsStillNeeded !== rejectedStillNeeded && (
                  <p className="text-amber-800 text-xs font-bold tracking-wide bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mb-1 shadow-sm">
                    ⚠️ {docsStillNeeded - rejectedStillNeeded} documento{(docsStillNeeded - rejectedStillNeeded) > 1 ? "s" : ""} faltante{(docsStillNeeded - rejectedStillNeeded) > 1 ? "s" : ""} ainda precisam ser selecionados.
                  </p>
                )}
                {!isInversõesValidadas && (
                  <p className="text-rose-800 text-xs font-bold tracking-wide bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl mb-1 shadow-sm">
                    ⚠️ A soma das inversões ({formatCurrency(totalInversoes)}) não é igual ao valor proposto da operação ({formatCurrency(estimatedValue)}). Ajuste os valores no grid para habilitar o envio.
                  </p>
                )}
                {/* Summary of rejected docs being replaced */}
                {hasRejections && selectedCount > 0 && (
                  <div className="w-full max-w-lg bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                      📋 Resumo do Reenvio ({selectedCount} arquivo{selectedCount > 1 ? "s" : ""})
                    </p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedFiles).map(([key, file]) => {
                        const docDef = DOCUMENTATION_REQUIRED.find(d => d.key === key);
                        const dbFileEntry = dbFilesMap[key];
                        const wasRejected = dbFileEntry?.status === "reprovado";
                        if (!docDef) return null;
                        return (
                          <div key={key} className="flex items-start gap-2 bg-white rounded-xl px-3 py-2 border border-indigo-100">
                            <FileCheck className="h-3.5 w-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{docDef.label}</p>
                              {wasRejected && (
                                <p className="text-[9px] text-rose-500 font-semibold">↻ Substituindo arquivo reprovado</p>
                              )}
                              <p className="text-[9px] text-indigo-500 truncate">{file.name}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Button
                  onClick={hasRejections ? handleResubmit : handleSubmit}
                  disabled={
                    docsStillNeeded > 0 ||
                    (selectedCount === 0 && docsNotReady > 0) ||
                    isSubmitting || 
                    !isInversõesValidadas
                  }
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
                      {hasRejections ? "Reenviar Documentos Reprovados" : "Enviar Documentação"}
                      {selectedCount > 0 && (
                        <Badge className="ml-2 bg-white/20 text-white border-0 rounded-full text-xs">
                          {selectedCount}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
                {selectedCount === 0 && docsNotReady > 0 && (
                  <p className="text-slate-400 text-xs font-medium">
                    Selecione os documentos necessários para continuar
                  </p>
                )}
              </div>
            );
          })()}
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


