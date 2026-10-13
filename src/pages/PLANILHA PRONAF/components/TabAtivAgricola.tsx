import * as React from "react";
import {
  AtividadeAgricolaData,
  UsoTerraAgricolaItem,
  ReceitaAgricolaItem,
} from "../types";
import { VirtualGrid, VirtualGridColumn } from "./VirtualGrid";
import { SearchableSelect, SelectOption } from "./SearchableSelect";
import { useReferenceTables } from "../useReferenceTables";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Sprout,
  Trees,
  DollarSign,
  Calculator,
  Layers,
  Info,
  CheckCircle2,
  Wheat,
  Activity,
  Plus,
  RefreshCw,
} from "lucide-react";

export interface TabAtivAgricolaProps {
  data: AtividadeAgricolaData;
  onChange: (data: Partial<AtividadeAgricolaData>) => void;
}

// Anos exibidos na grade simplificada para performance ótima no navegador
const ANOS_EXIBIDOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// Unidades padrão para fallback caso a tabela ainda esteja carregando
const UNIDADES_FALLBACK: SelectOption[] = [
  { value: "SACA 60 KG", label: "SACA 60 KG (sc)" },
  { value: "QUILOGRAMA", label: "QUILOGRAMA (kg)" },
  { value: "TONELADA", label: "TONELADA (t)" },
  { value: "CAIXA", label: "CAIXA (cx)" },
  { value: "UNIDADE", label: "UNIDADE (un)" },
  { value: "CENTO", label: "CENTO (ct)" },
  { value: "MILHEIRO", label: "MILHEIRO (mil)" },
  { value: "LITRO", label: "LITRO (L)" },
  { value: "FARDO", label: "FARDO (fd)" },
  { value: "ARROBA", label: "ARROBA (@)" },
];

