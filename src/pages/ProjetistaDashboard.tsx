import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderCheck,
  FileText,
  User,
  Phone,
  Mail,
  Award,
  MapPin,
  ExternalLink,
  LogOut,
  RefreshCw,
  Building2,
  DollarSign,
  Share2,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  PlusCircle,
  Send,
  UploadCloud,
  FileUp,
  X,
  Trash2,
  Calculator,
  HelpCircle,
  Eye,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";
import { useInversoesReferencia } from "@/hooks/useInversoesReferencia";
import { InversaoCombobox } from "@/components/inversoes/InversaoCombobox";
import { InversaoReferencia } from "@/types/inversoes";

// ── Linhas PRONAF Oficiais com Tetos Normativos ─────────────────────────────
export const PRONAF_LINES = [
  {
    id: "custeio",
    label: "Custeio Agrícola",
    teto: 250000,
    desc: "Financiamento de despesas operacionais de lavouras e insumos agropecuários.",
  },
  {
    id: "custeio_renovacao",
    label: "Custeio Pecuário / Renovação",
    teto: 250000,
    desc: "Custeio de rebanhos, pastagens, rações e renovação de custeios anteriores.",
  },
  {
    id: "pronaf_mais_alimento",
    label: "Pronaf Mais Alimentos",
    teto: 210000,
    desc: "Investimento em máquinas, tratores, implementos e irrigação para produção de alimentos.",
  },
  {
    id: "cartao_bnb",
    label: "Cartão BNB Agro",
    teto: 100000,
    desc: "Limite rotativo pré-aprovado para compra direta de insumos com cartão magnético.",
  },
  {
    id: "pronaf_a_368",
    label: "Pronaf Grupo A (Res. 368)",
    teto: 50000,
    desc: "Crédito inicial estruturante para assentados da Reforma Agrária e PNCF.",
  },
  {
    id: "pronaf_a_669",
    label: "Pronaf Grupo A (Res. 669)",
    teto: 50000,
    desc: "Apoio a agricultores de baixa renda no Semiárido com rebate e subvenção.",
  },
  {
    id: "pronaf_jovem",
    label: "Pronaf Jovem / Mulher",
    teto: 30000,
    desc: "Projetos liderados por jovens agricultores (16 a 29 anos) ou mulheres rurais.",
  },
  {
    id: "investimento",
    label: "Pronaf Investimento Geral",
    teto: 210000,
    desc: "Benfeitorias, galpões, cercas, energia solar, açudagem e aquisição de matrizes.",
  },
];

interface ProjetistaInfo {
  id: string;
  name: string;
  cpf: string;
  crea_cfta: string;
  phone: string;
  email: string;
  municipio: string;
  uf: string;
  status: string;
  validado_em?: string;
  documentos?: any[];
}

interface ProposalItem {
  id: string;
  producer_name: string;
  producer_cpf?: string;
  producer_phone?: string;
  producer_address?: string;
  proposal_number?: string;
  credit_program?: string;
  linha_credito?: string;
  pronaf_line?: string;
  estimated_value?: number;
  status?: string;
  original_csv_status?: string;
  municipio?: string;
  localizacao?: string;
  pendencias?: string;
  projetista?: string;
  entry_date?: string;
  agency_id?: string;
  agency_name?: string;
  inversoes?: any[];
  notes?: string;
  updated_at?: string;
}

interface AgencyItem {
  id: string;
  name: string;
  code?: string;
}

interface InversaoFormItem {
  id: string;
  item: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tetoUnitario?: number;
  excesso?: boolean;
}

