import * as React from "react";
import {
  AtividadePecuariaData,
  ExploracaoBovinoLeite,
  ExploracaoBovinoCorte,
  ExploracaoOvinocultura,
  ExploracaoCaprinocultura,
  CategoriaPecuariaItem,
  CustosPecuariaExploracao,
} from "../types";
import { SearchableSelect, SelectOption } from "./SearchableSelect";
import { useReferenceTables } from "../useReferenceTables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Milk,
  Beef,
  Layers,
  Activity,
  Calculator,
  Percent,
  TrendingUp,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface TabAtivPecuariaProps {
  data: AtividadePecuariaData;
  onChange: (data: Partial<AtividadePecuariaData>) => void;
}

// Categorias padrão Bovinos
const CATEGORIAS_BOVINO_PADRAO: Array<{ categoria: string; equivalenciaUa: number }> = [
  { categoria: "Touro", equivalenciaUa: 1.5 },
  { categoria: "Vacas", equivalenciaUa: 1.0 },
  { categoria: "Novilhas", equivalenciaUa: 0.7 },
  { categoria: "Novilhos", equivalenciaUa: 0.7 },
  { categoria: "Garrotas", equivalenciaUa: 0.5 },
  { categoria: "Garrotes", equivalenciaUa: 0.5 },
  { categoria: "Bezerras", equivalenciaUa: 0.3 },
  { categoria: "Bezerros", equivalenciaUa: 0.3 },
];

// Categorias padrão Ovinos e Caprinos
const CATEGORIAS_PEQUENOS_PADRAO: Array<{ categoria: string; equivalenciaUa: number }> = [
  { categoria: "Reprodutor", equivalenciaUa: 0.16 },
  { categoria: "Matrizes", equivalenciaUa: 0.14 },
  { categoria: "Fêmeas 1 a 2 anos", equivalenciaUa: 0.10 },
  { categoria: "Machos 1 a 2 anos", equivalenciaUa: 0.10 },
  { categoria: "Fêmeas 0 a 1 ano", equivalenciaUa: 0.04 },
  { categoria: "Machos 0 a 1 ano", equivalenciaUa: 0.04 },
];

const DEFAULT_CUSTOS: CustosPecuariaExploracao = {
  racaoPeriodoDias: 0,
  racaoQtdeCabecaKg: 0,
  racaoValorUnitarioKg: 0,
  vacinasMedicamentosSaisMineraisCabecaAno: 0,
  operarioCabecaAno: 0,
};

// Fallbacks de raças caso ainda não tenham carregado
const FALLBACK_RACAS_LEITE: SelectOption[] = [
  { value: "Holandesa", label: "Holandesa" },
  { value: "Girolando", label: "Girolando" },
  { value: "Gir Leiteiro", label: "Gir Leiteiro" },
  { value: "Guzerá Leiteiro", label: "Guzerá Leiteiro" },
  { value: "Jersey", label: "Jersey" },
  { value: "Pardo Suíço", label: "Pardo Suíço" },
  { value: "Sindi", label: "Sindi" },
  { value: "Mestiço Leiteiro", label: "Mestiço Leiteiro" },
];

const FALLBACK_RACAS_CORTE: SelectOption[] = [
  { value: "Nelore", label: "Nelore" },
  { value: "Nelore Mocho", label: "Nelore Mocho" },
  { value: "Angus", label: "Angus" },
  { value: "Brangus", label: "Brangus" },
  { value: "Brahman", label: "Brahman" },
  { value: "Canchim", label: "Canchim" },
  { value: "Senepol", label: "Senepol" },
  { value: "Tabapuã", label: "Tabapuã" },
  { value: "Guzerá", label: "Guzerá" },
  { value: "Mestiço de Corte", label: "Mestiço de Corte" },
];

const FALLBACK_RACAS_OVINOS: SelectOption[] = [
  { value: "Santa Inês", label: "Santa Inês" },
  { value: "Dorper", label: "Dorper" },
  { value: "Morada Nova", label: "Morada Nova" },
  { value: "Somalis Brasileira", label: "Somalis Brasileira" },
  { value: "Texel", label: "Texel" },
  { value: "Sem Raça Definida (SRD)", label: "Sem Raça Definida (SRD)" },
];

const FALLBACK_RACAS_CAPRINOS: SelectOption[] = [
  { value: "Boer", label: "Boer" },
  { value: "Anglo Nubiana", label: "Anglo Nubiana" },
  { value: "Saanen", label: "Saanen" },
  { value: "Toggenburg", label: "Toggenburg" },
  { value: "Alpina Americana", label: "Alpina Americana" },
  { value: "Moxotó", label: "Moxotó" },
  { value: "Canindé", label: "Canindé" },
  { value: "Sem Raça Definida (SRD)", label: "Sem Raça Definida (SRD)" },
];

