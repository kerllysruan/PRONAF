import * as React from "react";
import {
  CronogramaData,
  CronogramaInversaoParcela,
  AplicacaoRecursosItem,
  FinalidadeRecursoItem,
} from "../types";
import { VirtualGrid, VirtualGridColumn } from "./VirtualGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  AlertTriangle,
  Coins,
  CheckCircle2,
  BookmarkCheck,
  FolderTree,
  Building2,
} from "lucide-react";

export interface TabCronogramaProps {
  data: CronogramaData;
  onChange: (data: Partial<CronogramaData>) => void;
}

export const TabCronograma: React.FC<TabCronogramaProps> = ({ data, onChange }) => {
  const [secaoInferiorTab, setSecaoInferiorTab] = React.useState<string>("aplicacao");

  // Garante que o array de inversões esteja preenchido (até 41 inversões)
  const inversoes = React.useMemo(() => {
    if (data.inversoesParcelas && data.inversoesParcelas.length > 0) {
      return data.inversoesParcelas;
    }
    return Array.from({ length: 41 }, (_, i) => ({
      inversaoNum: i + 1,
      parcelas: Array.from({ length: 8 }, (_, p) => ({
        numero: p + 1,
        mesAno: "",
        percentual: 0,
      })),
    }));
  }, [data.inversoesParcelas]);

  // Atualiza uma parcela de uma inversão
  const handleParcelaChange = (
    inversaoIdx: number,
    parcelaIdx: number,
    field: "mesAno" | "percentual",
    value: string | number
  ) => {
    const updatedInversoes = [...inversoes];
    const currentInversao = { ...updatedInversoes[inversaoIdx] };
    const currentParcelas = [...currentInversao.parcelas];

    currentParcelas[parcelaIdx] = {
      ...currentParcelas[parcelaIdx],
      [field]: value,
    };

    currentInversao.parcelas = currentParcelas;
    updatedInversoes[inversaoIdx] = currentInversao;

    onChange({ inversoesParcelas: updatedInversoes });
  };

  // Atualiza linha de Aplicação dos Recursos (linhas 202-240)
  const handleAplicacaoRowChange = (
    rowIndex: number,
    field: keyof AplicacaoRecursosItem,
    value: unknown
  ) => {
    const list = [...(data.aplicacaoRecursos || [])];
    list[rowIndex] = {
      ...list[rowIndex],
      [field]: value,
    };
    onChange({ aplicacaoRecursos: list });
  };

  // Atualiza linha de Finalidade dos Recursos (linhas 243-281)
  const handleFinalidadeRowChange = (
    rowIndex: number,
    field: keyof FinalidadeRecursoItem,
    value: unknown
  ) => {
    const list = [...(data.finalidadesRecursos || [])];
    list[rowIndex] = {
      ...list[rowIndex],
      [field]: value,
    };
    onChange({ finalidadesRecursos: list });
  };

  // Colunas da grade de inversões (VirtualGrid)
  const columnsInversoes: VirtualGridColumn<CronogramaInversaoParcela>[] = [
    {
      key: "inversaoNum",
      header: "Inv. Nº",
      width: 75,
      minWidth: 70,
      render: (row) => (
        <div className="flex flex-col items-center justify-center w-full">
          <span className="text-xs font-bold text-foreground">#{row.inversaoNum}</span>
        </div>
      ),
    },
    {
      key: "totalPercent",
      header: "Total %",
      width: 85,
      minWidth: 80,
      render: (row) => {
        const total = (row.parcelas || []).reduce(
          (acc, p) => acc + (Number(p.percentual) || 0),
          0
        );
        const isOk = Math.abs(total - 100) < 0.01;
        const isOver = total > 100;
        return (
          <div className="flex flex-col items-center justify-center w-full">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isOk
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : isOver
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : total > 0
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-muted-foreground"
              }`}
            >
              {total.toFixed(0)}%
            </span>
          </div>
        );
      },
    },
    // Colunas para as 8 parcelas
    ...Array.from({ length: 8 }, (_, pIdx) => ({
      key: `parc_${pIdx + 1}`,
      header: `Parc. ${pIdx + 1} (Data | %)`,
      width: 145,
      minWidth: 135,
      render: (row: CronogramaInversaoParcela, rowIndex: number) => {
        const parc = row.parcelas?.[pIdx] || { numero: pIdx + 1, mesAno: "", percentual: 0 };
        return (
          <div className="flex items-center gap-1 w-full">
            <Input
              type="text"
              placeholder="mm/aaaa"
              maxLength={7}
              value={parc.mesAno || ""}
              onChange={(e) =>
                handleParcelaChange(rowIndex, pIdx, "mesAno", e.target.value)
              }
              className="h-7 text-[11px] px-1.5 w-16 bg-background/50 font-mono text-center"
            />
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="%"
                value={parc.percentual || ""}
                onChange={(e) =>
                  handleParcelaChange(
                    rowIndex,
                    pIdx,
                    "percentual",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="h-7 text-[11px] px-1 text-right bg-background/50 font-mono"
              />
            </div>
          </div>
        );
      },
    })),
  ];

  // Colunas para Aplicação dos Recursos (linhas 202-240)
  const columnsAplicacao: VirtualGridColumn<AplicacaoRecursosItem>[] = [
    {
      key: "id",
      header: "Item Nº",
      width: 80,
      minWidth: 70,
      render: (row) => (
        <span className="text-xs font-semibold text-muted-foreground px-2">
          Item {row.id}
        </span>
      ),
    },
    {
      key: "valor",
      header: "Valor (F)",
      width: 160,
      minWidth: 130,
      render: (row, rowIndex) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.valor || ""}
          onChange={(e) =>
            handleAplicacaoRowChange(
              rowIndex,
              "valor",
              parseFloat(e.target.value) || 0
            )
          }
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "empreendimento",
      header: "Empreendimento BACEN (J..M)",
      width: 320,
      minWidth: 240,
      render: (row, rowIndex) => (
        <Input
          value={row.empreendimento || ""}
          placeholder="Código ou descrição do empreendimento..."
          onChange={(e) =>
            handleAplicacaoRowChange(rowIndex, "empreendimento", e.target.value)
          }
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
    {
      key: "aplicacaoRecursos",
      header: "Aplicação dos Recursos (P:Q / visaoAPLIC)",
      width: 320,
      minWidth: 240,
      render: (row, rowIndex) => (
        <Input
          value={row.aplicacaoRecursos || ""}
          placeholder="Aplicação dos recursos..."
          onChange={(e) =>
            handleAplicacaoRowChange(rowIndex, "aplicacaoRecursos", e.target.value)
          }
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
  ];

  // Colunas para Finalidade dos Recursos (linhas 243-281)
  const columnsFinalidade: VirtualGridColumn<FinalidadeRecursoItem>[] = [
    {
      key: "id",
      header: "Item Nº",
      width: 80,
      minWidth: 70,
      render: (row) => (
        <span className="text-xs font-semibold text-muted-foreground px-2">
          Item {row.id}
        </span>
      ),
    },
    {
      key: "finalidadeCredito",
      header: "Finalidade do Crédito (G:K / listaFINALIDADE_APL_REC)",
      width: 380,
      minWidth: 260,
      render: (row, rowIndex) => (
        <Input
          value={row.finalidadeCredito || ""}
          placeholder="Finalidade da aplicação..."
          onChange={(e) =>
            handleFinalidadeRowChange(rowIndex, "finalidadeCredito", e.target.value)
          }
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
    {
      key: "codigoMda",
      header: "Código MDA (L ≤ 10)",
      width: 170,
      minWidth: 130,
      render: (row, rowIndex) => (
        <Input
          maxLength={10}
          value={row.codigoMda || ""}
          placeholder="Até 10 dígitos"
          onChange={(e) =>
            handleFinalidadeRowChange(rowIndex, "codigoMda", e.target.value)
          }
          className="h-8 text-xs bg-background/50 uppercase"
        />
      ),
    },
    {
      key: "cfiBndes",
      header: "CFI do BNDES (M:N ≤ 10)",
      width: 180,
      minWidth: 140,
      render: (row, rowIndex) => (
        <Input
          maxLength={10}
          value={row.cfiBndes || ""}
          placeholder="Código BNDES"
          onChange={(e) =>
            handleFinalidadeRowChange(rowIndex, "cfiBndes", e.target.value)
          }
          className="h-8 text-xs bg-background/50 uppercase"
        />
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* AVISO OBRIGATÓRIO DE CRÍTICA DAS DATAS */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 backdrop-blur-xl shadow-premium">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-amber-500 tracking-tight">
            Atenção às Regras de Validação do Cronograma:
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Datas devem ser crescentes e ≥ data prevista do contrato. A soma dos percentuais
            liberados para cada item de investimento deve totalizar 100% ao término das parcelas previstas.
          </p>
        </div>
      </div>

      {/* 1. GRADE DE PARCELAS POR INVERSÃO */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Cronograma de Liberação das Parcelas (Linhas 15 a 127)
                </CardTitle>
                <CardDescription>
                  Definição de datas (Mês/Ano) e percentuais (0% a 100%) para até 8 parcelas por investimento.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Total de Inversões:</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {inversoes.length} itens
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VirtualGrid<CronogramaInversaoParcela>
            rows={inversoes}
            columns={columnsInversoes}
            rowHeight={52}
            maxHeight={460}
            onRowChange={() => {}}
            emptyMessage="Nenhum item de inversão disponível."
          />
        </CardContent>
      </Card>

      {/* 2. SEÇÃO INFERIOR: APLICAÇÃO DOS RECURSOS E FINALIDADE DO CRÉDITO */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Classificação e Destinação dos Recursos
                </CardTitle>
                <CardDescription>
                  Enquadramento nos empreendimentos BACEN, aplicações e códigos de rastreabilidade (MDA / BNDES).
                </CardDescription>
              </div>
            </div>

            <Tabs value={secaoInferiorTab} onValueChange={setSecaoInferiorTab}>
              <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/40">
                <TabsTrigger
                  value="aplicacao"
                  className="rounded-xl px-4 py-1.5 text-xs font-semibold gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" /> Aplicação dos Recursos (202-240)
                </TabsTrigger>
                <TabsTrigger
                  value="finalidade"
                  className="rounded-xl px-4 py-1.5 text-xs font-semibold gap-1.5"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" /> Finalidade e MDA/BNDES (243-281)
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {secaoInferiorTab === "aplicacao" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Aplicação dos Recursos e Empreendimentos BACEN (39 itens)</span>
                <span>
                  Total Alocado:{" "}
                  {(data.aplicacaoRecursos || [])
                    .reduce((acc, r) => acc + (Number(r.valor) || 0), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <VirtualGrid<AplicacaoRecursosItem>
                rows={data.aplicacaoRecursos || []}
                columns={columnsAplicacao}
                rowHeight={46}
                maxHeight={360}
                onRowChange={() => {}}
                emptyMessage="Nenhuma aplicação de recursos configurada."
              />
            </div>
          )}

          {secaoInferiorTab === "finalidade" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Finalidade do Crédito, Códigos MDA e BNDES (39 itens)</span>
              </div>
              <VirtualGrid<FinalidadeRecursoItem>
                rows={data.finalidadesRecursos || []}
                columns={columnsFinalidade}
                rowHeight={46}
                maxHeight={360}
                onRowChange={() => {}}
                emptyMessage="Nenhuma finalidade configurada."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabCronograma;
