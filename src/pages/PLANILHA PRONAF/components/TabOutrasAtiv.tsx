import * as React from "react";
import { OutrasAtividadesData, OutraReceitaItem } from "../types";
import { useReferenceTables } from "../useReferenceTables";
import { SearchableSelect, SelectOption } from "./SearchableSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Receipt,
  Briefcase,
  Trash2,
  Zap,
  Fuel,
  UserCheck,
  HeartHandshake,
  Wrench,
  FileText,
  DollarSign,
} from "lucide-react";

export interface TabOutrasAtivProps {
  data: OutrasAtividadesData;
  onChange: (data: Partial<OutrasAtividadesData>) => void;
}

const SETORES_FALLBACK: SelectOption[] = [
  { value: "Agropecuário", label: "Agropecuário" },
  { value: "Agroindustrial", label: "Agroindustrial" },
  { value: "Comercial", label: "Comercial" },
  { value: "Serviços", label: "Serviços" },
  { value: "Artesanal", label: "Artesanal" },
  { value: "Turismo Rural", label: "Turismo Rural" },
  { value: "Outros", label: "Outros" },
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export const TabOutrasAtiv: React.FC<TabOutrasAtivProps> = ({ data, onChange }) => {
  const { getList, loaded } = useReferenceTables();
  const [activeYearsRange, setActiveYearsRange] = React.useState<"1-5" | "6-10">("1-5");

  // Opções das listas de referência com fallback
  const ativRebClasOptions = React.useMemo(() => {
    const list = getList("visaoATIV_REB_CLAS");
    return list.map((item) => ({ value: item.description, label: item.description }));
  }, [getList, loaded]);

  const setativOptions = React.useMemo(() => {
    const list = getList("visaoSETATIV");
    if (list.length > 0) {
      return list.map((item) => ({ value: item.description, label: item.description }));
    }
    return SETORES_FALLBACK;
  }, [getList, loaded]);

  const ativEconomicaOptions = React.useMemo(() => {
    const list = getList("visaoATIV");
    return list.map((item) => ({ value: item.description, label: item.description }));
  }, [getList, loaded]);

  // Garante as 10 linhas de receitas anuais (linhas 15-24)
  const receitasAnuais = React.useMemo(() => {
    const list = data.receitasAnuais || [];
    if (list.length >= 10) return list;
    return Array.from({ length: 10 }, (_, i) => {
      const existing = list[i];
      return (
        existing || {
          id: i + 1,
          descricao: "",
          setorAtividade: "",
          atual: 0,
          anos: Array.from({ length: 10 }, () => 0),
        }
      );
    });
  }, [data.receitasAnuais]);

  // Atualizador de Receita Anual
  const handleUpdateReceita = <K extends keyof OutraReceitaItem>(
    index: number,
    field: K,
    val: OutraReceitaItem[K]
  ) => {
    const updated = [...receitasAnuais];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange({ receitasAnuais: updated });
  };

  // Atualizador do ano específico no array anos
  const handleUpdateAnoReceita = (
    itemIndex: number,
    yearIndex: number, // 0-based
    val: number
  ) => {
    const updated = [...receitasAnuais];
    const curAnos = [...(updated[itemIndex].anos || [])];
    while (curAnos.length <= yearIndex) {
      curAnos.push(0);
    }
    curAnos[yearIndex] = val;
    updated[itemIndex] = {
      ...updated[itemIndex],
      anos: curAnos,
    };
    onChange({ receitasAnuais: updated });
  };

  // Limpa uma linha de receita
  const handleClearReceita = (index: number) => {
    const updated = [...receitasAnuais];
    updated[index] = {
      id: index + 1,
      descricao: "",
      setorAtividade: "",
      atual: 0,
      anos: Array.from({ length: 10 }, () => 0),
    };
    onChange({ receitasAnuais: updated });
  };

  // Garante 10 atividades econômicas (linhas 93-102)
  const atividadesEconomicas = React.useMemo(() => {
    const list = data.atividadesEconomicas || [];
    if (list.length >= 10) return list;
    return Array.from({ length: 10 }, (_, i) => list[i] || "");
  }, [data.atividadesEconomicas]);

  const handleUpdateAtividadeEconomica = (index: number, val: string) => {
    const updated = [...atividadesEconomicas];
    updated[index] = val;
    onChange({ atividadesEconomicas: updated });
  };

  // Índices dos anos em exibição
  const anosIndices = activeYearsRange === "1-5" ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];

  // Totais das Receitas por Coluna
  const totalAtualReceitas = React.useMemo(() => {
    return receitasAnuais.reduce((sum, item) => sum + (item.atual || 0), 0);
  }, [receitasAnuais]);

  const totaisAnos = React.useMemo(() => {
    return anosIndices.map((yIdx) => {
      return receitasAnuais.reduce((sum, item) => {
        const val = item.anos?.[yIdx] || 0;
        return sum + val;
      }, 0);
    });
  }, [receitasAnuais, anosIndices]);

  // Total das Despesas Diversas Anuais (F77:F82)
  const totalDespesasDiversas = React.useMemo(() => {
    const energia = data.energiaEletrica || 0;
    const comb = data.combustiveisLubrificantes || 0;
    const admin = data.administrador || 0;
    const subsist = data.subsistenciaFamilia || 0;
    const conserv = data.outrasDespesas1 || 0;
    const impostos = data.outrasDespesas2 || 0;
    return energia + comb + admin + subsist + conserv + impostos;
  }, [
    data.energiaEletrica,
    data.combustiveisLubrificantes,
    data.administrador,
    data.subsistenciaFamilia,
    data.outrasDespesas1,
    data.outrasDespesas2,
  ]);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* 1. RECEITAS ANUAIS (Linhas 15-24) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  1. Receitas Anuais de Outras Atividades
                </CardTitle>
                <CardDescription>
                  Linhas 15 a 24 da planilha — Outras explorações agropecuárias, agroindústrias e serviços
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Projeção:</span>
              <div className="flex rounded-xl bg-muted/40 p-1 border border-border/50">
                <Button
                  type="button"
                  variant={activeYearsRange === "1-5" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveYearsRange("1-5")}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Anos 1 a 5
                </Button>
                <Button
                  type="button"
                  variant={activeYearsRange === "6-10" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveYearsRange("6-10")}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Anos 6 a 10
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="min-w-[220px] text-xs">Descrição da Atividade (D)</TableHead>
                  <TableHead className="w-36 text-xs">Setor (E)</TableHead>
                  <TableHead className="w-28 text-xs text-right">Atual (R$)</TableHead>
                  {anosIndices.map((yIdx) => (
                    <TableHead key={yIdx} className="w-24 text-xs text-right">
                      Ano {yIdx + 1}
                    </TableHead>
                  ))}
                  <TableHead className="w-10 text-center text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitasAnuais.map((item, index) => (
                  <TableRow key={item.id ?? index} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {item.id ?? index + 1}
                    </TableCell>

                    {/* Descrição (D15:D24 - visaoATIV_REB_CLAS) */}
                    <TableCell className="p-2">
                      <SearchableSelect
                        options={ativRebClasOptions}
                        value={item.descricao || ""}
                        onChange={(val) =>
                          handleUpdateReceita(index, "descricao", val)
                        }
                        placeholder="Selecione ou busque a atividade..."
                        searchPlaceholder="Buscar atividade..."
                        className="h-8 text-xs rounded-lg"
                      />
                    </TableCell>

                    {/* Setor (E15:E24 - visaoSETATIV) */}
                    <TableCell className="p-2">
                      <SearchableSelect
                        options={setativOptions}
                        value={item.setorAtividade || ""}
                        onChange={(val) =>
                          handleUpdateReceita(index, "setorAtividade", val)
                        }
                        placeholder="Setor..."
                        className="h-8 text-xs rounded-lg"
                      />
                    </TableCell>

                    {/* Valor Atual */}
                    <TableCell className="p-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.atual ?? 0}
                        onChange={(e) =>
                          handleUpdateReceita(
                            index,
                            "atual",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 rounded-lg text-xs bg-background/50 text-right"
                      />
                    </TableCell>

                    {/* Projeção por Ano */}
                    {anosIndices.map((yIdx) => (
                      <TableCell key={yIdx} className="p-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.anos?.[yIdx] ?? 0}
                          onChange={(e) =>
                            handleUpdateAnoReceita(
                              index,
                              yIdx,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-8 rounded-lg text-xs bg-background/50 text-right"
                        />
                      </TableCell>
                    ))}

                    {/* Ação Limpar */}
                    <TableCell className="text-center p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClearReceita(index)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg"
                        title="Limpar linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Linha de Totais */}
                <TableRow className="bg-muted/40 font-semibold border-t-2 border-border/60">
                  <TableCell colSpan={3} className="text-right text-xs pr-4">
                    Totais de Receitas:
                  </TableCell>
                  <TableCell className="text-right text-xs text-foreground p-2">
                    {formatBRL(totalAtualReceitas)}
                  </TableCell>
                  {totaisAnos.map((tot, idx) => (
                    <TableCell
                      key={idx}
                      className="text-right text-xs text-emerald-600 dark:text-emerald-400 p-2"
                    >
                      {formatBRL(tot)}
                    </TableCell>
                  ))}
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. RECEITAS EXTRA-RURAIS E 3. DESPESAS DIVERSAS/ANO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Receitas Extra-rurais (F70) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">
                  2. Receitas Extra-rurais
                </CardTitle>
                <CardDescription>
                  Linha 70 (F70) — Salários, aposentadorias ou outras rendas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
              <Label htmlFor="receitasExtraRurais" className="text-xs font-medium text-muted-foreground">
                Receitas Extra-rurais Anuais (R$)
              </Label>
              <Input
                id="receitasExtraRurais"
                type="number"
                min={0}
                step="0.01"
                value={data.receitasExtraRurais ?? 0}
                onChange={(e) =>
                  onChange({
                    receitasExtraRurais: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-10 rounded-xl text-sm bg-background/50 text-right font-medium"
              />
              <span className="text-[11px] text-muted-foreground block pt-1">
                Representação formatada: {formatBRL(data.receitasExtraRurais || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Diversas Anuais (F77:F82) */}
        <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    3. Despesas Diversas por Ano
                  </CardTitle>
                  <CardDescription>
                    Linhas 77 a 82 da planilha — Gastos operacionais gerais e manutenção familiar
                  </CardDescription>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                  Total Anual
                </span>
                <span className="text-sm font-bold text-rose-500">
                  {formatBRL(totalDespesasDiversas)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Energia Elétrica (F77) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Energia Elétrica (F77)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.energiaEletrica ?? 0}
                  onChange={(e) =>
                    onChange({
                      energiaEletrica: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              {/* Combustíveis (F78) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Fuel className="w-3.5 h-3.5 text-blue-500" />
                  Combustíveis e Lubrif. (F78)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.combustiveisLubrificantes ?? 0}
                  onChange={(e) =>
                    onChange({
                      combustiveisLubrificantes: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              {/* Administrador (F79) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                  Administrador (F79)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.administrador ?? 0}
                  onChange={(e) =>
                    onChange({
                      administrador: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              {/* Subsistência da Família (F80) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                  Subsistência Familiar (F80)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.subsistenciaFamilia ?? 0}
                  onChange={(e) =>
                    onChange({
                      subsistenciaFamilia: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              {/* Conservação / Outras 1 (F81) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  Conservação / Outras 1 (F81)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.outrasDespesas1 ?? 0}
                  onChange={(e) =>
                    onChange({
                      outrasDespesas1: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>

              {/* Impostos / Outras 2 (F82) */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FileText className="w-3.5 h-3.5 text-teal-500" />
                  Impostos / Outras 2 (F82)
                </div>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={data.outrasDespesas2 ?? 0}
                  onChange={(e) =>
                    onChange({
                      outrasDespesas2: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-9 rounded-xl text-xs bg-background/50 text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. ATIVIDADES ECONÔMICAS (Linhas 93-102) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-tight">
                4. Atividades Econômicas Vinculadas
              </CardTitle>
              <CardDescription>
                Linhas 93 a 102 (Coluna E) — Classificação oficial de atividades conforme tabela de visão do Banco
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {atividadesEconomicas.map((ativ, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/40"
              >
                <span className="w-7 h-7 shrink-0 rounded-xl bg-background/50 border border-border/40 flex items-center justify-center text-xs font-mono font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <SearchableSelect
                    options={ativEconomicaOptions}
                    value={ativ || ""}
                    onChange={(val) => handleUpdateAtividadeEconomica(idx, val)}
                    placeholder={`Selecione a atividade ${idx + 1}...`}
                    searchPlaceholder="Buscar atividade econômica..."
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                {ativ && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUpdateAtividadeEconomica(idx, "")}
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabOutrasAtiv;
