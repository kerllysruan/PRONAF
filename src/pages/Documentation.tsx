import { useState, useCallback, useMemo, useEffect } from "react";
import { useDocumentationReview, SubmittedProposal, AuthorizedProposal, parseSafeDate } from "@/hooks/useDocumentationReview";
import { useAgency } from "@/contexts/AgencyContext";
import {
  getDocLabel,
  DOC_STATUS_COLORS,
  DOC_STATUS_LABELS,
  DOCUMENTATION_REQUIRED,
  DocFileStatus,
  AGENCY_DOCUMENTATION,
} from "@/types/documentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  FileCheck,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Archive,
  ArrowLeft,
  ClipboardList,
  ClipboardCheck,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  FileText,
  RefreshCw,
  Undo2,
  Link2,
  Send,
  Clock,
  FileBarChart,
  Building,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export default function Documentation() {
  const {
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
    refetch,
  } = useDocumentationReview();

  const { toast } = useToast();
  const { selectedAgencyId, agencies } = useAgency();

  const pendingTasksCount = useMemo(() => {
    const pendingSubmissions = submissions.filter(
      (s) => s.proposal.status !== "ENVIADO PARA CENTRAL"
    ).length;
    const pendingAuthorized = authorizedProposals.length;
    return pendingSubmissions + pendingAuthorized;
  }, [submissions, authorizedProposals]);

  const allConcluded = pendingTasksCount === 0;

  const currentAgencyName = useMemo(() => {
    if (selectedAgencyId === "all") return "Todas as Agências";
    return agencies.find((a) => a.id === selectedAgencyId)?.name || "Agência";
  }, [selectedAgencyId, agencies]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmittedProposal | null>(null);
  const is699Selected = useMemo(() => {
    if (!selectedSubmission) return false;
    const progStr = (selectedSubmission.proposal.credit_program || "").toUpperCase();
    const linhaStr = (selectedSubmission.proposal.linha_credito || "").toUpperCase();
    const value = Number(selectedSubmission.proposal.estimated_value) || 0;
    
    if (progStr.includes("PRONAF A") || progStr.includes("PRONAF GRUPO A") || 
        linhaStr.includes("PRONAF A") || linhaStr.includes("PRONAF GRUPO A")) {
      return value <= 50000;
    }
    
    return progStr.includes("699") || linhaStr.includes("699");
  }, [selectedSubmission]);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfName, setViewingPdfName] = useState("");
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingFileId, setRejectingFileId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [inversoesRejectDialogOpen, setInversoesRejectDialogOpen] = useState(false);
  const [inversoesRejectReason, setInversoesRejectReason] = useState("");
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [rejectingCurrentInversoes, setRejectingCurrentInversoes] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportFilterProjetista, setReportFilterProjetista] = useState("all");
  const [reportFilterPrograma, setReportFilterPrograma] = useState("all");
  const [pageFilterProjetista, setPageFilterProjetista] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Manager Opinion State
  const [parecerDialogOpen, setParecerDialogOpen] = useState(false);
  const [parecerTexto, setParecerTexto] = useState("");
  const [parecerAnalista, setParecerAnalista] = useState("");
  const [parecerResultado, setParecerResultado] = useState("Aprovado");
  const [parecerCaf, setParecerCaf] = useState("");
  const [parecerNomeImovel, setParecerNomeImovel] = useState("");
  const [parecerMunicipioImovel, setParecerMunicipioImovel] = useState("");
  const [parecerNomePA, setParecerNomePA] = useState("");
  const [parecerCarColetivo, setParecerCarColetivo] = useState("");
  const [parecerMunicipioPA, setParecerMunicipioPA] = useState("");
  const [parecerAtividadePlano, setParecerAtividadePlano] = useState("");
  const [parecerCarenciaMeses, setParecerCarenciaMeses] = useState("");
  const [parecerTotalMeses, setParecerTotalMeses] = useState("");
  const [parecerGerenteGeral, setParecerGerenteGeral] = useState("");
  const [parecerGerenteRelacionamento, setParecerGerenteRelacionamento] = useState("");
  const [parecerInversoes, setParecerInversoes] = useState<{ quant: number; unid: string; nome: string; valor: number }[]>([
    { quant: 1, unid: "UNID", nome: "", valor: 0 }
  ]);
  const [parecerNumProjetoPA, setParecerNumProjetoPA] = useState("");
  const [parecerCarIndividual, setParecerCarIndividual] = useState("");
  const [parecerAgenciaHistorico, setParecerAgenciaHistorico] = useState("");
  const [parecerUtilizaCarIndividual, setParecerUtilizaCarIndividual] = useState("SIM");
  const [parecerGeneroProponente, setParecerGeneroProponente] = useState("MASCULINO");

  // Keep selectedSubmission in sync when submissions array updates (after approve/reject)
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.token.id === selectedSubmission.token.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions]);

  // Load opinion draft from localStorage to prevent loss during tab switching
  useEffect(() => {
    if (!selectedSubmission) return;
    const key = `parecer_draft_${selectedSubmission.proposal.id}`;

    const saved = localStorage.getItem(key);

    // 1. First parse proposal data to have clean default fallbacks
    let propInversoes: { quant: number; unid: string; nome: string; valor: number }[] = [
      { quant: 1, unid: "UNID", nome: "", valor: 0 }
    ];
    const invData = selectedSubmission.proposal.inversoes;
    if (invData) {
      if (Array.isArray(invData)) {
        propInversoes = invData.map((item: any) => ({
          quant: Number(item.quant) || 1,
          unid: (item.unid || "UNID").toUpperCase(),
          nome: (item.nome || "").toUpperCase(),
          valor: Number(item.valor) || 0
        }));
      } else if (typeof invData === "object") {
        const obj = invData as any;
        const items = Array.isArray(obj.items) ? obj.items : [];
        const custo = typeof obj.custoAssessoria === "number" ? obj.custoAssessoria : 0;
        const itemsList = items.map((item: any) => ({
          quant: Number(item.quant) || 1,
          unid: (item.unid || "UNID").toUpperCase(),
          nome: (item.nome || "").toUpperCase(),
          valor: Number(item.valor) || 0
        }));
        if (custo > 0) {
          itemsList.push({
            quant: 1,
            unid: "UNID",
            nome: "CUSTO ASSESSORIA EMPRESARIAL E TÉCNICA",
            valor: custo
          });
        }
        if (itemsList.length > 0) {
          propInversoes = itemsList;
        }
      }
    }

    const propAtividade = (selectedSubmission.proposal.credit_purpose || "").toUpperCase();
    const propNomeImovel = (selectedSubmission.proposal.localizacao || "").toUpperCase();
    const propMunicipioImovel = (selectedSubmission.proposal.municipio || "").toUpperCase();

    const carIndFile = selectedSubmission.files.find(f => f.document_type === "car_individual");
    const propCarIndividual = carIndFile && carIndFile.ged_id ? carIndFile.ged_id : "";

    const carColFile = selectedSubmission.files.find(f => f.document_type === "car_coletivo");
    const propCarColetivo = carColFile && carColFile.ged_id ? carColFile.ged_id : "";

    // 2. Load draft if exists, but dynamically override empty fields with fresh proposal data
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        
        // If activity name is empty in draft, fall back to proposal's activity
        if (draft.atividadePlano && draft.atividadePlano.trim() !== "") {
          setParecerAtividadePlano(draft.atividadePlano);
        } else {
          setParecerAtividadePlano(propAtividade);
        }

        if (draft.nomeImovel !== undefined) setParecerNomeImovel(draft.nomeImovel);
        else setParecerNomeImovel(propNomeImovel);

        if (draft.municipioImovel !== undefined) setParecerMunicipioImovel(draft.municipioImovel);
        else setParecerMunicipioImovel(propMunicipioImovel);

        if (draft.carIndividual !== undefined) setParecerCarIndividual(draft.carIndividual);
        else setParecerCarIndividual(propCarIndividual);

        if (draft.carColetivo !== undefined) setParecerCarColetivo(draft.carColetivo);
        else setParecerCarColetivo(propCarColetivo);

        if (draft.numProjetoPA !== undefined) setParecerNumProjetoPA(draft.numProjetoPA);
        if (draft.nomePA !== undefined) setParecerNomePA(draft.nomePA);
        if (draft.municipioPA !== undefined) setParecerMunicipioPA(draft.municipioPA);
        if (draft.carenciaMeses !== undefined) setParecerCarenciaMeses(draft.carenciaMeses);
        if (draft.totalMeses !== undefined) setParecerTotalMeses(draft.totalMeses);
        if (draft.agenciaHistorico !== undefined) setParecerAgenciaHistorico(draft.agenciaHistorico);
        if (draft.utilizaCarIndividual !== undefined) setParecerUtilizaCarIndividual(draft.utilizaCarIndividual);
        if (draft.generoProponente !== undefined) setParecerGeneroProponente(draft.generoProponente);

        if (draft.inversoes && draft.inversoes.length > 0) {
          // Parse dynamic structure to ensure backwards compatibility with string arrays
          const parsedInvs = draft.inversoes.map((item: any) => {
            if (typeof item === "string") {
              const cleanInv = item.replace(/^\s*•\s*/, "").replace(/^\s*-\s*/, "").trim();
              const matchWithUnid = cleanInv.match(/^(\d+)\s+([A-Z]{1,5})\s*[xX]\s*(.*?)\s*\((.*?)\)$/i);
              if (matchWithUnid) {
                const valStr = matchWithUnid[4].replace(/[R$\s.]/g, "").replace(",", ".");
                return {
                  quant: parseInt(matchWithUnid[1]) || 1,
                  unid: matchWithUnid[2].toUpperCase(),
                  nome: matchWithUnid[3].trim().toUpperCase(),
                  valor: parseFloat(valStr) || 0
                };
              }
              const matchNoUnid = cleanInv.match(/^(\d+)\s*[xX]\s*(.*?)\s*\((.*?)\)$/i);
              if (matchNoUnid) {
                const valStr = matchNoUnid[3].replace(/[R$\s.]/g, "").replace(",", ".");
                return {
                  quant: parseInt(matchNoUnid[1]) || 1,
                  unid: "UNID",
                  nome: matchNoUnid[2].trim().toUpperCase(),
                  valor: parseFloat(valStr) || 0
                };
              }
              const matchNoQty = cleanInv.match(/^(.*?)\s*\((.*?)\)$/);
              if (matchNoQty) {
                const valStr = matchNoQty[2].replace(/[R$\s.]/g, "").replace(",", ".");
                return {
                  quant: 1,
                  unid: "UNID",
                  nome: matchNoQty[1].trim().toUpperCase(),
                  valor: parseFloat(valStr) || 0
                };
              }
              return { quant: 1, unid: "UNID", nome: cleanInv.toUpperCase(), valor: 0 };
            }
            return item;
          });
          setParecerInversoes(parsedInvs);
        } else {
          setParecerInversoes(propInversoes);
        }
      } catch (e) {
        console.error("Error parsing draft from localStorage", e);
      }
    } else {
      // 3. Fallback: Auto-populate completely from proposal data
      setParecerAtividadePlano(propAtividade);
      setParecerNomeImovel(propNomeImovel);
      setParecerMunicipioImovel(propMunicipioImovel);
      setParecerCarIndividual(propCarIndividual);
      setParecerCarColetivo(propCarColetivo);
      setParecerInversoes(propInversoes);
    }
  }, [selectedSubmission]);

  // Save opinion draft to localStorage in real-time
  useEffect(() => {
    if (!selectedSubmission || !parecerDialogOpen) return;
    const key = `parecer_draft_${selectedSubmission.proposal.id}`;

    const draft = {
      atividadePlano: parecerAtividadePlano,
      nomeImovel: parecerNomeImovel,
      municipioImovel: parecerMunicipioImovel,
      carIndividual: parecerCarIndividual,
      numProjetoPA: parecerNumProjetoPA,
      nomePA: parecerNomePA,
      carColetivo: parecerCarColetivo,
      municipioPA: parecerMunicipioPA,
      carenciaMeses: parecerCarenciaMeses,
      totalMeses: parecerTotalMeses,
      agenciaHistorico: parecerAgenciaHistorico,
      utilizaCarIndividual: parecerUtilizaCarIndividual,
      generoProponente: parecerGeneroProponente,
      inversoes: parecerInversoes,
    };

    localStorage.setItem(key, JSON.stringify(draft));
  }, [
    selectedSubmission,
    parecerDialogOpen,
    parecerAtividadePlano,
    parecerNomeImovel,
    parecerMunicipioImovel,
    parecerCarIndividual,
    parecerNumProjetoPA,
    parecerNomePA,
    parecerCarColetivo,
    parecerMunicipioPA,
    parecerCarenciaMeses,
    parecerTotalMeses,
    parecerAgenciaHistorico,
    parecerUtilizaCarIndividual,
    parecerGeneroProponente,
    parecerInversoes,
  ]);

  const generatedParecerText = useMemo(() => {
    if (!selectedSubmission) return "";
    const sub = selectedSubmission;
    const nome = sub.proposal.producer_name || "";
    const cpf = sub.proposal.producer_cpf || "";
    const is699 = is699Selected;
    const programAcao = is699 ? "AMPLIAÇÃO" : "IMPLANTAÇÃO";
    const atividade = parecerAtividadePlano || "";
    const carIndFile = sub.files.find(f => f.document_type === "car_individual");
    const carColFile = sub.files.find(f => f.document_type === "car_coletivo");
    const isCarIndDispensed = carIndFile?.file_path === "dispensado";
    const isCarColDispensed = carColFile?.file_path === "dispensado";

    const imovel = isCarIndDispensed ? "" : (parecerNomeImovel || "");
    const carIndividual = isCarIndDispensed ? "" : (parecerCarIndividual || "");
    const numPA = isCarColDispensed ? "" : (parecerNumProjetoPA || "");
    const nomePA = isCarColDispensed ? "" : (parecerNomePA || "");
    const carColetivo = isCarColDispensed ? "" : (parecerCarColetivo || "");
    const dataHoje = new Date().toLocaleDateString("pt-BR");

    const g = parecerGeneroProponente === "FEMININO"
      ? {
          artigo: "a",
          proponente: "proponente",
          agricultor: "agricultora",
          enquadrado: "enquadrada",
          produtor: "miniprodutora"
        }
      : {
          artigo: "o",
          proponente: "proponente",
          agricultor: "agricultor",
          enquadrado: "enquadrado",
          produtor: "miniprodutor"
        };
    
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
    };
    const invLines = parecerInversoes
      .filter((item) => (item.nome || "").trim().length > 0)
      .map((item) => {
        const q = item.quant || 1;
        const u = (item.unid || "UNID").toUpperCase();
        const n = (item.nome || "").trim().toUpperCase();
        const v = item.valor || 0;
        if (n === "CUSTO ASSESSORIA EMPRESARIAL E TÉCNICA") {
          return `  • CUSTO ASSESSORIA EMPRESARIAL E TÉCNICA (${formatCurrency(v)})`;
        }
        return `  • ${q} ${u} x ${n} (${formatCurrency(v)})`;
      })
      .join("\n");
    const inversoesStr = invLines ? `${invLines}` : "";
    
    const rawValue = Number(sub.proposal.estimated_value) || 0;
    const valorTotal = rawValue > 0
      ? rawValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "R$ 0,00";
      
    const codPrograma = is699 ? "699" : "368";
    const complemento699 = codPrograma === "699"
      ? `, visto que o cliente tem histórico de operação PRONAF A realizada na agência ${parecerAgenciaHistorico || "—"}`
      : "";
    const programa = is699 ? "PRONAF A (699)" : (sub.proposal.credit_program || "PRONAF Grupo A");
    const linha = is699 ? "PRONAF A 699" : (sub.proposal.linha_credito || "");
    let linhaFinanciamento = "";
    if (!linha) {
      linhaFinanciamento = programa;
    } else if (linha.toLowerCase().includes(programa.toLowerCase())) {
      linhaFinanciamento = linha;
    } else {
      if (/^\d+$/.test(linha.trim())) {
        linhaFinanciamento = `${programa} ${linha.trim()}`;
      } else {
        linhaFinanciamento = `${programa} - ${linha}`;
      }
    }
      
    let carencia = parecerCarenciaMeses || "36 MESES";
    if (/^\d+$/.test(carencia.trim())) {
      carencia = `${carencia.trim()} MESES`;
    }
    let prazoTotal = parecerTotalMeses || "120 MESES";
    if (/^\d+$/.test(prazoTotal.trim())) {
      prazoTotal = `${prazoTotal.trim()} MESES`;
    }

    const cleanImovel = (parecerNomeImovel || "").split("|")[0].trim().toUpperCase();
    let cleanNomePA = (parecerNomePA || "").trim().toUpperCase();
    if (!cleanNomePA && (sub.proposal.localizacao || "").includes("|")) {
      cleanNomePA = (sub.proposal.localizacao || "").split("|")[1].trim().toUpperCase();
    }
    let paPrefix = "PROJETO DE ASSENTAMENTO ";
    if (cleanNomePA.startsWith("PROJETO DE ASSENTAMENTO") || cleanNomePA.startsWith("PROJETO ASSENTAMENTO") || cleanNomePA.startsWith("PA ")) {
      paPrefix = "";
    }

    let localStr = "";
    if (isCarColDispensed) {
      localStr = `${cleanImovel} | COM REGISTRO NO CAR: ${carIndividual.toUpperCase()}`;
    } else if (isCarIndDispensed) {
      localStr = `${paPrefix}${numPA ? numPA.toUpperCase() + ' ' : ''}${cleanNomePA} | COM REGISTRO NO CAR: ${carColetivo.toUpperCase()}`;
    } else {
      localStr = `${cleanImovel} | COM REGISTRO NO CAR: ${carIndividual.toUpperCase()}, INSERIDO NO ${paPrefix}${numPA ? numPA.toUpperCase() + ' ' : ''}${cleanNomePA} |   COM REGISTRO NO CAR: ${carColetivo.toUpperCase()}`;
    }

    const invLocalStr = isCarColDispensed
      ? "NO IMÓVEL ACIMA IDENTIFICADO"
      : `NO ${paPrefix}${numPA ? numPA.toUpperCase() + ' ' : ''}${cleanNomePA} COM REGISTRO NO CAR: ${carColetivo.toUpperCase()}`;

    return `Trata-se de proposta de crédito rural apresentad${g.artigo.toLowerCase()} por ${nome.toUpperCase()}, CPF ${cpf}, ${g.agricultor} familiar ${g.enquadrado} no ${sub.proposal.credit_program || "PRONAF Grupo A"}, ${g.produtor}, para ${programAcao} da atividade de ${atividade.toUpperCase()}, a ser desenvolvida no IMOVÉL RURAL:
${localStr}
Possuindo aptidão agropecuária e infraestrutura compatível com a atividade financiada.

No que se refere à relação entre ${g.artigo.toLowerCase() === "o" ? "o proponente" : "a proponente"} e funcionário do Banco, informa-se que não há vínculo de parentesco com funcionário que atue na análise, deliberação ou decisão da presente operação de crédito.

O relacionamento negocial d${g.artigo} proponente com a instituição financeira apresenta-se condizente com o porte da operação, considerando os critérios de rentabilidade projetada, reciprocidade e aderência às diretrizes do programa ${sub.proposal.credit_program || "PRONAF A"}. Quanto às restrições cadastrais, não foram identificadas restrições impeditivas ao crédito, conforme consultas realizadas aos sistemas internos do Banco e à Central de Risco de Crédito – SCR/BACEN na data ${dataHoje}. O histórico do cliente demonstra situação regular, não havendo registros de atrasos relevantes ou inadimplência em operações de crédito rural.

O financiamento proposto contempla investimento fixo EM:
${inversoesStr}

totalizando investimento no valor de ${valorTotal}.
A operação será financiada com recursos do FNE/${linhaFinanciamento}${complemento699}.

Em relação aos recursos próprios, não haverá contrapartida financeira por parte d${g.artigo} proponente, sendo o investimento integralmente financiado. Não se aplica à presente operação a utilização de imóveis de terceiros beneficiados com o crédito, visto que todas as inversões ocorrerão no imóvel acima identificado.

A operação não contempla aquisição de veículo, inexistindo necessidade de justificativa de uso por, no mínimo, 120 dias ao ano.

QUANTO AO PRAZO, A OPERAÇÃO ESTRUTURA-SE DA SEGUINTE FORMA:
CARÊNCIA: ${carencia.toUpperCase()}
PRAZO TOTAL: ${prazoTotal.toUpperCase()}

A análise econômico-financeira evidencia capacidade de pagamento compatível com o cronograma do financiamento, com crescimento projetado das receitas provenientes da atividade pecuária e percentuais de comprometimento dentro dos limites aceitáveis. Diante do exposto, conclui-se que a operação encontra-se devidamente instruída, atende integralmente às exigências da IN 3102-03-09 e demais normativos vigentes, apresenta viabilidade técnica, econômica e financeira, manifestando-se esta Unidade de Relacionamento favoravelmente ao prosseguimento da proposta de crédito. Alçada de Decisão: Comag, na forma do MB-OC-1101-12-03.`;
  }, [
    selectedSubmission,
    parecerAtividadePlano,
    parecerNomeImovel,
    parecerCarIndividual,
    parecerNumProjetoPA,
    parecerNomePA,
    parecerCarColetivo,
    parecerInversoes,
    parecerAgenciaHistorico,
    parecerCarenciaMeses,
    parecerTotalMeses,
    is699Selected,
    parecerUtilizaCarIndividual,
    parecerGeneroProponente,
  ]);

  // ─── Stats (Reactivity to pageFilterProjetista) ───────────────
  const filteredSubmissionsForStats = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    if (pageFilterProjetista === "all") return submissions;
    return submissions.filter(
      (s) => normalizeName(s.proposal.projetista) === pageFilterProjetista.toUpperCase()
    );
  }, [submissions, pageFilterProjetista]);

  const filteredAuthorizedForStats = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    if (pageFilterProjetista === "all") return authorizedProposals;
    return authorizedProposals.filter(
      (p) => normalizeName(p.projetista) === pageFilterProjetista.toUpperCase()
    );
  }, [authorizedProposals, pageFilterProjetista]);

  const totalSubmissions = filteredSubmissionsForStats.length;
  const fullyApproved = filteredSubmissionsForStats.filter(
    (s) => s.totalFiles > 0 && s.approvedCount === s.totalFiles
  ).length;
  const withPending = filteredSubmissionsForStats.filter((s) => s.pendingCount > 0).length;
  const withRejections = filteredSubmissionsForStats.filter((s) => s.rejectedCount > 0).length;

  // ─── Filtered list ────────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    let result = submissions;
    if (pageFilterProjetista !== "all") {
      result = result.filter(
        (s) => normalizeName(s.proposal.projetista) === pageFilterProjetista.toUpperCase()
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((s) => {
        const allOk = s.totalFiles > 0 && s.approvedCount === s.totalFiles;
        const hasRejects = s.rejectedCount > 0;
        const isEnviado = s.proposal.status === "ENVIADO PARA CENTRAL";

        if (filterStatus === "aguardando") {
          return !isEnviado && (!allOk || hasRejects);
        }
        if (filterStatus === "apto") {
          return !isEnviado && allOk && !hasRejects;
        }
        if (filterStatus === "enviado") {
          return isEnviado;
        }
        return true;
      });
    }

    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (s) =>
        s.proposal.producer_name.toLowerCase().includes(term) ||
        (s.proposal.producer_cpf && s.proposal.producer_cpf.includes(term))
    );
  }, [submissions, searchTerm, pageFilterProjetista, filterStatus]);

  // ─── Filtered authorized proposals ────────────────────────────
  const filteredAuthorized = useMemo(() => {
    const normalizeName = (name: string | null | undefined) => {
      if (!name) return "";
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };

    let result = authorizedProposals;
    if (pageFilterProjetista !== "all") {
      result = result.filter(
        (p) => normalizeName(p.projetista) === pageFilterProjetista.toUpperCase()
      );
    }
    if (!searchTerm.trim()) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(
      (p) =>
        p.producer_name.toLowerCase().includes(term) ||
        (p.producer_cpf && p.producer_cpf.includes(term))
    );
  }, [authorizedProposals, searchTerm, pageFilterProjetista]);

  // ─── Report data: merge both lists ─────────────────────────────
  const allProjetistas = useMemo(() => {
    const set = new Set<string>();
    const normalizeName = (name: string) => {
      const trimmed = name.trim().toUpperCase();
      if (trimmed === "NEY MEDEIRO" || trimmed === "NEY MEDEIROS") return "NEY MEDEIROS";
      return trimmed;
    };
    submissions.forEach((s) => {
      if (s.proposal.projetista) set.add(normalizeName(s.proposal.projetista));
    });
    authorizedProposals.forEach((p) => {
      if (p.projetista) set.add(normalizeName(p.projetista));
    });
    return Array.from(set).sort();
  }, [submissions, authorizedProposals]);

  const allProgramas = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => { if (s.proposal.credit_program) set.add(s.proposal.credit_program); });
    authorizedProposals.forEach((p) => { if (p.credit_program) set.add(p.credit_program); });
    return Array.from(set).sort();
  }, [submissions, authorizedProposals]);

  // ─── Generate PDF Report ───────────────────────────────────────
  const generateReport = useCallback(() => {
    const formatCurrency = (v: number) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Build unified data
    type ReportItem = {
      producer_name: string;
      producer_cpf: string | null;
      projetista: string | null;
      credit_program: string | null;
      municipio: string | null;
      estimated_value: number | null;
      status_docs: string;
      link: string | null;
    };

    const normalizeProjetista = (name: string | null) => {
      if (!name) return null;
      const upper = name.trim().toUpperCase();
      if (upper === "NEY MEDEIRO" || upper === "NEY MEDEIROS") return "NEY MEDEIROS";
      return upper;
    };

    const items: ReportItem[] = [
      ...submissions.map((s) => ({
        producer_name: s.proposal.producer_name,
        producer_cpf: s.proposal.producer_cpf,
        projetista: normalizeProjetista(s.proposal.projetista),
        credit_program: s.proposal.credit_program,
        municipio: s.proposal.municipio,
        estimated_value: s.proposal.estimated_value,
        status_docs: s.approvedCount === s.totalFiles
          ? "APROVADA"
          : s.rejectedCount > 0
          ? "REPROVADA"
          : "PENDENTE",
        link: `${window.location.origin}/enviar-documentacao?token=${s.token.token}`,
      })),
      ...authorizedProposals.map((p) => ({
        producer_name: p.producer_name,
        producer_cpf: p.producer_cpf,
        projetista: normalizeProjetista(p.projetista),
        credit_program: p.credit_program,
        municipio: p.municipio,
        estimated_value: p.estimated_value,
        status_docs: "AGUARDANDO ENVIO DOCUMENTAÇÃO",
        link: p.token
          ? `${window.location.origin}/enviar-documentacao?token=${p.token}`
          : null,
      })),
    ];

    // Apply filters
    let filtered = items;
    if (reportFilterProjetista !== "all") {
      filtered = filtered.filter((i) => i.projetista === reportFilterProjetista);
    }
    if (reportFilterPrograma !== "all") {
      filtered = filtered.filter((i) => i.credit_program === reportFilterPrograma);
    }

    if (filtered.length === 0) {
      toast({ title: "Nenhuma proposta encontrada", description: "Ajuste os filtros e tente novamente.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const now = new Date();
    const timestamp = now.toLocaleString("pt-BR");

    // ═══════════════════════════════════════════════════
    // PÁGINA 1 — DASHBOARD KPI
    // ═══════════════════════════════════════════════════

    // Background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, "F");

    // Header — gradient-style with accent stripe
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 32, pageW, 6, "F");
    // Accent stripe
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 38, pageW, 1.5, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 39.5, pageW, 1.5, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("RELATÓRIO DE DOCUMENTAÇÃO", 15, 16);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Gerado em ${timestamp}`, 15, 23);

    // Filter badges in header
    doc.setFontSize(7);
    const drawBadge = (x: number, label: string, val: string) => {
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(x, 8, 58, 20, 3, 3, "F");
      // Border
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, 8, 58, 20, 3, 3, "S");
      doc.setLineWidth(0.2);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.text(label, x + 5, 15);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const truncVal = val.length > 22 ? val.substring(0, 20) + "..." : val;
      doc.text(truncVal, x + 5, 23);
      doc.setFont("helvetica", "normal");
    };
    drawBadge(pageW - 135, "PROJETISTA", reportFilterProjetista === "all" ? "TODOS" : reportFilterProjetista.toUpperCase());
    drawBadge(pageW - 72, "PROGRAMA", reportFilterPrograma === "all" ? "TODOS" : reportFilterPrograma.toUpperCase());

    // ── KPI Calculations ──────────────────────────────────
    const totalItems = filtered.length;
    const totalValue = filtered.reduce((acc, i) => acc + (Number(i.estimated_value) || 0), 0);
    const avgValue = totalItems > 0 ? totalValue / totalItems : 0;
    const countAprovada = filtered.filter((i) => i.status_docs === "APROVADA").length;
    const countReprovada = filtered.filter((i) => i.status_docs === "REPROVADA").length;
    const countAguardando = filtered.filter((i) => i.status_docs === "AGUARDANDO ENVIO DOCUMENTAÇÃO").length;
    const countPendente = filtered.filter((i) => i.status_docs === "PENDENTE").length;
    const pctAprovada = totalItems > 0 ? Math.round((countAprovada / totalItems) * 100) : 0;

    // ── ROW 1: Summary KPI Cards (3 large) ──────────────
    const kpiY = 48;
    const kpiW = 88;
    const kpiH = 26;
    const kpiGap = 5;
    const startX = 15;

    const drawBigKPI = (x: number, title: string, value: string, sub: string, color: [number, number, number]) => {
      // Card shadow
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(x + 0.5, kpiY + 0.5, kpiW, kpiH, 3, 3, "F");
      // Card background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "F");
      // Color accent left bar
      doc.setFillColor(...color);
      doc.roundedRect(x, kpiY, 3.5, kpiH, 3, 0, "F");
      doc.rect(x + 2, kpiY, 1.5, kpiH, "F");
      // Title
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 9, kpiY + 8);
      // Value
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(15);
      doc.text(value, x + 9, kpiY + 17);
      // Subtitle
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(sub, x + 9, kpiY + 22);
    };

    drawBigKPI(startX, "Total de Propostas", `${totalItems}`, "propostas no relatório", [79, 70, 229]);
    drawBigKPI(startX + kpiW + kpiGap, "Volume Total Estimado", formatCurrency(totalValue), "valor total bruto", [16, 185, 129]);
    drawBigKPI(startX + (kpiW + kpiGap) * 2, "Ticket Médio", formatCurrency(avgValue), "valor médio por proposta", [245, 158, 11]);

    // ── ROW 2: Status KPI Cards (4 cards with big numbers) ──
    const statusY = kpiY + kpiH + 5;
    const sKpiW = 65;
    const sKpiH = 28;
    const sKpiGap = 5;
    const sStartX = 15;

    const drawStatusKPI = (x: number, title: string, count: number, pct: number, color: [number, number, number]) => {
      // Card shadow
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(x + 0.5, statusY + 0.5, sKpiW, sKpiH, 3, 3, "F");
      // Card background
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, statusY, sKpiW, sKpiH, 3, 3, "F");
      // Top color accent line
      doc.setFillColor(...color);
      doc.roundedRect(x, statusY, sKpiW, 3, 3, 0, "F");
      // Title
      doc.setTextColor(...color);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 5, statusY + 10);
      // Big number
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.text(`${count}`, x + 5, statusY + 21);
      // Percentage
      doc.setTextColor(...color);
      doc.setFontSize(9);
      doc.text(`${pct}%`, x + sKpiW - 5, statusY + 21, { align: "right" });
      // Label
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("propostas", x + 5, statusY + 25);
    };

    const pctReprovada = totalItems > 0 ? Math.round((countReprovada / totalItems) * 100) : 0;
    const pctPendente = totalItems > 0 ? Math.round((countPendente / totalItems) * 100) : 0;
    const pctAguardando = totalItems > 0 ? Math.round((countAguardando / totalItems) * 100) : 0;

    drawStatusKPI(sStartX, "Aprovadas", countAprovada, pctAprovada, [16, 185, 129]);
    drawStatusKPI(sStartX + sKpiW + sKpiGap, "Pendentes", countPendente, pctPendente, [99, 102, 241]);
    drawStatusKPI(sStartX + (sKpiW + sKpiGap) * 2, "Reprovadas", countReprovada, pctReprovada, [239, 68, 68]);
    drawStatusKPI(sStartX + (sKpiW + sKpiGap) * 3, "Aguardando Envio", countAguardando, pctAguardando, [245, 158, 11]);

    // ── STATUS DISTRIBUTION (Large Horizontal Bars) ──────
    const mainY = statusY + sKpiH + 10;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUIÇÃO POR STATUS", 15, mainY);

    const statusData = [
      { label: "APROVADA", count: countAprovada, color: [16, 185, 129] as [number, number, number] },
      { label: "PENDENTE", count: countPendente, color: [99, 102, 241] as [number, number, number] },
      { label: "REPROVADA", count: countReprovada, color: [239, 68, 68] as [number, number, number] },
      { label: "AGUARDANDO ENVIO DOC.", count: countAguardando, color: [245, 158, 11] as [number, number, number] },
    ].filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

    const barX = 15;
    const barW = 115;
    const barH = 10;
    const barGap = 5;
    const maxC = Math.max(...statusData.map((s) => s.count), 1);

    statusData.forEach((s, i) => {
      const y = mainY + 8 + i * (barH + barGap);
      const fillW = Math.max((s.count / maxC) * barW, 15);
      // Background bar
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, y, barW, barH, 2.5, 2.5, "F");
      // Filled bar
      doc.setFillColor(...s.color);
      doc.roundedRect(barX, y, fillW, barH, 2.5, 2.5, "F");
      // Label above
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.text(s.label, barX + 2, y - 1.5);
      // Count + pct - render in dark slate/black to be clearly visible
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      // Render text to the right of the bar if it is short, otherwise offset inside but in black
      const textX = fillW > 35 ? barX + 4 : barX + fillW + 4;
      doc.text(`${s.count}  (${Math.round((s.count / totalItems) * 100)}%)`, textX, y + barH / 2 + 2.5);
    });

    // ── DONUT CHART (Approval Rate) ──────────────────────
    const midX = 155;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TAXA DE APROVAÇÃO", midX, mainY);

    const centerX = midX + 35;
    const centerY = mainY + 30;
    doc.setLineWidth(14);
    doc.setDrawColor(241, 245, 249);
    doc.circle(centerX, centerY, 20, "S");
    doc.setDrawColor(16, 185, 129);
    doc.circle(centerX, centerY, 20, "S");
    if (countReprovada > 0) {
      doc.setLineWidth(1);
    }
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${pctAprovada}%`, centerX, centerY + 3, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("APROVAÇÃO", centerX, centerY + 10, { align: "center" });

    // Legend with big numbers
    const legendY = mainY + 58;
    const drawLegend = (y: number, label: string, count: number, color: [number, number, number]) => {
      doc.setFillColor(...color);
      doc.roundedRect(midX + 2, y - 2, 4, 4, 1, 1, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${count}`, midX + 10, y + 1.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(label, midX + 20, y + 1.5);
    };
    drawLegend(legendY, "Aprovadas", countAprovada, [16, 185, 129]);
    drawLegend(legendY + 8, "Pendentes", countPendente, [99, 102, 241]);
    drawLegend(legendY + 16, "Reprovadas", countReprovada, [239, 68, 68]);
    drawLegend(legendY + 24, "Aguardando Envio Doc.", countAguardando, [245, 158, 11]);

    // ── RANKING POR MUNICÍPIO ─────────────────────
    const rightX = 210;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOP MUNICÍPIOS", rightX, mainY);

    const munRanking = [...new Set(filtered.map((i) => i.municipio).filter(Boolean))]
      .map((m) => ({
        name: m!,
        count: filtered.filter((i) => i.municipio === m).length,
        val: filtered.filter((i) => i.municipio === m).reduce((a, b) => a + (Number(b.estimated_value) || 0), 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    autoTable(doc, {
      startY: mainY + 5,
      head: [["#", "MUNICÍPIO", "QTD", "VOLUME R$"]],
      body: munRanking.map((m, i) => [i + 1, m.name, m.count, formatCurrency(m.val)]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], fontSize: 7, halign: "center" },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { halign: "center", cellWidth: 8 }, 2: { halign: "center" }, 3: { halign: "right", fontStyle: "bold" } },
      margin: { left: rightX, right: 15 },
      pageBreak: "avoid" as any,
    });

    // ═══════════════════════════════════════════════════
    // PÁGINA 2 — DETALHAMENTO COM BOTÕES DE LINK
    // ═══════════════════════════════════════════════════
    doc.addPage();
    // Subtle background
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageW, pageH, "F");
    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 14, pageW, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHAMENTO DAS PROPOSTAS — DOCUMENTAÇÃO", 15, 9);

    const tableData = filtered.map((item, idx) => [
      idx + 1,
      item.producer_name.toUpperCase(),
      item.producer_cpf || "---",
      item.projetista?.toUpperCase() || "N/A",
      item.municipio || "---",
      "", // Deixamos em branco para desenhar o badge customizado no didDrawCell
      formatCurrency(Number(item.estimated_value) || 0),
      item.link ? "" : "—",
    ]);

    autoTable(doc, {
      startY: 18,
      head: [["#", "PRODUTOR", "CPF", "PROJETISTA", "MUNICÍPIO", "STATUS DOCUMENTAÇÃO", "VALOR R$", "AÇÃO"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7, halign: "center", fontStyle: "bold" },
      styles: { fontSize: 6.5, cellPadding: 2.5, valign: "middle", lineColor: [226, 232, 240], lineWidth: 0.3 },
      columnStyles: {
        0: { halign: "center", cellWidth: 7 },
        1: { fontStyle: "bold", cellWidth: 46 },
        5: { halign: "center", cellWidth: 38 },
        6: { halign: "right", fontStyle: "bold" },
        7: { halign: "center", cellWidth: 30 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didDrawCell: (data: any) => {
        // Desenhar badge visual na coluna STATUS DOCUMENTAÇÃO (index 5)
        if (data.section === "body" && data.column.index === 5) {
          const item = filtered[data.row.index];
          const status = item?.status_docs || "";
          
          const badgeW = 32;
          const badgeH = 5.2;
          const badgeX = data.cell.x + (data.cell.width - badgeW) / 2;
          const badgeY = data.cell.y + (data.cell.height - badgeH) / 2;

          let bgColor = [241, 245, 249]; // Slate 100
          let textColor = [71, 85, 105]; // Slate 600

          if (status === "APROVADA") {
            bgColor = [220, 252, 231]; // Emerald 100
            textColor = [21, 128, 61];  // Emerald 700
          } else if (status === "REPROVADA") {
            bgColor = [254, 226, 226]; // Red 100
            textColor = [185, 28, 28];  // Red 700
          } else if (status === "PENDENTE") {
            bgColor = [254, 243, 199]; // Amber 100
            textColor = [180, 83, 9];   // Amber 700
          }

          // Salvar cor anterior do doc
          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, "F");

          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFontSize(4.8);
          doc.setFont("helvetica", "bold");
          doc.text(status, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1.6, { align: "center" });
        }

        // Draw a visible button in the AÇÃO column
        if (data.section === "body" && data.column.index === 7) {
          const item = filtered[data.row.index];
          if (item?.link) {
            const btnW = 28;
            const btnH = 6;
            const btnX = data.cell.x + (data.cell.width - btnW) / 2;
            const btnY = data.cell.y + (data.cell.height - btnH) / 2;

            // Draw button background
            doc.setFillColor(79, 70, 229);
            doc.roundedRect(btnX, btnY, btnW, btnH, 1.5, 1.5, "F");

            // Draw button text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(4.8);
            doc.setFont("helvetica", "bold");
            doc.text("ENVIAR DOCUMENTAÇÃO", btnX + btnW / 2, btnY + btnH / 2 + 1.6, { align: "center" });

            // Make it clickable
            doc.link(btnX, btnY, btnW, btnH, { url: item.link });
          }
        }
      },
    });


    // FOOTER (All Pages)
    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gerado em ${timestamp}  |  PRONAF Digital  |  Página ${i} de ${pages}`,
        pageW / 2,
        pageH - 5,
        { align: "center" }
      );
    }

    const projetistaName = reportFilterProjetista === "all" ? "GERAL" : reportFilterProjetista.replace(/\s+/g, "_").toUpperCase();
    doc.save(`Relatorio_Documentacao_${projetistaName}_${now.toISOString().slice(0, 10).replace(/-/g, "")}.pdf`);
    setReportDialogOpen(false);
    toast({ title: "Relatório gerado com sucesso! 📊", description: "O PDF foi baixado." });
  }, [submissions, authorizedProposals, reportFilterProjetista, reportFilterPrograma, toast]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleViewPdf = useCallback(
    async (filePath: string, fileName: string) => {
      setPdfLoading(true);
      setViewingPdfName(fileName);
      try {
        const url = await getFileUrl(filePath);
        if (url) {
          setViewingPdfUrl(url);
          setIsPdfDialogOpen(true);
        }
      } finally {
        setPdfLoading(false);
      }
    },
    [getFileUrl]
  );

  const handleClosePdfDialog = useCallback(() => {
    setIsPdfDialogOpen(false);
    setViewingPdfUrl(null);
    setViewingPdfName("");
  }, []);

  const handleOpenRejectDialog = useCallback((fileId: string) => {
    setRejectingFileId(fileId);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingFileId || !selectedSubmission) return;
    await rejectDocument(rejectingFileId, rejectReason, selectedSubmission.token.id);
    setRejectDialogOpen(false);
    setRejectingFileId(null);
    setRejectReason("");
  }, [rejectingFileId, rejectReason, selectedSubmission, rejectDocument]);

  const handleApproveProposal = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveProposal(selectedSubmission.token.id, selectedSubmission.proposal.id);
  }, [selectedSubmission, approveProposal]);

  const handleSendToCentral = useCallback(async () => {
    if (!selectedSubmission) return;
    await sendToCentral(selectedSubmission.proposal.id);
  }, [selectedSubmission, sendToCentral]);

  const handleApproveAllDocs = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveAllDocuments(selectedSubmission.token.id);
  }, [selectedSubmission, approveAllDocuments]);

  const handleConfirmBulkReject = useCallback(async () => {
    if (!selectedSubmission) return;
    await rejectAllDocuments(selectedSubmission.token.id, bulkRejectReason);
    setBulkRejectDialogOpen(false);
    setBulkRejectReason("");
  }, [selectedSubmission, bulkRejectReason, rejectAllDocuments]);

  const handleApproveInversoes = useCallback(async (proposalId: string, currentInversoes: any) => {
    const items = Array.isArray(currentInversoes) ? currentInversoes : (currentInversoes?.items || []);
    const custoAssessoria = typeof currentInversoes?.custoAssessoria === "number" ? currentInversoes.custoAssessoria : 0;
    
    const newInversoes = {
      items,
      custoAssessoria,
      status: "aprovado",
      rejection_reason: null
    };

    setSelectedSubmission((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        proposal: {
          ...prev.proposal,
          inversoes: newInversoes
        }
      };
    });

    await approveInversoes(proposalId, currentInversoes);
  }, [approveInversoes]);

  const handleOpenInversoesRejectDialog = useCallback((proposalId: string, currentInversoes: any) => {
    setRejectingProposalId(proposalId);
    setRejectingCurrentInversoes(currentInversoes);
    setInversoesRejectReason("");
    setInversoesRejectDialogOpen(true);
  }, []);

  const handleConfirmRejectInversoes = useCallback(async () => {
    if (!rejectingProposalId) return;
    const currentInversoes = rejectingCurrentInversoes;
    const items = Array.isArray(currentInversoes) ? currentInversoes : (currentInversoes?.items || []);
    const custoAssessoria = typeof currentInversoes?.custoAssessoria === "number" ? currentInversoes.custoAssessoria : 0;
    
    const newInversoes = {
      items,
      custoAssessoria,
      status: "reprovado",
      rejection_reason: inversoesRejectReason
    };

    setSelectedSubmission((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        proposal: {
          ...prev.proposal,
          inversoes: newInversoes
        }
      };
    });

    setInversoesRejectDialogOpen(false);
    await rejectInversoes(rejectingProposalId, rejectingCurrentInversoes, inversoesRejectReason);
    setRejectingProposalId(null);
    setRejectingCurrentInversoes(null);
    setInversoesRejectReason("");
  }, [rejectingProposalId, rejectingCurrentInversoes, inversoesRejectReason, rejectInversoes]);

  // ─── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Detail View ──────────────────────────────────────────────
  if (selectedSubmission) {
    const sub = selectedSubmission;
    const approvedPct =
      sub.totalFiles > 0
        ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
        : 0;
    const allApproved = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;
    const carIndividualFile = sub.files.find(f => f.document_type === "car_individual");
    const carColetivoFile = sub.files.find(f => f.document_type === "car_coletivo");
    const carNumber = carIndividualFile?.ged_id || carColetivoFile?.ged_id || "";

    return (
      <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
        {/* ── Header Premium Clean Panel ─────────────────────────────────── */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border border-border/80 text-foreground hover:bg-muted shrink-0 h-9 w-9"
                onClick={() => setSelectedSubmission(null)}
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
              <div className="space-y-1">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-sans font-bold text-base md:text-lg text-slate-900 dark:text-slate-50 leading-tight">
                      {sub.proposal.producer_name}
                    </h1>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={loading}
                      title="Atualizar dados da documentação"
                      className="rounded-xl border border-border/60 text-slate-500 hover:text-slate-700 hover:bg-muted h-7 w-7"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-semibold rounded-md ${
                        allApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : sub.rejectedCount > 0
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {allApproved
                        ? "Totalmente Aprovada"
                        : sub.rejectedCount > 0
                        ? "Com Reprovações"
                        : "Em Análise"}
                    </Badge>
                  </div>
                  {sub.proposal.status === "ENVIADO PARA CENTRAL" && (
                    <div className="flex">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 font-semibold rounded-md bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Enviado para Central
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Meta Grid clean & highly readable */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-sans">
                  <div>
                    <span className="text-muted-foreground/70">CPF:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.proposal.producer_cpf || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/70">Município:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.proposal.municipio || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/70">Projetista:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.proposal.projetista || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/70">Programa:</span>{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub.proposal.credit_program || sub.proposal.linha_credito || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/70">Valor:</span>{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {sub.proposal.estimated_value ? sub.proposal.estimated_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                    </span>
                  </div>
                  {(() => {
                    const loc = sub.proposal.localizacao || "";
                    const locParts = loc.split("|").map(p => p.trim());
                    
                    let imovelRural = "";
                    let nomePA = "";
                    
                    if (locParts.length > 1) {
                       imovelRural = locParts[0];
                       nomePA = locParts[1];
                     } else {
                       if (carIndividualFile?.ged_id && carColetivoFile?.ged_id) {
                         imovelRural = locParts[0];
                         nomePA = locParts[0];
                       } else if (carIndividualFile?.ged_id) {
                         imovelRural = locParts[0];
                       } else if (carColetivoFile?.ged_id) {
                         nomePA = locParts[0];
                       } else {
                         imovelRural = locParts[0];
                       }
                     }

                    return (
                      <>
                        {imovelRural && (
                          <div>
                            <span className="text-muted-foreground/70">Imóvel Rural:</span>{" "}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{imovelRural}</span>
                          </div>
                        )}
                        {nomePA && (
                          <div>
                            <span className="text-muted-foreground/70">PA/Assentamento:</span>{" "}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{nomePA}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {carIndividualFile?.ged_id && (
                    <div>
                      <span className="text-muted-foreground/70">CAR Individual:</span>{" "}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{carIndividualFile.ged_id.split(' | ')[0]}</span>
                    </div>
                  )}
                  {carColetivoFile?.ged_id && (
                    <div>
                      <span className="text-muted-foreground/70">CAR Coletivo:</span>{" "}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{carColetivoFile.ged_id.split(' | ')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Primary & Structured Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-4"
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString("pt-BR");
                  const d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                  const W = d.internal.pageSize.getWidth();
                  const H = d.internal.pageSize.getHeight();

                  // ── HEADER BAND ────────────────────────────────────
                  d.setFillColor(15, 23, 42);
                  d.rect(0, 0, W, 38, "F");
                  d.setFillColor(99, 102, 241);
                  d.rect(0, 38, W, 2, "F");
                  d.setFillColor(248, 250, 252);
                  d.rect(0, 40, W, H - 40, "F");

                  d.setTextColor(255, 255, 255);
                  d.setFont("helvetica", "bold");
                  d.setFontSize(16);
                  d.text("CHECKLIST DE DOCUMENTAÇÃO", 14, 14);

                  d.setFillColor(99, 102, 241);
                  d.roundedRect(14, 18, 42, 5.5, 1.5, 1.5, "F");
                  d.setTextColor(255, 255, 255);
                  d.setFont("helvetica", "bold");
                  d.setFontSize(7);
                  d.text("PRONAF — DOCUMENTAÇÃO", 35, 21.9, { align: "center" });

                  const infoItems = [
                    ["PRODUTOR", sub.proposal.producer_name || "—"],
                    ["CPF", sub.proposal.producer_cpf || "—"],
                    ["MUNICÍPIO", sub.proposal.municipio || "—"],
                    ["LINHA DE CRÉDITO", sub.proposal.linha_credito || sub.proposal.credit_program || "—"],
                  ];
                  const col1X = 14;
                  const col2X = W / 2 + 4;
                  infoItems.forEach((item, idx) => {
                    const col = idx % 2 === 0 ? col1X : col2X;
                    const row = Math.floor(idx / 2);
                    const baseY = 26 + row * 7;
                    d.setFont("helvetica", "bold");
                    d.setFontSize(6.5);
                    d.setTextColor(148, 163, 184);
                    d.text(item[0], col, baseY);
                    d.setFont("helvetica", "normal");
                    d.setFontSize(8);
                    d.setTextColor(255, 255, 255);
                    const maxW = W / 2 - 20;
                    d.text(item[1], col, baseY + 4, { maxWidth: maxW });
                  });

                  const gedMap = new Map<string, string>();
                  const statusMap = new Map<string, string>();
                  const dispensadosSet = new Set<string>();

                  sub.files.forEach((f) => {
                    const ex = statusMap.get(f.document_type);
                    if (f.file_path === "dispensado") {
                      dispensadosSet.add(f.document_type);
                    }
                    
                    if (!ex) {
                      statusMap.set(f.document_type, f.status);
                      if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                    } else if (f.status === "aprovado") {
                      statusMap.set(f.document_type, "aprovado");
                      if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                    } else if (f.status === "pendente" && ex !== "aprovado") {
                      statusMap.set(f.document_type, "pendente");
                      if (f.ged_id) gedMap.set(f.document_type, f.ged_id);
                    } else if (!gedMap.has(f.document_type) && f.ged_id) {
                      gedMap.set(f.document_type, f.ged_id);
                    }
                  });

                  const socioAmbientalKeys = [
                    "declaracao_suporte_hidrico",
                    "autorizacao_desmatamento_queima",
                    "declaracao_regularidade_ambiental",
                    "declaracao_recomposicao_reserva_car",
                    "declaracao_nao_desmatamento",
                    "declaracao_anexo_128"
                  ];

                  let consolidatedStatus: string | null = null;
                  let consolidatedGedId = "—";
                  let allSocioAmbientalDispensados = true;
                  let hasSocioAmbientalFiles = false;

                  for (const key of socioAmbientalKeys) {
                    const filesForKey = sub.files.filter(f => f.document_type === key);
                    if (filesForKey.length > 0) {
                      hasSocioAmbientalFiles = true;
                      const nonDispensado = filesForKey.find(f => f.file_path !== "dispensado");
                      if (nonDispensado) {
                        allSocioAmbientalDispensados = false;
                      }
                      const withGed = filesForKey.find(f => f.ged_id);
                      if (withGed && withGed.ged_id) {
                        consolidatedGedId = withGed.ged_id;
                      }
                    }
                  }

                  if (hasSocioAmbientalFiles) {
                    if (allSocioAmbientalDispensados) {
                      consolidatedStatus = "dispensado";
                    } else {
                      const socioStatuses = sub.files
                        .filter(f => socioAmbientalKeys.includes(f.document_type) && f.file_path !== "dispensado")
                        .map(f => f.status);
                      
                      if (socioStatuses.includes("aprovado")) {
                        consolidatedStatus = "aprovado";
                      } else if (socioStatuses.includes("pendente")) {
                        consolidatedStatus = "pendente";
                      } else if (socioStatuses.includes("reprovado")) {
                        consolidatedStatus = "reprovado";
                      } else {
                        consolidatedStatus = "pendente";
                      }
                    }
                  } else {
                    consolidatedStatus = null;
                  }

                  const IDENTIFICACAO_KEYS = [
                    "rg",
                    "ficha_cadastro_cliente",
                    "ficha_cadastro_esposa",
                    "rg_esposa",
                    "certidao_casamento",
                    "procuracao",
                    "rg_procurador",
                    "caf_extrato",
                    "certidao_obito",
                    "autorizacao_modificacao_projeto"
                  ];

                  const OPERACAO_KEYS = [
                    "declaracoes_unificadas",
                    "dcaa",
                    "espelho_beneficiario",
                    "titulo_dominio",
                    "carta_consulta",
                    "certidao_embargo_ambiental",
                    "certidao_improbidade",
                    "car_individual",
                    "car_coletivo"
                  ];

                  const PLANO_KEYS = [
                    "cadastro_atividade_plano",
                    "plano_eletronico",
                    "declaracao_assistencia_tecnica",
                    "orcamento",
                    "contrato_assessoria"
                  ];

                  const pdfDocs: { key: string; label: string; isConsolidated?: boolean }[] = [];

                  // 1. Identificação
                  IDENTIFICACAO_KEYS.forEach((key) => {
                    const found = DOCUMENTATION_REQUIRED.find((d) => d.key === key);
                    if (found) pdfDocs.push(found);
                  });

                  // 2. Operação
                  OPERACAO_KEYS.forEach((key) => {
                    const found = DOCUMENTATION_REQUIRED.find((d) => d.key === key);
                    if (found) pdfDocs.push(found);
                  });

                  // 3. Ambientais (Consolidated)
                  pdfDocs.push({
                    key: "cert_socio_ambiental_zip",
                    label: "CERT. SOCIO AMBIENTAL .ZIP",
                    isConsolidated: true
                  });

                  // 4. Plano
                  PLANO_KEYS.forEach((key) => {
                    const found = DOCUMENTATION_REQUIRED.find((d) => d.key === key);
                    if (found) pdfDocs.push(found);
                  });

                  // 5. Outros (safety fallback for any unmapped keys)
                  const handledKeys = [
                    ...IDENTIFICACAO_KEYS,
                    ...OPERACAO_KEYS,
                    ...socioAmbientalKeys,
                    ...PLANO_KEYS
                  ];
                  DOCUMENTATION_REQUIRED.forEach((doc) => {
                    if (!handledKeys.includes(doc.key)) {
                      pdfDocs.push(doc);
                    }
                  });

                  let cEntregue = 0, cAguardando = 0, cReprovado = 0, cPendente = 0, cDispensado = 0;
                  pdfDocs.forEach((doc) => {
                    if (doc.isConsolidated) {
                      if (consolidatedStatus === "dispensado") cDispensado++;
                      else if (consolidatedStatus === "aprovado") cEntregue++;
                      else if (consolidatedStatus === "pendente") cAguardando++;
                      else if (consolidatedStatus === "reprovado") cReprovado++;
                      else cPendente++;
                    } else {
                      if (dispensadosSet.has(doc.key)) {
                        cDispensado++;
                      } else {
                        const st = statusMap.get(doc.key);
                        if (st === "aprovado") cEntregue++;
                        else if (st === "pendente") cAguardando++;
                        else if (st === "reprovado") cReprovado++;
                        else cPendente++;
                      }
                    }
                  });

                  const kpiY = 44;
                  const kpiH = 14;
                  const kpiW = (W - 28 - 12) / 5;
                  const kpis = [
                    { label: "ENTREGUE", val: cEntregue, fill: [16, 185, 129] as [number, number, number] },
                    { label: "DISPENSADO", val: cDispensado, fill: [148, 163, 184] as [number, number, number] },
                    { label: "AGUARD. APROV.", val: cAguardando, fill: [245, 158, 11] as [number, number, number] },
                    { label: "REPROVADO", val: cReprovado, fill: [239, 68, 68] as [number, number, number] },
                    { label: "PENDENTE", val: cPendente, fill: [100, 116, 139] as [number, number, number] },
                  ];
                  kpis.forEach((k, i) => {
                    const x = 14 + i * (kpiW + 3);
                    d.setFillColor(255, 255, 255);
                    d.roundedRect(x, kpiY, kpiW, kpiH, 2, 2, "F");
                    d.setFillColor(...k.fill);
                    d.roundedRect(x, kpiY, 2.5, kpiH, 1, 1, "F");
                    d.setFont("helvetica", "bold");
                    d.setFontSize(11);
                    d.setTextColor(...k.fill);
                    d.text(String(k.val), x + 5, kpiY + 8.5);
                    d.setFont("helvetica", "normal");
                    d.setFontSize(5.5);
                    d.setTextColor(71, 85, 105);
                    d.text(k.label, x + 5, kpiY + 12.5);
                  });

                  const tableBody = pdfDocs.map((doc, i) => {
                    let gedId = "—";
                    let statusLabel = "PENDENTE";

                    if (doc.isConsolidated) {
                      gedId = consolidatedGedId;
                      if (consolidatedStatus === "dispensado") statusLabel = "DISPENSADO";
                      else if (consolidatedStatus === "aprovado") statusLabel = "ENTREGUE";
                      else if (consolidatedStatus === "pendente") statusLabel = "AGUARD. APROV.";
                      else if (consolidatedStatus === "reprovado") statusLabel = "REPROVADO";
                    } else {
                      const isDispensado = dispensadosSet.has(doc.key);
                      const st = statusMap.get(doc.key);

                      if (isDispensado) {
                        statusLabel = "DISPENSADO";
                      } else {
                        gedId = gedMap.get(doc.key) || "—";
                        if (st === "aprovado") statusLabel = "ENTREGUE";
                        else if (st === "pendente") statusLabel = "AGUARD. APROV.";
                        else if (st === "reprovado") statusLabel = "REPROVADO";
                      }
                    }

                    return [i + 1, gedId, doc.label, statusLabel];
                  });

                  const STATUS_COLORS: Record<string, [number, number, number]> = {
                    "ENTREGUE": [16, 185, 129],
                    "DISPENSADO": [100, 116, 139],
                    "AGUARD. APROV.": [245, 158, 11],
                    "REPROVADO": [239, 68, 68],
                    "PENDENTE": [100, 116, 139],
                  };

                  autoTable(d, {
                    startY: kpiY + kpiH + 4,
                    head: [["#", "ID-GED", "DOCUMENTO", "STATUS"]],
                    body: tableBody,
                    theme: "plain",
                    headStyles: {
                      fillColor: [30, 41, 59],
                      textColor: [255, 255, 255],
                      fontSize: 7.5,
                      fontStyle: "bold",
                      halign: "center",
                      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
                    },
                    styles: {
                      fontSize: 7.5,
                      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
                      valign: "middle",
                      textColor: [30, 41, 59],
                      lineColor: [226, 232, 240],
                      lineWidth: 0.3,
                    },
                    columnStyles: {
                      0: { halign: "center", cellWidth: 9 },
                      1: { halign: "center", cellWidth: 26, fontStyle: "bold", textColor: [99, 102, 241] },
                      2: { cellWidth: 115 },
                      3: { halign: "center", cellWidth: 38, fontStyle: "bold" },
                    },
                    alternateRowStyles: { fillColor: [241, 245, 249] },
                    willDrawCell: (data: any) => {
                      if (data.section === "body" && data.column.index === 3) {
                        const status = tableBody[data.row.index]?.[3] as string;
                        const color = STATUS_COLORS[status] || [100, 116, 139];
                        data.cell.styles.textColor = color;
                      }
                    },
                    didDrawPage: (hookData: any) => {
                      const pageNum = (d as any).internal.getCurrentPageInfo().pageNumber;
                      const total = (d as any).internal.getNumberOfPages();
                      d.setFillColor(30, 41, 59);
                      d.rect(0, H - 9, W, 9, "F");
                      d.setFont("helvetica", "normal");
                      d.setFontSize(6.5);
                      d.setTextColor(148, 163, 184);
                      d.text(`Gerado em ${dateStr}  ·  Proposta: ${sub.proposal.producer_name}`, 14, H - 3.5);
                      d.text(`Página ${pageNum} de ${total}`, W - 14, H - 3.5, { align: "right" });
                    },
                  });

                  const safeName = (sub.proposal.producer_name || "Produtor")
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "_").toUpperCase();
                  d.save(`Checklist_${safeName}_${now.toISOString().slice(0, 10)}.pdf`);
                }}
              >
                <ClipboardCheck className="h-4 w-4" />
                Gerar Checklist
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-bold px-4"
                onClick={() => {
                  const carIndividualFile = sub.files.find(f => f.document_type === "car_individual");
                  const carColetivoFile = sub.files.find(f => f.document_type === "car_coletivo");
                  const cafFile = sub.files.find(f => f.document_type === "caf_extrato");
                  const historicoFile = sub.files.find(f => f.document_type === "consulta_historico_operacao_pronaf");
                  const historicoAgencia = (historicoFile?.ged_id && historicoFile.ged_id !== "NAO" && historicoFile.ged_id !== "SIM") ? historicoFile.ged_id : "";

                  const sourceAct = sub.proposal.credit_purpose || sub.proposal.linha_credito || "";
                  const upperAct = sourceAct.toUpperCase();
                  const initialAct = (upperAct.includes("PRONAF") || upperAct.includes("368") || upperAct.includes("699") || upperAct.includes("GRUPO"))
                    ? ""
                    : sourceAct;
                   const hasCarInd = !!carIndividualFile?.ged_id;
                  const hasCarCol = !!carColetivoFile?.ged_id;
                  setParecerUtilizaCarIndividual(hasCarInd ? "SIM" : "NÃO");

                  setSelectedSubmission(sub);
                  setParecerDialogOpen(true);
                }}
              >
                <FileText className="h-4 w-4" />
                Parecer Gerencial
              </Button>

              <Button
                size="sm"
                className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
                disabled={!allApproved}
                onClick={handleApproveProposal}
              >
                <ShieldCheck className="h-4 w-4" />
                Aprovar Proposta
              </Button>

              <Button
                size="sm"
                className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4"
                disabled={sub.proposal.status === "ENVIADO PARA CENTRAL"}
                onClick={handleSendToCentral}
              >
                <Send className="h-4 w-4" />
                Confirmar Envio Central
              </Button>

              <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border text-foreground"
                onClick={async () => {
                  const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                  await navigator.clipboard.writeText(url);
                  toast({
                    title: "Link copiado! 📋",
                    description: "Link da página de envio copiado para a área de transferência.",
                  });
                }}
              >
                <Link2 className="h-4 w-4" />
                Link Envio
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border text-foreground"
                onClick={() => downloadAllAsZip(sub)}
              >
                <Archive className="h-4 w-4" />
                ZIP
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-amber-700 border-amber-200 hover:bg-amber-50"
                onClick={() => setRevertDialogOpen(true)}
              >
                <Undo2 className="h-4 w-4" />
                Reverter
              </Button>
            </div>
          </div>

          {/* Sub-bar for batch decisions - closer to documents grid */}
          {sub.files.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/40 rounded-2xl p-3 border border-border/40 text-xs gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Decisões em Massa:
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 h-7 text-xs"
                  onClick={handleApproveAllDocs}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Aprovar Todos os Documentos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg text-red-600 hover:bg-red-50 h-7 text-xs"
                  onClick={() => {
                    setBulkRejectReason("");
                    setBulkRejectDialogOpen(true);
                  }}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Reprovar Todos os Documentos
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Progress Card ──────────────────────────────────── */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 pb-5 px-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Progresso da Documentação
                </p>
                <p className="font-heading font-extrabold text-2xl mt-1">
                  {sub.approvedCount}
                  <span className="text-muted-foreground font-medium text-base">
                    /{sub.totalFiles}
                  </span>{" "}
                  <span className="text-sm font-medium text-muted-foreground">aprovados</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-heading font-extrabold text-3xl text-primary">
                  {approvedPct}%
                </span>
              </div>
            </div>
            <Progress value={approvedPct} className="h-2.5 rounded-full" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {sub.approvedCount} aprovados
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {sub.pendingCount} pendentes
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                {sub.rejectedCount} reprovados
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Documents Grids by Category ───────────────────────── */}
        {(() => {
          const bestByType = new Map<string, typeof sub.files[0]>();
          const grouped = new Map<string, typeof sub.files>();
          sub.files.forEach((f) => {
            const list = grouped.get(f.document_type) || [];
            list.push(f);
            grouped.set(f.document_type, list);
          });

          grouped.forEach((fileList, docType) => {
            const sorted = [...fileList].sort((a, b) => parseSafeDate(b.created_at) - parseSafeDate(a.created_at));
            bestByType.set(docType, sorted[0]);
          });

          // Ensure all current required documents exist (even as virtual pendente cards)
          DOCUMENTATION_REQUIRED.forEach((doc) => {
            if (!bestByType.has(doc.key)) {
              bestByType.set(doc.key, {
                id: `temp_${doc.key}`,
                token_id: sub.id,
                stock_proposal_id: sub.proposal?.id,
                file_name: "Pendente de envio",
                file_path: "habilitado",
                file_size: 0,
                document_type: doc.key,
                status: "pendente",
                rejection_reason: null,
                reviewed_at: null,
                reviewed_by: null,
                created_at: new Date().toISOString(),
                ged_id: null
              } as any);
            }
          });

          const uniqueFiles = [...bestByType.values()];

          const socioAmbientalKeys = [
            "declaracao_suporte_hidrico",
            "autorizacao_desmatamento_queima",
            "declaracao_regularidade_ambiental",
            "declaracao_recomposicao_reserva_car",
            "declaracao_nao_desmatamento",
            "declaracao_anexo_128"
          ];

          // Category definitions matching DocumentationSubmit layout
          const IDENTIFICACAO_KEYS = [
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

          const RURAL_KEYS = [
            "car_individual",
            "car_coletivo",
            "espelho_beneficiario",
            "titulo_dominio"
          ];

          const ENQUADRAMENTO_KEYS = [
            "caf_extrato",
            "carta_consulta"
          ];

          const CERTIDOES_CIVIS_KEYS = [
            "certidao_improbidade",
            "certidao_embargo_ambiental",
            "declaracao_assistencia_tecnica"
          ];

          const PLANO_INVESTIMENTO_KEYS = [
            "autorizacao_modificacao_projeto",
            "contrato_assessoria",
            "orcamento",
            "plano_eletronico",
            "plano_assinado",
            "cadastro_atividade_plano"
          ];

          const DECLARACOES_AMBIENTAIS_KEYS = [
            "dcaa",
            "declaracao_suporte_hidrico",
            "autorizacao_desmatamento_queima",
            "declaracao_regularidade_ambiental",
            "declaracao_recomposicao_reserva_car",
            "declaracao_nao_desmatamento",
            "declaracao_anexo_128"
          ];

          const renderGrid = (title: string, keys: string[], icon: React.ReactNode, sortByLabel = false) => {
            const filtered = uniqueFiles
              .filter((f) => keys.includes(f.document_type))
              .sort((a, b) => {
                if (sortByLabel) {
                  return getDocLabel(a.document_type).localeCompare(getDocLabel(b.document_type), "pt-BR");
                }
                return keys.indexOf(a.document_type) - keys.indexOf(b.document_type);
              });
            if (filtered.length === 0) return null;

            return (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                  {icon}
                  <h3 className="font-heading font-extrabold text-sm tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                    {title} ({filtered.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((file) => {
                    const status = file.status as DocFileStatus;
                    const isVirtual = file.id.startsWith("temp_");
                    const isDispensado = file.file_path === "dispensado" || file.file_path === "preenchido";
                    const isCarCard = file.document_type === "car_individual" || file.document_type === "car_coletivo";
                    const [carNumber, carGedId] = isCarCard && file.ged_id ? (file.ged_id.includes(' | ') ? file.ged_id.split(' | ') : [file.ged_id, '']) : ['', ''];
                    let cardBorder = "border-slate-200 dark:border-slate-800";
                    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
                    let badgeLabel = "Não enviado";
                    
                    if (isDispensado) {
                      cardBorder = "border-slate-200 dark:border-slate-800";
                      badgeColor = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
                      badgeLabel = "Dispensado 🚫";
                    } else if (isVirtual) {
                      cardBorder = "border-amber-200 dark:border-amber-900/40";
                      badgeColor = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
                      badgeLabel = "Pendente ⏳";
                    } else if (status === "aprovado") {
                      cardBorder = "border-emerald-300 dark:border-emerald-900/60";
                      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
                      badgeLabel = "Aprovado ✅";
                    } else if (status === "reprovado") {
                      cardBorder = "border-rose-300 dark:border-rose-900/60";
                      badgeColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
                      badgeLabel = "Reprovado ❌";
                    } else {
                      cardBorder = "border-amber-300 dark:border-amber-900/60";
                      badgeColor = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
                      badgeLabel = "Pendente ⏳";
                    }

                    return (
                      <Card
                        key={file.id}
                        className={`rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-md bg-white dark:bg-slate-950 relative border-2 ${cardBorder}`}
                      >
                        <CardContent className="p-6 space-y-4 pt-8">
                          {/* Top Right Mini Badge */}
                          <div className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {badgeLabel}
                          </div>

                          {/* Left Aligned Content Header mimicking DocumentationSubmit */}
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <FileText className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-heading font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-tight truncate" title={getDocLabel(file.document_type)}>
                                {getDocLabel(file.document_type)}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                {file.document_type === "cadastro_atividade_plano" ? "Atividade no Plano" : "Documento do Proponente"}
                              </p>
                            </div>
                          </div>

                          {/* Rejection Reason Alert */}
                          {status === "reprovado" && file.rejection_reason && (
                            <div className="bg-rose-100/60 border border-rose-200 rounded-2xl p-3">
                              <p className="text-xs text-rose-800 leading-relaxed">
                                <span className="font-bold">Motivo:</span> {file.rejection_reason}
                              </p>
                            </div>
                          )}

                           {/* CAR cards: show property name and CAR number */}
                           {isCarCard && !isVirtual && !isDispensado && (
                             <div className="space-y-2">
                               {sub.proposal.localizacao && (
                                 <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-2.5 text-center">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-0.5">Nome do Imóvel</span>
                                   <p className="text-[11px] font-bold text-indigo-700 break-words">{(sub.proposal.localizacao || "").toUpperCase()}</p>
                                 </div>
                               )}
                               {carNumber && (
                                 <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-2.5 text-center">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block mb-0.5">Número do CAR</span>
                                   <p className="text-[11px] font-bold text-sky-700 break-all leading-relaxed">{carNumber}</p>
                                 </div>
                               )}
                             </div>
                           )}

                           {/* Original Filename Display (non-CAR cards) */}
                           {(!isCarCard || isVirtual || isDispensado) && (
                             <div className="text-center">
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{file.document_type === "cadastro_atividade_plano" ? "Atividade do Plano" : "Arquivo Enviado"}</span>
                               <p className="text-[11px] font-bold text-slate-600 truncate max-w-full px-2" title={file.file_name}>
                                 {isVirtual ? "—" : file.document_type === "cadastro_atividade_plano" ? (sub.proposal.credit_purpose || "NÃO PREENCHIDA Pelo projetista") : file.file_name}
                               </p>
                             </div>
                           )}

                           {/* GED ID Field or Dispensation message */}
                           {file.document_type !== "cadastro_atividade_plano" && (isDispensado ? (
                             <div className="bg-slate-200/50 border border-slate-300 rounded-2xl py-2 px-3 text-center">
                               <span className="text-[9px] font-bold text-slate-600 block">
                                   DOC. DISPENSADO NÃO POSSUI / NÃO NECESSÁRIO
                               </span>
                             </div>
                           ) : (
                             <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-2xl p-2.5">
                               <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block ml-1">ID-GED</label>
                               <input
                                 type="text"
                                 defaultValue={isCarCard ? carGedId : (file.ged_id ?? "")}
                                 placeholder={
                                   socioAmbientalKeys.includes(file.document_type)
                                     ? "INSERIR ID - CERT. SOCIO AMBIENTAL ZIP"
                                     : "Ex: GED-001"
                                 }
                                 maxLength={80}
                                 className="w-full h-8 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-mono font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center"
                                 onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (isCarCard) {
                                      const newVal = val ? `${carNumber} | ${val}` : carNumber;
                                      if (newVal !== (file.ged_id ?? "")) {
                                        updateGedId(file.id, newVal);
                                      }
                                    } else {
                                      if (val !== (file.ged_id ?? "")) {
                                        updateGedId(file.id, val);
                                      }
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                   if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                 }}
                               />
                               {(isCarCard ? carGedId : file.ged_id) && (
                                 <div className="mt-1 px-1 bg-slate-100/60 rounded border border-slate-200/50 py-0.5 text-center">
                                   <p className="text-[9px] font-mono break-all text-slate-500 leading-normal select-all font-bold" title="Clique duas vezes para selecionar tudo">{isCarCard ? carGedId : file.ged_id}</p>
                                 </div>
                               )}
                             </div>
                           ))}

                           <Separator className="opacity-50" />

                           {/* Action Buttons for Analista */}
                           <div className="flex items-center gap-2 justify-center flex-wrap pt-1">
                             <Button
                               variant="outline"
                               size="sm"
                               className="gap-1 rounded-xl text-[11px] font-bold h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                               disabled={pdfLoading || isVirtual || (
                                 file.document_type === "cadastro_atividade_plano" &&
                                 !sub.files.find((f) => {
                                   const type = f.document_type.toLowerCase();
                                   const isVirt = f.file_path === "preenchido" || f.file_path === "dispensado" || f.file_path === "habilitado";
                                   if (isVirt) return false;
                                   return type === "plano_assinado" || type === "plano_eletronico" || type.includes("plano");
                                 })
                               )}
                               onClick={() => {
                                 if (file.document_type === "cadastro_atividade_plano") {
                                   const planoAssinadoFile = sub.files.find((f) => {
                                     const type = f.document_type.toLowerCase();
                                     const isVirt = f.file_path === "preenchido" || f.file_path === "dispensado" || f.file_path === "habilitado";
                                     if (isVirt) return false;
                                     return type === "plano_assinado" || type === "plano_eletronico" || type.includes("plano");
                                   });
                                   if (planoAssinadoFile) {
                                     handleViewPdf(planoAssinadoFile.file_path, planoAssinadoFile.file_name);
                                   }
                                 } else {
                                   handleViewPdf(file.file_path, file.file_name);
                                 }
                               }}
                             >
                               {pdfLoading ? (
                                 <Loader2 className="h-3.5 w-3.5 animate-spin" />
                               ) : (
                                 <Eye className="h-3.5 w-3.5" />
                               )}
                               Ver
                             </Button>
                             {file.document_type !== "cadastro_atividade_plano" && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 className="gap-1 rounded-xl text-[11px] font-bold h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                                 disabled={isVirtual}
                                 onClick={() => downloadFile(file.file_path, file.file_name)}
                               >
                                 <Download className="h-3.5 w-3.5" />
                                 Baixar
                               </Button>
                             )}
                              {!isDispensado && status !== "aprovado" && (
                               <Button
                                 size="sm"
                                 className="gap-1 rounded-xl text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                 onClick={() => approveDocument(file.id, sub.token.id)}
                               >
                                 <ThumbsUp className="h-3.5 w-3.5" />
                                 Aprovar
                               </Button>
                             )}
                             {status !== "reprovado" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1 rounded-xl text-[11px] font-bold h-8 shadow-sm"
                                  onClick={() => handleOpenRejectDialog(file.id)}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  {isDispensado ? "Reprovar Dispensa" : "Reprovar"}
                                </Button>
                              )}
                              {DISPENSABLE_DOCS.includes(file.document_type) && (
                                isDispensado ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 rounded-xl text-[11px] font-bold h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                                    onClick={() => dispenseDocument(sub.token.id, sub.proposal.id, file.document_type, false)}
                                  >
                                    <Undo2 className="h-3.5 w-3.5" />
                                    Desfazer Dispensa
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 rounded-xl text-[11px] font-bold h-8 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    onClick={() => {
                                      if (file.document_type === "car_individual" || file.document_type === "car_coletivo") {
                                        const otherKey = file.document_type === "car_individual" ? "car_coletivo" : "car_individual";
                                        const otherFile = sub.files.find(f => f.document_type === otherKey);
                                        if (otherFile?.file_path === "dispensado") {
                                          toast({
                                            title: "Operação não permitida ⚠️",
                                            description: "Você não pode dispensar ambos os CARs. É necessário fornecer ao menos um (CAR Individual ou CAR Coletivo)!",
                                            variant: "destructive"
                                          });
                                          return;
                                        }
                                      }
                                      dispenseDocument(sub.token.id, sub.proposal.id, file.document_type, true);
                                    }}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                    Dispensar
                                  </Button>
                                )
                              )}
                           </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          };

          const renderAgencyGrid = () => {
            const CONFIRMATION_ACTIVITY_KEYS = [
              "consulta_extrator_sicor",
              "parecer_gerencial",
              "consulta_s400",
              "registro_visita_gerencial",
              "avaliacao_risco",
              "consulta_restricoes_serasa",
              "checklist_documentos_responsabilidade_agencia"
            ];

            const agencyDocsCompletedCount = AGENCY_DOCUMENTATION.filter((doc) => {
              const existingFile = sub.files.find((f) => f.document_type === doc.key);
              if (doc.key === "checklist_documentos_responsabilidade_agencia") {
                const missingGed = [];
                const approvedProducerFiles = sub.files.filter(f => 
                  f.status === 'aprovado' && 
                  f.file_path !== 'dispensado' && 
                  f.file_path !== 'preenchido' && 
                  f.file_path !== 'habilitado' && 
                  !AGENCY_DOCUMENTATION.some(ad => ad.key === f.document_type)
                );
                for (const f of approvedProducerFiles) {
                  const isCar = f.document_type === "car_individual" || f.document_type === "car_coletivo";
                  if (isCar) {
                    const [_, carGedId] = f.ged_id && f.ged_id.includes(' | ') ? f.ged_id.split(' | ') : ['', ''];
                    if (!carGedId || carGedId.trim() === "") {
                      missingGed.push(f.document_type);
                    }
                  } else {
                    if (!f.ged_id || f.ged_id.trim() === "") {
                      missingGed.push(f.document_type);
                    }
                  }
                }
                const sicorFile = sub.files.find(f => f.document_type === "consulta_extrator_sicor");
                if (!sicorFile || !sicorFile.ged_id || sicorFile.ged_id.trim() === "") {
                  missingGed.push("consulta_extrator_sicor");
                }
                const parecerFile = sub.files.find(f => f.document_type === "parecer_gerencial");
                if (!parecerFile || !parecerFile.ged_id || parecerFile.ged_id.trim() === "") {
                  missingGed.push("parecer_gerencial");
                }
                return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO") && missingGed.length === 0;
              }
              if (doc.key === "consulta_historico_operacao_pronaf") {
                return !!existingFile?.ged_id && existingFile.ged_id !== "";
              }
              if (CONFIRMATION_ACTIVITY_KEYS.includes(doc.key)) {
                return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO");
              }
              return !!existingFile?.ged_id && existingFile.ged_id.trim() !== "";
            }).length;

            const agencyPct = Math.round((agencyDocsCompletedCount / AGENCY_DOCUMENTATION.length) * 100);

            return (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                  <Building className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-heading font-extrabold text-sm tracking-wider text-slate-800 dark:text-slate-200 uppercase">
                    DOCUMENTOS DE RESPONSABILIDADE DA AGÊNCIA ({AGENCY_DOCUMENTATION.length})
                  </h3>
                </div>
                
                {/* Agency Progress Card */}
                <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-indigo-500/5 border-indigo-500/10 mb-2">
                  <CardContent className="py-4 px-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                          Progresso das Atividades da Agência
                        </p>
                        <p className="font-heading font-extrabold text-lg mt-0.5">
                          {agencyDocsCompletedCount}
                          <span className="text-muted-foreground font-medium text-xs">
                            /{AGENCY_DOCUMENTATION.length}
                          </span>{" "}
                          <span className="text-xs font-medium text-muted-foreground">concluídas</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-extrabold text-xl text-indigo-600 dark:text-indigo-400">
                          {agencyPct}%
                        </span>
                      </div>
                    </div>
                    <Progress value={agencyPct} className="h-2 rounded-full bg-indigo-100 dark:bg-indigo-950/40" />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {AGENCY_DOCUMENTATION.map((doc) => {
                    const existingFile = sub.files.find((f) => f.document_type === doc.key);
                    const isComplete = (() => {
                      if (doc.key === "checklist_documentos_responsabilidade_agencia") {
                        const missingGed = [];
                        const approvedProducerFiles = sub.files.filter(f => 
                          f.status === 'aprovado' && 
                          f.file_path !== 'dispensado' && 
                          f.file_path !== 'preenchido' && 
                          f.file_path !== 'habilitado' && 
                          !AGENCY_DOCUMENTATION.some(ad => ad.key === f.document_type)
                        );
                        for (const f of approvedProducerFiles) {
                          const isCar = f.document_type === "car_individual" || f.document_type === "car_coletivo";
                          if (isCar) {
                            const [_, carGedId] = f.ged_id && f.ged_id.includes(' | ') ? f.ged_id.split(' | ') : ['', ''];
                            if (!carGedId || carGedId.trim() === "") {
                              missingGed.push(f.document_type);
                            }
                          } else {
                            if (!f.ged_id || f.ged_id.trim() === "") {
                              missingGed.push(f.document_type);
                            }
                          }
                        }
                        const sicorFile = sub.files.find(f => f.document_type === "consulta_extrator_sicor");
                        if (!sicorFile || !sicorFile.ged_id || !sicorFile.ged_id.startsWith("CONFIRMADO")) {
                          missingGed.push("consulta_extrator_sicor");
                        }
                        const parecerFile = sub.files.find(f => f.document_type === "parecer_gerencial");
                        if (!parecerFile || !parecerFile.ged_id || !parecerFile.ged_id.startsWith("CONFIRMADO")) {
                          missingGed.push("parecer_gerencial");
                        }
                        return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO") && missingGed.length === 0;
                      }
                      if (doc.key === "consulta_historico_operacao_pronaf") {
                        return !!existingFile?.ged_id && existingFile.ged_id !== "";
                      }
                      if (CONFIRMATION_ACTIVITY_KEYS.includes(doc.key)) {
                        return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO");
                      }
                      return !!existingFile?.ged_id && existingFile.ged_id.trim() !== "";
                    })();

                    return (
                      <Card
                        key={doc.key}
                        className={`shadow-premium rounded-3xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-lg group border-l-4 ${
                          isComplete
                            ? "bg-emerald-50/10 border-border/40 border-l-emerald-500"
                            : "bg-amber-50/5 border-border/40 border-l-amber-500"
                        }`}
                      >
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className={`h-5 w-5 shrink-0 ${isComplete ? "text-emerald-500" : "text-amber-500"}`} />
                              <p className="font-heading font-bold text-sm leading-tight text-slate-800 dark:text-slate-200">
                                {doc.label}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  isComplete
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                }`}
                              >
                                {isComplete ? "COMPLETA" : "PENDENTE"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                              >
                                Agência
                              </Badge>
                            </div>
                          </div>

                          {doc.key === "consulta_historico_operacao_pronaf" ? (
                            <div className="pt-1">
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                    Histórico PRONAF A?
                                  </span>
                                  <Select
                                    value={existingFile?.ged_id === "NAO" ? "nao" : (existingFile?.ged_id && existingFile.ged_id !== "") ? "sim" : ""}
                                    onValueChange={(val) => {
                                      if (val === "nao") {
                                        saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, "NAO", existingFile?.id);
                                      } else {
                                        saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, "SIM", existingFile?.id);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-28 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-400 focus:border-indigo-500 bg-background border-border/60">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      <SelectItem value="sim">SIM</SelectItem>
                                      <SelectItem value="nao">NÃO</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {existingFile?.ged_id && existingFile.ged_id !== "NAO" && (
                                  <div className="flex flex-col gap-1.5 pt-1 animate-fade-in">
                                    <span className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground leading-tight">
                                      INSERIR AGÊNCIA DE HISTÓRICO PRONAF A:
                                    </span>
                                    <input
                                      type="text"
                                      defaultValue={existingFile.ged_id === "SIM" ? "" : existingFile.ged_id}
                                      placeholder="Ex: Agência Maracaçumé (MA)"
                                      maxLength={80}
                                      className="w-full h-8 rounded-lg border border-border/60 bg-background px-3 text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-500 transition-all font-sans"
                                      onBlur={(e) => {
                                        const val = e.target.value.trim();
                                        if (val) {
                                          saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, val, existingFile?.id);
                                        } else {
                                          saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, "SIM", existingFile?.id);
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : CONFIRMATION_ACTIVITY_KEYS.includes(doc.key) ? (
                            <div className="pt-1">
                              {existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO") ? (
                                <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-2.5">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                      Atividade Confirmada
                                    </p>
                                    <p className="text-[9px] text-emerald-600/80 dark:text-emerald-500 font-medium leading-none mt-0.5 truncate">
                                      {existingFile.ged_id.replace("CONFIRMADO - ", "")}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg ml-auto font-bold shrink-0"
                                    onClick={() => {
                                      saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, "", existingFile?.id);
                                    }}
                                  >
                                    Desfazer
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1.5 rounded-xl text-xs h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-400 dark:hover:bg-emerald-950/20 font-bold justify-center"
                                  onClick={() => {
                                     if (doc.key === "checklist_documentos_responsabilidade_agencia") {
                                       const missingGed = [];
                                       const approvedProducerFiles = sub.files.filter(f => 
                                         f.status === 'aprovado' && 
                                         f.file_path !== 'dispensado' && 
                                         f.file_path !== 'preenchido' && 
                                         f.file_path !== 'habilitado' && 
                                         !AGENCY_DOCUMENTATION.some(ad => ad.key === f.document_type)
                                       );
                                       for (const f of approvedProducerFiles) {
                                         const isCar = f.document_type === "car_individual" || f.document_type === "car_coletivo";
                                         if (isCar) {
                                           const [_, carGedId] = f.ged_id && f.ged_id.includes(' | ') ? f.ged_id.split(' | ') : ['', ''];
                                           if (!carGedId || carGedId.trim() === "") {
                                             missingGed.push(f.document_type);
                                           }
                                         } else {
                                           if (!f.ged_id || f.ged_id.trim() === "") {
                                             missingGed.push(f.document_type);
                                           }
                                         }
                                       }
                                       const sicorFile = sub.files.find(f => f.document_type === "consulta_extrator_sicor");
                                       if (!sicorFile || !sicorFile.ged_id || !sicorFile.ged_id.startsWith("CONFIRMADO")) {
                                         missingGed.push("consulta_extrator_sicor");
                                       }
                                       const parecerFile = sub.files.find(f => f.document_type === "parecer_gerencial");
                                       if (!parecerFile || !parecerFile.ged_id || !parecerFile.ged_id.startsWith("CONFIRMADO")) {
                                         missingGed.push("parecer_gerencial");
                                       }
                                       if (missingGed.length > 0) {
                                         toast({
                                           title: "Erro ao confirmar Check List ⚠️",
                                           description: `Os seguintes documentos aprovados estão sem ID-GED: ${missingGed.map(docType => getDocLabel(docType)).join(", ")}.`,
                                           variant: "destructive"
                                         });
                                         return;
                                       }
                                     }
                                     const now = new Date();
                                     const dateStr = now.toLocaleDateString("pt-BR");
                                     const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                                     const val = `CONFIRMADO - ${dateStr} às ${timeStr}`;
                                     saveAgencyGedId(sub.token.id, sub.proposal.id, doc.key, val, existingFile?.id);
                                   }}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Confirmar Realização
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                ID-GED:
                              </span>
                              <input
                                type="text"
                                defaultValue={existingFile?.ged_id ?? ""}
                                placeholder="Ex: GED-001"
                                maxLength={40}
                                className="flex-1 h-7 rounded-lg border border-border/60 bg-background px-2 text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-500 transition-all"
                                onBlur={(e) => {
                                  const val = e.target.value.trim();
                                  const currentGed = existingFile?.ged_id ?? "";
                                  if (val !== currentGed) {
                                    saveAgencyGedId(
                                      sub.token.id,
                                      sub.proposal.id,
                                      doc.key,
                                      val,
                                      existingFile?.id
                                    );
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                }}
                              />
                            </div>
                          )}

                          {doc.key === "parecer_gerencial" && (
                            <>
                              <Separator className="opacity-40" />
                              <div className="pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-1.5 rounded-xl text-xs h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                                  onClick={() => {
                                    const carIndividualFile = sub.files.find(f => f.document_type === "car_individual");
                                    const carColetivoFile = sub.files.find(f => f.document_type === "car_coletivo");
                                    const cafFile = sub.files.find(f => f.document_type === "caf_extrato");
                                    const historicoFile = sub.files.find(f => f.document_type === "consulta_historico_operacao_pronaf");
                                    const historicoAgencia = (historicoFile?.ged_id && historicoFile.ged_id !== "NAO" && historicoFile.ged_id !== "SIM") ? historicoFile.ged_id : "";

                                    const sourceAct = sub.proposal.credit_purpose || sub.proposal.linha_credito || "";
                                    const upperAct = sourceAct.toUpperCase();
                                    const initialAct = (upperAct.includes("PRONAF") || upperAct.includes("368") || upperAct.includes("699") || upperAct.includes("GRUPO"))
                                      ? ""
                                      : sourceAct;
                                    const hasCarInd = !!carIndividualFile && carIndividualFile.file_path !== "dispensado";
                                    const hasCarCol = !!carColetivoFile && carColetivoFile.file_path !== "dispensado";
                                    setSelectedSubmission(sub);
                                    setParecerDialogOpen(true);
                                  }}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  Gerar Parecer
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          };

          // Render grids matching the order and layout of DocumentationSubmit
          const allKnownKeys = [
            ...IDENTIFICACAO_KEYS,
            ...RURAL_KEYS,
            ...ENQUADRAMENTO_KEYS,
            ...CERTIDOES_CIVIS_KEYS,
            ...PLANO_INVESTIMENTO_KEYS,
            ...DECLARACOES_AMBIENTAIS_KEYS
          ];
          const unknownKeys = uniqueFiles
            .filter((f) => !allKnownKeys.includes(f.document_type) && !AGENCY_DOCUMENTATION.some((ad) => ad.key === f.document_type))
            .map((f) => f.document_type);

          return (
            <div className="space-y-8">
              {renderAgencyGrid()}
              {renderGrid("Documentos de Identificação", IDENTIFICACAO_KEYS, <ShieldCheck className="h-5 w-5 text-sky-500" />, false)}
              {renderGrid("Identificação Imóvel Rural", RURAL_KEYS, <ClipboardList className="h-5 w-5 text-indigo-500" />, false)}
              {renderGrid("Documentação Enquadramento Agricultura Familiar", ENQUADRAMENTO_KEYS, <ShieldCheck className="h-5 w-5 text-teal-500" />, true)}
              {renderGrid("Certidões Civis e Administrativas", CERTIDOES_CIVIS_KEYS, <FileCheck className="h-5 w-5 text-blue-500" />, true)}
              {renderGrid("Documentação do Plano de Investimento Proposto", PLANO_INVESTIMENTO_KEYS, <FileBarChart className="h-5 w-5 text-slate-500" />, true)}
              
              {/* INVERSÕES DO PLANO (Apenas leitura para o analista) */}
              {(() => {
                const invData = sub.proposal.inversoes;
                let items: { quant: number; nome: string; valor: number }[] = [];
                let custo = 0;
                if (invData) {
                  if (Array.isArray(invData)) {
                    items = invData;
                  } else if (typeof invData === "object") {
                    const obj = invData as any;
                    items = Array.isArray(obj.items) ? obj.items : [];
                    custo = typeof obj.custoAssessoria === "number" ? obj.custoAssessoria : 0;
                  }
                }

                const totalInversoes = items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0) + custo;
                const estimatedValue = Number(sub.proposal.estimated_value) || 0;
                const isValid = Math.abs(totalInversoes - estimatedValue) < 0.01;
                
                const formatCurrency = (val: number) => {
                  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
                };

                const invStatus = (invData as any)?.status || "pendente";
                const invRejectionReason = (invData as any)?.rejection_reason || "";

                let cardBorder = "border-slate-200 dark:border-slate-800";
                let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50";
                let badgeLabel = "Pendente ⏳";

                if (invStatus === "aprovado") {
                  cardBorder = "border-emerald-300 dark:border-emerald-900/60";
                  badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
                  badgeLabel = "Aprovado ✅";
                } else if (invStatus === "reprovado") {
                  cardBorder = "border-rose-300 dark:border-rose-900/60";
                  badgeColor = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
                  badgeLabel = "Reprovado ❌";
                }

                return (
                  <div className={`p-6 rounded-3xl border-2 shadow-sm animate-fade-in mb-8 relative bg-white dark:bg-slate-950 pt-8 ${cardBorder}`}>
                    
                    {/* Top Right Mini Badge */}
                    <div className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {badgeLabel}
                    </div>

                    {/* Left Aligned Content Header matching the rest of the documents */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <FileBarChart className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-tight">
                          INVERSÕES DO PLANO PROPOSTO
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                          Análise do Plano de Negócio
                        </p>
                      </div>
                    </div>

                    {/* Rejection Reason Box */}
                    {invStatus === "reprovado" && invRejectionReason && (
                      <div className="bg-rose-100/60 border border-rose-200 rounded-2xl p-4 mb-4">
                        <p className="text-xs text-rose-800 leading-relaxed">
                          <span className="font-bold">Motivo da Reprovação das Inversões:</span> {invRejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-sm w-fit">
                        <span className="text-indigo-600 text-base">📊</span>
                        <p className="text-indigo-700 text-xs font-black uppercase tracking-widest">
                          DETALHAMENTO
                        </p>
                      </div>
                      {/* Validador de Valor da Proposta */}
                      <div className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                        isValid 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {isValid ? (
                          <span>✅ Inversões validadas! Soma bate 100% com o valor proposto: {formatCurrency(estimatedValue)}</span>
                        ) : (
                          <span>⚠️ Soma divergente: {formatCurrency(totalInversoes)} (Proposta: {formatCurrency(estimatedValue)})</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 font-semibold">
                      Conferência detalhada dos itens de investimento preenchidos pelo projetista no plano de negócio da operação.
                    </p>

                    <div className="space-y-3">
                      {items.length === 0 && custo === 0 && (
                        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 text-center">
                          <p className="text-xs text-rose-700 font-bold">
                            ⚠️ Nenhuma inversão de plano cadastrada para esta proposta. Os itens de investimento devem ser preenchidos pelo projetista para validação.
                          </p>
                        </div>
                      )}
                      {items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                          {/* Quantidade */}
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Quant.</label>
                            <input
                              type="number"
                              value={item.quant}
                              disabled
                              className="w-full px-1 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-center bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          </div>

                          {/* Unidade */}
                          <div className="col-span-3 md:col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Unid.</label>
                            <input
                              type="text"
                              value={item.unid || "UNID"}
                              disabled
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-center bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          </div>

                          {/* Nome / Descrição */}
                          <div className="col-span-4 md:col-span-6">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Item / Inversão</label>
                            <input
                              type="text"
                              value={item.nome}
                              disabled
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          </div>

                          {/* Valor Total */}
                          <div className="col-span-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Valor Total (R$)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                              <input
                                type="text"
                                value={new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.valor)}
                                disabled
                                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Campo de Custo Assessoria */}
                      {custo > 0 && (
                        <div className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mt-3">
                          {/* Nome / Descrição */}
                          <div className="col-span-9 md:col-span-9">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Item / Inversão</label>
                            <input
                              type="text"
                              value="CUSTO ASSESSORIA EMPRESARIAL E TÉCNICA"
                              disabled
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                          </div>

                          <div className="col-span-12 md:col-span-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block mb-1">Valor Total (R$)</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                              <input
                                type="text"
                                value={new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(custo)}
                                disabled
                                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="my-5 opacity-50" />

                    {/* Barra de Ações para Inversões */}
                    {(() => {
                      const planoAssinadoFile = sub.files.find((f) => {
                        const type = f.document_type.toLowerCase();
                        const isVirtual = f.file_path === "preenchido" || f.file_path === "dispensado" || f.file_path === "habilitado";
                        if (isVirtual) return false;
                        return type === "plano_assinado" || type === "plano_eletronico" || type.includes("plano");
                      });
                      const hasPlanoFile = !!planoAssinadoFile;

                      return (
                        <div className="flex items-center gap-2 justify-center flex-wrap pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 rounded-xl text-[11px] font-bold h-8 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            disabled={pdfLoading || !hasPlanoFile}
                            onClick={() => {
                              if (planoAssinadoFile) {
                                handleViewPdf(planoAssinadoFile.file_path, planoAssinadoFile.file_name);
                              }
                            }}
                          >
                            {pdfLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            Ver Plano
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 rounded-xl text-[11px] font-bold h-8 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            disabled={!hasPlanoFile}
                            onClick={() => {
                              if (planoAssinadoFile) {
                                downloadFile(planoAssinadoFile.file_path, planoAssinadoFile.file_name);
                              }
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Baixar Plano
                          </Button>
                          {invStatus !== "aprovado" && (
                            <Button
                              size="sm"
                              className="gap-1 rounded-xl text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              onClick={() => handleApproveInversoes(sub.proposal.id, sub.proposal.inversoes)}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              Aprovar Inversões
                            </Button>
                          )}
                          {invStatus !== "reprovado" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1 rounded-xl text-[11px] font-bold h-8 shadow-sm"
                              onClick={() => handleOpenInversoesRejectDialog(sub.proposal.id, sub.proposal.inversoes)}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                              Reprovar Inversões
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {renderGrid("Declarações Ambientais", DECLARACOES_AMBIENTAIS_KEYS, <FileCheck className="h-5 w-5 text-emerald-500" />, true)}
              {renderGrid("Outros Documentos", unknownKeys, <FileText className="h-5 w-5 text-slate-500" />)}
            </div>
          );
        })()}

        {sub.files.length === 0 && (
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">Nenhum documento enviado nesta proposta.</p>
            </CardContent>
          </Card>
        )}

        {/* ── PDF Viewer Dialog ───────────────────────────────── */}
        <Dialog open={isPdfDialogOpen} onOpenChange={handleClosePdfDialog}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {viewingPdfName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pré-visualização do documento enviado
              </DialogDescription>
            </DialogHeader>
            <div className="h-[80vh] w-full bg-muted/20">
              {viewingPdfUrl ? (
                <iframe
                  src={viewingPdfUrl}
                  className="w-full h-full border-0"
                  title={viewingPdfName}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Reject Dialog ──────────────────────────────────── */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Documento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Confirmar Reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ── Bulk Reject Dialog ──────────────────────────────────── */}
        <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Todos os Documentos
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação em lote de todos os documentos. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação geral..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setBulkRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!bulkRejectReason.trim()}
                onClick={handleConfirmBulkReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Reprovar Todos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Inversões Reject Dialog ──────────────────────────────────── */}
        <Dialog open={inversoesRejectDialogOpen} onOpenChange={setInversoesRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Inversões do Plano
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo de reprovação das inversões do plano de negócios.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação das inversões..."
              value={inversoesRejectReason}
              onChange={(e) => setInversoesRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setInversoesRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!inversoesRejectReason.trim()}
                onClick={handleConfirmRejectInversoes}
              >
                <ThumbsDown className="h-4 w-4" />
                Confirmar Reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Revert Confirmation Dialog ──────────────────────────── */}
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-amber-500" />
                Reverter Proposta
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Isto irá restaurar o status da proposta para{" "}
                <strong>{sub.token.previous_status || "CADASTRADA"}</strong>,
                excluir todos os documentos enviados e remover o token de envio.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRevertDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isReverting}
                onClick={async () => {
                  setIsReverting(true);
                  const success = await revertProposal(sub);
                  setIsReverting(false);
                  if (success) {
                    setRevertDialogOpen(false);
                    setSelectedSubmission(null);
                  }
                }}
              >
                {isReverting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Revertendo...
                  </>
                ) : (
                  <>
                    <Undo2 className="h-4 w-4" />
                    Confirmar Reversão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Parecer Gerencial Dialog ────────────────────────────── */}
        <Dialog open={parecerDialogOpen} onOpenChange={setParecerDialogOpen}>
          <DialogContent className="max-w-6xl w-[95vw] rounded-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2 text-indigo-700">
                <FileText className="h-5 w-5" />
                Gerador de Parecer Gerencial da Agência
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Preencha as informações para compilar e exportar o parecer gerencial da proposta rural.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* PAINEL ESQUERDO: FORMULÁRIO DE PREENCHIMENTO */}
              <div className="lg:col-span-5 p-6 overflow-y-auto space-y-4 border-r border-border/40 max-h-[50vh] lg:max-h-[none]">
                {/* Dados da Proposta Relacionada */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl space-y-2">
                  <h4 className="font-heading font-black text-[11px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Dados da Proposta Relacionada
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px]">
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Proponente:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sub.proposal.producer_name.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">CPF:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{sub.proposal.producer_cpf || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Programa de Crédito:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{is699Selected ? "PRONAF A (699)" : (sub.proposal.credit_program || "—")}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Linha de Crédito:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{is699Selected ? "PRONAF A 699" : (sub.proposal.linha_credito || "—")}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Valor Estimado:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        {(Number(sub.proposal.estimated_value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Município:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sub.proposal.municipio || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-bold text-[9px] uppercase tracking-wider">Projetista:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sub.proposal.projetista || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* Seção 1: Atividade do Plano */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-indigo-600">
                    Atividade e Gênero do Proponente
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Gênero do(a) Proponente (Concordância Gramatical)
                      </label>
                      <Select
                        value={parecerGeneroProponente}
                        onValueChange={setParecerGeneroProponente}
                      >
                        <SelectTrigger className="rounded-xl bg-background border-border/60">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="MASCULINO">MASCULINO (o, agricultor, enquadrado, miniprodutor)</SelectItem>
                          <SelectItem value="FEMININO">FEMININO (a, agricultora, enquadrada, miniprodutora)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Atividade Principal do Plano
                      </label>
                      <Input
                        className="rounded-xl"
                        placeholder="Ex: Pecuária Leiteira"
                        value={parecerAtividadePlano}
                        onChange={(e) => setParecerAtividadePlano(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Imóvel Rural e CAR */}
                {(() => {
                  const carIndFile = selectedSubmission?.files?.find(f => f.document_type === "car_individual");
                  const isCarIndDispensed = carIndFile?.file_path === "dispensado";

                  if (isCarIndDispensed) {
                    return (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          ℹ️ Imóvel Rural / CAR Individual dispensado para esta operação.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs uppercase tracking-wider text-indigo-600">
                          Imóvel Rural & CAR Individual
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Possui/Utilizará CAR Individual?
                          </label>
                          <Select
                            value={parecerUtilizaCarIndividual}
                            onValueChange={(val) => {
                              setParecerUtilizaCarIndividual(val);
                              if (val === "NÃO") {
                                setParecerNomeImovel("");
                                setParecerCarIndividual("");
                              }
                            }}
                          >
                            <SelectTrigger className="rounded-xl bg-background border-border/60">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="SIM">SIM</SelectItem>
                              <SelectItem value="NÃO">NÃO (Somente Assentamento/CAR Coletivo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {parecerUtilizaCarIndividual === "SIM" && (
                          <>
                            <div className="space-y-1.5 animate-fade-in">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Nome do Imóvel Rural
                              </label>
                              <Input
                                className="rounded-xl"
                                placeholder="Ex: Fazenda Santa Maria"
                                value={parecerNomeImovel}
                                onChange={(e) => setParecerNomeImovel(e.target.value)}
                              />
                            </div>
                            <div className="space-y-1.5 animate-fade-in">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Registro CAR Individual
                              </label>
                              <Input
                                className="rounded-xl font-mono text-xs"
                                placeholder="Ex: MA-2106201-..."
                                value={parecerCarIndividual}
                                onChange={(e) => setParecerCarIndividual(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Seção 3: Assentamento e CAR Coletivo */}
                {(() => {
                  const carColFile = selectedSubmission?.files?.find(f => f.document_type === "car_coletivo");
                  const isCarColDispensed = carColFile?.file_path === "dispensado";

                  if (isCarColDispensed) {
                    return (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-500">
                          ℹ️ Projeto de Assentamento / CAR Coletivo dispensado para esta operação.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-indigo-600">
                        Projeto de Assentamento & CAR Coletivo
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Nº Projeto Assent.
                            </label>
                            <Input
                              className="rounded-xl"
                              placeholder="Ex: 243"
                              value={parecerNumProjetoPA}
                              onChange={(e) => setParecerNumProjetoPA(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Nome do PA
                            </label>
                            <Input
                              className="rounded-xl"
                              placeholder="Ex: PA Nova Vida"
                              value={parecerNomePA}
                              onChange={(e) => setParecerNomePA(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Registro CAR Coletivo
                          </label>
                          <Input
                            className="rounded-xl font-mono text-xs"
                            placeholder="Ex: MA-2100342-..."
                            value={parecerCarColetivo}
                            onChange={(e) => setParecerCarColetivo(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Seção 4: Inversões */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-indigo-600">
                      Inversões (Investimento Fixo)
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                      onClick={() => setParecerInversoes([...parecerInversoes, { quant: 1, unid: "UNID", nome: "", valor: 0 }])}
                    >
                      + Adicionar Inversão
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {parecerInversoes.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                        {/* Qtd */}
                        <div className="w-[50px] shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quant || ""}
                            onChange={(e) => {
                              const updated = [...parecerInversoes];
                              updated[idx] = {
                                ...updated[idx],
                                quant: Math.max(1, parseInt(e.target.value) || 1)
                              };
                              setParecerInversoes(updated);
                            }}
                            className="w-full text-center text-xs h-7 border border-slate-200 rounded-md font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Qtd"
                          />
                        </div>

                        {/* Unid */}
                        <div className="w-[70px] shrink-0">
                          <select
                            value={item.unid || "UNID"}
                            onChange={(e) => {
                              const updated = [...parecerInversoes];
                              updated[idx] = {
                                ...updated[idx],
                                unid: e.target.value
                              };
                              setParecerInversoes(updated);
                            }}
                            className="w-full text-center text-[10px] font-bold h-7 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="UNID">UNID</option>
                            <option value="CX">CX</option>
                            <option value="SC">SC</option>
                            <option value="T">T</option>
                            <option value="HECT">HECT</option>
                          </select>
                        </div>

                        {/* Descrição */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.nome || ""}
                            onChange={(e) => {
                              const updated = [...parecerInversoes];
                              updated[idx] = {
                                ...updated[idx],
                                nome: e.target.value.toUpperCase()
                              };
                              setParecerInversoes(updated);
                            }}
                            className="w-full px-2 text-xs h-7 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-semibold"
                            placeholder="Descrição do item"
                          />
                        </div>

                        {/* Valor */}
                        <div className="w-[100px] shrink-0">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.valor || ""}
                            onChange={(e) => {
                              const updated = [...parecerInversoes];
                              updated[idx] = {
                                ...updated[idx],
                                valor: parseFloat(e.target.value) || 0
                              };
                              setParecerInversoes(updated);
                            }}
                            className="w-full px-1.5 text-right text-xs h-7 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            placeholder="Valor R$"
                          />
                        </div>

                        {/* Excluir */}
                        {parecerInversoes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                            onClick={() => {
                              const updated = parecerInversoes.filter((_, i) => i !== idx);
                              setParecerInversoes(updated);
                            }}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção 5: Condições da Operação */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border/40 space-y-3">
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-indigo-600">
                    Prazos & Condições
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Carência (em meses)
                      </label>
                      <Input
                        className="rounded-xl"
                        placeholder="Ex: 36 meses"
                        value={parecerCarenciaMeses}
                        onChange={(e) => setParecerCarenciaMeses(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Prazo Total (em meses)
                      </label>
                      <Input
                        className="rounded-xl"
                        placeholder="Ex: 120 meses"
                        value={parecerTotalMeses}
                        onChange={(e) => setParecerTotalMeses(e.target.value)}
                      />
                    </div>
                  </div>

                  {is699Selected && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        Agência de Histórico PRONAF A
                      </label>
                      <Input
                        className="rounded-xl border-indigo-200 focus-visible:ring-indigo-500"
                        placeholder="Ex: Agência Maracaçumé (MA)"
                        value={parecerAgenciaHistorico}
                        onChange={(e) => setParecerAgenciaHistorico(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* PAINEL DIREITO: PRE-VISUALIZAÇÃO EM TEMPO REAL */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden max-h-[40vh] lg:max-h-[none]">
                <div className="p-4 border-b border-border/40 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    Pré-visualização do Parecer (Tempo Real)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedParecerText);
                      toast({
                        title: "Copiado! 📋",
                        description: "O texto do parecer foi copiado para a área de transferência.",
                      });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Copiar Texto
                  </Button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  <pre className="font-sans text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap select-text bg-white dark:bg-slate-950 p-4 border border-border/40 rounded-xl font-medium shadow-sm">
                    {generatedParecerText}
                  </pre>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/40 bg-white dark:bg-slate-950 gap-2 shrink-0 flex-row justify-end">
              <Button
                variant="outline"
                className="rounded-xl h-10 px-6 font-bold"
                onClick={() => setParecerDialogOpen(false)}
              >
                Fechar
              </Button>
              <Button
                className="rounded-xl h-10 px-6 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString("pt-BR");
                  const d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
                  const W = d.internal.pageSize.getWidth();
                  const H = d.internal.pageSize.getHeight();

                  // Header Band
                  d.setFillColor(15, 23, 42);
                  d.rect(0, 0, W, 38, "F");
                  d.setFillColor(79, 70, 229);
                  d.rect(0, 38, W, 2, "F");

                  d.setTextColor(255, 255, 255);
                  d.setFont("helvetica", "bold");
                  d.setFontSize(11);
                  d.text("PARECER GERENCIAL DA AGÊNCIA", 14, 15);
                  d.setFontSize(9);
                  d.text("OPERAÇÃO PRONAF GRUPO A", 14, 21);
 
                  // Metadata right aligned
                  d.setFontSize(6.8);
                  d.setTextColor(148, 163, 184);
                  d.text("PROGRAMA NACIONAL DE FORTALECIMENTO DA AGRICULTURA FAMILIAR", W - 14, 14, { align: "right" });
                  d.setTextColor(255, 255, 255);
                  d.setFont("helvetica", "normal");
                  d.setFontSize(8);
                  d.text(`Proponente: ${sub.proposal.producer_name.toUpperCase()}`, W - 14, 20, { align: "right" });
                  d.text(`CPF: ${sub.proposal.producer_cpf || "—"}`, W - 14, 25, { align: "right" });
 
                  // Content
                  let curY = 46;
                  d.setFont("helvetica", "normal");
                  d.setFontSize(8.5);
                  d.setTextColor(30, 41, 59);
 
                  // Split generatedParecerText by double newline to treat as paragraphs
                  const paragraphs = generatedParecerText.split("\n\n");
                  paragraphs.forEach((pText) => {
                    if (pText.includes("O financiamento proposto contempla investimento fixo EM:")) {
                      const lines = d.splitTextToSize("O financiamento proposto contempla investimento fixo EM:", W - 28);
                      const blockH = lines.length * 4.0 + 2;
                      if (curY + blockH > H - 18) {
                        d.addPage();
                        curY = 12;
                      }
                      d.text(lines, 14, curY, { leading: 4.0 });
                      curY += blockH;

                      // Tabela elegante de Inversões
                      const tableRows = parecerInversoes
                        .filter(item => (item.nome || "").trim().length > 0)
                        .map(item => {
                          const q = String(item.quant || 1);
                          const u = (item.unid || "UNID").toUpperCase();
                          const n = (item.nome || "").trim().toUpperCase();
                          const v = (item.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          return [q, u, n, `R$ ${v}`];
                        });

                      autoTable(d, {
                        startY: curY,
                        head: [["QTD", "UNID", "DESCRIÇÃO DO ITEM / INVESTIMENTO FIXO", "VALOR TOTAL (R$)"]],
                        body: tableRows,
                        theme: "striped",
                        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
                        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
                        styles: { cellPadding: 1.5 },
                        columnStyles: {
                          0: { cellWidth: 12, halign: "center" },
                          1: { cellWidth: 16, halign: "center" },
                          2: { cellWidth: "auto" },
                          3: { cellWidth: 32, halign: "right" }
                        },
                        margin: { left: 14, right: 14 }
                      });

                      curY = (d as any).lastAutoTable.finalY + 4;
                    } else {
                      const lines = d.splitTextToSize(pText, W - 28);
                      const blockH = lines.length * 4.0 + 3;
                      if (curY + blockH > H - 18) {
                        d.addPage();
                        curY = 12;
                      }
                      d.text(lines, 14, curY, { leading: 4.0 });
                      curY += blockH;
                    }
                  });

                  // Representatives Block (no lines, just text)
                  const footerBlockH = 20;
                  if (curY + footerBlockH > H - 15) {
                    d.addPage();
                    curY = 20;
                  }

                  const textY = curY + 6;
                  d.setFont("helvetica", "bold");
                  d.setFontSize(7.5);
                  d.setTextColor(15, 23, 42);
                  d.text("MIERCIO BRUNO MIRANDA FRANCO F126870", 14, textY);
                  d.setFont("helvetica", "normal");
                  d.text("GERENTE DE AGENCIA", 14, textY + 4);

                  d.setFont("helvetica", "bold");
                  d.text("JAIRO FERREIRA DOS SANTOS F154768", W / 2 + 10, textY);
                  d.setFont("helvetica", "normal");
                  d.text("GERENTE DE RELACIONAMENTO", W / 2 + 10, textY + 4);

                  // Page Footer
                  d.setFillColor(15, 23, 42);
                  d.rect(0, H - 9, W, 9, "F");
                  d.setFont("helvetica", "normal");
                  d.setFontSize(6.5);
                  d.setTextColor(148, 163, 184);
                  d.text(`Gerado em ${dateStr}  ·  Proponente: ${sub.proposal.producer_name}`, 14, H - 3.5);
                  d.text(`PRONAF - Parecer Gerencial`, W - 14, H - 3.5, { align: "right" });

                  const safeName = (sub.proposal.producer_name || "Produtor")
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "_").toUpperCase();
                  d.save(`Parecer_Gerencial_${safeName}.pdf`);
                  setParecerDialogOpen(false);

                  toast({
                    title: "Parecer Gerencial gerado! 📄",
                    description: "O parecer foi impresso em PDF e salvo no seu computador.",
                  });
                }}
              >
                <FileText className="h-4 w-4" />
                Gerar PDF do Parecer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── List View (no proposal selected) ─────────────────────────
  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight">
              Documentação
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de conformidade e análise documental
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            onClick={() => {
              setReportFilterProjetista("all");
              setReportFilterPrograma("all");
              setReportDialogOpen(true);
            }}
          >
            <FileBarChart className="h-4 w-4" />
            Gerar Relatório
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ── Agency Task Status Banner ──────────────────────────── */}
      <Card className={`border-border/40 shadow-premium rounded-3xl overflow-hidden backdrop-blur-sm ${
        allConcluded 
          ? "bg-emerald-500/10 border-emerald-500/20" 
          : "bg-amber-500/10 border-amber-500/20"
      }`}>
        <CardContent className="py-4 px-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${
              allConcluded ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}>
              {allConcluded ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Status da Agência ({currentAgencyName})
              </p>
              <h3 className="font-heading font-extrabold text-sm md:text-base leading-tight">
                {allConcluded 
                  ? "Todas as tarefas desta agência estão concluídas!" 
                  : `Existem ${pendingTasksCount} tarefa(s) pendente(s) nesta agência.`
                }
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {allConcluded 
                  ? "Não há pendências de documentação ou envios pendentes para a Central." 
                  : "Verifique a lista de propostas recebidas e autorizadas abaixo para concluir os envios."
                }
              </p>
            </div>
          </div>
          <Badge className={`text-xs px-2.5 py-1 rounded-full font-bold ${
            allConcluded 
              ? "bg-emerald-500 text-white hover:bg-emerald-500" 
              : "bg-amber-500 text-white hover:bg-amber-500"
          }`}>
            {allConcluded ? "Concluído" : "Pendentes"}
          </Badge>
        </CardContent>
      </Card>

      {/* ── Report Dialog ─────────────────────────────────── */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-indigo-500" />
              Gerar Relatório PDF
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Selecione os filtros para gerar o relatório de documentação com KPIs e links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Projetista
              </label>
              <Select value={reportFilterProjetista} onValueChange={setReportFilterProjetista}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos os projetistas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetistas</SelectItem>
                  {allProjetistas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Programa de Crédito
              </label>
              <Select value={reportFilterPrograma} onValueChange={setReportFilterPrograma}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  {allProgramas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={generateReport}
            >
              <FileBarChart className="h-4 w-4" />
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Recebidas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight">
                  {totalSubmissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fully Approved */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Totalmente Aprovadas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-emerald-600">
                  {fullyApproved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Pending */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Pendências
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-amber-600">
                  {withPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Rejections */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Reprovações
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-red-600">
                  {withRejections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Stats Cards - Authorized ─────────────────────────── */}
      {filteredAuthorizedForStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500/10">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Autorizadas (Aguardando Documentação)
                  </p>
                  <p className="font-heading font-extrabold text-2xl leading-tight text-blue-600">
                    {filteredAuthorizedForStats.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-violet-500/10">
                  <Link2 className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Com Link Gerado
                  </p>
                  <p className="font-heading font-extrabold text-2xl leading-tight text-violet-600">
                    {filteredAuthorizedForStats.filter((p) => p.token).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Search Bar & Filter ─────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do produtor ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-border/60 bg-background/60"
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={pageFilterProjetista} onValueChange={setPageFilterProjetista}>
                <SelectTrigger className="rounded-xl border-border/60 bg-background/60">
                  <SelectValue placeholder="Filtrar por projetista" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Projetistas</SelectItem>
                  {allProjetistas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="rounded-xl border-border/60 bg-background/60">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="aguardando">Aguardando Docs</SelectItem>
                  <SelectItem value="apto">Apto para Envio</SelectItem>
                  <SelectItem value="enviado">Enviado para Central</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table: Propostas Recebidas ────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-6 pt-5">
          <CardTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Propostas Recebidas
            <Badge variant="secondary" className="ml-2 font-mono text-xs">
              {filteredSubmissions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileCheck className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">
                {searchTerm.trim()
                  ? "Nenhuma proposta encontrada com os termos pesquisados."
                  : "Nenhuma documentação recebida até o momento."}
              </p>
            </div>
          ) : (
             <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6">
                        Produtor
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Valor / Programa
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Projetista
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Status Docs
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Status Proposta
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Docs Agência (7)
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Município
                      </TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => {
                      const pct =
                        sub.totalFiles > 0
                          ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
                          : 0;
                      const allOk = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;
                      const hasRejects = sub.rejectedCount > 0;

                      return (
                        <TableRow
                          key={sub.token.id}
                          className="cursor-pointer transition-all duration-300 hover:bg-accent/50 border-border/30"
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          <TableCell className="pl-6 py-4">
                            <div>
                              <p className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">
                                {sub.proposal.producer_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {sub.proposal.producer_cpf || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                                {sub.proposal.estimated_value ? sub.proposal.estimated_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                              </p>
                              <p className="text-[10.5px] font-medium text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">
                                {sub.proposal.credit_program || sub.proposal.linha_credito || "—"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {sub.proposal.projetista || "—"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5 min-w-[140px]">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  allOk
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : hasRejects
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                }`}
                              >
                                {sub.approvedCount}/{sub.totalFiles} aprovados
                              </Badge>
                              <Progress value={pct} className="h-1.5 rounded-full" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.proposal.status === "ENVIADO PARA CENTRAL" ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 font-semibold rounded-md bg-blue-50 text-blue-700 border-blue-200"
                              >
                                Enviado para Central
                              </Badge>
                            ) : !allOk || hasRejects ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 font-semibold rounded-md ${
                                  hasRejects
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                Aguardando a documentação para envio à Central
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 font-semibold rounded-md bg-emerald-50 text-emerald-700 border-emerald-200"
                              >
                                Todos os Documentos Aprovados - Aguardando Envio à Central
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const agencyDocsCompletedCount = AGENCY_DOCUMENTATION.filter((doc) => {
                                const existingFile = sub.files.find((f) => f.document_type === doc.key);
                                const CONFIRMATION_ACTIVITY_KEYS = [
                                  "parecer_gerencial",
                                  "consulta_s400",
                                  "registro_visita_gerencial",
                                  "avaliacao_risco",
                                  "consulta_restricoes_serasa"
                                ];
                                if (doc.key === "consulta_historico_operacao_pronaf") {
                                  return !!existingFile?.ged_id && existingFile.ged_id !== "";
                                }
                                if (CONFIRMATION_ACTIVITY_KEYS.includes(doc.key)) {
                                  return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO");
                                }
                                return !!existingFile?.ged_id && existingFile.ged_id.trim() !== "";
                              }).length;

                              const isComplete = agencyDocsCompletedCount === AGENCY_DOCUMENTATION.length;

                              return (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-2 py-0.5 font-semibold rounded-md ${
                                    isComplete
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                  }`}
                                >
                                  {isComplete ? "Completa" : `${agencyDocsCompletedCount}/${AGENCY_DOCUMENTATION.length} Concluídos`}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {sub.proposal.municipio || "—"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Copiar Link de Envio"
                                onClick={async () => {
                                  const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                                  await navigator.clipboard.writeText(url);
                                  toast({
                                    title: "Link copiado! 📋",
                                    description: "O link de envio foi copiado para sua área de transferência.",
                                  });
                                }}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl h-8 w-8 text-slate-500 hover:text-slate-700"
                                title="Visualizar Detalhes"
                                onClick={() => setSelectedSubmission(sub)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="block md:hidden divide-y divide-border/30">
                {filteredSubmissions.map((sub) => {
                  const pct =
                    sub.totalFiles > 0
                      ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
                      : 0;
                  const allOk = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;
                  const hasRejects = sub.rejectedCount > 0;

                  return (
                    <div
                      key={sub.token.id}
                      className="p-5 space-y-4 hover:bg-accent/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-950 dark:text-slate-50 leading-tight truncate">
                            {sub.proposal.producer_name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {sub.proposal.producer_cpf || "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 leading-tight">
                            {sub.proposal.estimated_value ? sub.proposal.estimated_value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                            {sub.proposal.credit_program || sub.proposal.linha_credito || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-2.5 rounded-xl">
                        <div>
                          <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Projetista</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{sub.proposal.projetista || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Município</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{sub.proposal.municipio || "—"}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-semibold">Status de Docs</span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 font-medium ${
                              allOk
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : hasRejects
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}
                          >
                            {sub.approvedCount}/{sub.totalFiles} aprovados
                          </Badge>
                        </div>
                        <Progress value={pct} className="h-1.5 rounded-full" />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/20">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {sub.proposal.status === "ENVIADO PARA CENTRAL" ? (
                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                              Enviado para Central
                            </Badge>
                          ) : !allOk || hasRejects ? (
                            <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                              Aguardando Docs
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              Apto para Envio
                            </Badge>
                          )}

                          {(() => {
                            const agencyDocsCompletedCount = AGENCY_DOCUMENTATION.filter((doc) => {
                              const existingFile = sub.files.find((f) => f.document_type === doc.key);
                              const CONFIRMATION_ACTIVITY_KEYS = [
                                "parecer_gerencial",
                                "consulta_s400",
                                "registro_visita_gerencial",
                                "avaliacao_risco",
                                "consulta_restricoes_serasa"
                              ];
                              if (doc.key === "consulta_historico_operacao_pronaf") {
                                return !!existingFile?.ged_id && existingFile.ged_id !== "";
                              }
                              if (CONFIRMATION_ACTIVITY_KEYS.includes(doc.key)) {
                                return !!existingFile?.ged_id && existingFile.ged_id.startsWith("CONFIRMADO");
                              }
                              return !!existingFile?.ged_id && existingFile.ged_id.trim() !== "";
                            }).length;

                            const isComplete = agencyDocsCompletedCount === AGENCY_DOCUMENTATION.length;

                            return (
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-bold ${
                                  isComplete
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                }`}
                              >
                                Agência: {isComplete ? "Completa" : `${agencyDocsCompletedCount}/${AGENCY_DOCUMENTATION.length}`}
                              </Badge>
                            );
                          })()}
                        </div>

                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-semibold gap-1 px-2 border-border/80 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={async () => {
                              const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                              await navigator.clipboard.writeText(url);
                              toast({
                                title: "Link copiado! 📋",
                                description: "O link de envio foi copiado para sua área de transferência.",
                              });
                            }}
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs font-semibold gap-1 px-2 border-border/80"
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Aguardando Documentação Table ─────────────────────── */}
      {filteredAuthorized.length > 0 && (
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-3 px-6 pt-5">
            <CardTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Aguardando Documentação
              <Badge variant="secondary" className="ml-2 font-mono text-xs bg-blue-100 text-blue-700 border-blue-200">
                {filteredAuthorized.length}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Propostas com status "Autorizado Envio para Central" — link de envio gerado automaticamente
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6">
                      Produtor
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Projetista
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Município
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuthorized.map((p) => (
                    <TableRow
                      key={p.id}
                      className="transition-all duration-300 hover:bg-accent/50 border-border/30"
                    >
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="font-semibold text-sm leading-tight">
                            {p.producer_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.producer_cpf || "CPF não informado"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {p.projetista || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-100 text-blue-700 border-blue-200"
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {p.municipio || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {p.token ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Copiar Link de Envio"
                            onClick={async () => {
                              const url = `${window.location.origin}/enviar-documentacao?token=${p.token}`;
                              await navigator.clipboard.writeText(url);
                              toast({
                                title: "Link copiado! 📋",
                                description: "Link da página de envio copiado.",
                              });
                            }}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground inline-block" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}