export const TabAtivAgricola: React.FC<TabAtivAgricolaProps> = ({ data, onChange }) => {
  const { getListStrings, loaded } = useReferenceTables();
  const [subTabUsoTerra, setSubTabUsoTerra] = React.useState<"agricola" | "pecuaria">("agricola");

  // Opções de Descrição de Atividade
  const descAtividadeOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("lista_ANALISADOR_DESC_ATIVIDADE");
    if (list && list.length > 0) {
      return list.map((item) => ({ value: item, label: item }));
    }
    return [
      { value: "Milho Grão", label: "Milho Grão" },
      { value: "Feijão Caupi", label: "Feijão Caupi" },
      { value: "Mandioca Raiz", label: "Mandioca Raiz" },
      { value: "Pastagem Cultivada", label: "Pastagem Cultivada" },
      { value: "Pastagem Nativa", label: "Pastagem Nativa" },
      { value: "Palma Forrageira", label: "Palma Forrageira" },
      { value: "Capim Elefante / Napier", label: "Capim Elefante / Napier" },
      { value: "Hortaliças Diversas", label: "Hortaliças Diversas" },
      { value: "Fruticultura Irrigada", label: "Fruticultura Irrigada" },
    ];
  }, [getListStrings, loaded]);

  // Opções de Unidade de Medida
  const unidadeOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("visaoUND_S400");
    if (list && list.length > 0) {
      return list.map((item) => ({ value: item, label: item }));
    }
    return UNIDADES_FALLBACK;
  }, [getListStrings, loaded]);

  // Opções de Atividades Econômicas
  const atividadeOptions = React.useMemo<SelectOption[]>(() => {
    const list = getListStrings("visaoATIV");
    if (list && list.length > 0) {
      return list.map((item) => ({ value: item, label: item }));
    }
    return [
      { value: "AGRICULTURA FAMILIAR", label: "AGRICULTURA FAMILIAR" },
      { value: "BOVINOCULTURA DE LEITE", label: "BOVINOCULTURA DE LEITE" },
      { value: "BOVINOCULTURA DE CORTE", label: "BOVINOCULTURA DE CORTE" },
      { value: "OVINOCULTURA", label: "OVINOCULTURA" },
      { value: "CAPRINOCULTURA", label: "CAPRINOCULTURA" },
      { value: "AVICULTURA CAIPIRA", label: "AVICULTURA CAIPIRA" },
      { value: "APICULTURA", label: "APICULTURA" },
      { value: "HORTICULTURA", label: "HORTICULTURA" },
      { value: "FRUTICULTURA", label: "FRUTICULTURA" },
    ];
  }, [getListStrings, loaded]);

  // Inicialização segura das 35 linhas de uso das terras agrícola (linhas 8-42)
  const usoTerrasAgricola = React.useMemo<UsoTerraAgricolaItem[]>(() => {
    if (data.usoTerrasAgricola && data.usoTerrasAgricola.length === 35) {
      return data.usoTerrasAgricola;
    }
    const base = data.usoTerrasAgricola || [];
    return Array.from({ length: 35 }, (_, idx) => {
      const existing = base[idx];
      return {
        id: idx + 1,
        descricao: existing?.descricao || "",
        atualArea: existing?.atualArea || 0,
        atualUaHa: existing?.atualUaHa || 0,
        anos: existing?.anos || [],
      };
    });
  }, [data.usoTerrasAgricola]);

  // Inicialização segura das 35 linhas de uso das terras pecuária (linhas 44-78)
  const usoTerrasPecuaria = React.useMemo<UsoTerraAgricolaItem[]>(() => {
    if (data.usoTerrasPecuaria && data.usoTerrasPecuaria.length === 35) {
      return data.usoTerrasPecuaria;
    }
    const base = data.usoTerrasPecuaria || [];
    return Array.from({ length: 35 }, (_, idx) => {
      const existing = base[idx];
      return {
        id: idx + 1,
        descricao: existing?.descricao || "",
        atualArea: existing?.atualArea || 0,
        atualUaHa: existing?.atualUaHa || 0,
        anos: existing?.anos || [],
      };
    });
  }, [data.usoTerrasPecuaria]);

  // Inicialização segura das 35 linhas de receitas agrícolas (linhas 85-119)
  const receitasAgricolas = React.useMemo<ReceitaAgricolaItem[]>(() => {
    if (data.receitasAgricolas && data.receitasAgricolas.length === 35) {
      return data.receitasAgricolas;
    }
    const base = data.receitasAgricolas || [];
    return Array.from({ length: 35 }, (_, idx) => {
      const existing = base[idx];
      return {
        id: idx + 1,
        descricao: existing?.descricao || "",
        irrigacao: existing?.irrigacao || "Não Irrigada",
        unidade: existing?.unidade || "",
        valorUnitario: existing?.valorUnitario || 0,
        produtividadeAnos: existing?.produtividadeAnos || [],
      };
    });
  }, [data.receitasAgricolas]);

  // Inicialização segura das 35 atividades econômicas (linhas 166-200)
  const atividadesEconomicas = React.useMemo<string[]>(() => {
    if (data.atividadesEconomicas && data.atividadesEconomicas.length === 35) {
      return data.atividadesEconomicas;
    }
    const base = data.atividadesEconomicas || [];
    return Array.from({ length: 35 }, (_, idx) => base[idx] || "");
  }, [data.atividadesEconomicas]);

  // Totalizadores de uso de terra agrícola
  const totaisUsoAgricola = React.useMemo(() => {
    return usoTerrasAgricola.reduce(
      (acc, item) => ({
        areaAtual: acc.areaAtual + (item.atualArea || 0),
        uaAtual: acc.uaAtual + (item.atualUaHa || 0),
      }),
      { areaAtual: 0, uaAtual: 0 }
    );
  }, [usoTerrasAgricola]);

  // Totalizadores de uso de terra pecuária
  const totaisUsoPecuaria = React.useMemo(() => {
    return usoTerrasPecuaria.reduce(
      (acc, item) => ({
        areaAtual: acc.areaAtual + (item.atualArea || 0),
        uaAtual: acc.uaAtual + (item.atualUaHa || 0),
      }),
      { areaAtual: 0, uaAtual: 0 }
    );
  }, [usoTerrasPecuaria]);

  // Atualização de Uso da Terra Agrícola
  const handleUsoAgricolaChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const updated = [...usoTerrasAgricola];
    const item = { ...updated[rowIndex] };

    if (key.startsWith("ano_area_")) {
      const anoNum = parseInt(key.replace("ano_area_", ""), 10);
      const anos = [...(item.anos || [])];
      const anoIdx = anos.findIndex((a) => a.ano === anoNum);
      const numVal = parseFloat(String(value)) || 0;
      if (anoIdx >= 0) {
        anos[anoIdx] = { ...anos[anoIdx], area: numVal };
      } else {
        anos.push({ ano: anoNum, area: numVal, uaHa: 0 });
      }
      item.anos = anos;
    } else if (key.startsWith("ano_ua_")) {
      const anoNum = parseInt(key.replace("ano_ua_", ""), 10);
      const anos = [...(item.anos || [])];
      const anoIdx = anos.findIndex((a) => a.ano === anoNum);
      const numVal = parseFloat(String(value)) || 0;
      if (anoIdx >= 0) {
        anos[anoIdx] = { ...anos[anoIdx], uaHa: numVal };
      } else {
        anos.push({ ano: anoNum, area: 0, uaHa: numVal });
      }
      item.anos = anos;
    } else {
      (item as Record<string, unknown>)[key] = value;
    }

    updated[rowIndex] = item;
    onChange({ usoTerrasAgricola: updated });
  };

  // Atualização de Uso da Terra Pecuária
  const handleUsoPecuariaChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const updated = [...usoTerrasPecuaria];
    const item = { ...updated[rowIndex] };

    if (key.startsWith("ano_area_")) {
      const anoNum = parseInt(key.replace("ano_area_", ""), 10);
      const anos = [...(item.anos || [])];
      const anoIdx = anos.findIndex((a) => a.ano === anoNum);
      const numVal = parseFloat(String(value)) || 0;
      if (anoIdx >= 0) {
        anos[anoIdx] = { ...anos[anoIdx], area: numVal };
      } else {
        anos.push({ ano: anoNum, area: numVal, uaHa: 0 });
      }
      item.anos = anos;
    } else if (key.startsWith("ano_ua_")) {
      const anoNum = parseInt(key.replace("ano_ua_", ""), 10);
      const anos = [...(item.anos || [])];
      const anoIdx = anos.findIndex((a) => a.ano === anoNum);
      const numVal = parseFloat(String(value)) || 0;
      if (anoIdx >= 0) {
        anos[anoIdx] = { ...anos[anoIdx], uaHa: numVal };
      } else {
        anos.push({ ano: anoNum, area: 0, uaHa: numVal });
      }
      item.anos = anos;
    } else {
      (item as Record<string, unknown>)[key] = value;
    }

    updated[rowIndex] = item;
    onChange({ usoTerrasPecuaria: updated });
  };

  // Atualização de Receita Agrícola
  const handleReceitaChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const updated = [...receitasAgricolas];
    const item = { ...updated[rowIndex] };

    if (key.startsWith("prod_ano_")) {
      const anoNum = parseInt(key.replace("prod_ano_", ""), 10);
      const prods = [...(item.produtividadeAnos || [])];
      const numVal = parseFloat(String(value)) || 0;
      while (prods.length <= anoNum) {
        prods.push(0);
      }
      prods[anoNum] = numVal;
      item.produtividadeAnos = prods;
    } else {
      (item as Record<string, unknown>)[key] = value;
    }

    updated[rowIndex] = item;
    onChange({ receitasAgricolas: updated });
  };

  // Atualização de Atividade Econômica
  const handleAtividadeEconomicaChange = (index: number, val: string) => {
    const updated = [...atividadesEconomicas];
    updated[index] = val;
    onChange({ atividadesEconomicas: updated });
  };

  // Replicar valores do Ano 1 para os demais anos no uso da terra
  const replicarUsoTerraParaAnos = (isAgricola: boolean) => {
    const target = isAgricola ? [...usoTerrasAgricola] : [...usoTerrasPecuaria];
    const updated = target.map((item) => {
      const ano1 = item.anos?.find((a) => a.ano === 1);
      const baseArea = ano1 ? ano1.area : item.atualArea || 0;
      const baseUa = ano1 ? ano1.uaHa : item.atualUaHa || 0;
      const anos = Array.from({ length: 30 }, (_, i) => ({
        ano: i + 1,
        area: baseArea,
        uaHa: baseUa,
      }));
      return { ...item, anos };
    });

    if (isAgricola) {
      onChange({ usoTerrasAgricola: updated });
    } else {
      onChange({ usoTerrasPecuaria: updated });
    }
  };

  // Replicar produtividade do Ano 1 para os demais anos nas receitas
  const replicarProdutividadeReceitas = () => {
    const updated = receitasAgricolas.map((item) => {
      const prod1 = item.produtividadeAnos?.[1] ?? item.produtividadeAnos?.[0] ?? 0;
      const prods = Array.from({ length: 31 }, (_, i) => (i === 0 ? item.produtividadeAnos?.[0] ?? prod1 : prod1));
      return { ...item, produtividadeAnos: prods };
    });
    onChange({ receitasAgricolas: updated });
  };

  // ── Colunas para Grade de Uso da Terra (VirtualGrid) ────────────────
  const buildColumnsUsoTerra = (
    baseRowNumber: number
  ): VirtualGridColumn<UsoTerraAgricolaItem>[] => {
    const cols: VirtualGridColumn<UsoTerraAgricolaItem>[] = [
      {
        key: "linha",
        header: "Linha",
        width: 70,
        minWidth: 60,
        render: (_, index) => (
          <span className="text-[11px] font-bold text-muted-foreground font-mono">
            #{baseRowNumber + index}
          </span>
        ),
      },
      {
        key: "descricao",
        header: "Descrição da Atividade (D)",
        width: 250,
        minWidth: 200,
        render: (row, index, onRowChange) => {
          // As últimas 5 linhas (38-42 e 74-78) usam lista_ANALISADOR_DESC_ATIVIDADE na planilha
          const isDropdownRow = index >= 30;
          return isDropdownRow ? (
            <SearchableSelect
              options={descAtividadeOptions}
              value={row.descricao}
              onChange={(val) => onRowChange(val)}
              placeholder="Selecione atividade..."
              className="h-8 text-xs bg-background/50"
            />
          ) : (
            <Input
              value={row.descricao || ""}
              placeholder="Ex: Milho, Pastagem..."
              maxLength={50}
              onChange={(e) => onRowChange(e.target.value)}
              className="h-8 text-xs bg-background/50"
            />
          );
        },
      },
      {
        key: "atualArea",
        header: "Área Atual (ha)",
        width: 120,
        minWidth: 100,
        render: (row, _, onRowChange) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.atualArea ?? ""}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right bg-background/50"
          />
        ),
      },
      {
        key: "atualUaHa",
        header: "UA/ha Atual",
        width: 110,
        minWidth: 90,
        render: (row, _, onRowChange) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.atualUaHa ?? ""}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right bg-background/50"
          />
        ),
      },
    ];

    // Colunas de projeção dos Anos 1 a 10
    ANOS_EXIBIDOS.forEach((ano) => {
      cols.push({
        key: `ano_area_${ano}`,
        header: `Ano ${ano} (ha)`,
        width: 105,
        minWidth: 95,
        render: (row, _, onRowChange) => {
          const val = row.anos?.find((a) => a.ano === ano)?.area ?? "";
          return (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={val}
              placeholder="0.00"
              onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs text-right bg-background/50"
            />
          );
        },
      });

      cols.push({
        key: `ano_ua_${ano}`,
        header: `Ano ${ano} (UA)`,
        width: 105,
        minWidth: 95,
        render: (row, _, onRowChange) => {
          const val = row.anos?.find((a) => a.ano === ano)?.uaHa ?? "";
          return (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={val}
              placeholder="0.00"
              onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs text-right bg-background/50"
            />
          );
        },
      });
    });

    // Coluna consolidadora 'Até Ano 30' (ano 30 da projeção de longo prazo)
    cols.push({
      key: "ano_area_30",
      header: "Até Ano 30 (ha)",
      width: 120,
      minWidth: 110,
      render: (row, _, onRowChange) => {
        const val = row.anos?.find((a) => a.ano === 30)?.area ?? "";
        return (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={val}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right font-medium text-primary bg-primary/5"
          />
        );
      },
    });

    cols.push({
      key: "ano_ua_30",
      header: "Até Ano 30 (UA)",
      width: 120,
      minWidth: 110,
      render: (row, _, onRowChange) => {
        const val = row.anos?.find((a) => a.ano === 30)?.uaHa ?? "";
        return (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={val}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right font-medium text-primary bg-primary/5"
          />
        );
      },
    });

    return cols;
  };

  const columnsUsoAgricola = React.useMemo(() => buildColumnsUsoTerra(8), [
    descAtividadeOptions,
  ]);
  const columnsUsoPecuaria = React.useMemo(() => buildColumnsUsoTerra(44), [
    descAtividadeOptions,
  ]);

  // ── Colunas para Receitas Agrícolas (VirtualGrid) ─────────────────────
  const columnsReceitas: VirtualGridColumn<ReceitaAgricolaItem>[] = React.useMemo(() => {
    const cols: VirtualGridColumn<ReceitaAgricolaItem>[] = [
      {
        key: "linha",
        header: "Linha",
        width: 70,
        minWidth: 60,
        render: (_, index) => (
          <span className="text-[11px] font-bold text-muted-foreground font-mono">
            #{85 + index}
          </span>
        ),
      },
      {
        key: "descricao",
        header: "Produto / Cultura",
        width: 220,
        minWidth: 180,
        render: (row, _, onRowChange) => (
          <Input
            value={row.descricao || ""}
            placeholder="Ex: Milho Verde, Feijão..."
            maxLength={40}
            onChange={(e) => onRowChange(e.target.value)}
            className="h-8 text-xs bg-background/50"
          />
        ),
      },
      {
        key: "irrigacao",
        header: "Irrigação (E)",
        width: 140,
        minWidth: 130,
        render: (row, _, onRowChange) => (
          <Select
            value={row.irrigacao || "Não Irrigada"}
            onValueChange={(val) => onRowChange(val)}
          >
            <SelectTrigger className="h-8 text-xs bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Não Irrigada" className="text-xs">
                Não Irrigada
              </SelectItem>
              <SelectItem value="Irrigada" className="text-xs">
                Irrigada
              </SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "unidade",
        header: "Unidade (G)",
        width: 160,
        minWidth: 140,
        render: (row, _, onRowChange) => (
          <SearchableSelect
            options={unidadeOptions}
            value={row.unidade}
            onChange={(val) => onRowChange(val)}
            placeholder="Unid..."
            className="h-8 text-xs bg-background/50"
          />
        ),
      },
      {
        key: "valorUnitario",
        header: "Vr. Unitário R$ (I)",
        width: 130,
        minWidth: 110,
        render: (row, _, onRowChange) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.valorUnitario ?? ""}
            placeholder="R$ 0,00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right bg-background/50"
          />
        ),
      },
      {
        key: "prod_ano_0",
        header: "Prod. Ano 0",
        width: 110,
        minWidth: 95,
        render: (row, _, onRowChange) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.produtividadeAnos?.[0] ?? ""}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right bg-background/50"
          />
        ),
      },
    ];

    // Produtividades Anos 1 a 10
    ANOS_EXIBIDOS.forEach((ano) => {
      cols.push({
        key: `prod_ano_${ano}`,
        header: `Prod. Ano ${ano}`,
        width: 110,
        minWidth: 95,
        render: (row, _, onRowChange) => (
          <Input
            type="number"
            min={0}
            step="0.01"
            value={row.produtividadeAnos?.[ano] ?? ""}
            placeholder="0.00"
            onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
            className="h-8 text-xs text-right bg-background/50"
          />
        ),
      });
    });

    // Até Ano 30
    cols.push({
      key: "prod_ano_30",
      header: "Prod. Até Ano 30",
      width: 130,
      minWidth: 115,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.produtividadeAnos?.[30] ?? ""}
          placeholder="0.00"
          onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right font-medium text-emerald-500 bg-emerald-500/5"
        />
      ),
    });

    return cols;
  }, [unidadeOptions]);

  // Colunas para Atividades Econômicas
  interface AtivEconRow {
    linha: number;
    codigoAtividade: string;
  }
  const rowsAtividadesEconomicas: AtivEconRow[] = React.useMemo(() => {
    return atividadesEconomicas.map((codigo, idx) => ({
      linha: 166 + idx,
      codigoAtividade: codigo,
    }));
  }, [atividadesEconomicas]);

  const columnsAtividadesEconomicas: VirtualGridColumn<AtivEconRow>[] = [
    {
      key: "linha",
      header: "Linha Excel",
      width: 110,
      minWidth: 90,
      render: (row) => (
        <span className="text-xs font-bold text-muted-foreground font-mono">
          Linha {row.linha}
        </span>
      ),
    },
    {
      key: "codigoAtividade",
      header: "Atividade Econômica (E:J - visaoATIV)",
      width: 550,
      minWidth: 350,
      render: (row, index) => (
        <SearchableSelect
          options={atividadeOptions}
          value={row.codigoAtividade}
          onChange={(val) => handleAtividadeEconomicaChange(index, val)}
          placeholder="Selecione ou busque a atividade econômica..."
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Tabs Principais da Aba Atividade Agrícola ─────────────────── */}
      <Tabs defaultValue="uso-terras" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="bg-card/40 border border-border/40 rounded-2xl p-1 gap-1">
            <TabsTrigger
              value="uso-terras"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trees className="w-4 h-4" />
              <span>Uso das Terras</span>
            </TabsTrigger>
            <TabsTrigger
              value="receitas"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <DollarSign className="w-4 h-4" />
              <span>Receitas Agrícolas</span>
            </TabsTrigger>
            <TabsTrigger
              value="custos"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calculator className="w-4 h-4" />
              <span>Custos Agrícolas</span>
            </TabsTrigger>
            <TabsTrigger
              value="atividades"
              className="rounded-xl gap-2 text-xs font-bold px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="w-4 h-4" />
              <span>Atividades Econômicas</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs px-2.5 py-1"
            >
              VirtualGrid Ativo (~5.860 Células)
            </Badge>
          </div>
        </div>

        {/* ── 1. USO ATUAL E PROJETADO DAS TERRAS ──────────────────────── */}
        <TabsContent value="uso-terras" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Trees className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Uso Atual e Projetado das Terras
                    </CardTitle>
                    <CardDescription>
                      Planejamento de ocupação do solo e lotação pecuária (Área em hectares e UA/ha) para o ano atual e projeção até 30 anos.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-xl gap-1.5 border-border/60 hover:bg-muted/40"
                    onClick={() =>
                      replicarUsoTerraParaAnos(subTabUsoTerra === "agricola")
                    }
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replicar Ano 1 p/ Demais Anos
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Sub-tabs para alternar entre Exploração Agrícola e Pecuária */}
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/30 pb-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={subTabUsoTerra === "agricola" ? "default" : "outline"}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                    onClick={() => setSubTabUsoTerra("agricola")}
                  >
                    <Wheat className="w-3.5 h-3.5" />
                    Exploração Agrícola (Linhas 8 a 42)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={subTabUsoTerra === "pecuaria" ? "default" : "outline"}
                    className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                    onClick={() => setSubTabUsoTerra("pecuaria")}
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    Exploração Pecuária (Linhas 44 a 78)
                  </Button>
                </div>

                {/* Resumo rápido de totais da sub-aba */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="text-muted-foreground mr-1.5">Área Atual Total:</span>
                    <strong className="text-foreground font-semibold">
                      {(subTabUsoTerra === "agricola"
                        ? totaisUsoAgricola.areaAtual
                        : totaisUsoPecuaria.areaAtual
                      ).toFixed(2)}{" "}
                      ha
                    </strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30">
                    <span className="text-muted-foreground mr-1.5">Lotação UA Total:</span>
                    <strong className="text-emerald-500 font-semibold">
                      {(subTabUsoTerra === "agricola"
                        ? totaisUsoAgricola.uaAtual
                        : totaisUsoPecuaria.uaAtual
                      ).toFixed(2)}{" "}
                      UA
                    </strong>
                  </div>
                </div>
              </div>

              {/* Grade Virtualizada correspondente */}
              {subTabUsoTerra === "agricola" ? (
                <div>
                  <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>35 Linhas de Exploração Agrícola • Projeção Anos 1 a 10 e Até Ano 30</span>
                    <span className="text-[11px] font-mono text-muted-foreground/80">Linhas Excel 8..42</span>
                  </div>
                  <VirtualGrid
                    rows={usoTerrasAgricola}
                    columns={columnsUsoAgricola}
                    rowHeight={46}
                    maxHeight={520}
                    onRowChange={handleUsoAgricolaChange}
                    className="border-border/40 bg-card/20"
                  />
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>35 Linhas de Exploração Pecuária • Projeção Anos 1 a 10 e Até Ano 30</span>
                    <span className="text-[11px] font-mono text-muted-foreground/80">Linhas Excel 44..78</span>
                  </div>
                  <VirtualGrid
                    rows={usoTerrasPecuaria}
                    columns={columnsUsoPecuaria}
                    rowHeight={46}
                    maxHeight={520}
                    onRowChange={handleUsoPecuariaChange}
                    className="border-border/40 bg-card/20"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. RECEITAS AGRÍCOLAS ───────────────────────────────────── */}
        <TabsContent value="receitas" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Receitas Agrícolas (Linhas 85 a 119)
                    </CardTitle>
                    <CardDescription>
                      Cadastro de culturas, sistema de irrigação, unidades de medida, valor unitário de venda e evolução da produtividade.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-xl gap-1.5 border-border/60 hover:bg-muted/40"
                  onClick={replicarProdutividadeReceitas}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Replicar Produtividade p/ Demais Anos
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>35 Linhas de Receitas Agrícolas • Produtividade Anos 0 a 10 e Até Ano 30</span>
                <span className="text-[11px] font-mono text-muted-foreground/80">Linhas Excel 85..119</span>
              </div>
              <VirtualGrid
                rows={receitasAgricolas}
                columns={columnsReceitas}
                rowHeight={46}
                maxHeight={520}
                onRowChange={handleReceitaChange}
                className="border-border/40 bg-card/20"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. CUSTOS AGRÍCOLAS ─────────────────────────────────────── */}
        <TabsContent value="custos" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight">
                    Custos Agrícolas (Linhas 121..)
                  </CardTitle>
                  <CardDescription>
                    Parâmetros para apuração e estimação dos coeficientes técnicos e custos operacionais da produção agrícola.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Checkbox / Switch para "Utiliza Custo Padrão?" */}
              <div className="p-5 rounded-2xl bg-background/50 border border-border/40 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="custo-padrao" className="text-sm font-bold">
                      Utiliza Custo Padrão? (Linha 121)
                    </Label>
                    <Badge
                      variant={
                        data.utilizaCustoPadrao === "Sim" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {data.utilizaCustoPadrao === "Sim" ? "Ativado (Sim)" : "Desativado (Não)"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    Ao ativar o Custo Padrão, o sistema do PRONAF A2 utiliza os coeficientes e despesas pré-definidas na tabela técnica de referência do BNB para as atividades selecionadas.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">Não</span>
                  <Switch
                    id="custo-padrao"
                    checked={data.utilizaCustoPadrao === "Sim"}
                    onCheckedChange={(checked) =>
                      onChange({ utilizaCustoPadrao: checked ? "Sim" : "Não" })
                    }
                  />
                  <span className="text-xs font-semibold text-primary">Sim</span>
                </div>
              </div>

              {/* Informação Técnica e Normativa */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5 text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    Regra Operacional da Matriz de Custos PRONAF A2:
                  </p>
                  <p>
                    Quando configurado como <strong>"Sim"</strong>, os custos por hectare de preparo de solo, insumos, adubação e tratos culturais são parametrizados automaticamente com base na base oficial de dados do Banco do Nordeste.
                  </p>
                  <p>
                    Se configurado como <strong>"Não"</strong>, os custos individuais detalhados serão alimentados nas seções orçamentárias específicas do projeto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 4. ATIVIDADES ECONÔMICAS ─────────────────────────────────── */}
        <TabsContent value="atividades" className="space-y-6 m-0">
          <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Atividades Econômicas (Linhas 166 a 200)
                    </CardTitle>
                    <CardDescription>
                      Mapeamento das 35 atividades econômicas homologadas vinculadas ao empreendimento (Lista oficial <code>visaoATIV</code>).
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs rounded-xl gap-1.5 border-border/60 hover:bg-muted/40"
                  onClick={() => onChange({ atividadesEconomicas: Array.from({ length: 35 }, () => "") })}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Limpar Seleções
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between">
                <span>35 Linhas de Classificação de Atividade Econômica</span>
                <span className="text-[11px] font-mono text-muted-foreground/80">Linhas Excel 166..200</span>
              </div>
              <VirtualGrid
                rows={rowsAtividadesEconomicas}
                columns={columnsAtividadesEconomicas}
                rowHeight={46}
                maxHeight={520}
                onRowChange={(rowIndex, _, val) =>
                  handleAtividadeEconomicaChange(rowIndex, String(val))
                }
                className="border-border/40 bg-card/20"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabAtivAgricola;
