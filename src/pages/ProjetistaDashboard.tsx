import { useState, useMemo, useEffect, useRef } from "react";
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
  FileSpreadsheet,
  Lock,
  Download,
  CheckCheck,
  Sprout,
  Scale,
  Layers,
  Trees,
  Users,
  Activity,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useInversoesReferencia } from "@/hooks/useInversoesReferencia";
import { InversaoCombobox } from "@/components/inversoes/InversaoCombobox";
import { safeDynamicImport } from "@/utils/dynamicImport";
import type {
  ExcelProposalParsed,
  DadosProponenteData,
  SuporteForrageiroData,
} from "@/utils/excelInversoesReader";

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
  dados_proponente?: DadosProponenteData | any;
  suporte_forrageiro?: SuporteForrageiroData | any;
  data_nascimento?: string;
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

  // Modais de Propostas
  const [selectedProposal, setSelectedProposal] = useState<ProposalItem | null>(null);
  const [regularizeProposal, setRegularizeProposal] = useState<ProposalItem | null>(null);
  const [regularizeText, setRegularizeText] = useState("");
  const [regularizeFile, setRegularizeFile] = useState<File | null>(null);
  const [submittingRegularize, setSubmittingRegularize] = useState(false);

  // Modal de sucesso de nova proposta
  const [successProtocol, setSuccessProtocol] = useState<string | null>(null);

  // ── Importação Inteligente de Planilha Excel ────────────────────────────────
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPassword, setImportPassword] = useState("senhasBN");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [parsedProposalData, setParsedProposalData] = useState<ExcelProposalParsed | null>(null);
  const [hidePromptBanner, setHidePromptBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Formulário de Envio de Nova Proposta ────────────────────────────────────
  const [newPropProducerName, setNewPropProducerName] = useState("");
  const [newPropApelido, setNewPropApelido] = useState("");
  const [newPropProducerCpf, setNewPropProducerCpf] = useState("");
  const [newPropProducerPhone, setNewPropProducerPhone] = useState("");
  const [newPropMunicipio, setNewPropMunicipio] = useState("");
  const [newPropUf, setNewPropUf] = useState("MA");
  const [newPropLocalizacao, setNewPropLocalizacao] = useState("");
  const [newPropDapCaf, setNewPropDapCaf] = useState("");
  const [newPropAgenciaId, setNewPropAgenciaId] = useState("");
  const [newPropLinha, setNewPropLinha] = useState("custeio");
  const [newPropAtividade, setNewPropAtividade] = useState("");
  const [newPropObjetivo, setNewPropObjetivo] = useState("Implantação");
  const [newPropValorSolicitado, setNewPropValorSolicitado] = useState<number>(0);
  const [newPropCustoAssessoria, setNewPropCustoAssessoria] = useState<number>(0);
  const [newPropInversoes, setNewPropInversoes] = useState<InversaoFormItem[]>([]);
  const [newPropParecer, setNewPropParecer] = useState("");
  const [submittingNewProp, setSubmittingNewProp] = useState(false);

  // ── Dados Pessoais & Documentais do Produtor (Ficha 100% SEAP/BNB) ──────────
  const [newPropTipoCliente, setNewPropTipoCliente] = useState("Pessoa Física");
  const [newPropRg, setNewPropRg] = useState("");
  const [newPropOrgaoEmissor, setNewPropOrgaoEmissor] = useState("");
  const [newPropUfRg, setNewPropUfRg] = useState("");
  const [newPropDataEmissaoRg, setNewPropDataEmissaoRg] = useState("");
  const [newPropTipoDocumento, setNewPropTipoDocumento] = useState("Cédula de Identidade (RG)");
  const [newPropDataNascimento, setNewPropDataNascimento] = useState("");
  const [newPropNaturalidade, setNewPropNaturalidade] = useState("");
  const [newPropSexo, setNewPropSexo] = useState("Masculino");
  const [newPropEstadoCivil, setNewPropEstadoCivil] = useState("Casado(a)");
  const [newPropGrauInstrucao, setNewPropGrauInstrucao] = useState("Alfabetizado(a)");
  const [newPropProfissao, setNewPropProfissao] = useState("Agricultor(a)");
  const [newPropRendaMensal, setNewPropRendaMensal] = useState<number | string>("");
  const [newPropNomeMae, setNewPropNomeMae] = useState("");
  const [newPropNomePai, setNewPropNomePai] = useState("");
  const [newPropPorte, setNewPropPorte] = useState("PRONAFIANO GRUPO A - ASSOCIADO/COOPERADO");

  // ── Endereço & Residência do Produtor ───────────────────────────────────────
  const [newPropEndereco, setNewPropEndereco] = useState("");
  const [newPropComplemento, setNewPropComplemento] = useState("PRINCIPAL");
  const [newPropBairro, setNewPropBairro] = useState("ZONA RURAL");
  const [newPropCep, setNewPropCep] = useState("");

  // ── Cônjuge / Companheiro(a) ───────────────────────────────────────────────
  const [newPropNomeConjuge, setNewPropNomeConjuge] = useState("");
  const [newPropCpfConjuge, setNewPropCpfConjuge] = useState("");
  const [newPropDataNascimentoConjuge, setNewPropDataNascimentoConjuge] = useState("");
  const [newPropRgConjuge, setNewPropRgConjuge] = useState("");
  const [newPropOrgaoEmissorConjuge, setNewPropOrgaoEmissorConjuge] = useState("");
  const [newPropUfConjuge, setNewPropUfConjuge] = useState("");
  const [newPropProfissaoConjuge, setNewPropProfissaoConjuge] = useState("Agricultor(a)");

  // ── Dados do Imóvel, Posse & Recursos Naturais ──────────────────────────────
  const [newPropCondicaoPosse, setNewPropCondicaoPosse] = useState("Proprietário");
  const [newPropTipoProprietario, setNewPropTipoProprietario] = useState("P.Física");
  const [newPropNomeProprietario, setNewPropNomeProprietario] = useState("");
  const [newPropCpfProprietario, setNewPropCpfProprietario] = useState("");
  const [newPropAreaTotalHa, setNewPropAreaTotalHa] = useState<number>(0);
  const [newPropAreaExploradaHa, setNewPropAreaExploradaHa] = useState<number>(0);
  const [newPropAreaPastagemHa, setNewPropAreaPastagemHa] = useState<number>(0);
  const [newPropAreaReservaHa, setNewPropAreaReservaHa] = useState<number>(0);
  const [newPropCar, setNewPropCar] = useState("");
  const [newPropNirf, setNewPropNirf] = useState("");
  const [newPropCcir, setNewPropCcir] = useState("");
  const [newPropRoteiroAcesso, setNewPropRoteiroAcesso] = useState("");
  const [newPropSolosAguada, setNewPropSolosAguada] = useState("");
  const [newPropBanco, setNewPropBanco] = useState("004 - Banco do Nordeste (BNB)");
  const [newPropAgenciaConta, setNewPropAgenciaConta] = useState("");

  // ── Suporte Forrageiro & Dimensionamento Pecuário ───────────────────────────
  const [newPropTemPecuaria, setNewPropTemPecuaria] = useState(false);
  const [newPropAreaPastagemNativa, setNewPropAreaPastagemNativa] = useState<number>(0);
  const [newPropAreaPastagemCultivada, setNewPropAreaPastagemCultivada] = useState<number>(0);
  const [newPropAreaCapineira, setNewPropAreaCapineira] = useState<number>(0);
  const [newPropAreaPalma, setNewPropAreaPalma] = useState<number>(0);
  const [newPropEspeciePastagem, setNewPropEspeciePastagem] = useState("Brachiaria brizantha");
  const [newPropRebanhoCabecas, setNewPropRebanhoCabecas] = useState<number>(0);
  const [newPropRebanhoTotalUa, setNewPropRebanhoTotalUa] = useState<number>(0);
  const [newPropTaxaLotacao, setNewPropTaxaLotacao] = useState<number>(0);
  const [newPropPeriodoEstiagem, setNewPropPeriodoEstiagem] = useState<number>(6);
  const [newPropEstrategiaSuplementacao, setNewPropEstrategiaSuplementacao] = useState("");
  const [newPropParecerSuporte, setNewPropParecerSuporte] = useState("");

  // ── Novos Campos Expandidos PRONAF-C ────────────────────────────────────────
  const [newPropTituloEleitoral, setNewPropTituloEleitoral] = useState("");
  const [newPropBeneficiarioPoliticas, setNewPropBeneficiarioPoliticas] = useState("Cliente não Beneficiário de Políticas Públicas");
  const [newPropEnderecoCorrespondencia, setNewPropEnderecoCorrespondencia] = useState("");
  const [newPropEdificacoes, setNewPropEdificacoes] = useState<any[]>([]);
  const [newPropSemoventes, setNewPropSemoventes] = useState<any[]>([]);
  const [newPropTerrasCoberturas, setNewPropTerrasCoberturas] = useState<any[]>([]);
  const [newPropFinanciamentoPrazo, setNewPropFinanciamentoPrazo] = useState<number>(96);
  const [newPropFinanciamentoCarencia, setNewPropFinanciamentoCarencia] = useState<number>(24);
  const [newPropFinanciamentoJuros, setNewPropFinanciamentoJuros] = useState<number>(6);
  const [newPropFinanciamentoPeriodicidade, setNewPropFinanciamentoPeriodicidade] = useState("Anual");
  const [newPropGeorreferenciamento, setNewPropGeorreferenciamento] = useState<any[]>([]);
  const [newPropEmpresaElaboradora, setNewPropEmpresaElaboradora] = useState("");
  const [newPropElaborador, setNewPropElaborador] = useState("");
  const [newPropCpfElaborador, setNewPropCpfElaborador] = useState("");
  const [newPropCronograma, setNewPropCronograma] = useState<any[]>([]);
  const [newPropOutrasAtividades, setNewPropOutrasAtividades] = useState<any[]>([]);
  const [newPropMembrosFamiliares, setNewPropMembrosFamiliares] = useState<any[]>([]);

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

  // Cálculos de Suporte Forrageiro
  const computedAreaForrageiraTotal = useMemo(() => {
    return Math.round(
      (Number(newPropAreaPastagemNativa || 0) +
        Number(newPropAreaPastagemCultivada || 0) +
        Number(newPropAreaCapineira || 0) +
        Number(newPropAreaPalma || 0)) *
        100
    ) / 100;
  }, [
    newPropAreaPastagemNativa,
    newPropAreaPastagemCultivada,
    newPropAreaCapineira,
    newPropAreaPalma,
  ]);

  const computedRebanhoUa = useMemo(() => {
    if (newPropRebanhoTotalUa > 0) return newPropRebanhoTotalUa;
    if (newPropRebanhoCabecas > 0) return Math.round(newPropRebanhoCabecas * 0.8 * 10) / 10;
    return 0;
  }, [newPropRebanhoTotalUa, newPropRebanhoCabecas]);

  const computedTaxaLotacao = useMemo(() => {
    if (newPropTaxaLotacao > 0) return newPropTaxaLotacao;
    if (computedAreaForrageiraTotal > 0 && computedRebanhoUa > 0) {
      return Math.round((computedRebanhoUa / computedAreaForrageiraTotal) * 100) / 100;
    }
    return 0;
  }, [newPropTaxaLotacao, computedAreaForrageiraTotal, computedRebanhoUa]);

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

  // ── Processar Leitura da Planilha Excel ────────────────────────────────────
  const handleProcessSpreadsheet = async () => {
    if (!importFile) {
      toast({
        title: "Selecione um arquivo",
        description: "Escolha uma planilha Excel (.xlsx, .xlsm, .xls) ou CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingFile(true);
    try {
      const { parseExcelProposalFull } = await safeDynamicImport(() =>
        import("@/utils/excelInversoesReader")
      );
      const result = await parseExcelProposalFull(importFile, {
        customPassword: importPassword.trim() || undefined,
        findReferencia: (nome: string) => {
          if (!catalogoInversoes) return null;
          const q = nome.trim().toLowerCase();
          return (
            catalogoInversoes.find(
              (c) =>
                c.nome_completo.toLowerCase() === q ||
                c.item.toLowerCase() === q ||
                q.includes(c.item.toLowerCase())
            ) || null
          );
        },
        uf: projetistaInfo?.uf || undefined,
      });

      if (!result.success && (!result.items || result.items.length === 0) && !result.producerName) {
        toast({
          title: "Erro ao ler planilha",
          description: result.error || "Não foi possível extrair dados válidos da planilha enviada.",
          variant: "destructive",
        });
        return;
      }

      setParsedProposalData(result);
      toast({
        title: "Planilha analisada com sucesso! 📊",
        description: `Dados identificados (${result.items.length} itens orçados). Revise o resumo abaixo e clique em 'Confirmar e Preencher'.`,
      });
    } catch (err: any) {
      console.error("Erro ao processar planilha:", err);
      if (
        err?.message?.includes("dynamically imported module") ||
        err?.message?.includes("Failed to fetch") ||
        err?.name === "ChunkLoadError"
      ) {
        toast({
          title: "Atualização Detectada",
          description: "O sistema foi atualizado no servidor. Recarregando a página...",
        });
        setTimeout(() => window.location.reload(), 1200);
        return;
      }
      toast({
        title: "Erro no processamento",
        description: err.message || "Falha ao processar o arquivo Excel.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // ── Aplicar Dados Extraídos ao Formulário ──────────────────────────────────
  const handleApplyImportedData = () => {
    if (!parsedProposalData) return;

    if (parsedProposalData.producerName) {
      setNewPropProducerName(parsedProposalData.producerName);
    }
    if (parsedProposalData.producerCpf) {
      setNewPropProducerCpf(formatCPF(parsedProposalData.producerCpf));
    }
    if (parsedProposalData.producerPhone) {
      setNewPropProducerPhone(formatPhone(parsedProposalData.producerPhone));
    }
    if (parsedProposalData.municipio) {
      setNewPropMunicipio(parsedProposalData.municipio);
    }
    if (parsedProposalData.localizacao) {
      setNewPropLocalizacao(parsedProposalData.localizacao);
    }
    if (parsedProposalData.dapCaf) {
      setNewPropDapCaf(parsedProposalData.dapCaf);
    }
    if (parsedProposalData.pronafLineId) {
      setNewPropLinha(parsedProposalData.pronafLineId);
    }
    if (parsedProposalData.atividade) {
      setNewPropAtividade(parsedProposalData.atividade);
    }
    if (parsedProposalData.valorSolicitado && parsedProposalData.valorSolicitado > 0) {
      setNewPropValorSolicitado(parsedProposalData.valorSolicitado);
    } else if (parsedProposalData.totalGeral > 0) {
      setNewPropValorSolicitado(parsedProposalData.totalGeral);
    }

    if (parsedProposalData.agenciaBnb && agencies.length > 0) {
      const cleanAg = normalizeText(parsedProposalData.agenciaBnb)
        .replace(/[-/]\s*[A-Z]{2}$/, "")
        .trim();
      const foundAg = agencies.find((ag) => {
        const agNorm = normalizeText(ag.name);
        return agNorm.includes(cleanAg) || cleanAg.includes(agNorm);
      });
      if (foundAg) setNewPropAgenciaId(foundAg.id);
    }
    if (parsedProposalData.objetivo) {
      setNewPropObjetivo(parsedProposalData.objetivo);
    }
    if (parsedProposalData.parecerTecnico) {
      setNewPropParecer(parsedProposalData.parecerTecnico);
    }
    if (parsedProposalData.roteiroAcesso) {
      setNewPropRoteiroAcesso(parsedProposalData.roteiroAcesso);
    }
    if (parsedProposalData.custoAssessoria !== undefined && parsedProposalData.custoAssessoria > 0) {
      setNewPropCustoAssessoria(parsedProposalData.custoAssessoria);
    }

    // Preenche dados expandidos do proponente
    const dp = parsedProposalData.dadosProponente;
    if (dp) {
      if (dp.apelido) setNewPropApelido(dp.apelido);
      if (dp.tipoCliente) setNewPropTipoCliente(dp.tipoCliente);
      if (dp.rg) setNewPropRg(dp.rg);
      if (dp.orgaoEmissor) setNewPropOrgaoEmissor(dp.orgaoEmissor);
      if (dp.ufRg) setNewPropUfRg(dp.ufRg);
      if (dp.dataEmissaoRg) setNewPropDataEmissaoRg(dp.dataEmissaoRg);
      if (dp.tipoDocumento) setNewPropTipoDocumento(dp.tipoDocumento);
      if (dp.dataNascimento) setNewPropDataNascimento(dp.dataNascimento);
      if (dp.naturalidade) setNewPropNaturalidade(dp.naturalidade);
      if (dp.sexo) setNewPropSexo(dp.sexo);
      if (dp.estadoCivil) setNewPropEstadoCivil(dp.estadoCivil);
      if (dp.grauInstrucao) setNewPropGrauInstrucao(dp.grauInstrucao);
      if (dp.profissao) setNewPropProfissao(dp.profissao);
      if (dp.rendaMensal) setNewPropRendaMensal(dp.rendaMensal);
      if (dp.nomeMae) setNewPropNomeMae(dp.nomeMae);
      if (dp.nomePai) setNewPropNomePai(dp.nomePai);
      if (dp.porte) setNewPropPorte(dp.porte);

      if (dp.endereco) setNewPropEndereco(dp.endereco);
      if (dp.complemento) setNewPropComplemento(dp.complemento);
      if (dp.bairro) setNewPropBairro(dp.bairro);
      if (dp.cep) setNewPropCep(dp.cep);
      if (dp.uf) setNewPropUf(dp.uf);

      if (dp.nomeConjuge) setNewPropNomeConjuge(dp.nomeConjuge);
      if (dp.cpfConjuge) setNewPropCpfConjuge(formatCPF(dp.cpfConjuge));
      if (dp.dataNascimentoConjuge) setNewPropDataNascimentoConjuge(dp.dataNascimentoConjuge);
      if (dp.rgConjuge) setNewPropRgConjuge(dp.rgConjuge);
      if (dp.orgaoEmissorConjuge) setNewPropOrgaoEmissorConjuge(dp.orgaoEmissorConjuge);
      if (dp.ufConjuge) setNewPropUfConjuge(dp.ufConjuge);
      if (dp.profissaoConjuge) setNewPropProfissaoConjuge(dp.profissaoConjuge);

      if (dp.condicaoPosse) setNewPropCondicaoPosse(dp.condicaoPosse);
      if (dp.tipoProprietario) setNewPropTipoProprietario(dp.tipoProprietario);
      if (dp.nomeProprietario) setNewPropNomeProprietario(dp.nomeProprietario);
      if (dp.cpfProprietario) setNewPropCpfProprietario(formatCPF(dp.cpfProprietario));
      if (dp.areaTotalHa && dp.areaTotalHa > 0) setNewPropAreaTotalHa(dp.areaTotalHa);
      if (dp.areaExploradaHa && dp.areaExploradaHa > 0) setNewPropAreaExploradaHa(dp.areaExploradaHa);
      if (dp.areaPastagemHa && dp.areaPastagemHa > 0) setNewPropAreaPastagemHa(dp.areaPastagemHa);
      if (dp.areaReservaHa && dp.areaReservaHa > 0) setNewPropAreaReservaHa(dp.areaReservaHa);
      if (dp.car) setNewPropCar(dp.car);
      if (dp.nirf) setNewPropNirf(dp.nirf);
      if (dp.sncr || dp.ccir) setNewPropCcir(dp.sncr || dp.ccir || "");
      if (dp.roteiroAcesso) setNewPropRoteiroAcesso(dp.roteiroAcesso);
      if (dp.comentariosSolosAguada) setNewPropSolosAguada(dp.comentariosSolosAguada);
      if (dp.banco) setNewPropBanco(dp.banco);
      if (dp.agencia || dp.conta) {
        setNewPropAgenciaConta(`Ag: ${dp.agencia || ""} / C/C: ${dp.conta || ""}`);
      }

      if (dp.tituloEleitoral) setNewPropTituloEleitoral(dp.tituloEleitoral);
      if (dp.beneficiarioPoliticasPublicas) setNewPropBeneficiarioPoliticas(dp.beneficiarioPoliticasPublicas);
      if (dp.enderecoCorrespondencia) setNewPropEnderecoCorrespondencia(dp.enderecoCorrespondencia);
      if (dp.edificacoes) setNewPropEdificacoes(dp.edificacoes);
      if (dp.semoventes) setNewPropSemoventes(dp.semoventes);
      if (dp.terrasCoberturas) setNewPropTerrasCoberturas(dp.terrasCoberturas);
      if (dp.empresaElaboradora) setNewPropEmpresaElaboradora(dp.empresaElaboradora);
      if (dp.elaborador) setNewPropElaborador(dp.elaborador);
      if (dp.cpfElaborador) setNewPropCpfElaborador(formatCPF(dp.cpfElaborador));
      if (dp.georreferenciamento) setNewPropGeorreferenciamento(dp.georreferenciamento);
      if (dp.cronograma) setNewPropCronograma(dp.cronograma);
      if (dp.outrasAtividades) setNewPropOutrasAtividades(dp.outrasAtividades);
      if (dp.membrosFamiliares) setNewPropMembrosFamiliares(dp.membrosFamiliares);
      if (dp.financiamento) {
        if (dp.financiamento.prazoMeses) setNewPropFinanciamentoPrazo(dp.financiamento.prazoMeses);
        if (dp.financiamento.carenciaMeses) setNewPropFinanciamentoCarencia(dp.financiamento.carenciaMeses);
        if (dp.financiamento.jurosAnual) setNewPropFinanciamentoJuros(dp.financiamento.jurosAnual);
        if (dp.financiamento.periodicidade) setNewPropFinanciamentoPeriodicidade(dp.financiamento.periodicidade);
      }
    }

    // Preenche Suporte Forrageiro & Dimensionamento Pecuário
    const sf = parsedProposalData.suporteForrageiro;
    if (sf && (sf.temPecuaria || sf.areaTotalForrageiraHa > 0 || sf.rebanhoCabecas > 0)) {
      setNewPropTemPecuaria(true);
      if (sf.areaPastagemNativaHa > 0) setNewPropAreaPastagemNativa(sf.areaPastagemNativaHa);
      if (sf.areaPastagemCultivadaHa > 0) setNewPropAreaPastagemCultivada(sf.areaPastagemCultivadaHa);
      if (sf.areaCapineiraHa > 0) setNewPropAreaCapineira(sf.areaCapineiraHa);
      if (sf.areaPalmaHa > 0) setNewPropAreaPalma(sf.areaPalmaHa);
      if (sf.especiePastagem) setNewPropEspeciePastagem(sf.especiePastagem);
      if (sf.rebanhoCabecas > 0) setNewPropRebanhoCabecas(sf.rebanhoCabecas);
      if (sf.rebanhoTotalUa > 0) setNewPropRebanhoTotalUa(sf.rebanhoTotalUa);
      if (sf.taxaLotacaoUaHa > 0) setNewPropTaxaLotacao(sf.taxaLotacaoUaHa);
      if (sf.periodoEstiagemMeses > 0) setNewPropPeriodoEstiagem(sf.periodoEstiagemMeses);
      if (sf.estrategiaSuplementacao) setNewPropEstrategiaSuplementacao(sf.estrategiaSuplementacao);
      if (sf.parecerCapacidadeSuporte) setNewPropParecerSuporte(sf.parecerCapacidadeSuporte);
    }

    // Carregar itens de inversão na grade
    if (parsedProposalData.items && parsedProposalData.items.length > 0) {
      const convertedItems: InversaoFormItem[] = parsedProposalData.items.map((it, idx) => ({
        id: `imp-${Date.now()}-${idx}`,
        item: it.nome,
        unidade: it.unid || "UNID",
        quantidade: it.quant,
        valorUnitario: it.valor_unitario,
        valorTotal: it.valor,
        tetoUnitario: it.teto_maximo || undefined,
        excesso: !!(it.teto_maximo && it.valor_unitario > it.teto_maximo),
      }));
      setNewPropInversoes(convertedItems);
    }

    // Anexa o próprio arquivo Excel como o Projeto Técnico
    if (importFile) {
      setDocProjetoTecnico(importFile);
    }

    setImportModalOpen(false);
    setParsedProposalData(null);
    setHidePromptBanner(true);

    toast({
      title: "Formulário Preenchido com Sucesso! 🎉",
      description: "Dados do produtor, suporte forrageiro e inversões foram extraídos e aplicados com precisão.",
    });
  };

  // Submissão de Nova Proposta
  const handleSubmitNewProposal = async () => {
    if (!user) return;

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

      const inversoesPayload = newPropInversoes.map((it) => ({
        item: it.item,
        descricao: it.item,
        unidade: it.unidade,
        quantidade: it.quantidade,
        valor_unitario: it.valorUnitario,
        valor_total: it.valorTotal,
        teto_maximo: it.tetoUnitario || null,
      }));

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

      const dadosProponentePayload = {
        nome: newPropProducerName.trim().toUpperCase(),
        apelido: newPropApelido.trim().toUpperCase() || null,
        tipo_cliente: newPropTipoCliente || null,
        cpf: cleanCpf,
        rg: newPropRg.trim() || null,
        orgao_emissor: newPropOrgaoEmissor.trim().toUpperCase() || null,
        uf_rg: newPropUfRg.trim().toUpperCase() || null,
        data_emissao_rg: newPropDataEmissaoRg.trim() || null,
        tipo_documento: newPropTipoDocumento || null,
        data_nascimento: newPropDataNascimento.trim() || null,
        naturalidade: newPropNaturalidade.trim().toUpperCase() || null,
        sexo: newPropSexo || null,
        estado_civil: newPropEstadoCivil || null,
        grau_instrucao: newPropGrauInstrucao || null,
        profissao: newPropProfissao.trim() || null,
        renda_mensal: Number(newPropRendaMensal) || null,
        nome_mae: newPropNomeMae.trim().toUpperCase() || null,
        nome_pai: newPropNomePai.trim().toUpperCase() || null,
        porte: newPropPorte || null,
        endereco: newPropEndereco.trim().toUpperCase() || null,
        complemento: newPropComplemento.trim() || null,
        bairro: newPropBairro.trim().toUpperCase() || null,
        cep: newPropCep.trim() || null,
        telefone: newPropProducerPhone.trim() || null,
        municipio: newPropMunicipio.trim().toUpperCase() || null,
        uf: newPropUf.trim().toUpperCase() || null,
        propriedade: newPropLocalizacao.trim().toUpperCase() || null,
        condicao_posse: newPropCondicaoPosse || null,
        tipo_proprietario: newPropTipoProprietario || null,
        nome_proprietario: newPropNomeProprietario.trim().toUpperCase() || null,
        cpf_proprietario: newPropCpfProprietario.replace(/\D/g, "") || null,
        area_total_ha: Number(newPropAreaTotalHa) || 0,
        area_explorada_ha: Number(newPropAreaExploradaHa) || 0,
        area_pastagem_ha: Number(newPropAreaPastagemHa) || 0,
        area_reserva_ha: Number(newPropAreaReservaHa) || 0,
        dap_caf: newPropDapCaf.trim() || null,
        car: newPropCar.trim() || null,
        nirf: newPropNirf.trim() || null,
        ccir: newPropCcir.trim() || null,
        roteiro_acesso: newPropRoteiroAcesso.trim() || null,
        solos_aguada: newPropSolosAguada.trim() || null,
        objetivo: newPropObjetivo || null,
        custo_assessoria: Number(newPropCustoAssessoria) || 0,
        banco: newPropBanco || null,
        agencia_conta: newPropAgenciaConta.trim() || null,
        nome_conjuge: newPropNomeConjuge.trim().toUpperCase() || null,
        cpf_conjuge: newPropCpfConjuge.replace(/\D/g, "") || null,
        data_nascimento_conjuge: newPropDataNascimentoConjuge.trim() || null,
        rg_conjuge: newPropRgConjuge.trim() || null,
        orgao_emissor_conjuge: newPropOrgaoEmissorConjuge.trim().toUpperCase() || null,
        uf_conjuge: newPropUfConjuge.trim().toUpperCase() || null,
        profissao_conjuge: newPropProfissaoConjuge.trim() || null,
        titulo_eleitoral: newPropTituloEleitoral.trim() || null,
        beneficiario_politicas_publicas: newPropBeneficiarioPoliticas.trim() || null,
        endereco_correspondencia: newPropEnderecoCorrespondencia.trim() || null,
        edificacoes: newPropEdificacoes.length > 0 ? newPropEdificacoes : null,
        semoventes: newPropSemoventes.length > 0 ? newPropSemoventes : null,
        terras_coberturas: newPropTerrasCoberturas.length > 0 ? newPropTerrasCoberturas : null,
        financiamento: {
          prazo_meses: Number(newPropFinanciamentoPrazo) || 96,
          carencia_meses: Number(newPropFinanciamentoCarencia) || 24,
          juros_anual: Number(newPropFinanciamentoJuros) || 6,
          periodicidade: newPropFinanciamentoPeriodicidade || "Anual",
        },
        georreferenciamento: newPropGeorreferenciamento.length > 0 ? newPropGeorreferenciamento : null,
        empresa_elaboradora: newPropEmpresaElaboradora.trim().toUpperCase() || null,
        elaborador: (newPropElaborador || projetistaInfo?.name || displayName || "").trim().toUpperCase() || null,
        cpf_elaborador: (newPropCpfElaborador || projetistaInfo?.cpf || "").replace(/\D/g, "") || null,
        cronograma: newPropCronograma.length > 0 ? newPropCronograma : null,
        outras_atividades: newPropOutrasAtividades.length > 0 ? newPropOutrasAtividades : null,
        membros_familiares: newPropMembrosFamiliares.length > 0 ? newPropMembrosFamiliares : null,
      };

      const suporteForrageiroPayload =
        newPropTemPecuaria || computedAreaForrageiraTotal > 0 || newPropRebanhoCabecas > 0
          ? {
              tem_pecuaria: true,
              area_pastagem_nativa_ha: Number(newPropAreaPastagemNativa) || 0,
              area_pastagem_cultivada_ha: Number(newPropAreaPastagemCultivada) || 0,
              area_capineira_ha: Number(newPropAreaCapineira) || 0,
              area_palma_ha: Number(newPropAreaPalma) || 0,
              area_total_forrageira_ha: computedAreaForrageiraTotal,
              especie_pastagem: newPropEspeciePastagem || "Brachiaria",
              rebanho_cabecas: Number(newPropRebanhoCabecas) || 0,
              rebanho_total_ua: computedRebanhoUa,
              taxa_lotacao_ua_ha: computedTaxaLotacao,
              periodo_estiagem_meses: Number(newPropPeriodoEstiagem) || 6,
              estrategia_suplementacao:
                newPropEstrategiaSuplementacao ||
                "Suplementação volumosa e mineral no período de estiagem",
              parecer_capacidade_suporte:
                newPropParecerSuporte ||
                (computedTaxaLotacao <= 1.2
                  ? "Suporte Forrageiro Equilibrado e Sustentável."
                  : "Lotação Intensiva com Suporte de Reserva Estratégica."),
            }
          : null;

      const { data: insertedProposal, error: insertErr } = await supabase
        .from("stock_proposals")
        .insert([
          {
            producer_name: newPropProducerName.trim().toUpperCase(),
            producer_cpf: cleanCpf,
            producer_phone: newPropProducerPhone.trim(),
            data_nascimento: newPropDataNascimento.trim() || null,
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
            dados_proponente: dadosProponentePayload,
            suporte_forrageiro: suporteForrageiroPayload,
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
      setNewPropRg("");
      setNewPropOrgaoEmissor("");
      setNewPropDataNascimento("");
      setNewPropEstadoCivil("Casado(a)");
      setNewPropNomeConjuge("");
      setNewPropCpfConjuge("");
      setNewPropCondicaoPosse("Proprietário");
      setNewPropAreaTotalHa(0);
      setNewPropAreaExploradaHa(0);
      setNewPropCar("");
      setNewPropNirfCcir("");
      setNewPropAgenciaConta("");
      setNewPropTemPecuaria(false);
      setNewPropAreaPastagemNativa(0);
      setNewPropAreaPastagemCultivada(0);
      setNewPropAreaCapineira(0);
      setNewPropAreaPalma(0);
      setNewPropRebanhoCabecas(0);
      setNewPropRebanhoTotalUa(0);
      setNewPropTaxaLotacao(0);
      setNewPropParecerSuporte("");
      setDocProjetoTecnico(null);
      setDocDapCaf(null);
      setDocOrcamentos(null);
      setDocRgCpf(null);
      setDocComprovanteImovel(null);
      setHidePromptBanner(false);

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
            {/* ── CARD INICIAL: Pergunta se deseja importar planilha ─── */}
            {!hidePromptBanner && (
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-emerald-400/30 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
                      <FileSpreadsheet className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base md:text-lg font-heading font-black tracking-tight">
                          Deseja importar a planilha do projeto?
                        </h3>
                        <Badge className="bg-emerald-400/30 text-white border-white/30 text-[10px] font-bold">
                          Preenchimento Automático
                        </Badge>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                        Importe a planilha oficial do <strong>PRONAF / BNB (SEAP)</strong> ou orçamentária (com suporte nativo à senha <code>senhasBNxI</code>) para preencher instantaneamente os dados do produtor, enquadramento da linha, valor a financiar e todos os itens de investimento orçados.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
                    <Button
                      onClick={() => {
                        setImportModalOpen(true);
                        setParsedProposalData(null);
                      }}
                      className="rounded-2xl bg-white hover:bg-white/90 text-teal-800 font-extrabold text-xs px-5 h-11 shadow-lg shadow-black/15 gap-2"
                    >
                      <UploadCloud className="h-4 w-4 text-teal-700" />
                      <span>Sim, Importar Planilha</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => setHidePromptBanner(true)}
                      className="rounded-2xl text-white/90 hover:text-white hover:bg-white/10 text-xs h-11"
                    >
                      Preencher Manualmente
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Banner Informativo com Atalho Persistente */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
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

              <Button
                onClick={() => {
                  setImportModalOpen(true);
                  setParsedProposalData(null);
                }}
                className="rounded-2xl bg-white text-teal-900 hover:bg-white/90 font-bold text-xs gap-2 shrink-0 shadow-md"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Importar Planilha do Projeto</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1 & 2: Formulário Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Identificação do Produtor Rural */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <User className="h-4 w-4 text-teal-600" />
                      1. Identificação do Produtor Rural (Beneficiário)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Dados pessoais, civis, filiação e endereço completo do proponente do crédito
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">
                          Nome Completo do Produtor <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="Ex: João da Silva Ferreira"
                          value={newPropProducerName}
                          onChange={(e) => setNewPropProducerName(e.target.value)}
                          className="rounded-xl h-10 text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Apelido / Nome Social</Label>
                        <Input
                          placeholder="Ex: Joãozinho"
                          value={newPropApelido}
                          onChange={(e) => setNewPropApelido(e.target.value)}
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
                          className="rounded-xl h-10 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Data de Nascimento</Label>
                        <Input
                          placeholder="DD/MM/AAAA"
                          value={newPropDataNascimento}
                          onChange={(e) => setNewPropDataNascimento(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Sexo</Label>
                        <Select value={newPropSexo} onValueChange={setNewPropSexo}>
                          <SelectTrigger className="rounded-xl h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Documento de Identidade */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">RG / Nº Documento</Label>
                        <Input
                          placeholder="Ex: 00000000000"
                          value={newPropRg}
                          onChange={(e) => setNewPropRg(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Órgão Emissor / UF</Label>
                        <Input
                          placeholder="Ex: SSP/MA"
                          value={newPropOrgaoEmissor}
                          onChange={(e) => setNewPropOrgaoEmissor(e.target.value.toUpperCase())}
                          className="rounded-xl h-10 text-xs uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Naturalidade</Label>
                        <Input
                          placeholder="Ex: Turiaçu - MA"
                          value={newPropNaturalidade}
                          onChange={(e) => setNewPropNaturalidade(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      {/* Estado Civil, Grau de Instrução & Profissão */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Estado Civil</Label>
                        <Select value={newPropEstadoCivil} onValueChange={setNewPropEstadoCivil}>
                          <SelectTrigger className="rounded-xl h-10 text-xs">
                            <SelectValue placeholder="Selecione o estado civil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Casado(a) comunhão parcial de bens">Casado(a) comunhão parcial</SelectItem>
                            <SelectItem value="Casado(a) comunhão total de bens">Casado(a) comunhão total</SelectItem>
                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                            <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                            <SelectItem value="União Estável">União Estável</SelectItem>
                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                            <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Grau de Instrução</Label>
                        <Input
                          placeholder="Ex: Alfabetizado(a)"
                          value={newPropGrauInstrucao}
                          onChange={(e) => setNewPropGrauInstrucao(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Profissão</Label>
                        <Input
                          placeholder="Ex: Agricultor(a)"
                          value={newPropProfissao}
                          onChange={(e) => setNewPropProfissao(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      {/* Filiação & Enquadramento */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Nome da Mãe</Label>
                        <Input
                          placeholder="Nome da mãe do produtor"
                          value={newPropNomeMae}
                          onChange={(e) => setNewPropNomeMae(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Nome do Pai</Label>
                        <Input
                          placeholder="Nome do pai do produtor"
                          value={newPropNomePai}
                          onChange={(e) => setNewPropNomePai(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Renda Mensal (R$)</Label>
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={newPropRendaMensal || ""}
                          onChange={(e) => setNewPropRendaMensal(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Enquadramento / Porte PRONAF</Label>
                        <Input
                          placeholder="Ex: PRONAFIANO GRUPO A - ASSOCIADO/COOPERADO"
                          value={newPropPorte}
                          onChange={(e) => setNewPropPorte(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Número da DAP / CAF</Label>
                        <Input
                          placeholder="Ex: CAF-MA-0012345/2026"
                          value={newPropDapCaf}
                          onChange={(e) => setNewPropDapCaf(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono font-bold"
                        />
                      </div>

                      {/* Endereço & Contato */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Endereço / Comunidade / Logradouro</Label>
                        <Input
                          placeholder="Ex: Povoado Torozinho - Gleba 2"
                          value={newPropEndereco}
                          onChange={(e) => setNewPropEndereco(e.target.value)}
                          className="rounded-xl h-10 text-xs"
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
                        <Label className="text-xs font-bold">Bairro / Zona</Label>
                        <Input
                          placeholder="Ex: Zona Rural"
                          value={newPropBairro}
                          onChange={(e) => setNewPropBairro(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">CEP</Label>
                        <Input
                          placeholder="00000-000"
                          value={newPropCep}
                          onChange={(e) => setNewPropCep(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Município / UF do Produtor</Label>
                        <Input
                          placeholder="Ex: Turiaçu - MA"
                          value={newPropMunicipio}
                          onChange={(e) => setNewPropMunicipio(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Título Eleitoral</Label>
                        <Input
                          placeholder="Nº do Título Eleitoral"
                          value={newPropTituloEleitoral}
                          onChange={(e) => setNewPropTituloEleitoral(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Beneficiário de Políticas Públicas</Label>
                        <Input
                          placeholder="Ex: Cliente não Beneficiário de Políticas Públicas"
                          value={newPropBeneficiarioPoliticas}
                          onChange={(e) => setNewPropBeneficiarioPoliticas(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-xs font-bold">Endereço Residencial / Correspondência</Label>
                        <Input
                          placeholder="Ex: Rua / Av., Nº, Complemento, Bairro, CEP, Município"
                          value={newPropEnderecoCorrespondencia}
                          onChange={(e) => setNewPropEnderecoCorrespondencia(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Cônjuge / Companheiro(a) */}
                {(newPropEstadoCivil.includes("Casad") || newPropEstadoCivil.includes("Uni")) && (
                  <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                        <User className="h-4 w-4 text-teal-600" />
                        2. Cônjuge / Companheiro(a)
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Qualificação civil do parceiro(a) com anuência e composição de renda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs font-bold">Nome Completo do Cônjuge</Label>
                          <Input
                            placeholder="Nome do cônjuge / companheiro(a)"
                            value={newPropNomeConjuge}
                            onChange={(e) => setNewPropNomeConjuge(e.target.value)}
                            className="rounded-xl h-10 text-xs font-semibold"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">CPF do Cônjuge</Label>
                          <Input
                            placeholder="000.000.000-00"
                            value={newPropCpfConjuge}
                            onChange={(e) => setNewPropCpfConjuge(formatCPF(e.target.value))}
                            maxLength={14}
                            className="rounded-xl h-10 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Data de Nascimento</Label>
                          <Input
                            placeholder="DD/MM/AAAA"
                            value={newPropDataNascimentoConjuge}
                            onChange={(e) => setNewPropDataNascimentoConjuge(e.target.value)}
                            className="rounded-xl h-10 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">RG do Cônjuge</Label>
                          <Input
                            placeholder="Ex: 0000000000"
                            value={newPropRgConjuge}
                            onChange={(e) => setNewPropRgConjuge(e.target.value)}
                            className="rounded-xl h-10 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Órgão Emissor / UF</Label>
                          <Input
                            placeholder="Ex: SSP/MA"
                            value={newPropOrgaoEmissorConjuge}
                            onChange={(e) => setNewPropOrgaoEmissorConjuge(e.target.value.toUpperCase())}
                            className="rounded-xl h-10 text-xs uppercase"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 3. Dados do Imóvel, Posse & Recursos Naturais */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Trees className="h-4 w-4 text-emerald-600" />
                      3. Dados do Imóvel, Posse & Recursos Hídricos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Denominação, áreas em hectares, CAR, regime fundiário, solos e itinerário de acesso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-bold">Denominação da Propriedade / Assentamento</Label>
                        <Input
                          placeholder="Ex: Sítio São José - PA Mira Flores"
                          value={newPropLocalizacao}
                          onChange={(e) => setNewPropLocalizacao(e.target.value)}
                          className="rounded-xl h-10 text-xs font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Condição de Posse</Label>
                        <Select value={newPropCondicaoPosse} onValueChange={setNewPropCondicaoPosse}>
                          <SelectTrigger className="rounded-xl h-10 text-xs">
                            <SelectValue placeholder="Condição de posse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Proprietário">Proprietário</SelectItem>
                            <SelectItem value="Assentado">Assentado da Reforma Agrária</SelectItem>
                            <SelectItem value="Posseiro">Posseiro</SelectItem>
                            <SelectItem value="Arrendatário">Arrendatário</SelectItem>
                            <SelectItem value="Parceiro">Parceiro</SelectItem>
                            <SelectItem value="Comodatário">Comodatário</SelectItem>
                            <SelectItem value="Anuência">Anuência Familiar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Nome do Titular da Terra</Label>
                        <Input
                          placeholder="Nome do proprietário / anuente"
                          value={newPropNomeProprietario}
                          onChange={(e) => setNewPropNomeProprietario(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">CPF do Proprietário</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={newPropCpfProprietario}
                          onChange={(e) => setNewPropCpfProprietario(formatCPF(e.target.value))}
                          maxLength={14}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">CAR (Cadastro Ambiental Rural)</Label>
                        <Input
                          placeholder="Ex: MA2112407..."
                          value={newPropCar}
                          onChange={(e) => setNewPropCar(e.target.value.toUpperCase())}
                          className="rounded-xl h-10 text-xs font-mono uppercase"
                        />
                      </div>

                      {/* Áreas em Hectares */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Área Total (ha)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 25.5"
                          value={newPropAreaTotalHa || ""}
                          onChange={(e) => setNewPropAreaTotalHa(Number(e.target.value) || 0)}
                          className="rounded-xl h-10 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Área Explorada (ha)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 15.0"
                          value={newPropAreaExploradaHa || ""}
                          onChange={(e) => setNewPropAreaExploradaHa(Number(e.target.value) || 0)}
                          className="rounded-xl h-10 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Área de Reserva / Preservação (ha)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 10.0"
                          value={newPropAreaReservaHa || ""}
                          onChange={(e) => setNewPropAreaReservaHa(Number(e.target.value) || 0)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">NIRF</Label>
                        <Input
                          placeholder="Ex: 1234567-8"
                          value={newPropNirf}
                          onChange={(e) => setNewPropNirf(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">SNCR / CCIR / Matrícula</Label>
                        <Input
                          placeholder="Ex: 987654"
                          value={newPropCcir}
                          onChange={(e) => setNewPropCcir(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Dados Bancários Produtor (BNB)</Label>
                        <Input
                          placeholder="Ex: Ag: 0098 / Conta Corrente: 12345-6"
                          value={newPropAgenciaConta}
                          onChange={(e) => setNewPropAgenciaConta(e.target.value)}
                          className="rounded-xl h-10 text-xs font-mono"
                        />
                      </div>

                      {/* Roteiro e Solos/Aguada */}
                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-xs font-bold">Roteiro / Itinerário de Acesso à Propriedade</Label>
                        <Textarea
                          rows={2}
                          placeholder="Ex: Saindo da sede do município cerca de 26 km até a comunidade..."
                          value={newPropRoteiroAcesso}
                          onChange={(e) => setNewPropRoteiroAcesso(e.target.value)}
                          className="rounded-xl text-xs resize-none"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-3">
                        <Label className="text-xs font-bold">Solos, Recursos Hídricos & Aguadas</Label>
                        <Textarea
                          rows={2}
                          placeholder="Ex: Solos médios arenosos de boa fertilidade; imóvel dotado por igarapé e aguada natural..."
                          value={newPropSolosAguada}
                          onChange={(e) => setNewPropSolosAguada(e.target.value)}
                          className="rounded-xl text-xs resize-none"
                        />
                      </div>

                      {/* Resumo de Patrimônio Avaliado e Georreferenciamento (se importado do PRONAF-C) */}
                      {(newPropTerrasCoberturas.length > 0 ||
                        newPropEdificacoes.length > 0 ||
                        newPropSemoventes.length > 0 ||
                        newPropGeorreferenciamento.length > 0) && (
                        <div className="sm:col-span-3 pt-3 border-t border-border/40 space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                            Inventário Patrimonial & Georreferenciamento Extraído do Plano
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {newPropTerrasCoberturas.length > 0 && (
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-muted-foreground block">
                                  Terras e Coberturas ({newPropTerrasCoberturas.length} registros)
                                </span>
                                {newPropTerrasCoberturas.map((tc, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-foreground">{tc.descricao}</span>
                                    <Badge variant="outline" className="font-mono text-[10px]">
                                      {tc.areaHa} ha
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}

                            {newPropEdificacoes.length > 0 && (
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-muted-foreground block">
                                  Edificações & Benfeitorias ({newPropEdificacoes.length} registros)
                                </span>
                                {newPropEdificacoes.map((ed, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-foreground truncate max-w-[180px]" title={ed.descricao}>
                                      {ed.descricao} ({ed.estado || "Regular"})
                                    </span>
                                    <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                                      {ed.valor ? formatCurrency(Number(ed.valor)) : "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {newPropSemoventes.length > 0 && (
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-muted-foreground block">
                                  Semoventes Existentes ({newPropSemoventes.length} categorias)
                                </span>
                                {newPropSemoventes.map((sm, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="font-semibold text-foreground">
                                      {sm.quantidade}x {sm.categoria} {sm.raca ? `(${sm.raca})` : ""}
                                    </span>
                                    <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                                      {sm.valor ? `${formatCurrency(Number(sm.valor))}/un` : "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {newPropGeorreferenciamento.length > 0 && (
                              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                                <span className="font-bold text-[10px] uppercase text-emerald-800 dark:text-emerald-300 block">
                                  Georreferenciamento ({newPropGeorreferenciamento.length} coordenadas GPS)
                                </span>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  Vértice 1: Lat {newPropGeorreferenciamento[0].latitude} | Long {newPropGeorreferenciamento[0].longitude}
                                </p>
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                                  ✓ Glebas georreferenciadas vinculadas aos itens de inversão
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Enquadramento da Linha & Agência */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-600" />
                      4. Linha de Crédito PRONAF & Agência de Atendimento
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enquadramento normativo, agência BNB de vinculação e objetivo da proposta
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

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Atividade / Finalidade do Crédito</Label>
                        <Input
                          placeholder="Ex: Bovinocultura Extensiva / Corte / Leite"
                          value={newPropAtividade}
                          onChange={(e) => setNewPropAtividade(e.target.value)}
                          className="rounded-xl h-10 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Objetivo do Projeto</Label>
                        <Input
                          placeholder="Ex: Implantação / Expansão / Manutenção"
                          value={newPropObjetivo}
                          onChange={(e) => setNewPropObjetivo(e.target.value)}
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

                {/* 5. Valor Solicitado & Validação */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-teal-600" />
                      5. Valor a Financiar & Validação de Teto
                    </CardTitle>
                    <CardDescription className="text-xs">
                      O valor solicitado é validado em tempo real contra o regulamento do PRONAF
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Assessoria Técnica (ATER)</Label>
                        <Select
                          value={String(newPropCustoAssessoria)}
                          onValueChange={(val) => setNewPropCustoAssessoria(Number(val))}
                        >
                          <SelectTrigger className="rounded-xl h-12 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1" className="text-xs font-medium">
                              Inclusa no Financiamento (5% ATER)
                            </SelectItem>
                            <SelectItem value="0" className="text-xs font-medium">
                              Sem Retenção de Assessoria (0%)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Condições de Financiamento & Elaboração (Cronograma de Reembolso) */}
                    <div className="pt-3 border-t border-border/40 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Condições de Reembolso & Responsável Técnico (PRONAF)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Prazo Total (Meses)</Label>
                          <Input
                            type="number"
                            value={newPropFinanciamentoPrazo}
                            onChange={(e) => setNewPropFinanciamentoPrazo(Number(e.target.value) || 96)}
                            className="rounded-xl h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Carência (Meses)</Label>
                          <Input
                            type="number"
                            value={newPropFinanciamentoCarencia}
                            onChange={(e) => setNewPropFinanciamentoCarencia(Number(e.target.value) || 24)}
                            className="rounded-xl h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Taxa de Juros (% a.a.)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={newPropFinanciamentoJuros}
                            onChange={(e) => setNewPropFinanciamentoJuros(Number(e.target.value) || 6)}
                            className="rounded-xl h-9 text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Periodicidade</Label>
                          <Select
                            value={newPropFinanciamentoPeriodicidade}
                            onValueChange={setNewPropFinanciamentoPeriodicidade}
                          >
                            <SelectTrigger className="rounded-xl h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Anual">Anual</SelectItem>
                              <SelectItem value="Semestral">Semestral</SelectItem>
                              <SelectItem value="Mensal">Mensal</SelectItem>
                              <SelectItem value="Parcela Única">Parcela Única</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Empresa Elaboradora / ATER</Label>
                          <Input
                            placeholder="Nome da empresa elaboradora"
                            value={newPropEmpresaElaboradora}
                            onChange={(e) => setNewPropEmpresaElaboradora(e.target.value)}
                            className="rounded-xl h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">Projetista / Elaborador Responsável</Label>
                          <Input
                            placeholder="Nome completo do elaborador"
                            value={newPropElaborador}
                            onChange={(e) => setNewPropElaborador(e.target.value)}
                            className="rounded-xl h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold">CPF do Elaborador</Label>
                          <Input
                            placeholder="000.000.000-00"
                            value={newPropCpfElaborador}
                            onChange={(e) => setNewPropCpfElaborador(formatCPF(e.target.value))}
                            maxLength={14}
                            className="rounded-xl h-9 text-xs font-mono"
                          />
                        </div>
                      </div>
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

                {/* 6. Plano de Inversões Detalhado */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-teal-600" />
                          6. Plano de Inversões (Itens Orçados)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Adicione os itens do projeto utilizando os preços de referência da tabela BNB
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
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

                    {newPropInversoes.length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs space-y-2">
                        <Calculator className="h-8 w-8 mx-auto opacity-30" />
                        <p>Nenhum item adicionado ao plano de investimento.</p>
                        <p className="text-[11px]">
                          Use o campo de busca acima ou importe a planilha do projeto para carregar todos os itens automaticamente.
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

                {/* 7. Suporte Forrageiro & Dimensionamento Pecuário */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card overflow-hidden">
                  <CardHeader className="pb-3 border-b border-border/40 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                          <Sprout className="h-4 w-4 text-emerald-600" />
                          7. Suporte Forrageiro & Dimensionamento Pecuário
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Cálculo de capacidade forrageira, rebanho em UA, taxa de lotação e balanço de alimentação no período de estiagem
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="toggle-pecuaria" className="text-xs font-bold cursor-pointer">
                          Atividade Pecuária:
                        </Label>
                        <Switch
                          id="toggle-pecuaria"
                          checked={newPropTemPecuaria}
                          onCheckedChange={setNewPropTemPecuaria}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    {!newPropTemPecuaria ? (
                      <div className="p-5 text-center border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground text-xs space-y-2">
                        <Sprout className="h-8 w-8 mx-auto text-emerald-600 opacity-40" />
                        <p className="font-semibold text-foreground">
                          Projeto exclusivamente agrícola ou não pecuário
                        </p>
                        <p className="text-[11px]">
                          Se a proposta envolver bovinos, ovinos, caprinos ou formação/recuperação de pastagens, ative a chave acima para preencher o dimensionamento forrageiro normativo do BNB.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in">
                        {/* Indicadores de Destaque no Topo do Card */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                              Área Forrageira Total
                            </span>
                            <p className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                              {computedAreaForrageiraTotal} ha
                            </p>
                          </div>

                          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                            <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase block">
                              Rebanho (Cabeças)
                            </span>
                            <p className="text-base font-black font-mono text-teal-700 dark:text-teal-300">
                              {newPropRebanhoCabecas} cab.
                            </p>
                          </div>

                          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                            <span className="text-[10px] font-bold text-cyan-800 dark:text-cyan-300 uppercase block">
                              Unidades Animais (UA)
                            </span>
                            <p className="text-base font-black font-mono text-cyan-700 dark:text-cyan-300">
                              {computedRebanhoUa} UA
                            </p>
                          </div>

                          <div className={`p-3 rounded-2xl border ${
                            computedTaxaLotacao <= 1.2
                              ? "bg-emerald-500/15 border-emerald-500/30"
                              : computedTaxaLotacao <= 2.0
                              ? "bg-amber-500/15 border-amber-500/30"
                              : "bg-rose-500/15 border-rose-500/30"
                          }`}>
                            <span className="text-[10px] font-bold uppercase block text-muted-foreground">
                              Taxa de Lotação
                            </span>
                            <p className={`text-base font-black font-mono ${
                              computedTaxaLotacao <= 1.2
                                ? "text-emerald-700 dark:text-emerald-300"
                                : computedTaxaLotacao <= 2.0
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-rose-700 dark:text-rose-300"
                            }`}>
                              {computedTaxaLotacao} UA/ha
                            </p>
                          </div>
                        </div>

                        {/* Campos de Áreas Forrageiras */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Trees className="h-3.5 w-3.5 text-emerald-600" />
                            Áreas de Pastagens e Forrageiras (Hectares):
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-semibold">
                                Pasto Cultivado (ha)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={newPropAreaPastagemCultivada || ""}
                                onChange={(e) => setNewPropAreaPastagemCultivada(Number(e.target.value) || 0)}
                                className="h-8 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-semibold">
                                Pasto Nativo (ha)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={newPropAreaPastagemNativa || ""}
                                onChange={(e) => setNewPropAreaPastagemNativa(Number(e.target.value) || 0)}
                                className="h-8 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-semibold">
                                Capineira / Canavial (ha)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={newPropAreaCapineira || ""}
                                onChange={(e) => setNewPropAreaCapineira(Number(e.target.value) || 0)}
                                className="h-8 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-semibold">
                                Palma Forrageira (ha)
                              </Label>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={newPropAreaPalma || ""}
                                onChange={(e) => setNewPropAreaPalma(Number(e.target.value) || 0)}
                                className="h-8 rounded-lg text-xs font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Espécie Forrageira & Rebanho */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-xs font-bold">
                              Espécie(s) Forrageira(s) Predominante(s)
                            </Label>
                            <Input
                              placeholder="Ex: Brachiaria brizantha, Mombaça, Buffel, Capiaçu..."
                              value={newPropEspeciePastagem}
                              onChange={(e) => setNewPropEspeciePastagem(e.target.value)}
                              className="h-9 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">
                              Total Rebanho (Cabeças)
                            </Label>
                            <Input
                              type="number"
                              placeholder="Ex: 20"
                              value={newPropRebanhoCabecas || ""}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                setNewPropRebanhoCabecas(v);
                                if (!newPropRebanhoTotalUa || newPropRebanhoTotalUa === 0) {
                                  setNewPropRebanhoTotalUa(Math.round(v * 0.8 * 10) / 10);
                                }
                              }}
                              className="h-9 rounded-xl text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Estiagem, Suplementação & Parecer Técnico */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">
                              Período de Estiagem Crítica (Meses de Seca)
                            </Label>
                            <Select
                              value={String(newPropPeriodoEstiagem || 6)}
                              onValueChange={(val) => setNewPropPeriodoEstiagem(Number(val) || 6)}
                            >
                              <SelectTrigger className="rounded-xl h-9 text-xs">
                                <SelectValue placeholder="Meses de seca" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="3">3 Meses de Seca</SelectItem>
                                <SelectItem value="4">4 Meses de Seca</SelectItem>
                                <SelectItem value="5">5 Meses de Seca</SelectItem>
                                <SelectItem value="6">6 Meses (Padrão Semiárido/Cerrado)</SelectItem>
                                <SelectItem value="7">7 Meses de Seca</SelectItem>
                                <SelectItem value="8">8 Meses de Seca Severa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">
                              Estratégia de Reserva & Suplementação
                            </Label>
                            <Input
                              placeholder="Ex: Capineira/Palma no cocho + Silagem + Sal mineral proteinado"
                              value={newPropEstrategiaSuplementacao}
                              onChange={(e) => setNewPropEstrategiaSuplementacao(e.target.value)}
                              className="h-9 rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        {/* Parecer Técnico de Capacidade de Suporte */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex items-center justify-between">
                            <span>Parecer de Capacidade de Suporte (Normativo BNB):</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                computedTaxaLotacao <= 1.2
                                  ? "border-emerald-500/40 text-emerald-700 bg-emerald-50/50"
                                  : computedTaxaLotacao <= 2.0
                                  ? "border-amber-500/40 text-amber-700 bg-amber-50/50"
                                  : "border-rose-500/40 text-rose-700 bg-rose-50/50"
                              }`}
                            >
                              {computedTaxaLotacao <= 1.2
                                ? "Capacidade Forrageira Suficiente"
                                : computedTaxaLotacao <= 2.0
                                ? "Intensivo com Suplementação"
                                : "Atenção: Sobrecarga de Lotação"}
                            </Badge>
                          </Label>
                          <Textarea
                            rows={3}
                            placeholder="Descreva a avaliação da oferta forrageira x rebanho..."
                            value={newPropParecerSuporte}
                            onChange={(e) => setNewPropParecerSuporte(e.target.value)}
                            className="rounded-xl text-xs resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 8. Documentos do Projeto */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <FolderCheck className="h-4 w-4 text-teal-600" />
                      8. Documentação do Projeto & Anexos
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
                          accept=".pdf,.xlsx,.xls,.xlsm"
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

                {/* 9. Parecer Técnico */}
                <Card className="rounded-3xl border border-border/60 shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      9. Parecer Técnico e Justificativa Agronômica
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

      {/* ── MODAL: Importar Planilha do Projeto ───────────────────── */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-black text-lg flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Importar Planilha / Exportação do Projeto (PRONAF-A / PRONAF-C / HTML)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Carregue a planilha oficial do PRONAF/BNB (.xlsx, .xls, .pronaf_c) ou a Guia de Exportação (.html) para preencher automaticamente 100% dos campos do produtor, imóvel, semoventes, financiamento e itens orçados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Seletor de Arquivo com Drag & Drop */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Arquivo da Operação (Excel, PRONAF-C ou HTML):</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xlsm,.xls,.csv,.pronaf_a,.pronaf_a2,.pronaf_c,.html,.htm"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImportFile(f);
                  setParsedProposalData(null);
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
                  importFile
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                    : "border-border/80 hover:bg-muted/40"
                }`}
              >
                {importFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto" />
                    <p className="font-extrabold text-foreground text-sm">{importFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(importFile.size / 1024).toFixed(1)} KB • Clique para escolher outro arquivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-muted-foreground">
                    <UploadCloud className="h-10 w-10 mx-auto text-teal-600 opacity-60" />
                    <p className="font-bold text-foreground text-xs">
                      Clique para selecionar ou arraste o arquivo aqui
                    </p>
                    <p className="text-[11px]">
                      Formatos aceitos: <strong>.xlsx, .xlsm, .xls, .pronaf_c, .html, .htm, .csv</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Campo de Senha (pré-preenchido com senhasBNxI) */}
            <div className="space-y-1.5 p-3.5 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Senha de Descriptografia da Planilha:
                </Label>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Padrão BNB: senhasBNxI
                </Badge>
              </div>
              <Input
                type="text"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="senhasBNxI"
                className="h-9 rounded-xl text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Planilhas protegidas do SEAP/BNB utilizam <code>senhasBNxI</code> (arquivos HTML não precisam de senha).
              </p>
            </div>

            {/* Botão de Processar */}
            {!parsedProposalData && (
              <Button
                onClick={handleProcessSpreadsheet}
                disabled={!importFile || isProcessingFile}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-10 gap-2"
              >
                {isProcessingFile ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Lendo e Analisando Dados...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Analisar Arquivo e Extrair Dados</span>
                  </>
                )}
              </Button>
            )}

            {/* Resultado da Extração */}
            {parsedProposalData && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Dados Processados com Sucesso!</span>
                  </div>
                  {parsedProposalData.formatDetected && (
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-800 dark:text-emerald-300">
                      {parsedProposalData.formatDetected}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Produtor Encontrado:</span>
                    <p className="font-extrabold text-foreground truncate">
                      {parsedProposalData.producerName || "Não identificado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">CPF:</span>
                    <p className="font-mono font-bold text-foreground">
                      {parsedProposalData.producerCpf ? formatCPF(parsedProposalData.producerCpf) : "Não identificado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Município / Propriedade:</span>
                    <p className="font-semibold text-foreground truncate">
                      {parsedProposalData.municipio || "Não informado"}
                      {parsedProposalData.localizacao ? ` - ${parsedProposalData.localizacao}` : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área do Imóvel / Posse:</span>
                    <p className="font-semibold text-foreground truncate">
                      {parsedProposalData.dadosProponente?.areaTotalHa
                        ? `${parsedProposalData.dadosProponente.areaTotalHa} ha`
                        : "Área não identificada"}
                      {parsedProposalData.dadosProponente?.condicaoPosse
                        ? ` (${parsedProposalData.dadosProponente.condicaoPosse})`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Linha de Crédito:</span>
                    <p className="font-semibold text-teal-700 dark:text-teal-300 truncate">
                      {parsedProposalData.linhaCredito || "Custeio Agrícola"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Valor da Operação:</span>
                    <p className="font-black text-teal-700 dark:text-teal-300 font-mono">
                      {formatCurrency(parsedProposalData.valorSolicitado || parsedProposalData.totalGeral || 0)}
                    </p>
                  </div>
                  {parsedProposalData.dadosProponente?.tituloEleitoral && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Título Eleitoral:</span>
                      <p className="font-mono font-semibold text-foreground">
                        {parsedProposalData.dadosProponente.tituloEleitoral}
                      </p>
                    </div>
                  )}
                  {parsedProposalData.dadosProponente?.financiamento && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Financiamento (Prazo/Carência/Juros):</span>
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {parsedProposalData.dadosProponente.financiamento.prazoMeses}m / {parsedProposalData.dadosProponente.financiamento.carenciaMeses}m ({parsedProposalData.dadosProponente.financiamento.jurosAnual}% a.a.)
                      </p>
                    </div>
                  )}
                  {parsedProposalData.dadosProponente?.membrosFamiliares && parsedProposalData.dadosProponente.membrosFamiliares.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Membro Familiar / Avalista:</span>
                      <p className="font-semibold text-foreground truncate">
                        {parsedProposalData.dadosProponente.membrosFamiliares[0].nome}
                        {parsedProposalData.dadosProponente.membrosFamiliares[0].cpf ? ` (${formatCPF(parsedProposalData.dadosProponente.membrosFamiliares[0].cpf)})` : ""}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bloco Cronograma de Liberação Detectado */}
                {parsedProposalData.dadosProponente?.cronograma && parsedProposalData.dadosProponente.cronograma.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 p-2.5 rounded-xl bg-blue-500/10 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      Cronograma de Liberação ({parsedProposalData.dadosProponente.cronograma.length} Parcelas):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {parsedProposalData.dadosProponente.cronograma.map((cr, idx) => (
                        <div key={idx} className="p-1 rounded-lg bg-card/60 flex justify-between items-center text-[10px]">
                          <span className="font-medium truncate max-w-[140px]">{cr.parcela}: {cr.empreendimento}</span>
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{cr.percentual}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bloco de Suporte Forrageiro Detectado */}
                {parsedProposalData.suporteForrageiro &&
                  (parsedProposalData.suporteForrageiro.temPecuaria ||
                    parsedProposalData.suporteForrageiro.areaTotalForrageiraHa > 0 ||
                    parsedProposalData.suporteForrageiro.rebanhoCabecas > 0) && (
                    <div className="pt-2 border-t border-emerald-500/20 p-2.5 rounded-xl bg-emerald-500/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                          <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                          Suporte Forrageiro & Dimensionamento Detectado:
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-bold border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                        >
                          {parsedProposalData.suporteForrageiro.taxaLotacaoUaHa > 0
                            ? `${parsedProposalData.suporteForrageiro.taxaLotacaoUaHa} UA/ha`
                            : "Pecuária Identificada"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                        <div>
                          <span className="text-muted-foreground text-[9px] block">Área Pasto:</span>
                          <span className="font-mono font-bold">
                            {parsedProposalData.suporteForrageiro.areaTotalForrageiraHa || 0} ha
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[9px] block">Rebanho:</span>
                          <span className="font-mono font-bold">
                            {parsedProposalData.suporteForrageiro.rebanhoCabecas || 0} cab (
                            {parsedProposalData.suporteForrageiro.rebanhoTotalUa || 0} UA)
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[9px] block">Estiagem:</span>
                          <span className="font-mono font-bold">
                            {parsedProposalData.suporteForrageiro.periodoEstiagemMeses || 6} meses
                          </span>
                        </div>
                      </div>

                      {parsedProposalData.suporteForrageiro.parecerCapacidadeSuporte && (
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-200 italic leading-snug">
                          "{parsedProposalData.suporteForrageiro.parecerCapacidadeSuporte}"
                        </p>
                      )}
                    </div>
                  )}

                {parsedProposalData.items && parsedProposalData.items.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-200 block">
                      Itens de Inversão Identificados ({parsedProposalData.items.length} itens):
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {parsedProposalData.items.slice(0, 8).map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-card/60"
                        >
                          <span className="truncate max-w-[240px] font-medium">{it.nome}</span>
                          <span className="font-mono font-bold shrink-0">{formatCurrency(it.valor)}</span>
                        </div>
                      ))}
                      {parsedProposalData.items.length > 8 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          + {parsedProposalData.items.length - 8} outros itens orçados
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              className="rounded-xl text-xs"
              onClick={() => {
                setImportModalOpen(false);
                setParsedProposalData(null);
              }}
            >
              Cancelar
            </Button>

            {parsedProposalData && (
              <Button
                onClick={handleApplyImportedData}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Confirmar & Preencher Formulário</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Detalhes da Proposta ────────────────────────── */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2 text-foreground">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Dossiê Completo da Proposta de Crédito
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Visualização integral de todos os dados do produtor, imóvel, itens orçados e enquadramento normativo
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4 py-2 text-xs">
              {/* 1. Produtor Rural */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="font-extrabold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-teal-600" />
                    1. Identificação do Produtor Rural (Beneficiário)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedProposal.dados_proponente?.tipo_cliente || "Pessoa Física"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nome Completo:</span>
                    <p className="font-extrabold text-foreground text-sm">
                      {selectedProposal.producer_name}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">CPF:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.producer_cpf || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Apelido:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.apelido || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">RG / Órgão / UF:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.rg || "—"}
                      {selectedProposal.dados_proponente?.orgao_emissor ? ` ${selectedProposal.dados_proponente.orgao_emissor}` : ""}
                      {selectedProposal.dados_proponente?.uf_rg ? `/${selectedProposal.dados_proponente.uf_rg}` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Data de Emissão RG:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.data_emissao_rg || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Data de Nascimento:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.data_nascimento || selectedProposal.data_nascimento || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Naturalidade:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.naturalidade || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Sexo:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.sexo || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Estado Civil:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.estado_civil || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Grau de Instrução:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.grau_instrucao || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Profissão:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.profissao || "Agricultor(a)"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Renda Mensal Declarada:</span>
                    <p className="font-mono font-bold text-teal-700 dark:text-teal-300">
                      {selectedProposal.dados_proponente?.renda_mensal
                        ? formatCurrency(Number(selectedProposal.dados_proponente.renda_mensal))
                        : "—"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Nome da Mãe:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.nome_mae || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Nome do Pai:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.nome_pai || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">DAP / CAF:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.dados_proponente?.dap_caf || "—"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Porte / Enquadramento:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.porte || "PRONAFIANO GRUPO A"}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Endereço / Localidade:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.endereco || selectedProposal.producer_address || "—"}
                      {selectedProposal.dados_proponente?.complemento ? ` (${selectedProposal.dados_proponente.complemento})` : ""}
                      {selectedProposal.dados_proponente?.bairro ? ` - ${selectedProposal.dados_proponente.bairro}` : ""}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Município / UF / CEP:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.municipio || selectedProposal.dados_proponente?.municipio || "—"}
                      {selectedProposal.dados_proponente?.uf ? ` - ${selectedProposal.dados_proponente.uf}` : ""}
                      {selectedProposal.dados_proponente?.cep ? ` (CEP: ${selectedProposal.dados_proponente.cep})` : ""}
                    </p>
                  </div>

                  {selectedProposal.dados_proponente?.titulo_eleitoral && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Título Eleitoral:</span>
                      <p className="font-mono font-semibold text-foreground">
                        {selectedProposal.dados_proponente.titulo_eleitoral}
                      </p>
                    </div>
                  )}

                  {selectedProposal.dados_proponente?.beneficiario_politicas_publicas && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Beneficiário de Políticas Públicas:</span>
                      <p className="font-semibold text-foreground">
                        {selectedProposal.dados_proponente.beneficiario_politicas_publicas}
                      </p>
                    </div>
                  )}

                  {selectedProposal.dados_proponente?.endereco_correspondencia && (
                    <div className="sm:col-span-3 pt-1 border-t border-border/30">
                      <span className="text-muted-foreground block text-[10px] font-bold">Endereço Residencial (Correspondência):</span>
                      <p className="font-medium text-foreground bg-card p-2 rounded-xl border border-border/40 mt-0.5">
                        {selectedProposal.dados_proponente.endereco_correspondencia}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Cônjuge (se existir) */}
              {(selectedProposal.dados_proponente?.nome_conjuge || selectedProposal.dados_proponente?.cpf_conjuge) && (
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="font-extrabold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      2. Cônjuge / Companheiro(a)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px]">Nome do Cônjuge:</span>
                      <p className="font-bold text-foreground">
                        {selectedProposal.dados_proponente.nome_conjuge}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">CPF:</span>
                      <p className="font-mono font-bold text-foreground">
                        {selectedProposal.dados_proponente.cpf_conjuge || "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Data de Nascimento:</span>
                      <p className="font-mono font-semibold text-foreground">
                        {selectedProposal.dados_proponente.data_nascimento_conjuge || "—"}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">RG / Órgão / UF:</span>
                      <p className="font-mono font-semibold text-foreground">
                        {selectedProposal.dados_proponente.rg_conjuge || "—"}
                        {selectedProposal.dados_proponente.orgao_emissor_conjuge ? ` ${selectedProposal.dados_proponente.orgao_emissor_conjuge}` : ""}
                        {selectedProposal.dados_proponente.uf_conjuge ? `/${selectedProposal.dados_proponente.uf_conjuge}` : ""}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[10px]">Profissão:</span>
                      <p className="font-semibold text-foreground">
                        {selectedProposal.dados_proponente.profissao_conjuge || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Imóvel, Posse & Recursos Naturais */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="font-extrabold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                    <Trees className="h-3.5 w-3.5 text-emerald-600" />
                    3. Imóvel, Posse & Recursos Naturais
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {selectedProposal.dados_proponente?.condicao_posse || "Condição não especificada"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Denominação do Imóvel:</span>
                    <p className="font-bold text-foreground">
                      {selectedProposal.localizacao || selectedProposal.dados_proponente?.propriedade || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Titular da Terra:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.nome_proprietario || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">CPF do Titular:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.cpf_proprietario || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área Total (ha):</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.dados_proponente?.area_total_ha || 0} ha
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área Explorada (ha):</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.area_explorada_ha || 0} ha
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Área de Reserva Legal (ha):</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.area_reserva_ha || 0} ha
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">CAR (Cadastro Ambiental Rural):</span>
                    <p className="font-mono text-xs font-semibold text-foreground break-all">
                      {selectedProposal.dados_proponente?.car || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">NIRF:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.nirf || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">SNCR / CCIR / Matrícula:</span>
                    <p className="font-mono font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.ccir || "—"}
                    </p>
                  </div>

                  {selectedProposal.dados_proponente?.roteiro_acesso && (
                    <div className="sm:col-span-3 pt-1">
                      <span className="text-muted-foreground block text-[10px] font-bold">Roteiro de Acesso:</span>
                      <p className="text-xs text-foreground bg-card p-2 rounded-xl border border-border/40 mt-1">
                        {selectedProposal.dados_proponente.roteiro_acesso}
                      </p>
                    </div>
                  )}

                  {selectedProposal.dados_proponente?.solos_aguada && (
                    <div className="sm:col-span-3 pt-1">
                      <span className="text-muted-foreground block text-[10px] font-bold">Solos & Recursos Hídricos / Aguada:</span>
                      <p className="text-xs text-foreground bg-card p-2 rounded-xl border border-border/40 mt-1">
                        {selectedProposal.dados_proponente.solos_aguada}
                      </p>
                    </div>
                  )}

                  {/* Terras e Coberturas */}
                  {selectedProposal.dados_proponente?.terras_coberturas && selectedProposal.dados_proponente.terras_coberturas.length > 0 && (
                    <div className="sm:col-span-3 pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">
                        Terras e Coberturas Avaliadas:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {selectedProposal.dados_proponente.terras_coberturas.map((tc: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-xl bg-card border border-border/40 text-[11px] flex justify-between items-center">
                            <span className="font-medium text-foreground">{tc.descricao}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">{tc.areaHa} ha</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edificações / Benfeitorias */}
                  {selectedProposal.dados_proponente?.edificacoes && selectedProposal.dados_proponente.edificacoes.length > 0 && (
                    <div className="sm:col-span-3 pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">
                        Edificações & Benfeitorias Existentes:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProposal.dados_proponente.edificacoes.map((ed: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-xl bg-card border border-border/40 text-[11px] flex justify-between items-center">
                            <span className="font-medium text-foreground truncate max-w-[200px]" title={ed.descricao}>
                              {ed.descricao} ({ed.estado || "Regular"})
                            </span>
                            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                              {ed.valor ? formatCurrency(Number(ed.valor)) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Semoventes Existentes */}
                  {selectedProposal.dados_proponente?.semoventes && selectedProposal.dados_proponente.semoventes.length > 0 && (
                    <div className="sm:col-span-3 pt-2 border-t border-border/40 space-y-1.5">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">
                        Semoventes Existentes no Imóvel:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedProposal.dados_proponente.semoventes.map((sm: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-xl bg-card border border-border/40 text-[11px] flex justify-between items-center">
                            <span className="font-medium text-foreground">
                              {sm.quantidade}x {sm.categoria} {sm.raca ? `(${sm.raca})` : ""}
                            </span>
                            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                              {sm.valor ? `${formatCurrency(Number(sm.valor))}/un` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Georreferenciamento */}
                  {selectedProposal.dados_proponente?.georreferenciamento && selectedProposal.dados_proponente.georreferenciamento.length > 0 && (
                    <div className="sm:col-span-3 pt-2 border-t border-border/40 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                          Georreferenciamento de Glebas ({selectedProposal.dados_proponente.georreferenciamento.length} Vértices GPS):
                        </span>
                        <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/40 text-emerald-800 dark:text-emerald-300">
                          {selectedProposal.dados_proponente.georreferenciamento[0].inversao}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Coordenadas Vértice 1: Lat {selectedProposal.dados_proponente.georreferenciamento[0].latitude} | Long {selectedProposal.dados_proponente.georreferenciamento[0].longitude}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Enquadramento e Valores Financeiros */}
              <div className="bg-teal-500/5 p-4 rounded-2xl border border-teal-500/20 space-y-3">
                <span className="font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 text-[10px] flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  4. Dados da Operação, Financiamento & Elaboração
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Linha de Crédito:</span>
                    <p className="font-bold text-teal-700 dark:text-teal-300">
                      {selectedProposal.linha_credito || selectedProposal.credit_program || "PRONAF"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Agência BNB:</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.agency_name || "Agência Regional"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Situação da Proposta:</span>
                    <Badge variant="outline" className="font-bold text-[10px] mt-0.5">
                      {selectedProposal.status || selectedProposal.original_csv_status || "Em Análise"}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Valor Financiado:</span>
                    <p className="font-black text-teal-700 dark:text-teal-300 text-lg">
                      {formatCurrency(Number(selectedProposal.estimated_value) || 0)}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Número da Proposta:</span>
                    <p className="font-mono font-bold text-foreground">
                      {selectedProposal.proposal_number || "Aguardando geração"}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[10px]">Assessoria Técnica (ATER):</span>
                    <p className="font-semibold text-foreground">
                      {selectedProposal.dados_proponente?.custo_assessoria === 1
                        ? "Inclusa (5% ATER)"
                        : "Sem retenção"}
                    </p>
                  </div>

                  {selectedProposal.dados_proponente?.objetivo && (
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Objetivo do Projeto:</span>
                      <p className="font-semibold text-foreground">
                        {selectedProposal.dados_proponente.objetivo}
                      </p>
                    </div>
                  )}

                  {selectedProposal.dados_proponente?.financiamento && (
                    <>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Prazo / Carência:</span>
                        <p className="font-mono font-bold text-foreground">
                          {selectedProposal.dados_proponente.financiamento.prazo_meses || selectedProposal.dados_proponente.financiamento.prazoMeses || 96} meses / Carência: {selectedProposal.dados_proponente.financiamento.carencia_meses || selectedProposal.dados_proponente.financiamento.carenciaMeses || 24}m
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Juros / Periodicidade:</span>
                        <p className="font-mono font-bold text-teal-700 dark:text-teal-300">
                          {selectedProposal.dados_proponente.financiamento.juros_anual || selectedProposal.dados_proponente.financiamento.jurosAnual || 6}% a.a. ({selectedProposal.dados_proponente.financiamento.periodicidade || "Anual"})
                        </p>
                      </div>
                    </>
                  )}

                  {(selectedProposal.dados_proponente?.elaborador || selectedProposal.dados_proponente?.empresa_elaboradora) && (
                    <div className="sm:col-span-3 pt-1 border-t border-teal-500/20 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Empresa Elaboradora:</span>
                        <p className="font-semibold text-foreground">
                          {selectedProposal.dados_proponente.empresa_elaboradora || selectedProposal.dados_proponente.elaborador}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Elaborador / Projetista Responsável:</span>
                        <p className="font-semibold text-foreground">
                          {selectedProposal.dados_proponente.elaborador || selectedProposal.projetista}
                          {selectedProposal.dados_proponente.cpf_elaborador ? ` (CPF: ${formatCPF(selectedProposal.dados_proponente.cpf_elaborador)})` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Suporte Forrageiro se existente na proposta */}
              {selectedProposal.suporte_forrageiro && (
                <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 text-[10px] flex items-center gap-1.5">
                      <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                      5. Suporte Forrageiro & Dimensionamento Pecuário
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono font-bold border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                    >
                      {selectedProposal.suporte_forrageiro.taxa_lotacao_ua_ha || selectedProposal.suporte_forrageiro.taxaLotacaoUaHa || 0} UA/ha
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Área Forrageira:</span>
                      <p className="font-mono font-bold text-foreground">
                        {selectedProposal.suporte_forrageiro.area_total_forrageira_ha || selectedProposal.suporte_forrageiro.areaTotalForrageiraHa || 0} ha
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Rebanho Total:</span>
                      <p className="font-mono font-bold text-foreground">
                        {selectedProposal.suporte_forrageiro.rebanho_cabecas || selectedProposal.suporte_forrageiro.rebanhoCabecas || 0} cab.
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Total de UA:</span>
                      <p className="font-mono font-bold text-foreground">
                        {selectedProposal.suporte_forrageiro.rebanho_total_ua || selectedProposal.suporte_forrageiro.rebanhoTotalUa || 0} UA
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Meses Estiagem:</span>
                      <p className="font-mono font-bold text-foreground">
                        {selectedProposal.suporte_forrageiro.periodo_estiagem_meses || selectedProposal.suporte_forrageiro.periodoEstiagemMeses || 6} meses
                      </p>
                    </div>
                  </div>

                  {(selectedProposal.suporte_forrageiro.parecer_capacidade_suporte || selectedProposal.suporte_forrageiro.parecerCapacidadeSuporte) && (
                    <div className="pt-2 border-t border-emerald-500/20">
                      <span className="text-[10px] font-bold text-muted-foreground block">
                        Parecer de Capacidade Forrageira:
                      </span>
                      <p className="text-xs text-foreground font-medium italic mt-0.5">
                        "{selectedProposal.suporte_forrageiro.parecer_capacidade_suporte || selectedProposal.suporte_forrageiro.parecerCapacidadeSuporte}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Cronograma de Liberação de Recursos */}
              {selectedProposal.dados_proponente?.cronograma && selectedProposal.dados_proponente.cronograma.length > 0 && (
                <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 text-[10px] flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-600" />
                      Cronograma de Liberação de Recursos ({selectedProposal.dados_proponente.cronograma.length} Parcelas)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProposal.dados_proponente.cronograma.map((cr: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/40 text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-foreground block">
                            Parcela {cr.parcela}: {cr.empreendimento}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {cr.finalidade} {cr.areaHa ? `(${cr.areaHa} ha)` : ""} {cr.codEmpreendimento ? `• Cód: ${cr.codEmpreendimento}` : ""}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-mono font-bold border-blue-500/40 text-blue-700 dark:text-blue-300 shrink-0">
                          {cr.percentual}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outras Atividades e Receitas/Custos */}
              {selectedProposal.dados_proponente?.outras_atividades && selectedProposal.dados_proponente.outras_atividades.length > 0 && (
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/25 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 text-[10px] flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-600" />
                    Atividades Produtivas & Fluxo de Receitas / Custos
                  </span>
                  <div className="space-y-1.5">
                    {selectedProposal.dados_proponente.outras_atividades.map((oa: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/40 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-foreground block">{oa.atividade}</span>
                          <span className="text-[10px] text-muted-foreground">{oa.setor}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
                            Receita: {formatCurrency(Number(oa.receitaAnual) || 0)}
                          </span>
                          <span className="font-mono text-muted-foreground block text-[10px]">
                            Custo: {formatCurrency(Number(oa.custoAnual) || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Membro Familiar / Avalista */}
              {selectedProposal.dados_proponente?.membros_familiares && selectedProposal.dados_proponente.membros_familiares.length > 0 && (
                <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/25 space-y-2">
                  <span className="font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 text-[10px] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                    Composição Familiar / Membro Avalista Vinculado
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedProposal.dados_proponente.membros_familiares.map((mf: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/40 text-xs flex justify-between items-center">
                        <span className="font-bold text-foreground">{mf.nome}</span>
                        <span className="font-mono text-muted-foreground text-[11px]">{mf.cpf ? formatCPF(mf.cpf) : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Inversões / Itens Orçados */}
              {selectedProposal.inversoes && selectedProposal.inversoes.length > 0 && (
                <div className="bg-muted/40 p-4 rounded-2xl border border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] flex items-center gap-1.5">
                      <Calculator className="h-3.5 w-3.5 text-teal-600" />
                      6. Plano de Inversões ({selectedProposal.inversoes.length} Itens Orçados)
                    </span>
                    <span className="font-mono font-extrabold text-teal-700 dark:text-teal-300 text-xs">
                      Total: {formatCurrency(
                        selectedProposal.inversoes.reduce(
                          (acc: number, item: any) => acc + Number(item.valor_total || item.valor || 0),
                          0
                        )
                      )}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedProposal.inversoes.map((inv: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-[10px] text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <span className="font-semibold text-foreground truncate">
                            {inv.descricao || inv.item || `Item ${idx + 1}`}
                          </span>
                          {(inv.quantidade || inv.unidade) && (
                            <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                              {inv.quantidade} {inv.unidade}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono font-black text-teal-700 dark:text-teal-300 shrink-0 ml-2">
                          {formatCurrency(Number(inv.valor_total || inv.valor || 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Parecer Técnico */}
              {selectedProposal.notes && (
                <div className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-1">
                  <span className="font-extrabold text-foreground text-[10px] uppercase block tracking-wider">
                    7. Parecer Técnico & Justificativa do Projetista:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedProposal.notes}
                  </p>
                </div>
              )}

              {/* 8. Pendências se houver */}
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
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              variant="ghost"
              className="rounded-xl text-xs"
              onClick={() => setSelectedProposal(null)}
            >
              Fechar Dossiê
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
