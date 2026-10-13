import * as React from "react";
import {
  AvaliacaoData,
  ImovelVinculado,
  ImovelAvaliacaoDetalhe,
  ItemExploracaoTerra,
  BenfeitoriaAvaliada,
  InformacoesAdicionaisImovel,
  SemoventeItem,
} from "../types";
import { VirtualGrid, VirtualGridColumn } from "./VirtualGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Layers,
  Wrench,
  Truck,
  Armchair,
  FileCheck2,
  Scale,
  Sparkles,
  Info,
} from "lucide-react";

export interface TabAvaliacaoProps {
  data: AvaliacaoData;
  onChange: (data: Partial<AvaliacaoData>) => void;
}

const ESTADOS_CONSERVACAO = ["Ótimo", "Bom", "Regular", "Ruim", "Péssimo"];

const SEMOVENTES_DEFAULT: Array<{
  especie: SemoventeItem["especie"];
  categoria: string;
}> = [
  // Bovino Leite
  { especie: "Bovino Leite", categoria: "Touro" },
  { especie: "Bovino Leite", categoria: "Vacas" },
  { especie: "Bovino Leite", categoria: "Novilhas" },
  { especie: "Bovino Leite", categoria: "Novilhos" },
  { especie: "Bovino Leite", categoria: "Garrotas" },
  { especie: "Bovino Leite", categoria: "Garrotes" },
  { especie: "Bovino Leite", categoria: "Bezerras" },
  { especie: "Bovino Leite", categoria: "Bezerros" },
  // Bovino Corte
  { especie: "Bovino Corte", categoria: "Touro" },
  { especie: "Bovino Corte", categoria: "Vacas" },
  { especie: "Bovino Corte", categoria: "Novilhas" },
  { especie: "Bovino Corte", categoria: "Novilhos" },
  { especie: "Bovino Corte", categoria: "Garrotas" },
  { especie: "Bovino Corte", categoria: "Garrotes" },
  { especie: "Bovino Corte", categoria: "Bezerras" },
  { especie: "Bovino Corte", categoria: "Bezerros" },
  // Ovinos
  { especie: "Ovino", categoria: "Reprodutor" },
  { especie: "Ovino", categoria: "Matrizes" },
  { especie: "Ovino", categoria: "Fêmeas 1 a 2 anos" },
  { especie: "Ovino", categoria: "Machos 1 a 2 anos" },
  { especie: "Ovino", categoria: "Fêmeas 0 a 1 ano" },
  { especie: "Ovino", categoria: "Machos 0 a 1 ano" },
  // Caprinos
  { especie: "Caprino", categoria: "Reprodutor" },
  { especie: "Caprino", categoria: "Matrizes" },
  { especie: "Caprino", categoria: "Fêmeas 1 a 2 anos" },
  { especie: "Caprino", categoria: "Machos 1 a 2 anos" },
  { especie: "Caprino", categoria: "Fêmeas 0 a 1 ano" },
  { especie: "Caprino", categoria: "Machos 0 a 1 ano" },
  // Outros
  { especie: "Outros", categoria: "Outros animais / semoventes" },
];