export const TabAtivPecuaria: React.FC<TabAtivPecuariaProps> = ({ data, onChange }) => {
  const { getListStrings, loaded } = useReferenceTables();

  // Opções de Raças via useReferenceTables com fallback seguro
  const racasLeiteOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("listaBOV_LEITE");
    if (list && list.length > 0) {
      return list.map((r) => ({ value: r, label: r }));
    }
    return FALLBACK_RACAS_LEITE;
  }, [getListStrings, loaded]);

  const racasCorteOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("listaBOV_CORTE");
    if (list && list.length > 0) {
      return list.map((r) => ({ value: r, label: r }));
    }
    return FALLBACK_RACAS_CORTE;
  }, [getListStrings, loaded]);

  const racasOvinosOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("listaOVI");
    if (list && list.length > 0) {
      return list.map((r) => ({ value: r, label: r }));
    }
    return FALLBACK_RACAS_OVINOS;
  }, [getListStrings, loaded]);

  const racasCaprinosOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("listaCAPRI");
    if (list && list.length > 0) {
      return list.map((r) => ({ value: r, label: r }));
    }
    return FALLBACK_RACAS_CAPRINOS;
  }, [getListStrings, loaded]);

  // Garante que o estado de cada exploração esteja inicializado e íntegro
  const leiteData = React.useMemo<ExploracaoBovinoLeite>(() => {
    const l: Partial<ExploracaoBovinoLeite> = data.leite ?? ({} as ExploracaoBovinoLeite);
    const categorias =
      l.categorias && l.categorias.length === 8
        ? l.categorias
        : CATEGORIAS_BOVINO_PADRAO.map((c, i) => ({
            categoria: c.categoria,
            quantidadeAtual: l.categorias?.[i]?.quantidadeAtual ?? 0,
            aAdquirir: l.categorias?.[i]?.aAdquirir ?? 0,
            equivalenciaUa: c.equivalenciaUa,
            descartePercentAno1: l.categorias?.[i]?.descartePercentAno1 ?? 0,
            descartePercentDemais: l.categorias?.[i]?.descartePercentDemais ?? 0,
            precoUnitarioVenda: l.categorias?.[i]?.precoUnitarioVenda ?? 0,
          }));

    return {
      racaAtividade: l.racaAtividade || "",
      categorias,
      paricaoPercent: l.paricaoPercent ?? 0,
      mortalidadeAte1AnoPercent: l.mortalidadeAte1AnoPercent ?? 0,
      mortalidade1a2AnosPercent: l.mortalidade1a2AnosPercent ?? 0,
      mortalidadeAdultoPercent: l.mortalidadeAdultoPercent ?? 0,
      matrizesPorReprodutor: l.matrizesPorReprodutor ?? 0,
      periodoLactacaoDias: l.periodoLactacaoDias ?? 0,
      leiteCabDiaLitros: l.leiteCabDiaLitros ?? 0,
      leiteQueijoLitrosKg: l.leiteQueijoLitrosKg ?? 0,
      vendaQueijoPercent: l.vendaQueijoPercent ?? 0,
      precoQueijoKg: l.precoQueijoKg ?? 0,
      precoLeiteLitro: l.precoLeiteLitro ?? 0,
      matrizesEstabilizacaoCab: l.matrizesEstabilizacaoCab ?? 0,
      custos: { ...DEFAULT_CUSTOS, ...(l.custos || {}) },
    };
  }, [data.leite]);

  const corteData = React.useMemo<ExploracaoBovinoCorte>(() => {
    const c: Partial<ExploracaoBovinoCorte> = data.corte ?? ({} as ExploracaoBovinoCorte);
    const categorias =
      c.categorias && c.categorias.length === 8
        ? c.categorias
        : CATEGORIAS_BOVINO_PADRAO.map((cat, i) => ({
            categoria: cat.categoria,
            quantidadeAtual: c.categorias?.[i]?.quantidadeAtual ?? 0,
            aAdquirir: c.categorias?.[i]?.aAdquirir ?? 0,
            equivalenciaUa: cat.equivalenciaUa,
            descartePercentAno1: c.categorias?.[i]?.descartePercentAno1 ?? 0,
            descartePercentDemais: c.categorias?.[i]?.descartePercentDemais ?? 0,
            precoUnitarioVenda: c.categorias?.[i]?.precoUnitarioVenda ?? 0,
          }));

    return {
      racaAtividade: c.racaAtividade || "",
      categorias,
      paricaoPercent: c.paricaoPercent ?? 0,
      mortalidadeAte1AnoPercent: c.mortalidadeAte1AnoPercent ?? 0,
      mortalidade1a2AnosPercent: c.mortalidade1a2AnosPercent ?? 0,
      mortalidadeAdultoPercent: c.mortalidadeAdultoPercent ?? 0,
      matrizesPorReprodutor: c.matrizesPorReprodutor ?? 0,
      matrizesEstabilizacaoCab: c.matrizesEstabilizacaoCab ?? 0,
      custos: { ...DEFAULT_CUSTOS, ...(c.custos || {}) },
    };
  }, [data.corte]);

  const ovinosData = React.useMemo<ExploracaoOvinocultura>(() => {
    const o: Partial<ExploracaoOvinocultura> = data.ovinos ?? ({} as ExploracaoOvinocultura);
    const categorias =
      o.categorias && o.categorias.length === 6
        ? o.categorias
        : CATEGORIAS_PEQUENOS_PADRAO.map((cat, i) => ({
            categoria: cat.categoria,
            quantidadeAtual: o.categorias?.[i]?.quantidadeAtual ?? 0,
            aAdquirir: o.categorias?.[i]?.aAdquirir ?? 0,
            equivalenciaUa: cat.equivalenciaUa,
            descartePercentAno1: o.categorias?.[i]?.descartePercentAno1 ?? 0,
            descartePercentDemais: o.categorias?.[i]?.descartePercentDemais ?? 0,
            precoUnitarioVenda: o.categorias?.[i]?.precoUnitarioVenda ?? 0,
          }));

    return {
      racaAtividade: o.racaAtividade || "",
      categorias,
      paricaoPercent: o.paricaoPercent ?? 0,
      prolificidadePercent: o.prolificidadePercent ?? 0,
      mortalidadeAte1AnoPercent: o.mortalidadeAte1AnoPercent ?? 0,
      mortalidade1a2AnosPercent: o.mortalidade1a2AnosPercent ?? 0,
      mortalidadeAdultoPercent: o.mortalidadeAdultoPercent ?? 0,
      matrizesPorReprodutor: o.matrizesPorReprodutor ?? 0,
      matrizesEstabilizacaoCab: o.matrizesEstabilizacaoCab ?? 0,
      custos: { ...DEFAULT_CUSTOS, ...(o.custos || {}) },
    };
  }, [data.ovinos]);

  const caprinosData = React.useMemo<ExploracaoCaprinocultura>(() => {
    const cap: Partial<ExploracaoCaprinocultura> = data.caprinos ?? ({} as ExploracaoCaprinocultura);
    const categorias =
      cap.categorias && cap.categorias.length === 6
        ? cap.categorias
        : CATEGORIAS_PEQUENOS_PADRAO.map((cat, i) => ({
            categoria: cat.categoria,
            quantidadeAtual: cap.categorias?.[i]?.quantidadeAtual ?? 0,
            aAdquirir: cap.categorias?.[i]?.aAdquirir ?? 0,
            equivalenciaUa: cat.equivalenciaUa,
            descartePercentAno1: cap.categorias?.[i]?.descartePercentAno1 ?? 0,
            descartePercentDemais: cap.categorias?.[i]?.descartePercentDemais ?? 0,
            precoUnitarioVenda: cap.categorias?.[i]?.precoUnitarioVenda ?? 0,
          }));

    return {
      racaAtividade: cap.racaAtividade || "",
      categorias,
      paricaoPercent: cap.paricaoPercent ?? 0,
      prolificidadePercent: cap.prolificidadePercent ?? 0,
      mortalidadeAte1AnoPercent: cap.mortalidadeAte1AnoPercent ?? 0,
      mortalidade1a2AnosPercent: cap.mortalidade1a2AnosPercent ?? 0,
      mortalidadeAdultoPercent: cap.mortalidadeAdultoPercent ?? 0,
      matrizesPorReprodutor: cap.matrizesPorReprodutor ?? 0,
      periodoLactacaoDias: cap.periodoLactacaoDias ?? 0,
      leiteDiaLitros: cap.leiteDiaLitros ?? 0,
      precoLeiteLitro: cap.precoLeiteLitro ?? 0,
      matrizesEstabilizacaoCab: cap.matrizesEstabilizacaoCab ?? 0,
      custos: { ...DEFAULT_CUSTOS, ...(cap.custos || {}) },
    };
  }, [data.caprinos]);

  // Handlers para cada exploração
  const handleLeiteFieldChange = <K extends keyof ExploracaoBovinoLeite>(field: K, val: ExploracaoBovinoLeite[K]) => {
    onChange({
      leite: {
        ...leiteData,
        [field]: val,
      },
    });
  };

  const handleLeiteCategoriaChange = (
    index: number,
    field: keyof CategoriaPecuariaItem,
    val: string | number
  ) => {
    const updatedCats = [...leiteData.categorias];
    updatedCats[index] = { ...updatedCats[index], [field]: val };
    handleLeiteFieldChange("categorias", updatedCats);
  };

  const handleLeiteCustosChange = (field: keyof CustosPecuariaExploracao, val: number) => {
    handleLeiteFieldChange("custos", {
      ...leiteData.custos,
      [field]: val,
    });
  };

  const handleCorteFieldChange = <K extends keyof ExploracaoBovinoCorte>(field: K, val: ExploracaoBovinoCorte[K]) => {
    onChange({
      corte: {
        ...corteData,
        [field]: val,
      },
    });
  };

  const handleCorteCategoriaChange = (
    index: number,
    field: keyof CategoriaPecuariaItem,
    val: string | number
  ) => {
    const updatedCats = [...corteData.categorias];
    updatedCats[index] = { ...updatedCats[index], [field]: val };
    handleCorteFieldChange("categorias", updatedCats);
  };

  const handleCorteCustosChange = (field: keyof CustosPecuariaExploracao, val: number) => {
    handleCorteFieldChange("custos", {
      ...corteData.custos,
      [field]: val,
    });
  };

  const handleOvinosFieldChange = <K extends keyof ExploracaoOvinocultura>(field: K, val: ExploracaoOvinocultura[K]) => {
    onChange({
      ovinos: {
        ...ovinosData,
        [field]: val,
      },
    });
  };

  const handleOvinosCategoriaChange = (
    index: number,
    field: keyof CategoriaPecuariaItem,
    val: string | number
  ) => {
    const updatedCats = [...ovinosData.categorias];
    updatedCats[index] = { ...updatedCats[index], [field]: val };
    handleOvinosFieldChange("categorias", updatedCats);
  };

  const handleOvinosCustosChange = (field: keyof CustosPecuariaExploracao, val: number) => {
    handleOvinosFieldChange("custos", {
      ...ovinosData.custos,
      [field]: val,
    });
  };

  const handleCaprinosFieldChange = <K extends keyof ExploracaoCaprinocultura>(field: K, val: ExploracaoCaprinocultura[K]) => {
    onChange({
      caprinos: {
        ...caprinosData,
        [field]: val,
      },
    });
  };

  const handleCaprinosCategoriaChange = (
    index: number,
    field: keyof CategoriaPecuariaItem,
    val: string | number
  ) => {
    const updatedCats = [...caprinosData.categorias];
    updatedCats[index] = { ...updatedCats[index], [field]: val };
    handleCaprinosFieldChange("categorias", updatedCats);
  };

  const handleCaprinosCustosChange = (field: keyof CustosPecuariaExploracao, val: number) => {
    handleCaprinosFieldChange("custos", {
      ...caprinosData.custos,
      [field]: val,
    });
  };

  // Helper para calcular totais de uma exploração
  const calcularTotais = (categorias: CategoriaPecuariaItem[]) => {
    return categorias.reduce(
      (acc, c) => {
        const atual = c.quantidadeAtual || 0;
        const adquirir = c.aAdquirir || 0;
        const ua = c.equivalenciaUa || 0;
        return {
          totalAtual: acc.totalAtual + atual,
          totalAdquirir: acc.totalAdquirir + adquirir,
          totalRebanho: acc.totalRebanho + atual + adquirir,
          totalUa: acc.totalUa + (atual + adquirir) * ua,
        };
      },
      { totalAtual: 0, totalAdquirir: 0, totalRebanho: 0, totalUa: 0 }
    );
  };

  const totaisLeite = React.useMemo(() => calcularTotais(leiteData.categorias), [leiteData.categorias]);
  const totaisCorte = React.useMemo(() => calcularTotais(corteData.categorias), [corteData.categorias]);
  const totaisOvinos = React.useMemo(() => calcularTotais(ovinosData.categorias), [ovinosData.categorias]);
  const totaisCaprinos = React.useMemo(() => calcularTotais(caprinosData.categorias), [caprinosData.categorias]);

  // ── Renderizador de Tabela de Categorias Animais ───────────────────
  const renderTabelaCategorias = (
    categorias: CategoriaPecuariaItem[],
    onCategoriaChange: (index: number, field: keyof CategoriaPecuariaItem, val: string | number) => void
  ) => {
    return (
      <div className="overflow-x-auto rounded-2xl border border-border/40">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="min-w-[150px] font-bold">Categoria</TableHead>
              <TableHead className="min-w-[110px] text-right font-bold">Quant. Atual</TableHead>
              <TableHead className="min-w-[110px] text-right font-bold">A Adquirir</TableHead>
              <TableHead className="min-w-[110px] text-right font-bold">Equiv. UA</TableHead>
              <TableHead className="min-w-[120px] text-right font-bold">Descarte% Ano 1</TableHead>
              <TableHead className="min-w-[120px] text-right font-bold">Descarte% Demais</TableHead>
              <TableHead className="min-w-[140px] text-right font-bold">Preço Venda (R$)</TableHead>
              <TableHead className="min-w-[110px] text-right font-bold">Subtotal UA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.map((cat, idx) => {
              const totalCab = (cat.quantidadeAtual || 0) + (cat.aAdquirir || 0);
              const subtotalUa = totalCab * (cat.equivalenciaUa || 0);

              return (
                <TableRow key={cat.categoria} className="hover:bg-muted/20">
                  <TableCell className="font-semibold text-xs text-foreground">
                    {cat.categoria}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={cat.quantidadeAtual ?? ""}
                      placeholder="0"
                      onChange={(e) =>
                        onCategoriaChange(idx, "quantidadeAtual", parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={cat.aAdquirir ?? ""}
                      placeholder="0"
                      onChange={(e) =>
                        onCategoriaChange(idx, "aAdquirir", parseInt(e.target.value, 10) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={cat.equivalenciaUa ?? ""}
                      placeholder="0.00"
                      onChange={(e) =>
                        onCategoriaChange(idx, "equivalenciaUa", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50 font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={cat.descartePercentAno1 ?? ""}
                      placeholder="0.0%"
                      onChange={(e) =>
                        onCategoriaChange(idx, "descartePercentAno1", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={cat.descartePercentDemais ?? ""}
                      placeholder="0.0%"
                      onChange={(e) =>
                        onCategoriaChange(idx, "descartePercentDemais", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={cat.precoUnitarioVenda ?? ""}
                      placeholder="R$ 0,00"
                      onChange={(e) =>
                        onCategoriaChange(idx, "precoUnitarioVenda", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 text-xs text-right bg-background/50"
                    />
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold text-emerald-500 font-mono">
                    {subtotalUa.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // ── Renderizador de Card de Custos da Pecuária ─────────────────────
  const renderCardCustos = (
    custos: CustosPecuariaExploracao,
    onCustosChange: (field: keyof CustosPecuariaExploracao, val: number) => void
  ) => {
    return (
      <Card className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base font-bold">Custos da Pecuária</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Parâmetros de nutrição concentrada, sanidade animal e coeficientes de mão de obra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Ração - Período (dias)
              </Label>
              <Input
                type="number"
                min={0}
                value={custos.racaoPeriodoDias ?? ""}
                placeholder="Ex: 90"
                onChange={(e) =>
                  onCustosChange("racaoPeriodoDias", parseInt(e.target.value, 10) || 0)
                }
                className="h-8 text-xs bg-background/50 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Ração - Qtde/cab (Kg)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={custos.racaoQtdeCabecaKg ?? ""}
                placeholder="Ex: 2.5"
                onChange={(e) =>
                  onCustosChange("racaoQtdeCabecaKg", parseFloat(e.target.value) || 0)
                }
                className="h-8 text-xs bg-background/50 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Ração - Valor (R$/Kg)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={custos.racaoValorUnitarioKg ?? ""}
                placeholder="R$ 0,00"
                onChange={(e) =>
                  onCustosChange("racaoValorUnitarioKg", parseFloat(e.target.value) || 0)
                }
                className="h-8 text-xs bg-background/50 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Vacinas / Med. / Sal (R$/cab/ano)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={custos.vacinasMedicamentosSaisMineraisCabecaAno ?? ""}
                placeholder="R$ 0,00"
                onChange={(e) =>
                  onCustosChange(
                    "vacinasMedicamentosSaisMineraisCabecaAno",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="h-8 text-xs bg-background/50 text-right"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Operário / Cabeça-Ano
              </Label>
              <Input
                type="number"
                min={0}
                step="0.001"
                value={custos.operarioCabecaAno ?? ""}
                placeholder="Ex: 0.02"
                onChange={(e) =>
                  onCustosChange("operarioCabecaAno", parseFloat(e.target.value) || 0)
                }
                className="h-8 text-xs bg-background/50 text-right"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── BARRA SUPERIOR: CONFIGURAÇÃO GLOBAL E SALÁRIO MÍNIMO ─────── */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Beef className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Módulo de Atividade Pecuária (Sheet 21)
              </h2>
              <p className="text-xs text-muted-foreground">
                Planejamento zootécnico e orçamentário das 4 explorações animais (Bovino Leite, Bovino Corte, Ovinos e Caprinos).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-background/50 px-4 py-2.5 rounded-2xl border border-border/40">
            <div className="space-y-0.5">
              <Label htmlFor="salario-minimo" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Salário Mínimo-Referência (R$)
              </Label>
              <Input
                id="salario-minimo"
                type="number"
                min={0}
                step="1"
                value={data.salarioMinimoReferencia ?? 1412}
                onChange={(e) =>
                  onChange({
                    salarioMinimoReferencia: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-7 text-xs font-bold text-emerald-500 text-right w-32 bg-transparent border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── TABS DAS 4 EXPLORAÇÕES PECUÁRIAS ──────────────────────────── */}
      <Tabs defaultValue="leite" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="bg-card/40 border border-border/40 rounded-2xl p-1 gap-1">
            <TabsTrigger
              value="leite"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Milk className="w-4 h-4" />
              <span>Bovinocultura de Leite</span>
            </TabsTrigger>
            <TabsTrigger
              value="corte"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Beef className="w-4 h-4" />
              <span>Bovinocultura de Corte</span>
            </TabsTrigger>
            <TabsTrigger
              value="ovinos"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Layers className="w-4 h-4" />
              <span>Ovinocultura</span>
            </TabsTrigger>
            <TabsTrigger
              value="caprinos"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="w-4 h-4" />
              <span>Caprinocultura</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── 1. BOVINOCULTURA DE LEITE ──────────────────────────────── */}
        <TabsContent value="leite" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
                    <Milk className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Bovinocultura de Leite
                    </CardTitle>
                    <CardDescription>
                      Evolução do plantel leiteiro, parâmetros de ordenha, transformação e descarte.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-64">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                      Raça / Atividade (listaBOV_LEITE)
                    </Label>
                    <SearchableSelect
                      options={racasLeiteOptions}
                      value={leiteData.racaAtividade}
                      onChange={(val) => handleLeiteFieldChange("racaAtividade", val)}
                      placeholder="Selecione a raça..."
                      className="h-8 text-xs bg-background/50"
                    />
                  </div>
                </div>
              </div>

              {/* Resumo de totais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Atual:</span>
                  <span className="text-base font-bold text-foreground">{totaisLeite.totalAtual} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">A Adquirir:</span>
                  <span className="text-base font-bold text-foreground">{totaisLeite.totalAdquirir} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Projetado:</span>
                  <span className="text-base font-bold text-primary">{totaisLeite.totalRebanho} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Lotação Total (UA):</span>
                  <span className="text-base font-bold text-emerald-500">{totaisLeite.totalUa.toFixed(2)} UA</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tabela de 8 Categorias */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Evolução do Rebanho por Categoria
                </h3>
                {renderTabelaCategorias(leiteData.categorias, handleLeiteCategoriaChange)}
              </div>

              {/* Card de Indicadores Técnicos */}
              <Card className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-500" />
                    <CardTitle className="text-base font-bold">Indicadores Técnicos e de Vendas</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Produtividade de leite, rendimento queijeiro e taxas reprodutivas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Parição (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={leiteData.paricaoPercent ?? ""}
                        placeholder="Ex: 80%"
                        onChange={(e) => handleLeiteFieldChange("paricaoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade até 1 ano (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={leiteData.mortalidadeAte1AnoPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleLeiteFieldChange("mortalidadeAte1AnoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade 1 a 2 anos (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={leiteData.mortalidade1a2AnosPercent ?? ""}
                        placeholder="Ex: 2%"
                        onChange={(e) => handleLeiteFieldChange("mortalidade1a2AnosPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade Adulto (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={leiteData.mortalidadeAdultoPercent ?? ""}
                        placeholder="Ex: 2%"
                        onChange={(e) => handleLeiteFieldChange("mortalidadeAdultoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes por Reprodutor</Label>
                      <Input
                        type="number"
                        min={0}
                        value={leiteData.matrizesPorReprodutor ?? ""}
                        placeholder="Ex: 25"
                        onChange={(e) => handleLeiteFieldChange("matrizesPorReprodutor", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Período de Lactação (dias)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={leiteData.periodoLactacaoDias ?? ""}
                        placeholder="Ex: 270"
                        onChange={(e) => handleLeiteFieldChange("periodoLactacaoDias", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Leite / cab / dia (L)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={leiteData.leiteCabDiaLitros ?? ""}
                        placeholder="Ex: 12.0"
                        onChange={(e) => handleLeiteFieldChange("leiteCabDiaLitros", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Leite / Queijo (L/Kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={leiteData.leiteQueijoLitrosKg ?? ""}
                        placeholder="Ex: 10.0"
                        onChange={(e) => handleLeiteFieldChange("leiteQueijoLitrosKg", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Venda Queijo (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={leiteData.vendaQueijoPercent ?? ""}
                        placeholder="Ex: 50%"
                        onChange={(e) => handleLeiteFieldChange("vendaQueijoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Preço Queijo / Kg (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={leiteData.precoQueijoKg ?? ""}
                        placeholder="R$ 0,00"
                        onChange={(e) => handleLeiteFieldChange("precoQueijoKg", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Preço Leite / L (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={leiteData.precoLeiteLitro ?? ""}
                        placeholder="R$ 0,00"
                        onChange={(e) => handleLeiteFieldChange("precoLeiteLitro", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes Estabilização (Cab)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={leiteData.matrizesEstabilizacaoCab ?? ""}
                        placeholder="Ex: 15"
                        onChange={(e) => handleLeiteFieldChange("matrizesEstabilizacaoCab", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Custos */}
              {renderCardCustos(leiteData.custos, handleLeiteCustosChange)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. BOVINOCULTURA DE CORTE ──────────────────────────────── */}
        <TabsContent value="corte" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <Beef className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Bovinocultura de Corte
                    </CardTitle>
                    <CardDescription>
                      Plantel de cria, recria e engorda com indicadores zootécnicos voltados à produção de carne.
                    </CardDescription>
                  </div>
                </div>

                <div className="w-64">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                    Raça / Atividade (listaBOV_CORTE)
                  </Label>
                  <SearchableSelect
                    options={racasCorteOptions}
                    value={corteData.racaAtividade}
                    onChange={(val) => handleCorteFieldChange("racaAtividade", val)}
                    placeholder="Selecione a raça..."
                    className="h-8 text-xs bg-background/50"
                  />
                </div>
              </div>

              {/* Resumo de totais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Atual:</span>
                  <span className="text-base font-bold text-foreground">{totaisCorte.totalAtual} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">A Adquirir:</span>
                  <span className="text-base font-bold text-foreground">{totaisCorte.totalAdquirir} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Projetado:</span>
                  <span className="text-base font-bold text-primary">{totaisCorte.totalRebanho} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Lotação Total (UA):</span>
                  <span className="text-base font-bold text-emerald-500">{totaisCorte.totalUa.toFixed(2)} UA</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tabela de 8 Categorias */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Evolução do Rebanho de Corte
                </h3>
                {renderTabelaCategorias(corteData.categorias, handleCorteCategoriaChange)}
              </div>

              {/* Card de Indicadores Técnicos */}
              <Card className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-base font-bold">Indicadores Técnicos e Reprodutivos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Parição (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={corteData.paricaoPercent ?? ""}
                        placeholder="Ex: 80%"
                        onChange={(e) => handleCorteFieldChange("paricaoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade até 1 ano (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={corteData.mortalidadeAte1AnoPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleCorteFieldChange("mortalidadeAte1AnoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade 1 a 2 anos (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={corteData.mortalidade1a2AnosPercent ?? ""}
                        placeholder="Ex: 2%"
                        onChange={(e) => handleCorteFieldChange("mortalidade1a2AnosPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade Adulto (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={corteData.mortalidadeAdultoPercent ?? ""}
                        placeholder="Ex: 2%"
                        onChange={(e) => handleCorteFieldChange("mortalidadeAdultoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes por Reprodutor</Label>
                      <Input
                        type="number"
                        min={0}
                        value={corteData.matrizesPorReprodutor ?? ""}
                        placeholder="Ex: 25"
                        onChange={(e) => handleCorteFieldChange("matrizesPorReprodutor", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes Estabilização (Cab)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={corteData.matrizesEstabilizacaoCab ?? ""}
                        placeholder="Ex: 20"
                        onChange={(e) => handleCorteFieldChange("matrizesEstabilizacaoCab", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Custos */}
              {renderCardCustos(corteData.custos, handleCorteCustosChange)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. OVINOCULTURA ────────────────────────────────────────── */}
        <TabsContent value="ovinos" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Ovinocultura
                    </CardTitle>
                    <CardDescription>
                      Manejo de ovinos, taxas de prolificidade e parâmetros reprodutivos das 6 categorias.
                    </CardDescription>
                  </div>
                </div>

                <div className="w-64">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                    Raça / Atividade (listaOVI)
                  </Label>
                  <SearchableSelect
                    options={racasOvinosOptions}
                    value={ovinosData.racaAtividade}
                    onChange={(val) => handleOvinosFieldChange("racaAtividade", val)}
                    placeholder="Selecione a raça..."
                    className="h-8 text-xs bg-background/50"
                  />
                </div>
              </div>

              {/* Resumo de totais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Atual:</span>
                  <span className="text-base font-bold text-foreground">{totaisOvinos.totalAtual} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">A Adquirir:</span>
                  <span className="text-base font-bold text-foreground">{totaisOvinos.totalAdquirir} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Projetado:</span>
                  <span className="text-base font-bold text-primary">{totaisOvinos.totalRebanho} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Lotação Total (UA):</span>
                  <span className="text-base font-bold text-emerald-500">{totaisOvinos.totalUa.toFixed(2)} UA</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tabela de 6 Categorias */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Evolução do Rebanho de Ovinos (6 Categorias)
                </h3>
                {renderTabelaCategorias(ovinosData.categorias, handleOvinosCategoriaChange)}
              </div>

              {/* Card de Indicadores Técnicos */}
              <Card className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <CardTitle className="text-base font-bold">Indicadores Técnicos de Ovinos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Parição (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={ovinosData.paricaoPercent ?? ""}
                        placeholder="Ex: 85%"
                        onChange={(e) => handleOvinosFieldChange("paricaoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Prolificidade (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        step="0.1"
                        value={ovinosData.prolificidadePercent ?? ""}
                        placeholder="Ex: 120%"
                        onChange={(e) => handleOvinosFieldChange("prolificidadePercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade até 1 ano (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={ovinosData.mortalidadeAte1AnoPercent ?? ""}
                        placeholder="Ex: 5%"
                        onChange={(e) => handleOvinosFieldChange("mortalidadeAte1AnoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade 1 a 2 anos (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={ovinosData.mortalidade1a2AnosPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleOvinosFieldChange("mortalidade1a2AnosPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade Adulto (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={ovinosData.mortalidadeAdultoPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleOvinosFieldChange("mortalidadeAdultoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes por Reprodutor</Label>
                      <Input
                        type="number"
                        min={0}
                        value={ovinosData.matrizesPorReprodutor ?? ""}
                        placeholder="Ex: 25"
                        onChange={(e) => handleOvinosFieldChange("matrizesPorReprodutor", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes Estabilização (Cab)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={ovinosData.matrizesEstabilizacaoCab ?? ""}
                        placeholder="Ex: 30"
                        onChange={(e) => handleOvinosFieldChange("matrizesEstabilizacaoCab", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Custos */}
              {renderCardCustos(ovinosData.custos, handleOvinosCustosChange)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 4. CAPRINOCULTURA ──────────────────────────────────────── */}
        <TabsContent value="caprinos" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Caprinocultura
                    </CardTitle>
                    <CardDescription>
                      Exploração de caprinos (corte ou leite), indicadores de lactação e taxa de prolificidade.
                    </CardDescription>
                  </div>
                </div>

                <div className="w-64">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">
                    Raça / Atividade (listaCAPRI)
                  </Label>
                  <SearchableSelect
                    options={racasCaprinosOptions}
                    value={caprinosData.racaAtividade}
                    onChange={(val) => handleCaprinosFieldChange("racaAtividade", val)}
                    placeholder="Selecione a raça..."
                    className="h-8 text-xs bg-background/50"
                  />
                </div>
              </div>

              {/* Resumo de totais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/30">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Atual:</span>
                  <span className="text-base font-bold text-foreground">{totaisCaprinos.totalAtual} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">A Adquirir:</span>
                  <span className="text-base font-bold text-foreground">{totaisCaprinos.totalAdquirir} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Rebanho Projetado:</span>
                  <span className="text-base font-bold text-primary">{totaisCaprinos.totalRebanho} cab</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                  <span className="text-[11px] text-muted-foreground block font-medium">Lotação Total (UA):</span>
                  <span className="text-base font-bold text-emerald-500">{totaisCaprinos.totalUa.toFixed(2)} UA</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Tabela de 6 Categorias */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Evolução do Rebanho de Caprinos (6 Categorias)
                </h3>
                {renderTabelaCategorias(caprinosData.categorias, handleCaprinosCategoriaChange)}
              </div>

              {/* Card de Indicadores Técnicos */}
              <Card className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <CardTitle className="text-base font-bold">Indicadores Técnicos e de Lactação</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Parição (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={caprinosData.paricaoPercent ?? ""}
                        placeholder="Ex: 85%"
                        onChange={(e) => handleCaprinosFieldChange("paricaoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Prolificidade (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={200}
                        step="0.1"
                        value={caprinosData.prolificidadePercent ?? ""}
                        placeholder="Ex: 130%"
                        onChange={(e) => handleCaprinosFieldChange("prolificidadePercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade até 1 ano (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={caprinosData.mortalidadeAte1AnoPercent ?? ""}
                        placeholder="Ex: 6%"
                        onChange={(e) => handleCaprinosFieldChange("mortalidadeAte1AnoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade 1 a 2 anos (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={caprinosData.mortalidade1a2AnosPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleCaprinosFieldChange("mortalidade1a2AnosPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Mortalidade Adulto (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={caprinosData.mortalidadeAdultoPercent ?? ""}
                        placeholder="Ex: 3%"
                        onChange={(e) => handleCaprinosFieldChange("mortalidadeAdultoPercent", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes por Reprodutor</Label>
                      <Input
                        type="number"
                        min={0}
                        value={caprinosData.matrizesPorReprodutor ?? ""}
                        placeholder="Ex: 25"
                        onChange={(e) => handleCaprinosFieldChange("matrizesPorReprodutor", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Período Lactação (dias)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={caprinosData.periodoLactacaoDias ?? ""}
                        placeholder="Ex: 180"
                        onChange={(e) => handleCaprinosFieldChange("periodoLactacaoDias", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Leite / dia (L)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={caprinosData.leiteDiaLitros ?? ""}
                        placeholder="Ex: 2.0"
                        onChange={(e) => handleCaprinosFieldChange("leiteDiaLitros", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Preço Leite / L (R$)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={caprinosData.precoLeiteLitro ?? ""}
                        placeholder="R$ 0,00"
                        onChange={(e) => handleCaprinosFieldChange("precoLeiteLitro", parseFloat(e.target.value) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-semibold">Matrizes Estabilização (Cab)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={caprinosData.matrizesEstabilizacaoCab ?? ""}
                        placeholder="Ex: 30"
                        onChange={(e) => handleCaprinosFieldChange("matrizesEstabilizacaoCab", parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-xs bg-background/50 text-right"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Custos */}
              {renderCardCustos(caprinosData.custos, handleCaprinosCustosChange)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabAtivPecuaria;
