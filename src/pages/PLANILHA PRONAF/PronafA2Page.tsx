import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList,
  Users,
  BarChart3,
  FileText,
  Calendar,
  Sprout,
  Beef,
  Activity,
  Calculator,
  Download,
  Upload,
  FolderOpen,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PronafA2Provider, usePronafA2 } from "./usePronafA2Store";
import { exportXlsm } from "./exportXlsm";
import { importXlsm } from "./importXlsm";
import { projetoToCells } from "./cellMapping";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Lazy-loaded tab components (wrappers garantem a forma correta para React.lazy)
const TabCliente      = React.lazy(() => import("./components/TabCliente").then(m => ({ default: m.default })));
const TabAvaliacao    = React.lazy(() => import("./components/TabAvaliacao").then(m => ({ default: m.default })));
const TabProposta     = React.lazy(() => import("./components/TabProposta").then(m => ({ default: m.default })));
const TabCronograma   = React.lazy(() => import("./components/TabCronograma").then(m => ({ default: m.default })));
const TabAtivAgricola = React.lazy(() => import("./components/TabAtivAgricola").then(m => ({ default: m.default })));
const TabAtivPecuaria = React.lazy(() => import("./components/TabAtivPecuaria").then(m => ({ default: m.default })));
const TabOutrasAtiv   = React.lazy(() => import("./components/TabOutrasAtiv").then(m => ({ default: m.default })));
const TabCalcFinanceiro = React.lazy(() => import("./components/TabCalcFinanceiro").then(m => ({ default: m.default })));

const TABS = [
  { id: "cliente",        label: "Cliente",        icon: Users },
  { id: "avaliacao",      label: "Avaliação",      icon: BarChart3 },
  { id: "proposta",       label: "Proposta",       icon: FileText },
  { id: "cronograma",     label: "Cronograma",     icon: Calendar },
  { id: "ativ-agricola",  label: "Ativ. Agrícola", icon: Sprout },
  { id: "ativ-pecuaria",  label: "Ativ. Pecuária", icon: Beef },
  { id: "outras-ativ",    label: "Outras Ativ.",   icon: Activity },
  { id: "calc-financeiro",label: "Cal. Financeiro",icon: Calculator },
] as const;

type TabId = typeof TABS[number]["id"];