export const TabAvaliacao: React.FC<TabAvaliacaoProps> = ({ data, onChange }) => {
  const [selectedImovelIndex, setSelectedImovelIndex] = React.useState<number>(0);
  const [bensComunsTab, setBensComunsTab] = React.useState<string>("maquinas");

  // Garante que o array de semoventes esteja inicializado
  const semoventesList = React.useMemo(() => {
    if (data.semoventes && data.semoventes.length > 0) {
      return data.semoventes;
    }
    return SEMOVENTES_DEFAULT.map((item) => ({
      especie: item.especie,
      categoria: item.categoria,
      quantidadeCabecas: 0,
      racaMesticagem: "",
      valorUnitario: 0,
      valorTotal: 0,
    }));
  }, [data.semoventes]);

  // Atualiza um imóvel vinculado do cabeçalho
  const handleImovelHeaderChange = (
    index: number,
    field: keyof ImovelVinculado,
    value: unknown
  ) => {
    const updatedImoveis = [...data.imoveis];
    updatedImoveis[index] = {
      ...updatedImoveis[index],
      [field]: value,
    };
    onChange({ imoveis: updatedImoveis });
  };

  // Atualiza detalhes do imóvel (Terra / Benfeitorias)
  const handleDetalheImovelChange = (
    imovelIdx: number,
    field: keyof ImovelAvaliacaoDetalhe,
    value: unknown
  ) => {
    const updatedDetalhes = [...data.detalhesImoveis];
    updatedDetalhes[imovelIdx] = {
      ...updatedDetalhes[imovelIdx],
      [field]: value,
    };
    onChange({ detalhesImoveis: updatedDetalhes });
  };

  // Atualiza exploração agrícola do imóvel selecionado
  const handleAgricolaRowChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const currentDetalhes = data.detalhesImoveis[selectedImovelIndex];
    const updatedAgricola = [...currentDetalhes.exploracaoAgricola];
    updatedAgricola[rowIndex] = {
      ...updatedAgricola[rowIndex],
      [key]: value,
    };
    handleDetalheImovelChange(selectedImovelIndex, "exploracaoAgricola", updatedAgricola);
  };

  // Atualiza exploração pecuária do imóvel selecionado
  const handlePecuariaRowChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const currentDetalhes = data.detalhesImoveis[selectedImovelIndex];
    const updatedPecuaria = [...currentDetalhes.exploracaoPecuaria];
    updatedPecuaria[rowIndex] = {
      ...updatedPecuaria[rowIndex],
      [key]: value,
    };
    handleDetalheImovelChange(selectedImovelIndex, "exploracaoPecuaria", updatedPecuaria);
  };

  // Atualiza benfeitorias do imóvel selecionado
  const handleBenfeitoriasRowChange = (
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const currentDetalhes = data.detalhesImoveis[selectedImovelIndex];
    const updatedBenfeitorias = [...currentDetalhes.benfeitorias];
    const updatedRow = {
      ...updatedBenfeitorias[rowIndex],
      [key]: value,
    };

    // Auto-cálculo do Valor Avaliado: Valor de Reposição * (1 - Depreciação / 100)
    if (key === "valorReposicao" || key === "depreciacaoPercent") {
      const vr = Number(key === "valorReposicao" ? value : updatedRow.valorReposicao) || 0;
      const dep = Number(key === "depreciacaoPercent" ? value : updatedRow.depreciacaoPercent) || 0;
      updatedRow.valorAvaliado = Math.max(0, vr * (1 - dep / 100));
    }

    updatedBenfeitorias[rowIndex] = updatedRow;
    handleDetalheImovelChange(selectedImovelIndex, "benfeitorias", updatedBenfeitorias);
  };

  // Atualiza Bens Comuns (Máquinas, Veículos, Móveis)
  const handleBensComunsRowChange = (
    tipo: "maquinasEquipamentos" | "veiculosEmbarcacoes" | "moveisUtensilios",
    rowIndex: number,
    key: string,
    value: unknown
  ) => {
    const list = [...data[tipo]];
    const updatedRow = {
      ...list[rowIndex],
      [key]: value,
    };

    if (key === "valorReposicao" || key === "depreciacaoPercent") {
      const vr = Number(key === "valorReposicao" ? value : updatedRow.valorReposicao) || 0;
      const dep = Number(key === "depreciacaoPercent" ? value : updatedRow.depreciacaoPercent) || 0;
      updatedRow.valorAvaliado = Math.max(0, vr * (1 - dep / 100));
    }

    list[rowIndex] = updatedRow;
    onChange({ [tipo]: list });
  };

  // Atualiza Semovente
  const handleSemoventeChange = (
    rowIndex: number,
    field: keyof SemoventeItem,
    value: unknown
  ) => {
    const updated = [...semoventesList];
    const row = { ...updated[rowIndex], [field]: value };
    if (field === "quantidadeCabecas" || field === "valorUnitario") {
      const qtd = Number(field === "quantidadeCabecas" ? value : row.quantidadeCabecas) || 0;
      const vu = Number(field === "valorUnitario" ? value : row.valorUnitario) || 0;
      row.valorTotal = qtd * vu;
    }
    updated[rowIndex] = row;
    onChange({ semoventes: updated });
  };

  // Atualiza Informações Adicionais do Imóvel
  const handleInfoAdicionalChange = (
    imovelIdx: number,
    field: keyof InformacoesAdicionaisImovel,
    value: unknown
  ) => {
    const updated = [...data.informacoesAdicionais];
    updated[imovelIdx] = {
      ...updated[imovelIdx],
      [field]: value,
    };
    onChange({ informacoesAdicionais: updated });
  };

  // Colunas para Exploração Agrícola / Pecuária (Terra)
  const columnsExploracao: VirtualGridColumn<ItemExploracaoTerra>[] = [
    {
      key: "descricao",
      header: "Descrição da Atividade",
      width: 320,
      minWidth: 240,
      render: (row, _, onRowChange) => (
        <Input
          value={row.descricao || ""}
          placeholder="Ex.: Mandioca, Milho, Pastagem..."
          onChange={(e) => onRowChange(e.target.value)}
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
    {
      key: "areaHa",
      header: "Área (ha)",
      width: 140,
      minWidth: 100,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.areaHa || ""}
          onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "idadeMeses",
      header: "Idade (Meses)",
      width: 130,
      minWidth: 90,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          value={row.idadeMeses || ""}
          onChange={(e) => onRowChange(parseInt(e.target.value, 10) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "valorUnitario",
      header: "Valor Unit. (R$)",
      width: 160,
      minWidth: 120,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.valorUnitario || ""}
          onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "valorTotal",
      header: "Valor Total (R$)",
      width: 160,
      minWidth: 120,
      render: (row) => {
        const total = (row.areaHa || 0) * (row.valorUnitario || 0);
        return (
          <span className="text-xs font-semibold px-2 py-1 text-emerald-500">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        );
      },
    },
  ];

  // Colunas para Benfeitorias e Bens Comuns
  const columnsBenfeitorias: VirtualGridColumn<BenfeitoriaAvaliada>[] = [
    {
      key: "descricao",
      header: "Descrição do Bem",
      width: 280,
      minWidth: 200,
      render: (row, _, onRowChange) => (
        <Input
          value={row.descricao || ""}
          placeholder="Descrição detalhada do bem..."
          maxLength={40}
          onChange={(e) => onRowChange(e.target.value)}
          className="h-8 text-xs bg-background/50"
        />
      ),
    },
    {
      key: "idadeAnos",
      header: "Idade (Anos)",
      width: 110,
      minWidth: 80,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          value={row.idadeAnos || ""}
          onChange={(e) => onRowChange(parseInt(e.target.value, 10) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "valorReposicao",
      header: "Valor Reposição (R$)",
      width: 160,
      minWidth: 130,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.valorReposicao || ""}
          onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "estadoConservacao",
      header: "Estado Conserv.",
      width: 150,
      minWidth: 120,
      render: (row, _, onRowChange) => (
        <Select
          value={row.estadoConservacao || ""}
          onValueChange={(val) => onRowChange(val)}
        >
          <SelectTrigger className="h-8 text-xs bg-background/50">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS_CONSERVACAO.map((est) => (
              <SelectItem key={est} value={est} className="text-xs">
                {est}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "depreciacaoPercent",
      header: "Deprec. (%)",
      width: 120,
      minWidth: 90,
      render: (row, _, onRowChange) => (
        <Input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={row.depreciacaoPercent || ""}
          onChange={(e) => onRowChange(parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right bg-background/50"
        />
      ),
    },
    {
      key: "valorAvaliado",
      header: "Valor Avaliado (R$)",
      width: 160,
      minWidth: 130,
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-1 text-emerald-500">
          {(row.valorAvaliado || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      ),
    },
  ];

  const currentDetalhe = data.detalhesImoveis[selectedImovelIndex] || {
    exploracaoAgricola: [],
    exploracaoPecuaria: [],
    reservaFlorestalArea: 0,
    reservaFlorestalValorUnit: 0,
    terrasInaproveitaveisArea: 0,
    terrasInaproveitaveisValorUnit: 0,
    ocupadasBenfeitoriasArea: 0,
    ocupadasBenfeitoriasValorUnit: 0,
    terraNuaArea: 0,
    terraNuaValorUnit: 0,
    benfeitorias: [],
  };

  const currentInfoAdicional = data.informacoesAdicionais[selectedImovelIndex] || {
    nirf: "",
    cei: "",
    sncr: "",
    registroCar: "",
    numeroOutorgaAgua: "",
    percentualPreservacaoAcimaLimite: 0,
    embargosIbama: "Não",
    unidadesConservacao: "Não",
    florestasPublicasNaoDestinadas: "Não",
    bonusCarPercent: 0,
  };

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO: IMÓVEIS VINCULADOS AO PLANO */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Imóveis Vinculados ao Plano (Linhas 7 a 9)
              </CardTitle>
              <CardDescription>
                Identificação dos até 3 imóveis que compõem o plano de negócio e a proposta de crédito.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-border/40">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 text-center font-bold">Nº</TableHead>
                  <TableHead className="min-w-[200px] font-bold">Denominação (D)</TableHead>
                  <TableHead className="min-w-[180px] font-bold">Município (E)</TableHead>
                  <TableHead className="min-w-[140px] font-bold">Tipo Prop. (H)</TableHead>
                  <TableHead className="min-w-[180px] font-bold">Nome Proprietário (I)</TableHead>
                  <TableHead className="min-w-[160px] font-bold">CPF/CNPJ (J)</TableHead>
                  <TableHead className="min-w-[110px] text-right font-bold">Área Legal (ha)</TableHead>
                  <TableHead className="min-w-[120px] text-center font-bold">Realiza Inv.?</TableHead>
                  <TableHead className="min-w-[130px] text-center font-bold">Compõe Gar.?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.imoveis.map((imovel, idx) => (
                  <TableRow key={imovel.id || idx} className="hover:bg-muted/10">
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={imovel.denominacao || ""}
                        maxLength={40}
                        placeholder={`Imóvel ${idx + 1}`}
                        onChange={(e) =>
                          handleImovelHeaderChange(idx, "denominacao", e.target.value)
                        }
                        className="h-8 text-xs bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={imovel.municipio || ""}
                        placeholder="MUNICÍPIO-UF"
                        onChange={(e) =>
                          handleImovelHeaderChange(idx, "municipio", e.target.value)
                        }
                        className="h-8 text-xs bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={imovel.tipoProprietario || ""}
                        onValueChange={(val) =>
                          handleImovelHeaderChange(idx, "tipoProprietario", val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background/50">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P.Física" className="text-xs">
                            P. Física
                          </SelectItem>
                          <SelectItem value="P.Jurídica" className="text-xs">
                            P. Jurídica
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={imovel.nomeProprietario || ""}
                        placeholder="Nome do proprietário"
                        onChange={(e) =>
                          handleImovelHeaderChange(idx, "nomeProprietario", e.target.value)
                        }
                        className="h-8 text-xs bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={imovel.cpfCnpjProprietario || ""}
                        placeholder="CPF ou CNPJ"
                        onChange={(e) =>
                          handleImovelHeaderChange(idx, "cpfCnpjProprietario", e.target.value)
                        }
                        className="h-8 text-xs bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={imovel.areaLegal || ""}
                        onChange={(e) =>
                          handleImovelHeaderChange(
                            idx,
                            "areaLegal",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-xs text-right bg-background/50"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={imovel.realizaInversao || "Não"}
                        onValueChange={(val) =>
                          handleImovelHeaderChange(idx, "realizaInversao", val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background/50 mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sim" className="text-xs">
                            Sim
                          </SelectItem>
                          <SelectItem value="Não" className="text-xs">
                            Não
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select
                        value={imovel.compoeGarantia || "Não"}
                        onValueChange={(val) =>
                          handleImovelHeaderChange(idx, "compoeGarantia", val)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background/50 mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sim" className="text-xs">
                            Sim
                          </SelectItem>
                          <SelectItem value="Não" className="text-xs">
                            Não
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. BLOCO DE AVALIAÇÃO POR IMÓVEL (TABS PARA OS 3 IMÓVEIS) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Avaliação Patrimonial por Imóvel
                </CardTitle>
                <CardDescription>
                  Terras (Exploração Agrícola, Pecuária e Linhas Fixas) e Benfeitorias.
                </CardDescription>
              </div>
            </div>

            {/* Seletor de Imóvel */}
            <Tabs
              value={String(selectedImovelIndex)}
              onValueChange={(val) => setSelectedImovelIndex(Number(val))}
            >
              <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/40">
                <TabsTrigger value="0" className="rounded-xl px-4 py-1.5 text-xs font-semibold">
                  Imóvel 1 {data.imoveis[0]?.denominacao ? `(${data.imoveis[0].denominacao})` : ""}
                </TabsTrigger>
                <TabsTrigger value="1" className="rounded-xl px-4 py-1.5 text-xs font-semibold">
                  Imóvel 2 {data.imoveis[1]?.denominacao ? `(${data.imoveis[1].denominacao})` : ""}
                </TabsTrigger>
                <TabsTrigger value="2" className="rounded-xl px-4 py-1.5 text-xs font-semibold">
                  Imóvel 3 {data.imoveis[2]?.denominacao ? `(${data.imoveis[2].denominacao})` : ""}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* A. Exploração Agrícola (10 linhas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Exploração Agrícola (10 linhas)
              </h4>
              <span className="text-xs text-muted-foreground">
                Total Área:{" "}
                {currentDetalhe.exploracaoAgricola
                  .reduce((acc, r) => acc + (r.areaHa || 0), 0)
                  .toFixed(2)}{" "}
                ha
              </span>
            </div>
            <VirtualGrid<ItemExploracaoTerra>
              rows={currentDetalhe.exploracaoAgricola}
              columns={columnsExploracao}
              maxHeight={280}
              rowHeight={42}
              onRowChange={handleAgricolaRowChange}
              emptyMessage="Nenhuma linha agrícola cadastrada."
            />
          </div>

          {/* B. Exploração Pecuária (10 linhas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Exploração Pecuária (10 linhas)
              </h4>
              <span className="text-xs text-muted-foreground">
                Total Área:{" "}
                {currentDetalhe.exploracaoPecuaria
                  .reduce((acc, r) => acc + (r.areaHa || 0), 0)
                  .toFixed(2)}{" "}
                ha
              </span>
            </div>
            <VirtualGrid<ItemExploracaoTerra>
              rows={currentDetalhe.exploracaoPecuaria}
              columns={columnsExploracao}
              maxHeight={280}
              rowHeight={42}
              onRowChange={handlePecuariaRowChange}
              emptyMessage="Nenhuma linha pecuária cadastrada."
            />
          </div>

          {/* C. Linhas Fixas de Terra do Imóvel */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Linhas Fixas de Terra (Reserva, Inaproveitáveis, Benfeitorias e Terra Nua)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Reserva Florestal */}
              <div className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-2">
                <Label className="text-xs font-semibold">Reserva Florestal</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Área (ha)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.reservaFlorestalArea || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "reservaFlorestalArea",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Vr. Unit (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.reservaFlorestalValorUnit || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "reservaFlorestalValorUnit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Terras Inaproveitáveis */}
              <div className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-2">
                <Label className="text-xs font-semibold">Terras Inaproveitáveis</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Área (ha)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.terrasInaproveitaveisArea || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "terrasInaproveitaveisArea",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Vr. Unit (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.terrasInaproveitaveisValorUnit || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "terrasInaproveitaveisValorUnit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Ocupadas com Benfeitorias */}
              <div className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-2">
                <Label className="text-xs font-semibold">Ocupadas com Benfeitorias</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Área (ha)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.ocupadasBenfeitoriasArea || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "ocupadasBenfeitoriasArea",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Vr. Unit (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.ocupadasBenfeitoriasValorUnit || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "ocupadasBenfeitoriasValorUnit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Terra Nua */}
              <div className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-2">
                <Label className="text-xs font-semibold">Terra Nua</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Área (ha)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.terraNuaArea || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "terraNuaArea",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Vr. Unit (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentDetalhe.terraNuaValorUnit || ""}
                      onChange={(e) =>
                        handleDetalheImovelChange(
                          selectedImovelIndex,
                          "terraNuaValorUnit",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 text-xs text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D. Benfeitorias Quantificadas (20 linhas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Benfeitorias do Imóvel {selectedImovelIndex + 1} (20 linhas)
              </h4>
              <span className="text-xs text-muted-foreground">
                Total Avaliado:{" "}
                {currentDetalhe.benfeitorias
                  .reduce((acc, r) => acc + (r.valorAvaliado || 0), 0)
                  .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <VirtualGrid<BenfeitoriaAvaliada>
              rows={currentDetalhe.benfeitorias}
              columns={columnsBenfeitorias}
              maxHeight={320}
              rowHeight={42}
              onRowChange={handleBenfeitoriasRowChange}
              emptyMessage="Nenhuma benfeitoria cadastrada."
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. BENS COMUNS AO PLANO */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Bens Comuns ao Plano
                </CardTitle>
                <CardDescription>
                  Máquinas e Equipamentos (10), Veículos e Embarcações (10), Móveis e Utensílios (10).
                </CardDescription>
              </div>
            </div>

            <Tabs value={bensComunsTab} onValueChange={setBensComunsTab}>
              <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/40">
                <TabsTrigger value="maquinas" className="rounded-xl px-4 py-1.5 text-xs font-semibold gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> Máquinas
                </TabsTrigger>
                <TabsTrigger value="veiculos" className="rounded-xl px-4 py-1.5 text-xs font-semibold gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Veículos
                </TabsTrigger>
                <TabsTrigger value="moveis" className="rounded-xl px-4 py-1.5 text-xs font-semibold gap-1.5">
                  <Armchair className="w-3.5 h-3.5" /> Móveis
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {bensComunsTab === "maquinas" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <span>Máquinas e Equipamentos (10 linhas)</span>
                <span>
                  Total:{" "}
                  {data.maquinasEquipamentos
                    .reduce((acc, r) => acc + (r.valorAvaliado || 0), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <VirtualGrid<BenfeitoriaAvaliada>
                rows={data.maquinasEquipamentos}
                columns={columnsBenfeitorias}
                maxHeight={280}
                rowHeight={42}
                onRowChange={(idx, key, val) =>
                  handleBensComunsRowChange("maquinasEquipamentos", idx, key, val)
                }
              />
            </div>
          )}

          {bensComunsTab === "veiculos" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <span>Veículos e Embarcações (10 linhas)</span>
                <span>
                  Total:{" "}
                  {data.veiculosEmbarcacoes
                    .reduce((acc, r) => acc + (r.valorAvaliado || 0), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <VirtualGrid<BenfeitoriaAvaliada>
                rows={data.veiculosEmbarcacoes}
                columns={columnsBenfeitorias}
                maxHeight={280}
                rowHeight={42}
                onRowChange={(idx, key, val) =>
                  handleBensComunsRowChange("veiculosEmbarcacoes", idx, key, val)
                }
              />
            </div>
          )}

          {bensComunsTab === "moveis" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                <span>Móveis e Utensílios (10 linhas)</span>
                <span>
                  Total:{" "}
                  {data.moveisUtensilios
                    .reduce((acc, r) => acc + (r.valorAvaliado || 0), 0)
                    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <VirtualGrid<BenfeitoriaAvaliada>
                rows={data.moveisUtensilios}
                columns={columnsBenfeitorias}
                maxHeight={280}
                rowHeight={42}
                onRowChange={(idx, key, val) =>
                  handleBensComunsRowChange("moveisUtensilios", idx, key, val)
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SEMOVENTES (LINHAS 242-290) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Semoventes (Linhas 242 a 290)
                </CardTitle>
                <CardDescription>
                  Rebanho existente: Bovinos (Leite e Corte), Ovinos, Caprinos e outros animais.
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Valor Total do Rebanho</span>
              <p className="text-lg font-bold text-emerald-500">
                {semoventesList
                  .reduce((acc, r) => acc + (r.valorTotal || 0), 0)
                  .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border border-border/40 max-h-[420px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[140px] font-bold">Espécie</TableHead>
                  <TableHead className="min-w-[180px] font-bold">Categoria do Animal</TableHead>
                  <TableHead className="min-w-[120px] text-right font-bold">Quant. Cabeças</TableHead>
                  <TableHead className="min-w-[180px] font-bold">Raça / Mestiçagem</TableHead>
                  <TableHead className="min-w-[140px] text-right font-bold">Valor Unit. (R$)</TableHead>
                  <TableHead className="min-w-[150px] text-right font-bold">Valor Total (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {semoventesList.map((item, idx) => (
                  <TableRow key={`${item.especie}-${item.categoria}-${idx}`} className="hover:bg-muted/10">
                    <TableCell className="font-semibold text-xs text-muted-foreground">
                      {item.especie}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {item.categoria}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantidadeCabecas || ""}
                        onChange={(e) =>
                          handleSemoventeChange(
                            idx,
                            "quantidadeCabecas",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="h-8 text-xs text-right bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.racaMesticagem || ""}
                        placeholder="Ex.: Girolando, Nelore, SRD..."
                        onChange={(e) =>
                          handleSemoventeChange(idx, "racaMesticagem", e.target.value)
                        }
                        className="h-8 text-xs bg-background/50"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.valorUnitario || ""}
                        onChange={(e) =>
                          handleSemoventeChange(
                            idx,
                            "valorUnitario",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="h-8 text-xs text-right bg-background/50"
                      />
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-emerald-500">
                      {(item.valorTotal || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. INFORMAÇÕES ADICIONAIS DOS IMÓVEIS (LINHAS 294-305) */}
      <Card className="bg-card/40 backdrop-blur-xl rounded-3xl border border-border/50 shadow-premium">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Informações Adicionais dos Imóveis (Linhas 294 a 305)
              </CardTitle>
              <CardDescription>
                Registros ambientais, cadastrais e condicionantes do imóvel {selectedImovelIndex + 1}.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">NIRF (Alfanumérico 8 posições)</Label>
              <Input
                value={currentInfoAdicional.nirf || ""}
                maxLength={8}
                placeholder="Ex.: 12345678"
                onChange={(e) =>
                  handleInfoAdicionalChange(selectedImovelIndex, "nirf", e.target.value)
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">CEI (12 dígitos)</Label>
              <Input
                value={currentInfoAdicional.cei || ""}
                maxLength={12}
                placeholder="Ex.: 123456789012"
                onChange={(e) =>
                  handleInfoAdicionalChange(selectedImovelIndex, "cei", e.target.value)
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">SNCR (13 dígitos)</Label>
              <Input
                value={currentInfoAdicional.sncr || ""}
                maxLength={13}
                placeholder="Ex.: 1234567890123"
                onChange={(e) =>
                  handleInfoAdicionalChange(selectedImovelIndex, "sncr", e.target.value)
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Registro CAR (Recibo do CAR)</Label>
              <Input
                value={currentInfoAdicional.registroCar || ""}
                maxLength={45}
                placeholder="Ex.: BA-2900000-XXXXXXXXXXXXXXXX"
                onChange={(e) =>
                  handleInfoAdicionalChange(selectedImovelIndex, "registroCar", e.target.value)
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Número de Outorga de Água</Label>
              <Input
                value={currentInfoAdicional.numeroOutorgaAgua || ""}
                placeholder="Portaria ou nº da outorga"
                onChange={(e) =>
                  handleInfoAdicionalChange(
                    selectedImovelIndex,
                    "numeroOutorgaAgua",
                    e.target.value
                  )
                }
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">% Preservação Acima do Limite Legal</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={currentInfoAdicional.percentualPreservacaoAcimaLimite || ""}
                onChange={(e) =>
                  handleInfoAdicionalChange(
                    selectedImovelIndex,
                    "percentualPreservacaoAcimaLimite",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="bg-background/50 text-right"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Complemento Imóvel Catálogo 5.08
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Embargos do IBAMA</Label>
                <Select
                  value={currentInfoAdicional.embargosIbama || "Não"}
                  onValueChange={(val) =>
                    handleInfoAdicionalChange(selectedImovelIndex, "embargosIbama", val)
                  }
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Unidades de Conservação</Label>
                <Select
                  value={currentInfoAdicional.unidadesConservacao || "Não"}
                  onValueChange={(val) =>
                    handleInfoAdicionalChange(selectedImovelIndex, "unidadesConservacao", val)
                  }
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Florestas Públicas Não Destinadas</Label>
                <Select
                  value={currentInfoAdicional.florestasPublicasNaoDestinadas || "Não"}
                  onValueChange={(val) =>
                    handleInfoAdicionalChange(
                      selectedImovelIndex,
                      "florestasPublicasNaoDestinadas",
                      val
                    )
                  }
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Bônus-CAR (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={currentInfoAdicional.bonusCarPercent || ""}
                  onChange={(e) =>
                    handleInfoAdicionalChange(
                      selectedImovelIndex,
                      "bonusCarPercent",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="bg-background/50 text-right"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabAvaliacao;