export default function ProjetistaDashboard() {
  const { user, signOut, displayName } = useAuth();
  const { toast } = useToast();
  const { inversoes: catalogoInversoes, loading: loadingCatalogo } = useInversoesReferencia();

  // Estados principais
  const [activeTab, setActiveTab] = useState<string>("acompanhamento");
  const [loading, setLoading] = useState(true);
  const [projetistaInfo, setProjetistaInfo] = useState<ProjetistaInfo | null>(null);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modais
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [regularizeProposal, setRegularizeProposal] = useState<ProposalItem | null>(null);
  const [regularizeText, setRegularizeText] = useState("");
  const [regularizeFile, setRegularizeFile] = useState<File | null>(null);
  const [submittingRegularize, setSubmittingRegularize] = useState(false);

  // Modal de sucesso de nova proposta
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  // ── Formulário de Envio de Nova Proposta ────────────────────────────────────
  const [newPropProducerName, setNewPropProducerName] = useState("");
  const [newPropProducerCpf, setNewPropProducerCpf] = useState("");
  const [newPropProducerPhone, setNewPropProducerPhone] = useState("");
  const [newPropMunicipio, setNewPropMunicipio] = useState("");
  const [newPropLocalizacao, setNewPropLocalizacao] = useState("");
  const [newPropDapCaf, setNewPropDapCaf] = useState("");
  const [newPropAgenciaId, setNewPropAgenciaId] = useState("");
  const [newPropLinha, setNewPropLinha] = useState("custeio");
  const [newPropAtividade, setNewPropAtividade] = useState("");
  const [newPropValorSolicitado, setNewPropValorSolicitado] = useState<number>(0);
  const [newPropInversoes, setNewPropInversoes] = useState<InversaoFormItem[]>([]);
  const [newPropParecer, setNewPropParecer] = useState("");
  const [submittingNewProp, setSubmittingNewProp] = useState(false);

  // Arquivos anexos da nova proposta
  const [docProjetoTecnico, setDocProjetoTecnico] = useState<File | null>(null);
  const [docDapCaf, setDocDapCaf] = useState<File | null>(null);
  const [docOrcamentos, setDocOrcamentos] = useState<File | null>(null);
  const [docRgCpf, setDocRgCpf] = useState<File | null>(null);
  const [docComprovanteImovel, setDocComprovanteImovel] = useState<File | null>(null);

  // Formatação de CPF e Telefone
  const formatCPF = (v: string) => {
    return v
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (v: string) => {
    return v
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  // Carregar Dados
  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Buscar registro do projetista em public.projetistas
      const { data: projData } = await supabase
        .from("projetistas")
        .select("*")
        .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let currentProj: ProjetistaInfo | null = null;
      if (projData) {
        currentProj = {
          id: projData.id,
          name: projData.name,
          cpf: projData.cpf || "",
          crea_cfta: projData.crea_cfta || "",
          phone: projData.phone || "",
          email: projData.email || user.email || "",
          municipio: projData.municipio || "",
          uf: projData.uf || "",
          status: projData.status || "ativo",
          validado_em: projData.validado_em,
          documentos: Array.isArray(projData.documentos) ? projData.documentos : [],
        };
        setProjetistaInfo(currentProj);
        if (!newPropMunicipio && projData.municipio) {
          setNewPropMunicipio(projData.municipio);
        }
      } else {
        currentProj = {
          id: user.id,
          name: displayName || user.email || "Projetista",
          cpf: "",
          crea_cfta: "",
          phone: "",
          email: user.email || "",
          municipio: "",
          uf: "",
          status: "ativo",
        };
        setProjetistaInfo(currentProj);
      }

      // 2. Buscar agências disponíveis
      const { data: agData } = await supabase
        .from("agencies")
        .select("id, name, code")
        .order("name", { ascending: true });

      if (agData && agData.length > 0) {
        setAgencies(agData);
        if (!newPropAgenciaId) {
          setNewPropAgenciaId(agData[0].id);
        }
      }

      // 3. Buscar propostas associadas a este projetista no estoque (stock_proposals)
      const projName = currentProj.name.trim();

      let stockQuery = supabase
        .from("stock_proposals")
        .select("*")
        .order("updated_at", { ascending: false });

      if (projName) {
        stockQuery = stockQuery.or(
          `projetista.ilike.%${projName}%,created_by.eq.${user.id}`
        );
      } else {
        stockQuery = stockQuery.eq("created_by", user.id);
      }

      const { data: stockData, error: stockErr } = await stockQuery;

      if (!stockErr && stockData) {
        setProposals(stockData);
      } else {
        // Fallback: se a query específica falhar, tenta buscar as permitidas por RLS
        const { data: rlsData } = await supabase
          .from("stock_proposals")
          .select("*")
          .order("updated_at", { ascending: false });
        if (rlsData) {
          setProposals(rlsData);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do painel do projetista:", err);
      toast({
        title: "Erro ao carregar dados",
        description: err.message || "Não foi possível carregar as informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Linha PRONAF selecionada no formulário
  const currentLineConfig = useMemo(() => {
    return PRONAF_LINES.find((l) => l.id === newPropLinha) || PRONAF_LINES[0];
  }, [newPropLinha]);

  // Total das inversões orçadas
  const totalInversoesOrçadas = useMemo(() => {
    return newPropInversoes.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
  }, [newPropInversoes]);

  // Checagem de conformidade de tetos da nova proposta
  const isValorAcimaDoTeto = newPropValorSolicitado > currentLineConfig.teto;
  const diferencaInversoes = newPropValorSolicitado - totalInversoesOrçadas;
  const isInversoesBatem =
    newPropInversoes.length > 0 && Math.abs(diferencaInversoes) < 0.01;

  // Itens de inversão com excesso de preço unitário
  const itensComExcessoUnitario = useMemo(() => {
    return newPropInversoes.filter((i) => i.excesso);
  }, [newPropInversoes]);

  // Manipular adição de item de inversão
  const handleAddInversao = (nome: string, ref?: InversaoReferencia) => {
    const newItem: InversaoFormItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      item: nome || "Novo Item de Inversão",
      unidade: ref?.unidade_padrao || "UNID",
      quantidade: 1,
      valorUnitario: ref?.valor_maximo ? Math.min(ref.valor_maximo, 1000) : 0,
      valorTotal: ref?.valor_maximo ? Math.min(ref.valor_maximo, 1000) : 0,
      tetoUnitario: ref?.valor_maximo,
      excesso: false,
    };
    setNewPropInversoes((prev) => [...prev, newItem]);
  };

  const handleUpdateInversao = (
    id: string,
    field: "quantidade" | "valorUnitario" | "unidade" | "item",
    val: any
  ) => {
    setNewPropInversoes((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === "quantidade" || field === "valorUnitario") {
          const q = field === "quantidade" ? Number(val) || 0 : it.quantidade;
          const v = field === "valorUnitario" ? Number(val) || 0 : it.valorUnitario;
          updated.valorTotal = q * v;
          if (it.tetoUnitario && it.tetoUnitario > 0) {
            updated.excesso = v > it.tetoUnitario;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveInversao = (id: string) => {
    setNewPropInversoes((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCorrigirParaTeto = (id: string) => {
    setNewPropInversoes((prev) =>
      prev.map((it) => {
        if (it.id !== id || !it.tetoUnitario) return it;
        return {
          ...it,
          valorUnitario: it.tetoUnitario,
          valorTotal: it.quantidade * it.tetoUnitario,
          excesso: false,
        };
      })
    );
  };

  // Submissão de Nova Proposta
  const handleSubmitNewProposal = async () => {
    if (!user) return;

    // Validações básicas
    if (!newPropProducerName.trim()) {
      toast({
        title: "Nome do Produtor Obrigatório",
        description: "Informe o nome completo do produtor rural beneficiário.",
        variant: "destructive",
      });
      return;
    }

    const cleanCpf = newPropProducerCpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast({
        title: "CPF do Produtor Inválido",
        description: "Informe um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!newPropAgenciaId) {
      toast({
        title: "Agência Obrigatória",
        description: "Selecione a agência bancária do BNB de atendimento.",
        variant: "destructive",
      });
      return;
    }

    if (newPropValorSolicitado <= 0) {
      toast({
        title: "Valor Obrigatório",
        description: "Informe o valor solicitado a financiar.",
        variant: "destructive",
      });
      return;
    }

    if (isValorAcimaDoTeto) {
      toast({
        title: "Limite Máximo Ultrapassado",
        description: `O valor de ${formatCurrency(
          newPropValorSolicitado
        )} excede o teto de ${formatCurrency(
          currentLineConfig.teto
        )} para a linha ${currentLineConfig.label}.`,
        variant: "destructive",
      });
      return;
    }

    if (itensComExcessoUnitario.length > 0) {
      toast({
        title: "Itens com Excesso de Teto",
        description: "Existem itens de inversão com valor unitário acima da tabela BNB. Corrija-os antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingNewProp(true);

    try {
      const timestamp = Date.now();
      const proposalNumber = `PRONAF-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;
      const selectedAgency = agencies.find((a) => a.id === newPropAgenciaId);

      // Upload de Documentos se houver
      const uploadedDocs: { tipo: string; nome: string; url: string }[] = [];
      const filesMap: Record<string, File | null> = {
        projeto_tecnico: docProjetoTecnico,
        dap_caf: docDapCaf,
        orcamentos: docOrcamentos,
        rg_cpf: docRgCpf,
        comprovante_imovel: docComprovanteImovel,
      };

      for (const [docKey, file] of Object.entries(filesMap)) {
        if (!file) continue;
        const fileExt = file.name.split(".").pop() || "pdf";
        const storagePath = `propostas/${proposalNumber}/${docKey}_${timestamp}.${fileExt}`;

        const { data: upData, error: upErr } = await supabase.storage
          .from("projetistas_documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (!upErr) {
          const { data: pubData } = supabase.storage
            .from("projetistas_documents")
            .getPublicUrl(storagePath);
          uploadedDocs.push({
            tipo: docKey,
            nome: file.name,
            url: pubData?.publicUrl || "",
          });
        }
      }

      // Preparar payload de inversões
      const inversoesPayload = newPropInversoes.map((it) => ({
        item: it.item,
        descricao: it.item,
        unidade: it.unidade,
        quantidade: it.quantidade,
        valor_unitario: it.valorUnitario,
        valor_total: it.valorTotal,
        teto_maximo: it.tetoUnitario || null,
      }));

      // Montar notas com links
      let notesCombined = `[PROJETO ENVIADO PELO PROJETISTA]\nAtividade: ${
        newPropAtividade || "Não informada"
      }\nParecer Técnico: ${newPropParecer || "Sem parecer complementar."}`;

      if (newPropDapCaf.trim()) {
        notesCombined += `\nCAF/DAP: ${newPropDapCaf.trim()}`;
      }

      if (uploadedDocs.length > 0) {
        notesCombined += `\n\nDocumentos Anexados:\n` +
          uploadedDocs.map((d) => `• ${d.tipo.toUpperCase()}: ${d.nome} (${d.url})`).join("\n");
      }

      // Inserir em stock_proposals
      const { data: insertedProposal, error: insertErr } = await supabase
        .from("stock_proposals")
        .insert([
          {
            producer_name: newPropProducerName.trim().toUpperCase(),
            producer_cpf: cleanCpf,
            producer_phone: newPropProducerPhone.trim(),
            municipio: newPropMunicipio.trim().toUpperCase() || projetistaInfo?.municipio || null,
            localizacao: newPropLocalizacao.trim().toUpperCase() || null,
            agency_id: newPropAgenciaId,
            agency_name: selectedAgency?.name || null,
            linha_credito: currentLineConfig.label,
            pronaf_line: currentLineConfig.id,
            credit_program: "PRONAF",
            credit_purpose: newPropAtividade.trim() || null,
            estimated_value: newPropValorSolicitado,
            projetista: projetistaInfo?.name?.trim() || displayName || user.email,
            status: "nova",
            proposal_number: proposalNumber,
            inversoes: inversoesPayload,
            notes: notesCombined,
            created_by: user.id,
            order_index: 1,
          },
        ])
        .select()
        .single();

      if (insertErr) {
        throw new Error(insertErr.message);
      }

      setSuccessProtocol(proposalNumber);
      toast({
        title: "Proposta Enviada com Sucesso! 🚀",
        description: `Protocolo ${proposalNumber} gerado e encaminhado à agência ${selectedAgency?.name}.`,
      });

      // Limpar formulário
      setNewPropProducerName("");
      setNewPropProducerCpf("");
      setNewPropProducerPhone("");
      setNewPropLocalizacao("");
      setNewPropDapCaf("");
      setNewPropAtividade("");
      setNewPropValorSolicitado(0);
      setNewPropInversoes([]);
      setNewPropParecer("");
      setDocProjetoTecnico(null);
      setDocDapCaf(null);
      setDocOrcamentos(null);
      setDocRgCpf(null);
      setDocComprovanteImovel(null);

      // Recarregar lista de propostas
      await loadData();
    } catch (err: any) {
      console.error("Erro ao enviar proposta:", err);
      toast({
        title: "Falha ao enviar proposta",
        description: err.message || "Ocorreu um erro ao registrar a proposta.",
        variant: "destructive",
      });
    } finally {
      setSubmittingNewProp(false);
    }
  };

  // Submissão de Regularização de Pendência
  const handleRegularizeSubmit = async () => {
    if (!regularizeProposal || !user) return;
    if (!regularizeText.trim() && !regularizeFile) {
      toast({
        title: "Preencha a regularização",
        description: "Descreva a correção efetuada ou anexe o documento solicitado.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingRegularize(true);

    try {
      let fileUrl = "";
      if (regularizeFile) {
        const timestamp = Date.now();
        const fileExt = regularizeFile.name.split(".").pop() || "pdf";
        const path = `regularizacoes/${regularizeProposal.proposal_number || regularizeProposal.id}/reg_${timestamp}.${fileExt}`;

        const { error: upErr } = await supabase.storage
          .from("projetistas_documents")
          .upload(path, regularizeFile, { upsert: true });

        if (!upErr) {
          const { data: pubData } = supabase.storage
            .from("projetistas_documents")
            .getPublicUrl(path);
          fileUrl = pubData?.publicUrl || "";
        }
      }

      const updateNote = `\n\n[REGULARIZAÇÃO ENVIADA EM ${new Date().toLocaleDateString("pt-BR")}]: ${regularizeText}${
        fileUrl ? `\nAnexo de Regularização: ${regularizeFile?.name} (${fileUrl})` : ""
      }`;

      const { error: updateErr } = await supabase
        .from("stock_proposals")
        .update({
          status: "em_analise",
          pendencias: `[REGULARIZADO PELO PROJETISTA EM ${new Date().toLocaleDateString("pt-BR")}]: ${regularizeText}`,
          notes: (regularizeProposal.notes || "") + updateNote,
          updated_at: new Date().toISOString(),
        })
        .eq("id", regularizeProposal.id);

      if (updateErr) throw updateErr;

      toast({
        title: "Pendência Regularizada! ✅",
        description: "A proposta foi atualizada e reencaminhada para a esteira de análise do banco.",
      });

      setRegularizeProposal(null);
      setRegularizeText("");
      setRegularizeFile(null);
      await loadData();
    } catch (err: any) {
      console.error("Erro ao regularizar proposta:", err);
      toast({
        title: "Erro ao regularizar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingRegularize(false);
    }
  };

  // Filtragem de Propostas
  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        (p.producer_name && p.producer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.producer_cpf && p.producer_cpf.includes(searchTerm)) ||
        (p.proposal_number && p.proposal_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.municipio && p.municipio.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === "pendencias") {
        matchStatus = !!(p.pendencias && p.pendencias.trim() !== "");
      } else if (statusFilter === "analise") {
        const s = (p.status || "").toLowerCase();
        matchStatus = s.includes("análise") || s.includes("analise") || s.includes("andamento") || s === "nova";
      } else if (statusFilter === "concluidas") {
        const s = (p.status || "").toLowerCase();
        matchStatus = s.includes("contratad") || s.includes("conclu") || s.includes("aprovad");
      } else if (statusFilter !== "all") {
        matchStatus = (p.status || "").toLowerCase() === statusFilter.toLowerCase();
      }

      return matchSearch && matchStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = proposals.length;
    let comPendencia = 0;
    let concluidas = 0;
    let emAnalise = 0;
    let volumeTotal = 0;

    proposals.forEach((p) => {
      const valor = Number(p.estimated_value) || 0;
      volumeTotal += valor;

      if (p.pendencias && p.pendencias.trim() !== "") {
        comPendencia++;
      }

      const s = (p.status || "").toLowerCase();
      if (s.includes("contratad") || s.includes("conclu") || s.includes("aprovad")) {
        concluidas++;
      } else {
        emAnalise++;
      }
    });

    return { total, comPendencia, concluidas, emAnalise, volumeTotal };
  }, [proposals]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-20">
      {/* ── Header Exclusivo do Projetista ──────────────────────────────── */}
      <header className="border-b border-border/40 bg-card/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-800 flex items-center justify-center text-white font-black shadow-lg shadow-teal-600/25 shrink-0 text-base border border-white/20">
              {projetistaInfo?.name?.substring(0, 2).toUpperCase() || "PR"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading font-black text-xl md:text-2xl text-foreground tracking-tight leading-tight">
                  {getGreeting()},{" "}
                  <span className="text-teal-700 dark:text-teal-400">
                    {projetistaInfo?.name || displayName || "Projetista"}
                  </span>
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Credenciado & Ativo
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                {projetistaInfo?.crea_cfta && (
                  <span className="flex items-center gap-1 font-mono font-semibold text-foreground/90">
                    <Award className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.crea_cfta}
                  </span>
                )}
                {projetistaInfo?.municipio && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.municipio}
                    {projetistaInfo.uf ? `/${projetistaInfo.uf}` : ""}
                  </span>
                )}
                {projetistaInfo?.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                    {projetistaInfo.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl text-xs gap-1.5 border-border hover:bg-accent"
              title="Atualizar propostas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setActiveTab("novo-envio")}
              className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-md shadow-teal-600/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Enviar Nova Proposta</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5"
              title="Encerrar sessão"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Container com Abas ──────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-3">
            <TabsList className="bg-muted/70 p-1 rounded-2xl h-11 border border-border/50">
              <TabsTrigger
                value="acompanhamento"
                className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-sm px-4"
              >
                <Briefcase className="h-4 w-4" />
                <span>Central de Acompanhamento</span>
                {stats.total > 0 && (
                  <Badge variant="secondary" className="text-[10px] ml-1 font-bold">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="novo-envio"
                className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-sm px-4"
              >
                <Send className="h-4 w-4 text-emerald-600" />
                <span>Cadastrar & Enviar Proposta</span>
              </TabsTrigger>

              <TabsTrigger
                value="tabela-precos"
                className="rounded-xl text-xs font-bold gap-2 data-[state=active]:bg-card data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-sm px-4"
              >
                <Calculator className="h-4 w-4" />
                <span>Catálogo de Preços & Tetos BNB</span>
              </TabsTrigger>
            </TabsList>

            {/* Resumo rápido do volume */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card/60 px-3 py-1.5 rounded-xl border border-border/40">
              <span>Volume Total Gerido:</span>
              <span className="font-mono font-black text-teal-700 dark:text-teal-300">
                {formatCurrency(stats.volumeTotal)}
              </span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ABA 1: CENTRAL DE ACOMPANHAMENTO DE PROPOSTAS                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="acompanhamento" className="space-y-6 mt-0">
            {/* Banner de Pendências (se houver) */}
            {stats.comPendencia > 0 && (
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-rose-500/10 border border-amber-500/40 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <span>Atenção: Você possui {stats.comPendencia} proposta(s) com pendências</span>
                        <Badge
                          variant="outline"
                          className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 text-[10px] font-bold"
                        >
                          Ação Necessária
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        A agência bancária ou o analista registraram apontamentos em suas propostas. Clique em "Regularizar" para retificar e devolver ao banco.
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setStatusFilter("pendencias")}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-md shadow-amber-600/20"
                  >
                    Ver Propostas com Pendência
                  </Button>
                </div>
              </div>
            )}

            {/* ── Cards de Métricas do Projetista ──────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <Card className="rounded-2xl border border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Total de Propostas
                    </p>
                    <h3 className="text-2xl font-black text-foreground">{stats.total}</h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Em Andamento
                    </p>
                    <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {stats.emAnalise}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                  stats.comPendencia > 0
                    ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20"
                    : "border-border/60 bg-card"
                }`}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      Com Pendência
                    </p>
                    <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {stats.comPendencia}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Concluídas / Aprovadas
                    </p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {stats.concluidas}
                    </h3>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/60 shadow-sm bg-card col-span-2 sm:col-span-2 lg:col-span-1 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                      Volume de Crédito
                    </p>
                    <h3 className="text-lg md:text-xl font-black text-teal-700 dark:text-teal-300 truncate">
                      {formatCurrency(stats.volumeTotal)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Filtros e Busca ──────────────────────────────────── */}
            <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
              <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome do produtor, CPF, proposta ou município..."
                    className="pl-9 rounded-xl h-10 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                    Filtrar:
                  </span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] rounded-xl h-10 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas ({stats.total})</SelectItem>
                      <SelectItem value="pendencias">Com Pendências ({stats.comPendencia})</SelectItem>
                      <SelectItem value="analise">Em Andamento ({stats.emAnalise})</SelectItem>
                      <SelectItem value="concluidas">Concluídas ({stats.concluidas})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ── Tabela de Propostas do Projetista ─────────────────── */}
            <Card className="rounded-3xl border border-border/60 shadow-md overflow-hidden bg-card">
              <CardHeader className="bg-muted/30 p-5 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-extrabold font-heading flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-teal-600" />
                      Minhas Propostas de Crédito
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {filteredProposals.length} proposta{filteredProposals.length !== 1 ? "s" : ""} encontrada{filteredProposals.length !== 1 ? "s" : ""} sob sua responsabilidade técnica
                    </CardDescription>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setActiveTab("novo-envio")}
                    className="rounded-xl text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Nova Proposta</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredProposals.length === 0 ? (
                  <div className="p-12 text-center space-y-4">
                    <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <h4 className="font-bold text-sm text-foreground">
                      Nenhuma proposta encontrada
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {searchTerm || statusFilter !== "all"
                        ? "Tente ajustar os filtros de busca para encontrar suas propostas."
                        : "Você ainda não possui propostas cadastradas. Clique no botão abaixo para enviar sua primeira proposta de crédito PRONAF."}
                    </p>
                    <Button
                      onClick={() => setActiveTab("novo-envio")}
                      className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Cadastrar Primeira Proposta
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="pl-6 text-[10px] font-black uppercase tracking-wider">
                            Produtor / Cliente
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Nº Proposta
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Linha PRONAF
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Valor
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Município
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Status / Situação
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-wider">
                            Pendências
                          </TableHead>
                          <TableHead className="pr-6 text-right text-[10px] font-black uppercase tracking-wider">
                            Ações
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.map((prop) => {
                          const hasPendencia = !!(prop.pendencias && prop.pendencias.trim() !== "");
                          const valor = Number(prop.estimated_value) || 0;

                          return (
                            <TableRow
                              key={prop.id}
                              className={`hover:bg-accent/40 transition-colors ${
                                hasPendencia ? "bg-amber-500/[0.04]" : ""
                              }`}
                            >
                              {/* Produtor */}
                              <TableCell className="pl-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
                                    {prop.producer_name?.substring(0, 2).toUpperCase() || "PR"}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-sm text-foreground leading-tight">
                                      {prop.producer_name}
                                    </p>
                                    <p className="text-[11px] font-mono text-muted-foreground">
                                      {prop.producer_cpf || "CPF não informado"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Nº Proposta */}
                              <TableCell>
                                <span className="font-mono text-xs font-bold text-foreground">
                                  {prop.proposal_number || "—"}
                                </span>
                              </TableCell>

                              {/* Linha PRONAF */}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                >
                                  {prop.linha_credito || prop.credit_program || prop.pronaf_line || "PRONAF"}
                                </Badge>
                              </TableCell>

                              {/* Valor */}
                              <TableCell>
                                <span className="font-mono text-xs font-bold text-foreground">
                                  {valor > 0 ? formatCurrency(valor) : "—"}
                                </span>
                              </TableCell>

                              {/* Município */}
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {prop.municipio || "—"}
                                </span>
                              </TableCell>

                              {/* Status */}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                                >
                                  {prop.status || prop.original_csv_status || "Em Análise"}
                                </Badge>
                              </TableCell>

                              {/* Pendências */}
                              <TableCell>
                                {hasPendencia ? (
                                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold max-w-[200px]">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                    <span className="truncate" title={prop.pendencias}>
                                      {prop.pendencias}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Regular
                                  </span>
                                )}
                              </TableCell>

                              {/* Ações */}
                              <TableCell className="pr-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedProposal(prop)}
                                    className="h-8 rounded-xl text-xs font-bold border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-50"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    Detalhes
                                  </Button>

                                  {hasPendencia && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setRegularizeProposal(prop);
                                        setRegularizeText("");
                                        setRegularizeFile(null);
                                      }}
                                      className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                                      title="Regularizar pendência bancária"
                                    >
                                      <FileUp className="h-3.5 w-3.5 mr-1" />
                                      Regularizar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ABA 2: CADASTRO E ENVIO DE NOVA PROPOSTA DE CRÉDITO              */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="novo-envio" className="space-y-6 mt-0">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-black tracking-tight">
                    Envio de Nova Proposta de Crédito PRONAF
                  </h2>
                  <p className="text-xs text-white/80">
                    Preencha os dados cadastrais do produtor rural, selecione a linha de financiamento com validação automática de tetos e anexe o plano técnico.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1 & 2: Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Dados do Produtor Rural */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-600" />
                      1. Identificação do Produtor Rural (Beneficiário)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dados pessoais e de localização da propriedade onde o projeto será implantado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">
                          Nome Completo do Produtor <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: João da Silva Ferreira"
                          value={newPropProducerName}
                          onChange={(e) => setNewPropProducerName(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          CPF do Produtor <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={newPropProducerCpf}
                          onChange={(e) => setNewPropProducerCpf(formatCPF(e.target.value))}
                          maxLength={14}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Telefone / WhatsApp</Label>
                        <Input
                          placeholder="(98) 99999-9999"
                          value={newPropProducerPhone}
                          onChange={(e) => setNewPropProducerPhone(formatPhone(e.target.value))}
                          maxLength={15}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Município da Propriedade</Label>
                        <Input
                          placeholder="Ex: Governador Nunes Freire"
                          value={newPropMunicipio}
                          onChange={(e) => setNewPropMunicipio(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Nome da Propriedade / Localidade</Label>
                        <Input
                          placeholder="Ex: Sítio Boa Esperança - Gleba 2"
                          value={newPropLocalizacao}
                          onChange={(e) => setNewPropLocalizacao(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Número da DAP / CAF (Se houver)</Label>
                        <Input
                          placeholder="Ex: CAF-MA-0012345/2026"
                          value={newPropDapCaf}
                          onChange={(e) => setNewPropDapCaf(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Enquadramento da Linha & Agência */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-600" />
                      2. Linha de Crédito PRONAF & Agência de Atendimento
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enquadramento normativo e teto máximo financiado da safra
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          Agência BNB de Destino <span className="text-destructive">*</span>
                        </Label>
                        <Select value={newPropAgenciaId} onValueChange={setNewPropAgenciaId}>
                          <SelectTrigger className="rounded-xl h-10 text-xs">
                            <SelectValue placeholder="Selecione a agência BNB..." />
                          </SelectTrigger>
                          <SelectContent>
                            {agencies.map((ag) => (
                              <SelectItem key={ag.id} value={ag.id} className="text-xs">
                                {ag.name} {ag.code ? `(${ag.code})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">
                          Linha de Crédito PRONAF <span className="text-destructive">*</span>
                        </Label>
                        <Select value={newPropLinha} onValueChange={setNewPropLinha}>
                          <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRONAF_LINES.map((linha) => (
                              <SelectItem key={linha.id} value={linha.id} className="text-xs">
                                {linha.label} (Teto: {formatCurrency(linha.teto)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Atividade / Finalidade do Crédito</Label>
                        <Input
                          placeholder="Ex: Aquisição de Matrizes Bovinas Leiteiras e Pastagem"
                          value={newPropAtividade}
                          onChange={(e) => setNewPropAtividade(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>
                    </div>

                    {/* Card de Alerta de Teto da Linha */}
                    <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          Linha: <span className="text-teal-700 dark:text-teal-300">{currentLineConfig.label}</span>
                        </span>
                        <Badge className="bg-teal-600 text-white font-mono text-[10px]">
                          Teto: {formatCurrency(currentLineConfig.teto)}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {currentLineConfig.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Valor Solicitado & Validação */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-teal-600" />
                      3. Valor a Financiar & Validação de Teto
                    </CardTitle>
                    <CardDescription className="text-xs">
                      O valor solicitado é validado em tempo real contra o regulamento do PRONAF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Valor Solicitado a Financiar (R$) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 50000"
                        value={newPropValorSolicitado || ""}
                        onChange={(e) => setNewPropValorSolicitado(Number(e.target.value) || 0)}
                        className={`rounded-xl h-12 text-base font-black font-mono ${
                          isValorAcimaDoTeto ? "border-destructive text-destructive bg-destructive/5" : ""
                        }`}
                      />
                    </div>

                    {/* Status de Teto */}
                    {newPropValorSolicitado > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Utilização do Teto Normativo:</span>
                          <span className="font-mono font-bold">
                            {((newPropValorSolicitado / currentLineConfig.teto) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min((newPropValorSolicitado / currentLineConfig.teto) * 100, 100)}
                          className={`h-2 ${isValorAcimaDoTeto ? "bg-rose-100" : ""}`}
                        />

                        {isValorAcimaDoTeto ? (
                          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-2 animate-pulse">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>
                                <strong>Teto Ultrapassado:</strong> O valor excede o limite de{" "}
                                {formatCurrency(currentLineConfig.teto)} em{" "}
                                {formatCurrency(newPropValorSolicitado - currentLineConfig.teto)}.
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setNewPropValorSolicitado(currentLineConfig.teto)}
                              className="rounded-lg text-[10px] h-7 border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0 font-bold"
                            >
                              Ajustar p/ Máximo
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Valor em conformidade com o teto oficial do PRONAF.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Plano de Inversões Detalhado */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-teal-600" />
                          4. Plano de Inversões (Itens Orçados)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Adicione os itens do projeto utilizando os preços de referência da tabela BNB
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {/* Seletor com Combobox */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Selecionar Item da Tabela Oficial BNB:
                      </Label>
                      <InversaoCombobox
                        value=""
                        onChange={(nome, ref) => handleAddInversao(nome, ref)}
                        placeholder="Busque por Trator, Matriz Bovina, Adubo, Arame, etc..."
                      />
                    </div>

                    {/* Lista de Itens Adicionados */}
                    {newPropInversoes.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs space-y-2">
                        <Calculator className="h-8 w-8 mx-auto opacity-30" />
                        <p>Nenhum item adicionado ao plano de investimento.</p>
                        <p className="text-[11px]">
                          Use o campo de busca acima para selecionar itens da tabela de referência ou adicione manualmente.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newPropInversoes.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                              item.excesso
                                ? "bg-rose-500/5 border-rose-500/30"
                                : "bg-muted/30 border-border/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-xs text-foreground truncate flex-1">
                                {idx + 1}. {item.item}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveInversao(item.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Unidade</Label>
                                <Input
                                  value={item.unidade}
                                  onChange={(e) =>
                                    handleUpdateInversao(item.id, "unidade", e.target.value.toUpperCase())
                                  }
                                  className="h-8 rounded-lg text-xs font-mono uppercase"
                                />
                              </div>

                              <div>
                                <Label className="text-[10px] text-muted-foreground">Quantidade</Label>
                                <Input
                                  type="number"
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    handleUpdateInversao(item.id, "quantidade", e.target.value)
                                  }
                                  className="h-8 rounded-lg text-xs font-mono font-bold"
                                />
                              </div>

                              <div>
                                <Label className="text-[10px] text-muted-foreground">
                                  Valor Unitário (R$)
                                </Label>
                                <Input
                                  type="number"
                                  value={item.valorUnitario}
                                  onChange={(e) =>
                                    handleUpdateInversao(item.id, "valorUnitario", e.target.value)
                                  }
                                  className={`h-8 rounded-lg text-xs font-mono font-bold ${
                                    item.excesso ? "border-rose-500 text-rose-600" : ""
                                  }`}
                                />
                              </div>

                              <div>
                                <Label className="text-[10px] text-muted-foreground">Total do Item</Label>
                                <div className="h-8 px-2 flex items-center font-mono font-black text-teal-700 dark:text-teal-300 text-xs bg-card rounded-lg border border-border/40">
                                  {formatCurrency(item.valorTotal)}
                                </div>
                              </div>
                            </div>

                            {/* Alerta de excesso no item */}
                            {item.excesso && item.tetoUnitario && (
                              <div className="flex items-center justify-between text-[11px] text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-800">
                                <span>
                                  ⚠️ Valor acima do teto oficial do BNB ({formatCurrency(item.tetoUnitario)})
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCorrigirParaTeto(item.id)}
                                  className="h-6 text-[10px] font-bold text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-md"
                                >
                                  Corrigir p/ Teto
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resumo do Orçamento e Batimento */}
                    {newPropInversoes.length > 0 && (
                      <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Total dos Itens Orçados:</span>
                          <span className="font-mono font-black text-sm text-foreground">
                            {formatCurrency(totalInversoesOrçadas)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Valor Solicitado da Proposta:</span>
                          <span className="font-mono font-black text-sm text-teal-700 dark:text-teal-300">
                            {formatCurrency(newPropValorSolicitado)}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border/40">
                          {isInversoesBatem ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Soma bate 100% com o valor financiado!</span>
                            </div>
                          ) : diferencaInversoes > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Saldo a orçar: {formatCurrency(diferencaInversoes)} para atingir o valor solicitado.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                              <AlertTriangle className="h-4 w-4" />
                              <span>
                                Soma dos itens excede o valor da proposta em {formatCurrency(Math.abs(diferencaInversoes))}.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5. Documentos do Projeto */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <FolderCheck className="h-4 w-4 text-teal-600" />
                      5. Documentação do Projeto & Anexos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Anexe os arquivos comprobatórios do produtor e o projeto técnico simplificado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Projeto Técnico */}
                      <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>📑 Projeto Técnico / Planilha</span>
                          {docProjetoTecnico && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <input
                          type="file"
                          id="doc-proj"
                          className="hidden"
                          onChange={(e) => setDocProjetoTecnico(e.target.files?.[0] || null)}
                          accept=".pdf,.xlsx,.xls"
                        />
                        <label
                          htmlFor="doc-proj"
                          className="flex items-center justify-center p-3 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground text-center"
                        >
                          {docProjetoTecnico ? (
                            <span className="font-semibold text-teal-700 dark:text-teal-300 truncate max-w-[200px]">
                              {docProjetoTecnico.name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UploadCloud className="h-4 w-4 text-teal-600" />
                              Selecionar Arquivo (PDF/XLSX)
                            </span>
                          )}
                        </label>
                      </div>

                      {/* DAP / CAF */}
                      <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>📄 Extrato DAP ou CAF</span>
                          {docDapCaf && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <input
                          type="file"
                          id="doc-dap"
                          className="hidden"
                          onChange={(e) => setDocDapCaf(e.target.files?.[0] || null)}
                          accept=".pdf,.png,.jpg"
                        />
                        <label
                          htmlFor="doc-dap"
                          className="flex items-center justify-center p-3 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground text-center"
                        >
                          {docDapCaf ? (
                            <span className="font-semibold text-teal-700 dark:text-teal-300 truncate max-w-[200px]">
                              {docDapCaf.name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UploadCloud className="h-4 w-4 text-teal-600" />
                              Selecionar Arquivo
                            </span>
                          )}
                        </label>
                      </div>

                      {/* Orçamentos */}
                      <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>📑 Orçamentos / Cotações</span>
                          {docOrcamentos && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <input
                          type="file"
                          id="doc-orc"
                          className="hidden"
                          onChange={(e) => setDocOrcamentos(e.target.files?.[0] || null)}
                          accept=".pdf,.png,.jpg"
                        />
                        <label
                          htmlFor="doc-orc"
                          className="flex items-center justify-center p-3 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground text-center"
                        >
                          {docOrcamentos ? (
                            <span className="font-semibold text-teal-700 dark:text-teal-300 truncate max-w-[200px]">
                              {docOrcamentos.name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UploadCloud className="h-4 w-4 text-teal-600" />
                              Selecionar Arquivo
                            </span>
                          )}
                        </label>
                      </div>

                      {/* RG e CPF */}
                      <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>🪪 RG / CNH do Produtor</span>
                          {docRgCpf && <Check className="h-4 w-4 text-emerald-600" />}
                        </div>
                        <input
                          type="file"
                          id="doc-rg"
                          className="hidden"
                          onChange={(e) => setDocRgCpf(e.target.files?.[0] || null)}
                          accept=".pdf,.png,.jpg"
                        />
                        <label
                          htmlFor="doc-rg"
                          className="flex items-center justify-center p-3 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground text-center"
                        >
                          {docRgCpf ? (
                            <span className="font-semibold text-teal-700 dark:text-teal-300 truncate max-w-[200px]">
                              {docRgCpf.name}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <UploadCloud className="h-4 w-4 text-teal-600" />
                              Selecionar Arquivo
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Parecer Técnico */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      6. Parecer Técnico e Justificativa Agronômica
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Descreva a capacidade de pagamento, viabilidade técnica e notas para o analista
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <Textarea
                      placeholder="Ex: O produtor possui histórico de boa produtividade na pecuária leiteira. O investimento destina-se à melhoria genética do plantel e reforma das pastagens, com capacidade de pagamento plenamente compatível com o cronograma..."
                      value={newPropParecer}
                      onChange={(e) => setNewPropParecer(e.target.value)}
                      rows={4}
                      className="rounded-xl text-xs resize-none"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Coluna 3: Painel de Revisão & Submissão */}
              <div className="space-y-6">
                <Card className="rounded-3xl border border-border/60 shadow-md bg-card sticky top-24">
                  <CardHeader className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 p-5 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      Resumo da Proposta
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Confira os dados antes do envio à agência
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Projetista Responsável:
                      </span>
                      <p className="font-extrabold text-foreground">
                        {projetistaInfo?.name || displayName || "Projetista"}
                      </p>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {projetistaInfo?.crea_cfta || "CREA/CFTA não informado"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Produtor Beneficiário:
                      </span>
                      <p className="font-extrabold text-foreground">
                        {newPropProducerName || "Nome não preenchido"}
                      </p>
                      <span className="font-mono text-muted-foreground">
                        {newPropProducerCpf || "CPF não preenchido"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Enquadramento:
                      </span>
                      <p className="font-semibold text-teal-700 dark:text-teal-300">
                        {currentLineConfig.label}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        Teto Normativo: {formatCurrency(currentLineConfig.teto)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Valor da Operação:
                      </span>
                      <p className="text-xl font-black font-mono text-teal-700 dark:text-teal-300">
                        {formatCurrency(newPropValorSolicitado)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 space-y-1">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Itens de Inversão:
                      </span>
                      <div className="flex items-center justify-between">
                        <span>{newPropInversoes.length} item(ns) orçado(s)</span>
                        <span className="font-mono font-bold">
                          {formatCurrency(totalInversoesOrçadas)}
                        </span>
                      </div>
                    </div>

                    {/* Alertas */}
                    {isValorAcimaDoTeto && (
                      <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Valor acima do limite permitido!</span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Button
                      onClick={handleSubmitNewProposal}
                      disabled={submittingNewProp || isValorAcimaDoTeto}
                      className="w-full rounded-2xl h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-teal-600/25 gap-2"
                    >
                      {submittingNewProp ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Transmitindo Proposta...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Transmitir Proposta ao Banco</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* ABA 3: CATÁLOGO DE PREÇOS E TETOS BNB / PRONAF                   */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="tabela-precos" className="space-y-6 mt-0">
            {/* Cards dos Tetos das Linhas PRONAF */}
            <div>
              <div className="mb-3">
                <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Tetos Regulamentares por Linha de Crédito PRONAF
                </h3>
                <p className="text-xs text-muted-foreground">
                  Limites máximos financiados por produtor/safra estabelecidos no Manual de Crédito Rural (MCR)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRONAF_LINES.map((linha) => (
                  <Card key={linha.id} className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
                    <Badge variant="outline" className="text-[10px] font-bold bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300">
                      {linha.id.toUpperCase()}
                    </Badge>
                    <h4 className="font-bold text-sm text-foreground">{linha.label}</h4>
                    <p className="font-black font-mono text-base text-teal-700 dark:text-teal-300">
                      {formatCurrency(linha.teto)}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {linha.desc}
                    </p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tabela de Preços Referenciais por Item */}
            <Card className="rounded-3xl border border-border/60 shadow-md bg-card overflow-hidden">
              <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-teal-600" />
                  Tabela Oficial de Preços Referenciais BNB / PRONAF
                </CardTitle>
                <CardDescription className="text-xs">
                  {catalogoInversoes.length} itens homologados para elaboração de orçamentos e planos de investimento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingCatalogo ? (
                  <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                    Carregando tabela de preços referenciais...
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="pl-6 text-[10px] font-black uppercase">Código</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Item / Descrição</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Categoria</TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Unidade</TableHead>
                          <TableHead className="pr-6 text-right text-[10px] font-black uppercase">
                            Teto Máximo Unitário
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalogoInversoes.slice(0, 100).map((inv) => (
                          <TableRow key={inv.id} className="hover:bg-accent/40 text-xs">
                            <TableCell className="pl-6 font-mono text-[11px] text-muted-foreground">
                              {inv.codigo || "—"}
                            </TableCell>
                            <TableCell className="font-extrabold text-foreground">
                              {inv.nome_completo || inv.item}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {inv.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {inv.unidade_padrao}
                            </TableCell>
                            <TableCell className="pr-6 text-right font-mono font-bold text-teal-700 dark:text-teal-300">
                              {inv.valor_maximo > 0 ? formatCurrency(inv.valor_maximo) : "Sob Consulta"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Modal Detalhes da Proposta ────────────────────────── */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-foreground">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Detalhes da Proposta de Crédito
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informações completas do produtor e situação cadastral no banco
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4 py-2 text-xs">
              {/* Card Produtor */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-2">
                <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  Dados do Produtor Rural
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-extrabold text-foreground text-sm">
                      {selectedProposal.producer_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.producer_cpf || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Município:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.municipio || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Linha de Crédito:</span>
                    <p className="font-semibold text-teal-700 dark:text-teal-300">
                      {selectedProposal.linha_credito || selectedProposal.credit_program || "PRONAF"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Financiamento */}
              <div className="bg-teal-500/5 p-4 rounded-2xl border border-teal-500/20 space-y-2">
                <span className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 text-[10px]">
                  Dados Financeiros & Bancários
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Valor Solicitado:</span>
                    <p className="font-black text-teal-700 dark:text-teal-300 text-base">
                      {formatCurrency(Number(selectedProposal.estimated_value) || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número da Proposta:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.proposal_number || "Aguardando geração"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Situação Atual:</span>
                    <Badge variant="outline" className="font-bold text-[10px] mt-0.5">
                      {selectedProposal.status || selectedProposal.original_csv_status || "Em Análise"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Agência Bancária:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.agency_name || "Agência Regional"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pendências se houver */}
              {selectedProposal.pendencias && (
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Apontamentos e Pendências:
                  </div>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    {selectedProposal.pendencias}
                  </p>
                </div>
              )}

              {/* Inversões Cadastradas */}
              {selectedProposal.inversoes && selectedProposal.inversoes.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    Itens Financiados (Inversões Cadastradas)
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedProposal.inversoes.map((inv: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40 text-xs"
                      >
                        <span className="font-semibold truncate max-w-[280px]">
                          {inv.descricao || inv.item || `Item ${idx + 1}`}
                        </span>
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-300 shrink-0">
                          {formatCurrency(Number(inv.valor_total || inv.valor || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedProposal.notes && (
                <div className="bg-muted/30 p-3 rounded-xl border border-border/40 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  <span className="font-bold text-foreground block mb-0.5">Observações & Anexos:</span>
                  {selectedProposal.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              className="rounded-xl text-xs"
              onClick={() => setSelectedProposal(null)}
            >
              Fechar
            </Button>

            {selectedProposal?.pendencias && (
              <Button
                onClick={() => {
                  const target = selectedProposal;
                  setSelectedProposal(null);
                  setRegularizeProposal(target);
                  setRegularizeText("");
                  setRegularizeFile(null);
                }}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                Regularizar Pendência
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Regularização de Pendência ─────────────────── */}
      <Dialog open={!!regularizeProposal} onOpenChange={(open) => !open && setRegularizeProposal(null)}>
        <DialogContent className="max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-foreground">
              <FileUp className="h-5 w-5 text-amber-600" />
              Regularizar Pendência Bancária
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Proposta nº {regularizeProposal?.proposal_number || "—"} • {regularizeProposal?.producer_name}
            </DialogDescription>
          </DialogHeader>

          {regularizeProposal && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 text-amber-950 dark:text-amber-200">
                <span className="font-bold block mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Pendência Apontada pela Agência:
                </span>
                <p className="leading-relaxed">{regularizeProposal.pendencias}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Justificativa / Parecer de Regularização:
                </Label>
                <Textarea
                  placeholder="Descreva a correção realizada ou esclarecimentos para o analista do banco..."
                  value={regularizeText}
                  onChange={(e) => setRegularizeText(e.target.value)}
                  rows={3}
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Anexar Documento Retificado (PDF ou Imagem):
                </Label>
                <input
                  type="file"
                  id="reg-file"
                  className="hidden"
                  onChange={(e) => setRegularizeFile(e.target.files?.[0] || null)}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <label
                  htmlFor="reg-file"
                  className="flex items-center justify-center p-4 border-2 border-dashed border-border/70 rounded-2xl cursor-pointer hover:bg-muted/40 transition-colors text-xs text-muted-foreground text-center"
                >
                  {regularizeFile ? (
                    <span className="font-bold text-teal-700 dark:text-teal-300 truncate max-w-[280px]">
                      {regularizeFile.name}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UploadCloud className="h-4 w-4 text-amber-600" />
                      Clique para anexar arquivo de regularização
                    </span>
                  )}
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              className="rounded-xl text-xs"
              onClick={() => setRegularizeProposal(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegularizeSubmit}
              disabled={submittingRegularize}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5"
            >
              {submittingRegularize ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Enviando Regularização...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Regularização à Agência
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Confirmação de Sucesso de Nova Proposta ────────── */}
      <Dialog open={!!successProtocol} onOpenChange={() => setSuccessProtocol(null)}>
        <DialogContent className="max-w-md rounded-3xl text-center p-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>

          <div>
            <DialogTitle className="font-heading font-black text-xl text-foreground">
              Proposta Transmitida com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Sua proposta foi gravada no estoque da agência e já está disponível para análise da equipe técnica.
            </DialogDescription>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">
              Número da Proposta / Protocolo:
            </span>
            <span className="text-lg font-black font-mono text-teal-700 dark:text-teal-300">
              {successProtocol}
            </span>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                setSuccessProtocol(null);
                setActiveTab("acompanhamento");
              }}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
            >
              Ver na Central de Acompanhamento
            </Button>

            <Button
              variant="outline"
              onClick={() => setSuccessProtocol(null)}
              className="w-full rounded-xl text-xs"
            >
              Cadastrar Nova Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