// ──────────────────────────────────────────────────────────────
// Componente interno (usa o contexto PronafA2)
// ──────────────────────────────────────────────────────────────
function PronafA2Inner() {
  const { projeto, updateTab, replaceProjeto, clearProjeto, loading } = usePronafA2();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("cliente");
  const [isExporting, setIsExporting] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isVinculosDialogOpen, setIsVinculosDialogOpen] = useState(false);
  const [pendingXlsmBlob, setPendingXlsmBlob] = useState<Blob | null>(null);
  const [pendingXlsmName, setPendingXlsmName] = useState("");

  const modeloInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const xlsmImportRef = useRef<HTMLInputElement>(null);

  // ── Salvar JSON ────────────────────────────────────────────
  function handleSaveJson() {
    const json = JSON.stringify(projeto, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const now = new Date().toISOString().slice(0, 10);
    a.download = `ProjetoA2_${now}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Projeto salvo", description: "Arquivo .json baixado com sucesso." });
  }

  // ── Abrir JSON ────────────────────────────────────────────
  function handleOpenJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        replaceProjeto(parsed);
        toast({ title: "Projeto carregado", description: "Dados importados do arquivo .json com sucesso." });
      } catch {
        toast({ title: "Erro ao abrir", description: "Arquivo .json inválido.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Importar .xlsm existente ───────────────────────────────
  async function handleImportXlsm(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast({ title: "Importando...", description: "Lendo o arquivo e extraindo dados de todas as abas..." });
      const imported = await importXlsm(file);
      replaceProjeto(imported);

      const nomeCliente = imported.Cliente?.nome || "Cliente";
      toast({
        title: "Importação concluída!",
        description: `Planilha importada com sucesso. Os dados de ${nomeCliente} e de todas as 8 abas foram carregados.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível ler o arquivo da planilha.";
      toast({
        title: "Erro na importação",
        description: msg,
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
    }
  }

  // ── Exportar .xlsm ────────────────────────────────────────
  async function handleExport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsExporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const writes = projetoToCells(projeto);
      const result = await exportXlsm(arrayBuffer, writes);
      const now = new Date().toISOString().slice(0, 10);
      const name = `PlanilhaPRONAF-A2_${now}.xlsm`;
      setPendingXlsmBlob(result.blob);
      setPendingXlsmName(name);
      setIsVinculosDialogOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível gerar o .xlsm.";
      toast({
        title: "Erro na exportação",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  function handleDownloadXlsm() {
    if (!pendingXlsmBlob) return;
    const url = URL.createObjectURL(pendingXlsmBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pendingXlsmName;
    a.click();
    URL.revokeObjectURL(url);
    setIsVinculosDialogOpen(false);
    setPendingXlsmBlob(null);
    toast({ title: "Download iniciado", description: pendingXlsmName });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">Carregando projeto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-[1800px] mx-auto pb-10">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-border/50 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-foreground tracking-tight">
              PRONAF A2
            </h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Formulário Web — Versão 2.0 (Procedimento Simplificado)
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={xlsmImportRef}
            type="file"
            accept=".xlsm,.xlsx,.xls,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
            onChange={handleImportXlsm}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border/40 font-bold"
            onClick={() => xlsmImportRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar .xlsm</span>
          </Button>

          {/* Abrir JSON */}
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleOpenJsonFile}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border/40 font-bold"
            onClick={() => jsonInputRef.current?.click()}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Abrir JSON</span>
          </Button>

          {/* Salvar JSON */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-border/40 font-bold"
            onClick={handleSaveJson}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar JSON</span>
          </Button>

          {/* Limpar */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold"
            onClick={() => setIsClearDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>

          {/* Exportar .xlsm */}
          <input
            ref={modeloInputRef}
            type="file"
            accept=".xlsm"
            className="hidden"
            onChange={handleExport}
          />
          <Button
            size="sm"
            disabled={isExporting}
            className="gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20 font-black h-10 px-5"
            onClick={() => modeloInputRef.current?.click()}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar .xlsm
          </Button>
        </div>
      </header>

      {/* ── Aviso privacidade ────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
        <span>
          <strong>Privacidade (LGPD):</strong> Todos os dados (CPF, nomes, renda) ficam exclusivamente
          no seu navegador. Nenhuma informação é enviada para servidores.
        </span>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="space-y-0">
        <div className="overflow-x-auto">
          <TabsList className="bg-card/40 border border-border/40 rounded-2xl p-1 gap-1 h-auto flex-wrap w-max min-w-full">
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="rounded-xl gap-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md px-3 py-2"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-3">
          <React.Suspense
            fallback={
              <Card className="rounded-3xl border-border/40">
                <CardContent className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            }
          >
            <TabsContent value="cliente" className="m-0">
              <TabCliente
                data={projeto.Cliente}
                onChange={(data) => updateTab("Cliente", data)}
              />
            </TabsContent>
            <TabsContent value="avaliacao" className="m-0">
              <TabAvaliacao
                data={projeto["Avaliação"]}
                onChange={(data) => updateTab("Avaliação", data)}
              />
            </TabsContent>
            <TabsContent value="proposta" className="m-0">
              <TabProposta
                data={projeto[" Proposta"]}
                onChange={(data) => updateTab(" Proposta", data)}
              />
            </TabsContent>
            <TabsContent value="cronograma" className="m-0">
              <TabCronograma
                data={projeto.Cronograma}
                onChange={(data) => updateTab("Cronograma", data)}
              />
            </TabsContent>
            <TabsContent value="ativ-agricola" className="m-0">
              <TabAtivAgricola
                data={projeto["Ativ. Agrícola"]}
                onChange={(data) => updateTab("Ativ. Agrícola", data)}
              />
            </TabsContent>
            <TabsContent value="ativ-pecuaria" className="m-0">
              <TabAtivPecuaria
                data={projeto["Ativ. Pecuária"]}
                onChange={(data) => updateTab("Ativ. Pecuária", data)}
              />
            </TabsContent>
            <TabsContent value="outras-ativ" className="m-0">
              <TabOutrasAtiv
                data={projeto["Outras Ativ"]}
                onChange={(data) => updateTab("Outras Ativ", data)}
              />
            </TabsContent>
            <TabsContent value="calc-financeiro" className="m-0">
              <TabCalcFinanceiro
                data={projeto.CalculoFinanceiro}
                onChange={(data) => updateTab("CalculoFinanceiro", data)}
              />
            </TabsContent>
          </React.Suspense>
        </div>
      </Tabs>

      {/* ── Dialog: Limpar projeto ───────────────────────────── */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Limpar todo o projeto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados do formulário serão apagados permanentemente do navegador.
              Salve um arquivo .json antes se quiser manter os dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearProjeto}
              className="rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              Sim, limpar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Dialog: Aviso vínculos externos ─────────────────── */}
      <Dialog open={isVinculosDialogOpen} onOpenChange={setIsVinculosDialogOpen}>
        <DialogContent className="rounded-3xl border-border/40 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Atenção antes de abrir no Excel
            </DialogTitle>
            <DialogDescription className="space-y-2 text-left pt-2">
              <p>
                O arquivo <strong>.xlsm</strong> gerado contém ligações externas a sistemas internos
                do BNB. Ao abrir no Excel, uma mensagem perguntará se deseja <em>atualizar vínculos</em>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm">
                <strong>Clique em "Não Atualizar" (ou "Don't Update").</strong>
                <br />
                Atualizar os vínculos pode apagar os dados ou travar o arquivo.
              </div>
              <p className="text-sm">
                Após abrir, <strong>habilite macros</strong> quando solicitado para usar os botões
                de cálculo e geração do SEAP.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVinculosDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleDownloadXlsm} className="rounded-xl gap-2 bg-primary font-bold">
              <Download className="h-4 w-4" />
              Entendido — Baixar .xlsm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Export default — envolve com o Provider
// ──────────────────────────────────────────────────────────────
export default function PronafA2Page() {
  return (
    <PronafA2Provider>
      <PronafA2Inner />
    </PronafA2Provider>
  );
}
