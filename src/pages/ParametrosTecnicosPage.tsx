import React, { useState, useMemo, useRef } from "react";
import {
  Sliders,
  Upload,
  Download,
  RotateCcw,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Database,
  Building,
  TrendingUp,
  MapPin,
  Layers,
  Sprout,
  Save,
  X,
} from "lucide-react";
import {
  useParametrosTecnicos,
  RegraCatalogoConfig,
  VmicUfValores,
  PrecosVendaUfValores,
  SuporteForrageiroMun,
  MunicipioClassifItem,
} from "@/pages/PLANILHA PRONAF/parametrosStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ITEMS_POR_PAGINA = 25;

export default function ParametrosTecnicosPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    parametros,
    salvarRegra,
    excluirRegra,
    salvarVmicUf,
    excluirVmicUf,
    salvarPrecosVendaUf,
    excluirPrecosVendaUf,
    salvarSuporteForrageiro,
    excluirSuporteForrageiro,
    salvarClassificacaoMunicipio,
    excluirClassificacaoMunicipio,
    restaurarPadroes,
    exportarJson,
    importarJson,
  } = useParametrosTecnicos();

  // Estados de navegação e filtros
  const [activeTab, setActiveTab] = useState("regras");
  const [buscaRegras, setBuscaRegras] = useState("");
  const [buscaVmic, setBuscaVmic] = useState("");
  const [buscaPrecos, setBuscaPrecos] = useState("");
  const [buscaForragem, setBuscaForragem] = useState("");
  const [buscaMunicipios, setBuscaMunicipios] = useState("");

  // Paginação
  const [pagForragem, setPagForragem] = useState(1);
  const [pagMunicipios, setPagMunicipios] = useState(1);

  // Modais de Criação / Edição
  const [modalRegraAberta, setModalRegraAberta] = useState(false);
  const [regraEmEdicao, setRegraEmEdicao] = useState<RegraCatalogoConfig | null>(null);

  const [modalVmicAberta, setModalVmicAberta] = useState(false);
  const [vmicEmEdicao, setVmicEmEdicao] = useState<{ uf: string; valores: VmicUfValores } | null>(null);

  const [modalPrecoAberta, setModalPrecoAberta] = useState(false);
  const [precoEmEdicao, setPrecoEmEdicao] = useState<{ uf: string; valores: PrecosVendaUfValores } | null>(null);

  const [modalForragemAberta, setModalForragemAberta] = useState(false);
  const [forragemEmEdicao, setForragemEmEdicao] = useState<SuporteForrageiroMun | null>(null);

  const [modalClassifAberta, setModalClassifAberta] = useState(false);
  const [classifEmEdicao, setClassifEmEdicao] = useState<MunicipioClassifItem | null>(null);

  // Modal de Confirmação de Restauração
  const [alertRestaurarAberto, setAlertRestaurarAberto] = useState(false);

  // Modal de Confirmação de Exclusão Genérica
  const [itemParaExcluir, setItemParaExcluir] = useState<{
    tipo: "regra" | "vmic" | "preco" | "forragem" | "classif";
    id: string;
    nome: string;
  } | null>(null);

  // ----------------------------------------------------
  // HANDLERS DE UPLOAD E DOWNLOAD
  // ----------------------------------------------------
  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        importarJson(conteudo);
        toast({
          title: "Parâmetros importados com sucesso!",
          description: "A base de regras, tetos e índices técnicos foi atualizada.",
        });
      } catch (err: unknown) {
        toast({
          title: "Erro ao importar arquivo",
          description: err instanceof Error ? err.message : "Arquivo JSON corrompido ou incompatível.",
          variant: "destructive",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleRestaurarPadroes = () => {
    restaurarPadroes();
    setAlertRestaurarAberto(false);
    toast({
      title: "Padrões BNB Restaurados",
      description: "Todos os parâmetros técnicos retornaram aos valores normativos oficiais.",
    });
  };

  const confirmarExclusao = () => {
    if (!itemParaExcluir) return;

    if (itemParaExcluir.tipo === "regra") {
      excluirRegra(itemParaExcluir.id);
    } else if (itemParaExcluir.tipo === "vmic") {
      excluirVmicUf(itemParaExcluir.id);
    } else if (itemParaExcluir.tipo === "preco") {
      excluirPrecosVendaUf(itemParaExcluir.id);
    } else if (itemParaExcluir.tipo === "forragem") {
      excluirSuporteForrageiro(itemParaExcluir.id);
    } else if (itemParaExcluir.tipo === "classif") {
      excluirClassificacaoMunicipio(itemParaExcluir.id);
    }

    toast({
      title: "Parâmetro Excluído",
      description: `${itemParaExcluir.nome} foi removido com sucesso.`,
    });
    setItemParaExcluir(null);
  };

  // ----------------------------------------------------
  // LISTAS FILTRADAS E MEMOIZADAS
  // ----------------------------------------------------
  const regrasFiltradas = useMemo(() => {
    const q = buscaRegras.toLowerCase().trim();
    if (!q) return parametros.regrasCatalogo;
    return parametros.regrasCatalogo.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.regra.toLowerCase().includes(q) ||
        r.comoResolver.toLowerCase().includes(q)
    );
  }, [parametros.regrasCatalogo, buscaRegras]);

  const vmicLista = useMemo(() => {
    const q = buscaVmic.toUpperCase().trim();
    const entries = Object.entries(parametros.vmicTetosPorUf || {});
    if (!q) return entries;
    return entries.filter(([uf]) => uf.includes(q));
  }, [parametros.vmicTetosPorUf, buscaVmic]);

  const precosLista = useMemo(() => {
    const q = buscaPrecos.toUpperCase().trim();
    const entries = Object.entries(parametros.precosReferenciaVendaModelo || {});
    if (!q) return entries;
    return entries.filter(([uf]) => uf.includes(q));
  }, [parametros.precosReferenciaVendaModelo, buscaPrecos]);

  const forragemEntries = useMemo(() => {
    return Object.entries(parametros.suporteForrageiroMunicipios || {});
  }, [parametros.suporteForrageiroMunicipios]);

  const forragemFiltrada = useMemo(() => {
    const q = buscaForragem.toLowerCase().trim();
    if (!q) return forragemEntries;
    return forragemEntries.filter(([, item]) => {
      return (
        item.municipio.toLowerCase().includes(q) ||
        item.uf.toLowerCase().includes(q)
      );
    });
  }, [forragemEntries, buscaForragem]);

  const forragemPaginada = useMemo(() => {
    const start = (pagForragem - 1) * ITEMS_POR_PAGINA;
    return forragemFiltrada.slice(start, start + ITEMS_POR_PAGINA);
  }, [forragemFiltrada, pagForragem]);

  const totalPagForragem = Math.ceil(forragemFiltrada.length / ITEMS_POR_PAGINA) || 1;

  const municipiosEntries = useMemo(() => {
    return Object.entries(parametros.municipiosClassificacao || {});
  }, [parametros.municipiosClassificacao]);

  const municipiosFiltrados = useMemo(() => {
    const q = buscaMunicipios.toLowerCase().trim();
    if (!q) return municipiosEntries;
    return municipiosEntries.filter(([, item]) => {
      return (
        item.municipio.toLowerCase().includes(q) ||
        (item.uf && item.uf.toLowerCase().includes(q)) ||
        (item.agencia && item.agencia.toLowerCase().includes(q))
      );
    });
  }, [municipiosEntries, buscaMunicipios]);

  const municipiosPaginados = useMemo(() => {
    const start = (pagMunicipios - 1) * ITEMS_POR_PAGINA;
    return municipiosFiltrados.slice(start, start + ITEMS_POR_PAGINA);
  }, [municipiosFiltrados, pagMunicipios]);

  const totalPagMunicipios = Math.ceil(municipiosFiltrados.length / ITEMS_POR_PAGINA) || 1;

  // ----------------------------------------------------
  // HELPERS DE FORMATAÇÃO E STATUS
  // ----------------------------------------------------
  const renderBadgeStatus = (status: string) => {
    switch (status) {
      case "BLOQUEIA":
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 flex items-center gap-1 font-semibold">
            <XCircle className="w-3 h-3 text-red-500" /> Bloqueante
          </Badge>
        );
      case "ALERTA":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Alerta
          </Badge>
        );
      case "OK":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Em Conformidade
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> {status}
          </Badge>
        );
    }
  };

  const formatarMoeda = (val?: number) => {
    if (val === undefined || isNaN(val)) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Input invisível para upload de JSON */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadJson}
        accept=".json"
        className="hidden"
      />

      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-r from-card via-card/80 to-card/60 p-6 md:p-8 backdrop-blur-xl shadow-premium">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner border border-primary/20">
                <Sliders className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                  Parâmetros Técnicos & Normativos BNB
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Configuração, calibração e manutenção das regras de crítica técnica do PRONAF A2
                </p>
              </div>
            </div>
          </div>

          {/* AÇÕES DE CABEÇALHO */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-border/60 hover:border-primary/50 gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4 text-primary" />
              <span>Subir Parâmetros (JSON)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportarJson}
              className="rounded-xl border-border/60 hover:border-primary/50 gap-2 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-500" />
              <span>Exportar (JSON)</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlertRestaurarAberto(true)}
              className="rounded-xl text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restaurar Padrões BNB</span>
            </Button>
          </div>
        </div>

        {/* CARDS DE RESUMO KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/40">
          <div className="rounded-2xl bg-card/60 border border-border/40 p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Regras de Conformidade</span>
              <Database className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-foreground">{parametros.regrasCatalogo.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">R01 a R27 mapeadas e calibradas</p>
          </div>

          <div className="rounded-2xl bg-card/60 border border-border/40 p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Tetos VMIC (F5)</span>
              <Building className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground">{Object.keys(parametros.vmicTetosPorUf || {}).length} UFs</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tetos de matrizes e reprodutores</p>
          </div>

          <div className="rounded-2xl bg-card/60 border border-border/40 p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Suporte Forrageiro (F4)</span>
              <Sprout className="h-4 w-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-foreground">{forragemEntries.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Municípios com UA/ha calibrados</p>
          </div>

          <div className="rounded-2xl bg-card/60 border border-border/40 p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Classificação BNB (F1)</span>
              <MapPin className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground">{municipiosEntries.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Agências, semiárido e vocações</p>
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO DE PARÂMETROS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-card/60 border border-border/50 p-1 rounded-2xl h-auto flex flex-wrap gap-1 shadow-sm">
            <TabsTrigger value="regras" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Regras de Conformidade ({regrasFiltradas.length})</span>
            </TabsTrigger>
            <TabsTrigger value="vmic" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <Building className="h-4 w-4" />
              <span>Tetos VMIC por UF ({vmicLista.length})</span>
            </TabsTrigger>
            <TabsTrigger value="precos" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Preços de Venda ({precosLista.length})</span>
            </TabsTrigger>
            <TabsTrigger value="zootecnicos" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <Layers className="h-4 w-4" />
              <span>Índices Zootécnicos (F3)</span>
            </TabsTrigger>
            <TabsTrigger value="forrageiro" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <Sprout className="h-4 w-4" />
              <span>Suporte Forrageiro (F4)</span>
            </TabsTrigger>
            <TabsTrigger value="classificacao" className="rounded-xl px-4 py-2.5 font-semibold text-xs gap-2">
              <MapPin className="h-4 w-4" />
              <span>Classificação BNB (F1)</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ABA 1: REGRAS DE CONFORMIDADE */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="regras" className="space-y-4">
          <Card className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Catálogo de Regras de Conformidade BNB</CardTitle>
                  <CardDescription className="text-xs">
                    Regras R01 a R27 aplicadas automaticamente na análise crítica e geração do PDF técnico
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar regra ou resolução..."
                      value={buscaRegras}
                      onChange={(e) => setBuscaRegras(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background/50 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setRegraEmEdicao({
                        id: `R${String(parametros.regrasCatalogo.length + 1).padStart(2, "0")}`,
                        regra: "",
                        referencia: "",
                        statusDefault: "ALERTA",
                        confianca: "Alta",
                        fonte: "Manual do Crédito BNB",
                        comoResolver: "",
                        ativa: true,
                      });
                      setModalRegraAberta(true);
                    }}
                    className="rounded-xl h-9 gap-1.5 shadow-sm text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nova Regra</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/20">
                      <TableHead className="w-20 text-xs font-bold">Código</TableHead>
                      <TableHead className="text-xs font-bold">Descrição da Regra / Exigência</TableHead>
                      <TableHead className="w-36 text-xs font-bold">Referência / Limite</TableHead>
                      <TableHead className="w-36 text-xs font-bold">Classificação</TableHead>
                      <TableHead className="text-xs font-bold">Instrução de Resolução ("Como Resolver")</TableHead>
                      <TableHead className="w-24 text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regrasFiltradas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                          Nenhuma regra encontrada para a busca informada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      regrasFiltradas.map((r) => (
                        <TableRow key={r.id} className="border-border/30 hover:bg-muted/15 transition-colors">
                          <TableCell className="font-mono font-bold text-xs">
                            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                              {r.id}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium max-w-xs">{r.regra}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {String(r.referencia || "—")}
                          </TableCell>
                          <TableCell>{renderBadgeStatus(r.statusDefault)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-sm">
                            <span className="line-clamp-2" title={r.comoResolver}>
                              {r.comoResolver}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setRegraEmEdicao({ ...r });
                                  setModalRegraAberta(true);
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                                title="Editar Regra"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setItemParaExcluir({
                                    tipo: "regra",
                                    id: r.id,
                                    nome: `Regra ${r.id}: ${r.regra.slice(0, 30)}...`,
                                  });
                                }}
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                title="Excluir Regra"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* ABA 2: TETOS VMIC (F5) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="vmic" className="space-y-4">
          <Card className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Tetos de Investimento VMIC por UF (Tabela F5)</CardTitle>
                  <CardDescription className="text-xs">
                    Valores máximos de aquisição (R$/cabeça) permitidos por estado para matrizes e reprodutores
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="UF..."
                      value={buscaVmic}
                      onChange={(e) => setBuscaVmic(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background/50 text-xs uppercase"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setVmicEmEdicao({
                        uf: "",
                        valores: {
                          matrizMesticaCorte: 3500,
                          reprodutorMesticoAltaMesticagem: 6000,
                          matrizPo: 5000,
                          reprodutorPo: 8000,
                          matrizMesticaLeiteNt1: 4000,
                          matrizMesticaLeiteNt2: 4800,
                          matrizOvinaMestica: 450,
                          reprodutorOvinoPo: 1200,
                          matrizCaprinaMestica: 400,
                          reprodutorCaprinoPo: 1000,
                        },
                      });
                      setModalVmicAberta(true);
                    }}
                    className="rounded-xl h-9 gap-1.5 shadow-sm text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar UF</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/20">
                      <TableHead className="w-16 text-xs font-bold">UF</TableHead>
                      <TableHead className="text-xs font-bold">Matriz Mestiça Corte</TableHead>
                      <TableHead className="text-xs font-bold">Reprodutor Mestiço</TableHead>
                      <TableHead className="text-xs font-bold">Matriz PO</TableHead>
                      <TableHead className="text-xs font-bold">Reprodutor PO</TableHead>
                      <TableHead className="text-xs font-bold">Matriz Leite (NT1)</TableHead>
                      <TableHead className="text-xs font-bold">Matriz Leite (NT2)</TableHead>
                      <TableHead className="text-xs font-bold">Matriz Ovina</TableHead>
                      <TableHead className="text-xs font-bold">Reprodutor Ovino PO</TableHead>
                      <TableHead className="w-20 text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vmicLista.map(([uf, vals]) => (
                      <TableRow key={uf} className="border-border/30 hover:bg-muted/15 transition-colors">
                        <TableCell className="font-bold text-xs">
                          <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                            {uf}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.matrizMesticaCorte)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.reprodutorMesticoAltaMesticagem)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.matrizPo)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.reprodutorPo)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.matrizMesticaLeiteNt1)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.matrizMesticaLeiteNt2)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.matrizOvinaMestica)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.reprodutorOvinoPo)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setVmicEmEdicao({ uf, valores: { ...vals } });
                                setModalVmicAberta(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Editar UF"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemParaExcluir({
                                  tipo: "vmic",
                                  id: uf,
                                  nome: `Teto VMIC do estado ${uf}`,
                                });
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                              title="Excluir UF"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* ABA 3: PREÇOS DE VENDA DE ANIMAIS */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="precos" className="space-y-4">
          <Card className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Preços de Referência de Venda de Animais</CardTitle>
                  <CardDescription className="text-xs">
                    Valores médios normativos por categoria animal utilizados para projeção de receita pecuária
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="UF..."
                      value={buscaPrecos}
                      onChange={(e) => setBuscaPrecos(e.target.value)}
                      className="pl-9 h-9 rounded-xl bg-background/50 text-xs uppercase"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPrecoEmEdicao({
                        uf: "",
                        valores: {
                          novilhoArroba: 280,
                          vacasDescarteCabeca: 2400,
                          novilhasCabeca: 2000,
                          novilhosCabeca: 2200,
                          garrotesCabeca: 1800,
                          bezerrosCabeca: 1400,
                        },
                      });
                      setModalPrecoAberta(true);
                    }}
                    className="rounded-xl h-9 gap-1.5 shadow-sm text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Preço UF</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/20">
                      <TableHead className="w-16 text-xs font-bold">UF</TableHead>
                      <TableHead className="text-xs font-bold">Novilho (@ Arroba)</TableHead>
                      <TableHead className="text-xs font-bold">Vacas Descarte (Cab)</TableHead>
                      <TableHead className="text-xs font-bold">Novilhas (Cab)</TableHead>
                      <TableHead className="text-xs font-bold">Novilhos (Cab)</TableHead>
                      <TableHead className="text-xs font-bold">Garrotes (Cab)</TableHead>
                      <TableHead className="text-xs font-bold">Bezerros (Cab)</TableHead>
                      <TableHead className="w-20 text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {precosLista.map(([uf, vals]) => (
                      <TableRow key={uf} className="border-border/30 hover:bg-muted/15 transition-colors">
                        <TableCell className="font-bold text-xs">
                          <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                            {uf}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.novilhoArroba)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.vacasDescarteCabeca)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.novilhasCabeca)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.novilhosCabeca)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.garrotesCabeca)}</TableCell>
                        <TableCell className="text-xs font-mono">{formatarMoeda(vals.bezerrosCabeca)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPrecoEmEdicao({ uf, valores: { ...vals } });
                                setModalPrecoAberta(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Editar Preços"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemParaExcluir({
                                  tipo: "preco",
                                  id: uf,
                                  nome: `Tabela de preços da UF ${uf}`,
                                });
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                              title="Excluir Preço UF"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* ABA 4: ÍNDICES ZOOTÉCNICOS (F3) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="zootecnicos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(parametros.parametrosZootecnicos || {}).map(([atividade, niveis]) => (
              <Card key={atividade} className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold capitalize">
                      {atividade.replace(/([A-Z])/g, " $1").trim()}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {niveis.length} Níveis Tecnológicos
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Parâmetros zootécnicos normativos calibrados para validação da capacidade produtiva
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {niveis.map((nv, idx) => {
                      const titulo = (nv.nivelTecnologico as string) || `Nível ${idx + 1}`;
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-card/60 border border-border/40 hover:border-primary/30 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-primary">{titulo}</span>
                            {nv.regiao && (
                              <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                                {String(nv.regiao)}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {Object.entries(nv)
                              .filter(([k]) => !["nivelTecnologico", "regiao", "tipo"].includes(k))
                              .map(([k, v]) => (
                                <div key={k} className="p-1.5 rounded-lg bg-background/40">
                                  <div className="text-[10px] text-muted-foreground uppercase truncate" title={k}>
                                    {k.replace(/([A-Z])/g, " $1")}
                                  </div>
                                  <div className="font-mono font-semibold text-xs mt-0.5">
                                    {typeof v === "number" ? v.toLocaleString("pt-BR") : String(v)}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* ABA 5: SUPORTE FORRAGEIRO (F4) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="forrageiro" className="space-y-4">
          <Card className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Capacidade de Suporte Forrageiro (F4)</CardTitle>
                  <CardDescription className="text-xs">
                    Capacidade de suporte (UA/ha) por município para pastagens de sequeiro (Braquiária, Andropogon, Buffel) e irrigadas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por município ou UF..."
                      value={buscaForragem}
                      onChange={(e) => {
                        setBuscaForragem(e.target.value);
                        setPagForragem(1);
                      }}
                      className="pl-9 h-9 rounded-xl bg-background/50 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setForragemEmEdicao({
                        municipio: "",
                        uf: "CE",
                        chuvaMmAno: 650,
                        classeKoppen: "BSh",
                        suporteUaHa: {
                          maximoSequeiroBraquiaria: 0.8,
                          braquiariaSequeiroNt1: 0.5,
                          braquiariaSequeiroNt2: 0.8,
                          irrigadoNt3: 2.5,
                          irrigadoNt4: 3.5,
                        },
                      });
                      setModalForragemAberta(true);
                    }}
                    className="rounded-xl h-9 gap-1.5 shadow-sm text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Município</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/20">
                      <TableHead className="text-xs font-bold">Município</TableHead>
                      <TableHead className="w-16 text-xs font-bold">UF</TableHead>
                      <TableHead className="text-xs font-bold">Chuva (mm/ano)</TableHead>
                      <TableHead className="text-xs font-bold">Köppen</TableHead>
                      <TableHead className="text-xs font-bold">Máx Sequeiro (UA/ha)</TableHead>
                      <TableHead className="text-xs font-bold">Braquiária NT1</TableHead>
                      <TableHead className="text-xs font-bold">Braquiária NT2</TableHead>
                      <TableHead className="text-xs font-bold">Irrigado NT3/NT4</TableHead>
                      <TableHead className="w-20 text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forragemPaginada.map(([chave, item]) => (
                      <TableRow key={chave} className="border-border/30 hover:bg-muted/15 transition-colors">
                        <TableCell className="font-semibold text-xs">{item.municipio}</TableCell>
                        <TableCell className="font-mono text-xs">{item.uf}</TableCell>
                        <TableCell className="text-xs font-mono">{item.chuvaMmAno ? `${item.chuvaMmAno} mm` : "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{item.classeKoppen || "—"}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-primary">
                          {item.suporteUaHa?.maximoSequeiroBraquiaria !== undefined
                            ? `${item.suporteUaHa.maximoSequeiroBraquiaria} UA/ha`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{item.suporteUaHa?.braquiariaSequeiroNt1 ?? "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{item.suporteUaHa?.braquiariaSequeiroNt2 ?? "—"}</TableCell>
                        <TableCell className="text-xs font-mono">
                          {item.suporteUaHa?.irrigadoNt3 ?? "—"} / {item.suporteUaHa?.irrigadoNt4 ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setForragemEmEdicao({ ...item });
                                setModalForragemAberta(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Editar Município"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemParaExcluir({
                                  tipo: "forragem",
                                  id: chave,
                                  nome: `Forragem do município ${item.municipio} - ${item.uf}`,
                                });
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                              title="Excluir Município"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINAÇÃO DE FORRAGEM */}
              <div className="flex items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground">
                <div>
                  Mostrando {(pagForragem - 1) * ITEMS_POR_PAGINA + 1} a{" "}
                  {Math.min(pagForragem * ITEMS_POR_PAGINA, forragemFiltrada.length)} de {forragemFiltrada.length} municípios
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagForragem <= 1}
                    onClick={() => setPagForragem((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-foreground">
                    Página {pagForragem} de {totalPagForragem}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagForragem >= totalPagForragem}
                    onClick={() => setPagForragem((p) => Math.min(totalPagForragem, p + 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------- */}
        {/* ABA 6: CLASSIFICAÇÃO BNB & VOCAÇÕES (F1) */}
        {/* ---------------------------------------------------- */}
        <TabsContent value="classificacao" className="space-y-4">
          <Card className="rounded-3xl border-border/50 bg-card/40 backdrop-blur-xl shadow-premium">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Classificação de Municípios e Vocações BNB (F1)</CardTitle>
                  <CardDescription className="text-xs">
                    Mapeamento de agências jurisdicionadas BNB, enquadramento no Semiárido e vocações produtivas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por município, UF ou agência..."
                      value={buscaMunicipios}
                      onChange={(e) => {
                        setBuscaMunicipios(e.target.value);
                        setPagMunicipios(1);
                      }}
                      className="pl-9 h-9 rounded-xl bg-background/50 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setClassifEmEdicao({
                        municipio: "",
                        uf: "CE",
                        localizacao: "SEMIÁRIDO",
                        agencia: "AGÊNCIA BNB",
                        regiao: "NORDESTE",
                      });
                      setModalClassifAberta(true);
                    }}
                    className="rounded-xl h-9 gap-1.5 shadow-sm text-xs font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Município</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/20">
                      <TableHead className="text-xs font-bold">Município</TableHead>
                      <TableHead className="w-16 text-xs font-bold">UF</TableHead>
                      <TableHead className="text-xs font-bold">Localização</TableHead>
                      <TableHead className="text-xs font-bold">Agência BNB Jurisdicionada</TableHead>
                      <TableHead className="text-xs font-bold">Vocações Produtivas</TableHead>
                      <TableHead className="w-20 text-right text-xs font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {municipiosPaginados.map(([chave, item]) => (
                      <TableRow key={chave} className="border-border/30 hover:bg-muted/15 transition-colors">
                        <TableCell className="font-semibold text-xs">{item.municipio}</TableCell>
                        <TableCell className="font-mono text-xs">{item.uf || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.localizacao === "SEMIÁRIDO" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {item.localizacao}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{item.agencia || "—"}</TableCell>
                        <TableCell className="text-xs">
                          {item.vovacoes ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(item.vovacoes).map(([atv, v]) => (
                                <span
                                  key={atv}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/30"
                                >
                                  {atv.replace("bovinocultura", "Bov.").slice(0, 15)}: {v.vocacao || "Sim"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setClassifEmEdicao({ ...item });
                                setModalClassifAberta(true);
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                              title="Editar Classificação"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemParaExcluir({
                                  tipo: "classif",
                                  id: chave,
                                  nome: `Classificação de ${item.municipio}`,
                                });
                              }}
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                              title="Excluir Classificação"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINAÇÃO DE CLASSIFICAÇÃO */}
              <div className="flex items-center justify-between p-4 border-t border-border/40 text-xs text-muted-foreground">
                <div>
                  Mostrando {(pagMunicipios - 1) * ITEMS_POR_PAGINA + 1} a{" "}
                  {Math.min(pagMunicipios * ITEMS_POR_PAGINA, municipiosFiltrados.length)} de {municipiosFiltrados.length} municípios
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagMunicipios <= 1}
                    onClick={() => setPagMunicipios((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-foreground">
                    Página {pagMunicipios} de {totalPagMunicipios}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagMunicipios >= totalPagMunicipios}
                    onClick={() => setPagMunicipios((p) => Math.min(totalPagMunicipios, p + 1))}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: REGRA DE CONFORMIDADE */}
      {/* ---------------------------------------------------- */}
      <Dialog open={modalRegraAberta} onOpenChange={setModalRegraAberta}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sliders className="h-5 w-5 text-primary" />
              <span>{regraEmEdicao?.id ? `Configurar Regra ${regraEmEdicao.id}` : "Nova Regra Técnica"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina o código, severidade e o texto de "Como Resolver" apresentado na crítica e no relatório PDF.
            </DialogDescription>
          </DialogHeader>

          {regraEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Código da Regra</Label>
                  <Input
                    value={regraEmEdicao.id}
                    onChange={(e) => setRegraEmEdicao({ ...regraEmEdicao, id: e.target.value.toUpperCase() })}
                    placeholder="Ex: R28"
                    className="h-9 font-mono rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severidade</Label>
                  <Select
                    value={regraEmEdicao.statusDefault}
                    onValueChange={(val: "OK" | "ALERTA" | "BLOQUEIA" | "NÃO VERIFICÁVEL") =>
                      setRegraEmEdicao({ ...regraEmEdicao, statusDefault: val })
                    }
                  >
                    <SelectTrigger className="h-9 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BLOQUEIA">Bloqueante (Erro)</SelectItem>
                      <SelectItem value="ALERTA">Alerta (Aviso)</SelectItem>
                      <SelectItem value="OK">Informativo (OK)</SelectItem>
                      <SelectItem value="NÃO VERIFICÁVEL">Não Verificável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Referência / Limite</Label>
                  <Input
                    value={String(regraEmEdicao.referencia)}
                    onChange={(e) => setRegraEmEdicao({ ...regraEmEdicao, referencia: e.target.value })}
                    placeholder="Ex: R$ 40.000"
                    className="h-9 font-mono rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição da Regra / Exigência Normativa</Label>
                <Textarea
                  rows={2}
                  value={regraEmEdicao.regra}
                  onChange={(e) => setRegraEmEdicao({ ...regraEmEdicao, regra: e.target.value })}
                  placeholder="Ex: Valor total do financiamento não pode ultrapassar o teto..."
                  className="rounded-xl resize-none text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fonte Normativa</Label>
                <Input
                  value={regraEmEdicao.fonte}
                  onChange={(e) => setRegraEmEdicao({ ...regraEmEdicao, fonte: e.target.value })}
                  placeholder="Ex: Manual do BNB PRONAF Grupo A / MCR 10"
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-primary">Instruções de Resolução ("Como Resolver")</Label>
                <Textarea
                  rows={4}
                  value={regraEmEdicao.comoResolver}
                  onChange={(e) => setRegraEmEdicao({ ...regraEmEdicao, comoResolver: e.target.value })}
                  placeholder="Texto explicativo para o projetista sobre como ajustar a planilha ou proposta..."
                  className="rounded-xl resize-none text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setModalRegraAberta(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!regraEmEdicao?.id || !regraEmEdicao.regra) {
                  toast({ title: "Preencha o código e descrição da regra", variant: "destructive" });
                  return;
                }
                salvarRegra(regraEmEdicao);
                setModalRegraAberta(false);
                toast({ title: `Regra ${regraEmEdicao.id} salva com sucesso!` });
              }}
              className="rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Regra</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: VMIC POR UF */}
      {/* ---------------------------------------------------- */}
      <Dialog open={modalVmicAberta} onOpenChange={setModalVmicAberta}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Building className="h-5 w-5 text-emerald-500" />
              <span>Configurar Tetos VMIC ({vmicEmEdicao?.uf || "Nova UF"})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure os tetos máximos aceitos pelo BNB para aquisição de animais nessa unidade federativa.
            </DialogDescription>
          </DialogHeader>

          {vmicEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Sigla da UF</Label>
                <Input
                  value={vmicEmEdicao.uf}
                  onChange={(e) => setVmicEmEdicao({ ...vmicEmEdicao, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="Ex: CE, BA, PI, MA"
                  className="h-9 w-24 font-mono font-bold rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">Matriz Mestiça Corte (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.matrizMesticaCorte ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, matrizMesticaCorte: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Reprodutor Mestiço Alta Mestiçagem (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.reprodutorMesticoAltaMesticagem ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, reprodutorMesticoAltaMesticagem: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Matriz PO (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.matrizPo ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, matrizPo: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Reprodutor PO (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.reprodutorPo ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, reprodutorPo: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Matriz Leite NT1 (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.matrizMesticaLeiteNt1 ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, matrizMesticaLeiteNt1: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Matriz Leite NT2 (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.matrizMesticaLeiteNt2 ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, matrizMesticaLeiteNt2: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Matriz Ovina Mestiça (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.matrizOvinaMestica ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, matrizOvinaMestica: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Reprodutor Ovino PO (R$)</Label>
                  <Input
                    type="number"
                    value={vmicEmEdicao.valores.reprodutorOvinoPo ?? ""}
                    onChange={(e) =>
                      setVmicEmEdicao({
                        ...vmicEmEdicao,
                        valores: { ...vmicEmEdicao.valores, reprodutorOvinoPo: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setModalVmicAberta(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!vmicEmEdicao?.uf) {
                  toast({ title: "Informe a UF", variant: "destructive" });
                  return;
                }
                salvarVmicUf(vmicEmEdicao.uf, vmicEmEdicao.valores);
                setModalVmicAberta(false);
                toast({ title: `Tetos VMIC de ${vmicEmEdicao.uf} salvos com sucesso!` });
              }}
              className="rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Tetos VMIC</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: PREÇOS DE VENDA POR UF */}
      {/* ---------------------------------------------------- */}
      <Dialog open={modalPrecoAberta} onOpenChange={setModalPrecoAberta}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              <span>Preços de Venda ({precoEmEdicao?.uf || "Nova UF"})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere os preços de referência aplicados nas projeções de receitas da pecuária.
            </DialogDescription>
          </DialogHeader>

          {precoEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Sigla da UF</Label>
                <Input
                  value={precoEmEdicao.uf}
                  onChange={(e) => setPrecoEmEdicao({ ...precoEmEdicao, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="Ex: CE, PB, RN"
                  className="h-9 w-24 font-mono font-bold rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">Novilho (@ Arroba - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.novilhoArroba ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, novilhoArroba: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Vacas Descarte (Cab - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.vacasDescarteCabeca ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, vacasDescarteCabeca: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Novilhas (Cab - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.novilhasCabeca ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, novilhasCabeca: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Novilhos (Cab - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.novilhosCabeca ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, novilhosCabeca: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Garrotes (Cab - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.garrotesCabeca ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, garrotesCabeca: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Bezerros (Cab - R$)</Label>
                  <Input
                    type="number"
                    value={precoEmEdicao.valores.bezerrosCabeca ?? ""}
                    onChange={(e) =>
                      setPrecoEmEdicao({
                        ...precoEmEdicao,
                        valores: { ...precoEmEdicao.valores, bezerrosCabeca: Number(e.target.value) },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setModalPrecoAberta(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!precoEmEdicao?.uf) {
                  toast({ title: "Informe a UF", variant: "destructive" });
                  return;
                }
                salvarPrecosVendaUf(precoEmEdicao.uf, precoEmEdicao.valores);
                setModalPrecoAberta(false);
                toast({ title: `Preços de venda de ${precoEmEdicao.uf} salvos com sucesso!` });
              }}
              className="rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Preços</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: SUPORTE FORRAGEIRO DE MUNICÍPIO */}
      {/* ---------------------------------------------------- */}
      <Dialog open={modalForragemAberta} onOpenChange={setModalForragemAberta}>
        <DialogContent className="sm:max-w-xl rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sprout className="h-5 w-5 text-teal-500" />
              <span>Suporte Forrageiro ({forragemEmEdicao?.municipio || "Novo Município"})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste as taxas de lotação máxima recomendadas pelo BNB para o município.
            </DialogDescription>
          </DialogHeader>

          {forragemEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Nome do Município</Label>
                  <Input
                    value={forragemEmEdicao.municipio}
                    onChange={(e) => setForragemEmEdicao({ ...forragemEmEdicao, municipio: e.target.value })}
                    placeholder="Ex: Russas"
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Input
                    value={forragemEmEdicao.uf}
                    onChange={(e) => setForragemEmEdicao({ ...forragemEmEdicao, uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="CE"
                    className="h-9 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Precipitação Média (mm/ano)</Label>
                  <Input
                    type="number"
                    value={forragemEmEdicao.chuvaMmAno ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({ ...forragemEmEdicao, chuvaMmAno: Number(e.target.value) })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Classificação Köppen</Label>
                  <Input
                    value={forragemEmEdicao.classeKoppen ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({ ...forragemEmEdicao, classeKoppen: e.target.value })
                    }
                    placeholder="Ex: BSh, Aw"
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-border/40">
                <div className="space-y-1">
                  <Label className="text-[11px]">Máximo Sequeiro Braquiária (UA/ha)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={forragemEmEdicao.suporteUaHa.maximoSequeiroBraquiaria ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({
                        ...forragemEmEdicao,
                        suporteUaHa: {
                          ...forragemEmEdicao.suporteUaHa,
                          maximoSequeiroBraquiaria: Number(e.target.value),
                        },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Braquiária Sequeiro NT1 (UA/ha)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={forragemEmEdicao.suporteUaHa.braquiariaSequeiroNt1 ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({
                        ...forragemEmEdicao,
                        suporteUaHa: {
                          ...forragemEmEdicao.suporteUaHa,
                          braquiariaSequeiroNt1: Number(e.target.value),
                        },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Braquiária Sequeiro NT2 (UA/ha)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={forragemEmEdicao.suporteUaHa.braquiariaSequeiroNt2 ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({
                        ...forragemEmEdicao,
                        suporteUaHa: {
                          ...forragemEmEdicao.suporteUaHa,
                          braquiariaSequeiroNt2: Number(e.target.value),
                        },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Irrigado NT3 (UA/ha)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={forragemEmEdicao.suporteUaHa.irrigadoNt3 ?? ""}
                    onChange={(e) =>
                      setForragemEmEdicao({
                        ...forragemEmEdicao,
                        suporteUaHa: {
                          ...forragemEmEdicao.suporteUaHa,
                          irrigadoNt3: Number(e.target.value),
                        },
                      })
                    }
                    className="h-9 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setModalForragemAberta(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!forragemEmEdicao?.municipio) {
                  toast({ title: "Informe o nome do município", variant: "destructive" });
                  return;
                }
                salvarSuporteForrageiro(forragemEmEdicao);
                setModalForragemAberta(false);
                toast({ title: `Suporte forrageiro de ${forragemEmEdicao.municipio} salvo com sucesso!` });
              }}
              className="rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Forragem</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 5: CLASSIFICAÇÃO BNB DO MUNICÍPIO */}
      {/* ---------------------------------------------------- */}
      <Dialog open={modalClassifAberta} onOpenChange={setModalClassifAberta}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-amber-500" />
              <span>Classificação BNB ({classifEmEdicao?.municipio || "Novo Município"})</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Agência BNB jurisdicionada, enquadramento regional e vocações agropecuárias.
            </DialogDescription>
          </DialogHeader>

          {classifEmEdicao && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Município</Label>
                  <Input
                    value={classifEmEdicao.municipio}
                    onChange={(e) => setClassifEmEdicao({ ...classifEmEdicao, municipio: e.target.value })}
                    placeholder="Ex: Quixeramobim"
                    className="h-9 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UF</Label>
                  <Input
                    value={classifEmEdicao.uf || ""}
                    onChange={(e) => setClassifEmEdicao({ ...classifEmEdicao, uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                    placeholder="CE"
                    className="h-9 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Localização Regional</Label>
                  <Select
                    value={classifEmEdicao.localizacao}
                    onValueChange={(val) => setClassifEmEdicao({ ...classifEmEdicao, localizacao: val })}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEMIÁRIDO">SEMIÁRIDO</SelectItem>
                      <SelectItem value="FORA DO SEMIÁRIDO">FORA DO SEMIÁRIDO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Agência BNB Jurisdicionada</Label>
                  <Input
                    value={classifEmEdicao.agencia || ""}
                    onChange={(e) => setClassifEmEdicao({ ...classifEmEdicao, agencia: e.target.value })}
                    placeholder="Ex: AGÊNCIA QUIXERAMOBIM"
                    className="h-9 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setModalClassifAberta(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!classifEmEdicao?.municipio) {
                  toast({ title: "Informe o município", variant: "destructive" });
                  return;
                }
                salvarClassificacaoMunicipio(classifEmEdicao);
                setModalClassifAberta(false);
                toast({ title: `Classificação de ${classifEmEdicao.municipio} salva com sucesso!` });
              }}
              className="rounded-xl gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Classificação</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* DIÁLOGO DE CONFIRMAÇÃO: RESTAURAR PADRÕES BNB */}
      {/* ---------------------------------------------------- */}
      <AlertDialog open={alertRestaurarAberto} onOpenChange={setAlertRestaurarAberto}>
        <AlertDialogContent className="rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-500 font-bold">
              <RotateCcw className="h-5 w-5" />
              <span>Restaurar todos os parâmetros de fábrica do BNB?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Esta ação redefinirá todas as 27 regras técnicas, tetos VMIC, suporte forrageiro e tabelas zootécnicas
              para as versões normativas originais do Banco do Nordeste. Todas as edições e adições locais serão
              substituídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestaurarPadroes}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              Sim, Restaurar Padrões BNB
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------------------------------------------------- */}
      {/* DIÁLOGO DE CONFIRMAÇÃO: EXCLUSÃO GENÉRICA */}
      {/* ---------------------------------------------------- */}
      <AlertDialog
        open={!!itemParaExcluir}
        onOpenChange={(aberto) => {
          if (!aberto) setItemParaExcluir(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl border-border/50 bg-card/95 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500 font-bold">
              <Trash2 className="h-5 w-5" />
              <span>Excluir Parâmetro?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Você tem certeza de que deseja excluir permanentemente{" "}
              <strong className="text-foreground">{itemParaExcluir?.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Excluir Parâmetro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
