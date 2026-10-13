import * as React from "react";
import {
  PropostaData,
  InvestimentoItem,
  FinanciamentoExistente,
  GarantiaFidejussoria,
  OutraGarantia,
  OperacaoDeclarada,
} from "../types";
import { useReferenceTables } from "../useReferenceTables";
import { SearchableSelect, SelectOption } from "./SearchableSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Building2,
  TrendingUp,
  Landmark,
  ShieldAlert,
  ShieldCheck,
  Users,
  MessageSquare,
  Award,
  Plus,
  Trash2,
  Info,
  DollarSign,
  CheckCircle2,
} from "lucide-react";

export interface TabPropostaProps {
  data: PropostaData;
  onChange: (data: Partial<PropostaData>) => void;
}

const REGIOES = ["Semi-árido", "Fora do Semi-árido"];
const SIM_NAO = ["Sim", "Não"];
const AGENTES_FINANC = ["BNB", "Outros"];

const UNIDADES_FALLBACK: SelectOption[] = [
  { value: "ha", label: "Hectare (ha)" },
  { value: "unid", label: "Unidade (unid)" },
  { value: "cabeça", label: "Cabeça" },
  { value: "m²", label: "Metro Quadrado (m²)" },
  { value: "km", label: "Quilômetro (km)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "t", label: "Tonelada (t)" },
  { value: "litro", label: "Litro (l)" },
  { value: "sacas", label: "Sacas (sc)" },
  { value: "hora", label: "Hora (h)" },
  { value: "serviço", label: "Serviço (sv)" },
];

const USOS_FALLBACK: SelectOption[] = [
  { value: "Próprio", label: "Próprio" },
  { value: "Comum", label: "Comum" },
  { value: "Coletivo", label: "Coletivo" },
  { value: "Individual", label: "Individual" },
];

const OBJETIVOS_FALLBACK: SelectOption[] = [
  { value: "Implantação", label: "Implantação" },
  { value: "Modernização", label: "Modernização" },
  { value: "Reforma", label: "Reforma" },
  { value: "Expansão", label: "Expansão" },
  { value: "Manutenção", label: "Manutenção" },
];

const GARANTIAS_FALLBACK: SelectOption[] = [
  { value: "Hipoteca", label: "Hipoteca" },
  { value: "Penhor", label: "Penhor" },
  { value: "Alienação Fiduciária", label: "Alienação Fiduciária" },
  { value: "Aval", label: "Aval" },
  { value: "Fiança", label: "Fiança" },
  { value: "Outras", label: "Outras" },
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export const TabProposta: React.FC<TabPropostaProps> = ({ data, onChange }) => {
  const { getList, loaded } = useReferenceTables();

  // Opções vindas das tabelas de referência com fallback
  const objetivoOptions = React.useMemo(() => {
    const list = getList("visaoOBJ");
    if (list.length > 0) {
      return list.map((item) => ({ value: item.description, label: item.description }));
    }
    return OBJETIVOS_FALLBACK;
  }, [getList, loaded]);

  const programaOptions = React.useMemo(() => {
    const list = getList("visaoPRG");
    return list.map((item) => ({ value: item.description, label: item.description }));
  }, [getList, loaded]);

  const agenciaOptions = React.useMemo(() => {
    const list = getList("visaoAGC");
    return list.map((item) => ({
      value: item.description,
      label: item.code ? `${item.code} - ${item.description}` : item.description,
    }));
  }, [getList, loaded]);

  const atividadeOptions = React.useMemo(() => {
    const list = getList("visaoATIV");
    return list.map((item) => ({ value: item.description, label: item.description }));
  }, [getList, loaded]);

  const municipioOptions = React.useMemo(() => {
    const list = getList("visaoMUNI");
    return list.map((item) => ({ value: item.description, label: item.description }));
  }, [getList, loaded]);

  const unidadeOptions = React.useMemo(() => {
    const list = getList("visaoUND");
    if (list.length > 0) {
      return list.map((item) => ({ value: item.description, label: item.description }));
    }
    return UNIDADES_FALLBACK;
  }, [getList, loaded]);

  const usoOptions = React.useMemo(() => {
    const list = getList("visaoUSO");
    if (list.length > 0) {
      return list.map((item) => ({ value: item.description, label: item.description }));
    }
    return USOS_FALLBACK;
  }, [getList, loaded]);

  const imoveisInversaoOptions = React.useMemo(() => {
    const list = getList("Imoveis_Inversao");
    if (list.length > 0) {
      return list.map((item) => ({
        value: item.code || item.description,
        label: item.description,
      }));
    }
    return [
      { value: "1", label: "Imóvel 1" },
      { value: "2", label: "Imóvel 2" },
      { value: "3", label: "Imóvel 3" },
    ];
  }, [getList, loaded]);

  const garantiaTipoOptions = React.useMemo(() => {
    const list = getList("visaoGAR");
    if (list.length > 0) {
      return list.map((item) => ({ value: item.description, label: item.description }));
    }
    return GARANTIAS_FALLBACK;
  }, [getList, loaded]);

  // Garante que existam itens no investimento (até 36)
  const itensInvestimento = React.useMemo(() => {
    if (data.itensInvestimento && data.itensInvestimento.length > 0) {
      return data.itensInvestimento;
    }
    return Array.from({ length: 1 }, (_, i) => ({
      id: i + 1,
      discriminacao: "",
      compoeGarantia: "Não" as const,
      quantidade: 0,
      unidade: "",
      uso: "",
      numImovel: "1",
      valorUnitario: 0,
      recursosPropriosUnit: 0,
    }));
  }, [data.itensInvestimento]);

  // Atualizador de Item de Investimento
  const handleUpdateInvestimento = <K extends keyof InvestimentoItem>(
    index: number,
    field: K,
    val: InvestimentoItem[K]
  ) => {
    const updated = [...itensInvestimento];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ itensInvestimento: updated });
  };

  // Adicionar Linha de Investimento (máx 36)
  const handleAddInvestimento = () => {
    if (itensInvestimento.length >= 36) return;
    const nextId = itensInvestimento.length + 1;
    const newItem: InvestimentoItem = {
      id: nextId,
      discriminacao: "",
      compoeGarantia: "Não",
      quantidade: 0,
      unidade: "",
      uso: "",
      numImovel: "1",
      valorUnitario: 0,
      recursosPropriosUnit: 0,
    };
    onChange({ itensInvestimento: [...itensInvestimento, newItem] });
  };

  // Remover Linha de Investimento
  const handleRemoveInvestimento = (index: number) => {
    if (itensInvestimento.length <= 1) {
      const cleared: InvestimentoItem = {
        id: 1,
        discriminacao: "",
        compoeGarantia: "Não",
        quantidade: 0,
        unidade: "",
        uso: "",
        numImovel: "1",
        valorUnitario: 0,
        recursosPropriosUnit: 0,
      };
      onChange({ itensInvestimento: [cleared] });
      return;
    }
    const filtered = itensInvestimento
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, id: idx + 1 }));
    onChange({ itensInvestimento: filtered });
  };

  // Totais do Programa de Investimentos
  const totaisInvestimento = React.useMemo(() => {
    return itensInvestimento.reduce(
      (acc, item) => {
        const qty = item.quantidade || 0;
        const vu = item.valorUnitario || 0;
        const rpu = item.recursosPropriosUnit || 0;
        const totalInvest = qty * vu;
        const totalProprio = qty * rpu;
        const financiado = Math.max(0, totalInvest - totalProprio);

        return {
          totalInvest: acc.totalInvest + totalInvest,
          totalProprio: acc.totalProprio + totalProprio,
          totalFinanciado: acc.totalFinanciado + financiado,
        };
      },
      { totalInvest: 0, totalProprio: 0, totalFinanciado: 0 }
    );
  }, [itensInvestimento]);

  // Financiamentos Existentes (5 linhas)
  const financiamentosExistentes = React.useMemo(() => {
    if (data.financiamentosExistentes && data.financiamentosExistentes.length === 5) {
      return data.financiamentosExistentes;
    }
    return Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      discriminacao: "",
      agenteFinanc: "BNB" as const,
      saldoDevedor: 0,
      mesmaAtivConjuge: "Não" as const,
      pertenceTitular: "Sim" as const,
      jurosPercentAa: 0,
      carenciaMeses: 0,
      prazoRestanteMeses: 0,
      dataContratacao: "",
    }));
  }, [data.financiamentosExistentes]);

  const handleUpdateFinanciamento = <K extends keyof FinanciamentoExistente>(
    index: number,
    field: K,
    val: FinanciamentoExistente[K]
  ) => {
    const updated = [...financiamentosExistentes];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ financiamentosExistentes: updated });
  };

  // Garantias Fidejussórias (2 garantidores)
  const garantiasFidejussorias = React.useMemo(() => {
    if (data.garantiasFidejussorias && data.garantiasFidejussorias.length >= 2) {
      return data.garantiasFidejussorias;
    }
    return [
      { cpf: "", cnpj: "", cpfConjuge: "" },
      { cpf: "", cnpj: "", cpfConjuge: "" },
    ];
  }, [data.garantiasFidejussorias]);

  const handleUpdateGarantiaFidejussoria = (
    index: number,
    field: keyof GarantiaFidejussoria,
    val: string
  ) => {
    const updated = [...garantiasFidejussorias];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ garantiasFidejussorias: updated });
  };

  // Outras Garantias (3 itens)
  const outrasGarantias = React.useMemo(() => {
    if (data.outrasGarantias && data.outrasGarantias.length === 3) {
      return data.outrasGarantias;
    }
    return [
      { id: 1, denominacao: "", tipo: "Hipoteca", valor: 0 },
      { id: 2, denominacao: "", tipo: "Hipoteca", valor: 0 },
      { id: 3, denominacao: "", tipo: "Hipoteca", valor: 0 },
    ];
  }, [data.outrasGarantias]);

  const handleUpdateOutraGarantia = <K extends keyof OutraGarantia>(
    index: number,
    field: K,
    val: OutraGarantia[K]
  ) => {
    const updated = [...outrasGarantias];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ outrasGarantias: updated });
  };

  // Operações Declaradas (8 itens)
  const operacoesDeclaradas = React.useMemo(() => {
    if (data.operacoesDeclaradas && data.operacoesDeclaradas.length === 8) {
      return data.operacoesDeclaradas;
    }
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      bancoOuCooperativa: "",
      data: "",
      valor: 0,
      fonteRecursos: "",
      comBonus200: "Não" as const,
      bonus700: "Não" as const,
      saldoDevedor: 0,
    }));
  }, [data.operacoesDeclaradas]);

  const handleUpdateOperacaoDeclarada = <K extends keyof OperacaoDeclarada>(
    index: number,
    field: K,
    val: OperacaoDeclarada[K]
  ) => {
    const updated = [...operacoesDeclaradas];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ operacoesDeclaradas: updated });
  };

  // Cálculos de Custeio e Assessoria
  const custeioAgricolaFinanciado = Math.max(
    0,
    (data.custeioAgricolaValorUnit || 0) - (data.custeioAgricolaRecursosProprios || 0)
  );
  const custeioPecuarioFinanciado = Math.max(
    0,
    (data.custeioPecuarioValorUnit || 0) - (data.custeioPecuarioRecursosProprios || 0)
  );
  const assessoriaFinanciada = Math.max(
    0,
    (data.assessoriaEmpresarialValor || 0) -
      (data.assessoriaEmpresarialRecursosProprios || 0)
  );

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. CABEÇALHO */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                1. Cabeçalho da Proposta
              </CardTitle>
              <CardDescription>
                Identificação da proposta, enquadramento operacional e dados da empresa elaboradora
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Data da Proposta (E5) */}
            <div className="space-y-2">
              <Label htmlFor="dataProposta" className="text-xs font-medium text-muted-foreground">
                Data da Proposta <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="dataProposta"
                type="date"
                value={data.dataProposta || ""}
                onChange={(e) => onChange({ dataProposta: e.target.value })}
                className="rounded-xl border-border/50 bg-background/50 h-10"
              />
            </div>

            {/* Objetivo do Crédito (J5) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Objetivo do Crédito <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={objetivoOptions}
                value={data.objetivoCredito || "Implantação"}
                onChange={(val) => onChange({ objetivoCredito: val })}
                placeholder="Selecione o objetivo..."
                searchPlaceholder="Buscar objetivo..."
              />
            </div>

            {/* Programa (E6) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Programa <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={programaOptions}
                value={data.programa || ""}
                onChange={(val) => onChange({ programa: val })}
                placeholder="Selecione o programa..."
                searchPlaceholder="Buscar programa..."
              />
            </div>

            {/* Agência BNB (E7) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Agência BNB <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={agenciaOptions}
                value={data.agencia || ""}
                onChange={(val) => onChange({ agencia: val })}
                placeholder="Selecione a agência..."
                searchPlaceholder="Buscar agência..."
              />
            </div>

            {/* Região (E8) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Região <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={data.regiao || "Semi-árido"}
                onValueChange={(val: string) =>
                  onChange({ regiao: val as 'Semi-árido' | 'Fora do Semi-árido' })
                }
              >
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {REGIOES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Atividade Principal (E9) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Atividade Principal <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={atividadeOptions}
                value={data.atividadePrincipal || ""}
                onChange={(val) => onChange({ atividadePrincipal: val })}
                placeholder="Selecione a atividade..."
                searchPlaceholder="Buscar atividade..."
              />
            </div>

            {/* Finalidade do Crédito (E10) */}
            <div className="space-y-2">
              <Label htmlFor="finalidadeCredito" className="text-xs font-medium text-muted-foreground">
                Finalidade do Crédito
              </Label>
              <Input
                id="finalidadeCredito"
                value={data.finalidadeCredito || "INVESTIMENTOS FIXOS"}
                onChange={(e) => onChange({ finalidadeCredito: e.target.value })}
                className="rounded-xl border-border/50 bg-background/50 h-10"
              />
            </div>

            {/* Município com Decreto de Emergência (P9) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Decreto de Emergência?
              </Label>
              <Select
                value={data.municipioDecretoEmergencia || "Não"}
                onValueChange={(val: string) =>
                  onChange({ municipioDecretoEmergencia: val as 'Sim' | 'Não' })
                }
              >
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SIM_NAO.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Produção Agroecológica (P12) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Produção Agroecológica / Orgânica?
              </Label>
              <Select
                value={data.producaoAgroecologica || "Não"}
                onValueChange={(val: string) =>
                  onChange({ producaoAgroecologica: val as 'Sim' | 'Não' })
                }
              >
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SIM_NAO.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proposta Origem Planos de Ação (P13) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Origem em Plano de Ação Territorial?
              </Label>
              <Select
                value={data.propostaOrigemPlanosAcao || "Não"}
                onValueChange={(val: string) =>
                  onChange({ propostaOrigemPlanosAcao: val as 'Sim' | 'Não' })
                }
              >
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {SIM_NAO.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dados do Elaborador e Empresa (E12-E15) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Responsável Técnico e Empresa Elaboradora
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="empresaElaboradora" className="text-xs font-medium text-muted-foreground">
                  Empresa Elaboradora
                </Label>
                <Input
                  id="empresaElaboradora"
                  value={data.empresaElaboradora || ""}
                  onChange={(e) => onChange({ empresaElaboradora: e.target.value })}
                  placeholder="Razão Social / Nome da Empresa"
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpjEmpresaElaboradora" className="text-xs font-medium text-muted-foreground">
                  CNPJ da Empresa
                </Label>
                <Input
                  id="cnpjEmpresaElaboradora"
                  value={data.cnpjEmpresaElaboradora || ""}
                  onChange={(e) => onChange({ cnpjEmpresaElaboradora: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="elaborador" className="text-xs font-medium text-muted-foreground">
                  Nome do Elaborador
                </Label>
                <Input
                  id="elaborador"
                  value={data.elaborador || ""}
                  onChange={(e) => onChange({ elaborador: e.target.value })}
                  placeholder="Nome do técnico responsável"
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpfElaborador" className="text-xs font-medium text-muted-foreground">
                  CPF do Elaborador
                </Label>
                <Input
                  id="cpfElaborador"
                  value={data.cpfElaborador || ""}
                  onChange={(e) => onChange({ cpfElaborador: e.target.value })}
                  placeholder="000.000.000-00"
                  className="rounded-xl border-border/50 bg-background/50 h-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. IMÓVEL DAS INVERSÕES (Linha 22) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                2. Imóvel das Inversões
              </CardTitle>
              <CardDescription>
                Localização do imóvel principal onde os investimentos serão aplicados (Linha 22)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imovelDenominacao" className="text-xs font-medium text-muted-foreground">
                Denominação do Imóvel <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="imovelDenominacao"
                value={data.imovelDenominacao || ""}
                onChange={(e) => onChange({ imovelDenominacao: e.target.value })}
                placeholder="Ex.: Fazenda Boa Vista"
                className="rounded-xl border-border/50 bg-background/50 h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Município <span className="text-rose-500">*</span>
              </Label>
              <SearchableSelect
                options={municipioOptions}
                value={data.imovelMunicipio || ""}
                onChange={(val) => onChange({ imovelMunicipio: val })}
                placeholder="Selecione o município..."
                searchPlaceholder="Buscar município..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imovelRegiao" className="text-xs font-medium text-muted-foreground">
                Região
              </Label>
              <Input
                id="imovelRegiao"
                value={data.imovelRegiao || ""}
                onChange={(e) => onChange({ imovelRegiao: e.target.value })}
                placeholder="Ex.: Semi-árido"
                className="rounded-xl border-border/50 bg-background/50 h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Nº do Imóvel (Avaliação)
              </Label>
              <Select
                value={data.imovelNum || "1"}
                onValueChange={(val: string) => onChange({ imovelNum: val })}
              >
                <SelectTrigger className="rounded-xl border-border/50 bg-background/50 h-10">
                  <SelectValue placeholder="Selecione o imóvel" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {imoveisInversaoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. PROGRAMA DE INVESTIMENTOS (Linhas 27-62, 36 itens) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  3. Programa de Investimentos
                </CardTitle>
                <CardDescription>
                  Discriminação dos bens, obras e serviços a serem financiados (até 36 itens)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddInvestimento}
                disabled={itensInvestimento.length >= 36}
                className="rounded-xl h-9 gap-1.5 border-border/50 bg-background/50 hover:bg-background"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                Adicionar Item ({itensInvestimento.length}/36)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="min-w-[190px] text-xs">Discriminação (D ≤70)</TableHead>
                  <TableHead className="w-24 text-xs">Garantia (E)</TableHead>
                  <TableHead className="w-20 text-xs">Quant. (F)</TableHead>
                  <TableHead className="w-28 text-xs">Unidade (G)</TableHead>
                  <TableHead className="w-28 text-xs">Uso (H)</TableHead>
                  <TableHead className="w-24 text-xs">Imóvel (I)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Vr. Unitário (J)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Rec. Próprio Unit. (L)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Rec. Próprio Total (M)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Financiado (N)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Total (O)</TableHead>
                  <TableHead className="w-12 text-center text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensInvestimento.map((item, index) => {
                  const qty = item.quantidade || 0;
                  const vu = item.valorUnitario || 0;
                  const rpu = item.recursosPropriosUnit || 0;
                  const totalProprio = qty * rpu;
                  const totalInvest = qty * vu;
                  const financiado = Math.max(0, totalInvest - totalProprio);

                  return (
                    <TableRow key={item.id ?? index} className="hover:bg-muted/30">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">
                        {item.id ?? index + 1}
                      </TableCell>

                      {/* Discriminação (D) */}
                      <TableCell className="p-2">
                        <Input
                          value={item.discriminacao || ""}
                          maxLength={70}
                          onChange={(e) =>
                            handleUpdateInvestimento(index, "discriminacao", e.target.value)
                          }
                          placeholder="Discriminação do bem ou serviço..."
                          className="h-8 rounded-lg text-xs bg-background/50"
                        />
                      </TableCell>

                      {/* Compõe Garantia (E) */}
                      <TableCell className="p-2">
                        <Select
                          value={item.compoeGarantia || "Não"}
                          onValueChange={(val: string) =>
                            handleUpdateInvestimento(index, "compoeGarantia", val as 'Sim' | 'Não')
                          }
                        >
                          <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {SIM_NAO.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Quantidade (F) */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={item.quantidade ?? 0}
                          onChange={(e) =>
                            handleUpdateInvestimento(
                              index,
                              "quantidade",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 rounded-lg text-xs bg-background/50 text-right"
                        />
                      </TableCell>

                      {/* Unidade (G) */}
                      <TableCell className="p-2">
                        <SearchableSelect
                          options={unidadeOptions}
                          value={item.unidade || ""}
                          onChange={(val) =>
                            handleUpdateInvestimento(index, "unidade", val)
                          }
                          placeholder="Unid."
                          className="h-8 text-xs rounded-lg"
                        />
                      </TableCell>

                      {/* Uso (H) */}
                      <TableCell className="p-2">
                        <SearchableSelect
                          options={usoOptions}
                          value={item.uso || ""}
                          onChange={(val) =>
                            handleUpdateInvestimento(index, "uso", val)
                          }
                          placeholder="Uso"
                          className="h-8 text-xs rounded-lg"
                        />
                      </TableCell>

                      {/* Nº Imóvel (I) */}
                      <TableCell className="p-2">
                        <Select
                          value={item.numImovel || "1"}
                          onValueChange={(val: string) =>
                            handleUpdateInvestimento(index, "numImovel", val)
                          }
                        >
                          <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {imoveisInversaoOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Valor Unitário (J) */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.valorUnitario ?? 0}
                          onChange={(e) =>
                            handleUpdateInvestimento(
                              index,
                              "valorUnitario",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 rounded-lg text-xs bg-background/50 text-right"
                        />
                      </TableCell>

                      {/* Rec. Próprios Unit. (L) */}
                      <TableCell className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.recursosPropriosUnit ?? 0}
                          onChange={(e) =>
                            handleUpdateInvestimento(
                              index,
                              "recursosPropriosUnit",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 rounded-lg text-xs bg-background/50 text-right"
                        />
                      </TableCell>

                      {/* Rec. Próprios Total (M - leitura calculada) */}
                      <TableCell className="text-right text-xs font-medium">
                        {formatBRL(totalProprio)}
                      </TableCell>

                      {/* Financiado (N - fórmula calculada) */}
                      <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {formatBRL(financiado)}
                      </TableCell>

                      {/* Total Investimento (O - fórmula calculada) */}
                      <TableCell className="text-right text-xs font-semibold">
                        {formatBRL(totalInvest)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-center p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveInvestimento(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Cards de Totais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
              <span className="text-xs font-medium text-muted-foreground block">
                Total Recursos Próprios
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatBRL(totaisInvestimento.totalProprio)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">
                Total Valor Financiado
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatBRL(totaisInvestimento.totalFinanciado)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="text-xs font-medium text-primary block">
                Investimento Total
              </span>
              <span className="text-lg font-bold text-primary">
                {formatBRL(totaisInvestimento.totalInvest)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. CUSTEIO VINCULADO E 5. ASSESSORIA EMPRESARIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Custeio Vinculado (Linhas 64-65) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  4. Custeio Vinculado ao Investimento
                </CardTitle>
                <CardDescription>
                  Linhas 64 e 65 da planilha (Agrícola e Pecuário)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custeio Agrícola */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custeio Agrícola (Linha 64)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Valor Total (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.custeioAgricolaValorUnit ?? 0}
                    onChange={(e) =>
                      onChange({
                        custeioAgricolaValorUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Recursos Próprios (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.custeioAgricolaRecursosProprios ?? 0}
                    onChange={(e) =>
                      onChange({
                        custeioAgricolaRecursosProprios:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Financiado (R$)</Label>
                  <div className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-end bg-background/30 text-emerald-600 dark:text-emerald-400">
                    {formatBRL(custeioAgricolaFinanciado)}
                  </div>
                </div>
              </div>
            </div>

            {/* Custeio Pecuário */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custeio Pecuário (Linha 65)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Valor Total (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.custeioPecuarioValorUnit ?? 0}
                    onChange={(e) =>
                      onChange({
                        custeioPecuarioValorUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Recursos Próprios (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.custeioPecuarioRecursosProprios ?? 0}
                    onChange={(e) =>
                      onChange({
                        custeioPecuarioRecursosProprios:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-9 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Financiado (R$)</Label>
                  <div className="h-9 px-3 rounded-xl text-xs font-semibold flex items-center justify-end bg-background/30 text-emerald-600 dark:text-emerald-400">
                    {formatBRL(custeioPecuarioFinanciado)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessoria Técnica (Linha 69) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  5. Assessoria Técnica e Empresarial
                </CardTitle>
                <CardDescription>
                  Linha 69 da planilha (serviços técnicos vinculados ao projeto)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Valor da Assessoria (R$)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.assessoriaEmpresarialValor ?? 0}
                    onChange={(e) =>
                      onChange({
                        assessoriaEmpresarialValor:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Recursos Próprios (R$)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={data.assessoriaEmpresarialRecursosProprios ?? 0}
                    onChange={(e) =>
                      onChange({
                        assessoriaEmpresarialRecursosProprios:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10 rounded-xl text-xs bg-background/50 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Financiado (R$)
                  </Label>
                  <div className="h-10 px-3 rounded-xl text-sm font-semibold flex items-center justify-end bg-background/30 text-emerald-600 dark:text-emerald-400">
                    {formatBRL(assessoriaFinanciada)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  O limite financiado de assessoria empresarial e técnica é calculado automaticamente em função das regras do programa.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. BASES DO FINANCIAMENTO (SOMENTE LEITURA, Linhas 75-79) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                6. Bases do Financiamento
              </CardTitle>
              <CardDescription>
                Condições financeiras calculadas a partir do programa selecionado e da aba de Cálculo Financeiro (somente leitura)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Prazo</span>
              <span className="text-base font-bold">{data.prazoMeses || 0} meses</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Carência</span>
              <span className="text-base font-bold">{data.carenciaMeses || 0} meses</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Juros a.a.</span>
              <span className="text-base font-bold">{data.jurosPercentAa || 0}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Rebate a.a.</span>
              <span className="text-base font-bold">{data.rebatePercentAa || 0}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Del Credere</span>
              <span className="text-base font-bold">{data.delCrederePercentAa || 0}%</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Reembolso</span>
              <span className="text-xs font-semibold">{data.periodicidadeReembolso || "Anual"}</span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground block">Método</span>
              <span className="text-xs font-semibold">{data.metodoCalculo || "SAC"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. FINANCIAMENTOS EXISTENTES (Linhas 129-133, 5 linhas) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                7. Financiamentos Existentes
              </CardTitle>
              <CardDescription>
                Operações de crédito já contratadas pelo proponente ou cônjuge (linhas 129 a 133)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="min-w-[180px] text-xs">Denominação (D)</TableHead>
                  <TableHead className="w-24 text-xs">Agente (F)</TableHead>
                  <TableHead className="w-32 text-xs text-right">Saldo Devedor (G)</TableHead>
                  <TableHead className="w-24 text-xs">Mesma Ativ? (I)</TableHead>
                  <TableHead className="w-24 text-xs">Titular? (J)</TableHead>
                  <TableHead className="w-20 text-xs text-right">Juros % (K)</TableHead>
                  <TableHead className="w-20 text-xs text-right">Carência (L)</TableHead>
                  <TableHead className="w-20 text-xs text-right">Prazo Rest. (N)</TableHead>
                  <TableHead className="w-28 text-xs">Contratação (O)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financiamentosExistentes.map((fin, index) => (
                  <TableRow key={fin.id ?? index} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {fin.id ?? index + 1}
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        value={fin.discriminacao || ""}
                        onChange={(e) =>
                          handleUpdateFinanciamento(index, "discriminacao", e.target.value)
                        }
                        placeholder="Ex.: Custeio Pecuário 2023"
                        className="h-8 rounded-lg text-xs bg-background/50"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Select
                        value={fin.agenteFinanc || "BNB"}
                        onValueChange={(val: string) =>
                          handleUpdateFinanciamento(index, "agenteFinanc", val as 'BNB' | 'Outros')
                        }
                      >
                        <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {AGENTES_FINANC.map((ag) => (
                            <SelectItem key={ag} value={ag} className="text-xs">
                              {ag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={fin.saldoDevedor ?? 0}
                        onChange={(e) =>
                          handleUpdateFinanciamento(
                            index,
                            "saldoDevedor",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Select
                        value={fin.mesmaAtivConjuge || "Não"}
                        onValueChange={(val: string) =>
                          handleUpdateFinanciamento(index, "mesmaAtivConjuge", val as 'Sim' | 'Não')
                        }
                      >
                        <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SIM_NAO.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="p-2">
                      <Select
                        value={fin.pertenceTitular || "Sim"}
                        onValueChange={(val: string) =>
                          handleUpdateFinanciamento(index, "pertenceTitular", val as 'Sim' | 'Não')
                        }
                      >
                        <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SIM_NAO.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={fin.jurosPercentAa ?? 0}
                        onChange={(e) =>
                          handleUpdateFinanciamento(
                            index,
                            "jurosPercentAa",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={fin.carenciaMeses ?? 0}
                        onChange={(e) =>
                          handleUpdateFinanciamento(
                            index,
                            "carenciaMeses",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={fin.prazoRestanteMeses ?? 0}
                        onChange={(e) =>
                          handleUpdateFinanciamento(
                            index,
                            "prazoRestanteMeses",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="date"
                        value={fin.dataContratacao || ""}
                        onChange={(e) =>
                          handleUpdateFinanciamento(index, "dataContratacao", e.target.value)
                        }
                        className="h-8 rounded-lg text-xs bg-background/50"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 8. GARANTIAS FIDEJUSSÓRIAS E 9. OUTRAS GARANTIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Garantias Fidejussórias (Linhas 137-139) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  8. Garantias Fidejussórias
                </CardTitle>
                <CardDescription>
                  Linhas 137 a 139 (Avalistas e Fiadores)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {garantiasFidejussorias.map((gar, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-3"
              >
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Garantidor / Avalista #{idx + 1}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">CPF Avalista</Label>
                    <Input
                      value={gar.cpf || ""}
                      onChange={(e) =>
                        handleUpdateGarantiaFidejussoria(idx, "cpf", e.target.value)
                      }
                      placeholder="000.000.000-00"
                      className="h-9 rounded-xl text-xs bg-background/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">CNPJ (se PJ)</Label>
                    <Input
                      value={gar.cnpj || ""}
                      onChange={(e) =>
                        handleUpdateGarantiaFidejussoria(idx, "cnpj", e.target.value)
                      }
                      placeholder="00.000.000/0000-00"
                      className="h-9 rounded-xl text-xs bg-background/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">CPF Cônjuge</Label>
                    <Input
                      value={gar.cpfConjuge || ""}
                      onChange={(e) =>
                        handleUpdateGarantiaFidejussoria(idx, "cpfConjuge", e.target.value)
                      }
                      placeholder="000.000.000-00"
                      className="h-9 rounded-xl text-xs bg-background/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Outras Garantias (Linhas 142-144) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  9. Outras Garantias
                </CardTitle>
                <CardDescription>
                  Linhas 142 a 144 (Garantias Reais / Hipoteca / Penhor)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {outrasGarantias.map((gar, idx) => (
              <div
                key={gar.id ?? idx}
                className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-[11px] text-muted-foreground">Denominação (D)</Label>
                    <Input
                      value={gar.denominacao || ""}
                      onChange={(e) =>
                        handleUpdateOutraGarantia(idx, "denominacao", e.target.value)
                      }
                      placeholder="Ex.: Imóvel Rural / Benfeitoria"
                      className="h-9 rounded-xl text-xs bg-background/50"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-[11px] text-muted-foreground">Tipo de Garantia (J)</Label>
                    <Select
                      value={gar.tipo || "Hipoteca"}
                      onValueChange={(val: string) =>
                        handleUpdateOutraGarantia(idx, "tipo", val)
                      }
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {garantiaTipoOptions.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <Label className="text-[11px] text-muted-foreground">Valor (N R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={gar.valor ?? 0}
                      onChange={(e) =>
                        handleUpdateOutraGarantia(
                          idx,
                          "valor",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-9 rounded-xl text-xs bg-background/50 text-right"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 10. INDICADORES DE EMPREGO E COMENTÁRIOS / PARECER */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                10. Indicadores Sociais e Parecer Técnico
              </CardTitle>
              <CardDescription>
                Geração de emprego prevista, comentários do técnico e justificativas da proposta
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Indicadores de Emprego (Linha 155) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Número de Empregados (Linha 155)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Atual (D155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAtual ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAtual: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Ano 1 (E155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAno1 ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAno1: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Ano 2 (F155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAno2 ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAno2: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Ano 3 (G155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAno3 ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAno3: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Ano 4 (H155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAno4 ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAno4: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Ano 5 (I155)</Label>
                <Input
                  type="number"
                  min={0}
                  value={data.nrEmpregadosAno5 ?? 0}
                  onChange={(e) =>
                    onChange({
                      nrEmpregadosAno5: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>
            </div>
          </div>

          {/* Textareas de Comentários e Parecer (Linhas 157-160) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comentariosJustificativas" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Comentários / Objetivos / Justificativas (Q157)
              </Label>
              <Textarea
                id="comentariosJustificativas"
                rows={5}
                value={data.comentariosJustificativas || ""}
                onChange={(e) =>
                  onChange({ comentariosJustificativas: e.target.value })
                }
                placeholder="Descreva os objetivos do crédito, capacidade de pagamento, impactos técnicos e justificativas econômicas..."
                className="rounded-2xl border-border/50 bg-background/50 text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parecerTecnico" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Parecer Técnico Conclusivo (Q159)
              </Label>
              <Textarea
                id="parecerTecnico"
                rows={5}
                value={data.parecerTecnico || ""}
                onChange={(e) => onChange({ parecerTecnico: e.target.value })}
                placeholder="Parecer conclusivo do técnico responsável pela elaboração do projeto..."
                className="rounded-2xl border-border/50 bg-background/50 text-xs leading-relaxed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 11. DECLARAÇÕES DE OPERAÇÕES DE CRÉDITO (Linhas 166-173 e P185) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  11. Declarações de Operações de Crédito
                </CardTitle>
                <CardDescription>
                  Declaração de financiamentos e histórico de bônus de adimplência (linhas 166 a 173)
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="anoDeclaracao" className="text-xs text-muted-foreground whitespace-nowrap">
                Ano Base (P185):
              </Label>
              <Input
                id="anoDeclaracao"
                type="number"
                min={1900}
                max={2100}
                value={data.anoDeclaracao || new Date().getFullYear()}
                onChange={(e) =>
                  onChange({
                    anoDeclaracao: parseInt(e.target.value, 10) || new Date().getFullYear(),
                  })
                }
                className="w-24 h-9 rounded-xl text-xs bg-background/50 text-center"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="min-w-[180px] text-xs">Banco / Cooperativa</TableHead>
                  <TableHead className="w-28 text-xs">Data</TableHead>
                  <TableHead className="w-28 text-xs text-right">Valor</TableHead>
                  <TableHead className="min-w-[140px] text-xs">Fonte Recursos</TableHead>
                  <TableHead className="w-24 text-xs text-center">Bônus R$200? (L)</TableHead>
                  <TableHead className="w-24 text-xs text-center">Bônus R$700? (N)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Saldo Devedor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operacoesDeclaradas.map((op, index) => (
                  <TableRow key={op.id ?? index} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {op.id ?? index + 1}
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        value={op.bancoOuCooperativa || ""}
                        onChange={(e) =>
                          handleUpdateOperacaoDeclarada(
                            index,
                            "bancoOuCooperativa",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: Banco do Nordeste"
                        className="h-8 rounded-lg text-xs bg-background/50"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="date"
                        value={op.data || ""}
                        onChange={(e) =>
                          handleUpdateOperacaoDeclarada(index, "data", e.target.value)
                        }
                        className="h-8 rounded-lg text-xs bg-background/50"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={op.valor ?? 0}
                        onChange={(e) =>
                          handleUpdateOperacaoDeclarada(
                            index,
                            "valor",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        value={op.fonteRecursos || ""}
                        onChange={(e) =>
                          handleUpdateOperacaoDeclarada(
                            index,
                            "fonteRecursos",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: FNE / PRONAF"
                        className="h-8 rounded-lg text-xs bg-background/50"
                      />
                    </TableCell>

                    <TableCell className="p-2 text-center">
                      <Select
                        value={op.comBonus200 || "Não"}
                        onValueChange={(val: string) =>
                          handleUpdateOperacaoDeclarada(index, "comBonus200", val as 'Sim' | 'Não')
                        }
                      >
                        <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SIM_NAO.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="p-2 text-center">
                      <Select
                        value={op.bonus700 || "Não"}
                        onValueChange={(val: string) =>
                          handleUpdateOperacaoDeclarada(index, "bonus700", val as 'Sim' | 'Não')
                        }
                      >
                        <SelectTrigger className="h-8 rounded-lg text-xs bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SIM_NAO.map((opt) => (
                            <SelectItem key={opt} value={opt} className="text-xs">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={op.saldoDevedor ?? 0}
                        onChange={(e) =>
                          handleUpdateOperacaoDeclarada(
                            index,
                            "saldoDevedor",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabProposta;
