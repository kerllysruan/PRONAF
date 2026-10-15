import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertTriangle,
  FileDown,
  Search,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  Activity,
} from "lucide-react";
import { RelatorioCritica, ItemCritica } from "../engineCritica";
import { gerarPdfParecerCritica } from "../gerarPdfCritica";
import { ProjetoA2 } from "../types";

interface DialogCriticaConformidadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatorio: RelatorioCritica | null;
  projeto?: ProjetoA2;
  onNavigateTab?: (tabId: string) => void;
}

// Mapeia regras para as abas correspondentes para facilitar a navegação direta
const REGRA_PARA_ABA: Record<string, string> = {
  R01: "proposta",
  R02: "proposta",
  R03: "proposta",
  R04: "cliente",
  R05: "proposta",
  R06: "proposta",
  R07: "ativ-pecuaria",
  R08: "ativ-pecuaria",
  R09: "ativ-pecuaria",
  R10: "ativ-pecuaria",
  R11: "ativ-pecuaria",
  R12: "ativ-pecuaria",
  R13: "ativ-pecuaria",
  R14: "ativ-pecuaria",
  R15: "ativ-agricola",
  R16: "ativ-agricola",
  R17: "ativ-agricola",
  R18: "proposta",
  R19: "proposta",
  R20: "proposta",
  R21: "proposta",
  R22: "cronograma",
  R23: "cronograma",
  R24: "calc-financeiro",
  R25: "proposta",
  R26: "proposta",
  R27: "ativ-pecuaria",
};

// Mapeamento de fonte para cor
const FONTE_CORES: Record<string, string> = {
  F1: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  F2: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  F3: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  F4: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  F5: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  interno: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
};

function getFonteBadge(fonte: string): string {
  // Busca pela chave parcial (ex: "F3 x F1" deveria usar F3)
  for (const key of Object.keys(FONTE_CORES)) {
    if (fonte.startsWith(key)) return FONTE_CORES[key];
  }
  return FONTE_CORES.interno;
}

export const DialogCriticaConformidade: React.FC<DialogCriticaConformidadeProps> = ({
  open,
  onOpenChange,
  relatorio,
  projeto,
  onNavigateTab,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "PENDENCIAS" | "BLOQUEIA" | "ALERTA" | "OK">("PENDENCIAS");
  const [busca, setBusca] = useState("");

  // Filtragem memorizada
  const itensFiltrados = useMemo(() => {
    if (!relatorio) return [];
    return relatorio.itens.filter((item) => {
      if (filtroStatus === "PENDENCIAS" && item.status === "OK") return false;
      if (filtroStatus === "BLOQUEIA" && item.status !== "BLOQUEIA") return false;
      if (filtroStatus === "ALERTA" && item.status !== "ALERTA") return false;
      if (filtroStatus === "OK" && item.status !== "OK") return false;

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        return (
          item.id.toLowerCase().includes(termo) ||
          item.regra.toLowerCase().includes(termo) ||
          item.comoResolver.toLowerCase().includes(termo)
        );
      }

      return true;
    });
  }, [relatorio, filtroStatus, busca]);

  if (!relatorio) return null;

  const totalPendencias = relatorio.totalBloqueios + relatorio.totalAlertas;
  const taxaConformidade = relatorio.totalRegras > 0 ? Math.round((relatorio.totalOk / relatorio.totalRegras) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[94vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/60 shadow-2xl">
        {/* ═══════════════════════════════════════════════════════════════
            HERO HEADER — Cabeçalho Institucional Executivo
            ═══════════════════════════════════════════════════════════════ */}
        <div className="p-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700/50">
          {/* Linha 1: Título e botão PDF */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Validação Automática BNB
                </span>
                <span className="text-[11px] text-slate-400">27 Parâmetros Oficiais (F1 a F5)</span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                {relatorio.statusGeral === "BLOQUEIA" && <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse shrink-0" />}
                {relatorio.statusGeral === "ALERTA" && <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />}
                {relatorio.statusGeral === "CONFORME" && <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />}
                Conformidade Técnica da Proposta
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-xs truncate">
                Proponente: <span className="font-semibold text-white">{relatorio.proponenteNome}</span>
                {" • "}Município: <span className="font-semibold text-white">{relatorio.municipio} - {relatorio.uf}</span>
              </DialogDescription>
            </div>

            <Button
              onClick={() => gerarPdfParecerCritica(relatorio, projeto)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-900/30 transition-all shrink-0 cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              <span>Gerar Parecer em PDF</span>
            </Button>
          </div>

          {/* ── KPI Cards Inline ── */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* KPI: Taxa de Aderência */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3 flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-700" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${taxaConformidade} ${100 - taxaConformidade}`}
                    className={
                      relatorio.statusGeral === "BLOQUEIA"
                        ? "text-rose-400"
                        : relatorio.statusGeral === "ALERTA"
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                  {taxaConformidade}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aderência</p>
                <p className="text-sm font-black text-white truncate">
                  {taxaConformidade === 100 ? "Plena" : taxaConformidade >= 80 ? "Elevada" : "Baixa"}
                </p>
              </div>
            </div>

            {/* KPI: Conformes */}
            <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">Conformes</p>
                <p className="text-lg font-black text-emerald-400">{relatorio.totalOk}</p>
              </div>
            </div>

            {/* KPI: Alertas */}
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">Alertas</p>
                <p className="text-lg font-black text-amber-400">{relatorio.totalAlertas}</p>
              </div>
            </div>

            {/* KPI: Bloqueios */}
            <div className="bg-rose-500/10 backdrop-blur-sm rounded-2xl border border-rose-500/20 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/70">Bloqueios</p>
                <p className="text-lg font-black text-rose-400">{relatorio.totalBloqueios}</p>
              </div>
            </div>
          </div>

          {/* ── Barra de progresso ── */}
          <div className="mt-3 h-1.5 rounded-full bg-slate-700/50 overflow-hidden flex">
            {relatorio.totalOk > 0 && (
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(relatorio.totalOk / relatorio.totalRegras) * 100}%` }}
              />
            )}
            {relatorio.totalAlertas > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${(relatorio.totalAlertas / relatorio.totalRegras) * 100}%` }}
              />
            )}
            {relatorio.totalBloqueios > 0 && (
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${(relatorio.totalBloqueios / relatorio.totalRegras) * 100}%` }}
              />
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BARRA DE FILTROS E BUSCA
            ═══════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant={filtroStatus === "PENDENCIAS" ? "default" : "outline"}
              onClick={() => setFiltroStatus("PENDENCIAS")}
              className="text-xs h-7 rounded-xl font-bold cursor-pointer gap-1"
            >
              <Activity className="h-3 w-3" />
              Pendências ({totalPendencias})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "BLOQUEIA" ? "destructive" : "outline"}
              onClick={() => setFiltroStatus("BLOQUEIA")}
              className="text-xs h-7 rounded-xl font-bold cursor-pointer"
            >
              Bloqueios ({relatorio.totalBloqueios})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "ALERTA" ? "secondary" : "outline"}
              onClick={() => setFiltroStatus("ALERTA")}
              className="text-xs h-7 rounded-xl font-bold cursor-pointer"
            >
              Alertas ({relatorio.totalAlertas})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "OK" ? "default" : "outline"}
              onClick={() => setFiltroStatus("OK")}
              className="text-xs h-7 rounded-xl font-bold cursor-pointer"
            >
              Conformes ({relatorio.totalOk})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "TODOS" ? "secondary" : "ghost"}
              onClick={() => setFiltroStatus("TODOS")}
              className="text-xs h-7 rounded-xl font-medium cursor-pointer"
            >
              Todas ({relatorio.totalRegras})
            </Button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar regra..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 text-xs h-7 rounded-xl"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            LISTAGEM DE REGRAS E INCONFORMIDADES
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-background">
          {itensFiltrados.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center text-muted-foreground space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold">Nenhuma regra encontrada para este filtro.</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Altere o filtro ou o termo de busca para exibir critérios.
              </p>
            </div>
          ) : (
            itensFiltrados.map((item) => (
              <RegraCard
                key={item.id}
                item={item}
                onNavigateTab={onNavigateTab}
                onCloseDialog={() => onOpenChange(false)}
              />
            ))
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RODAPÉ DO MODAL
            ═══════════════════════════════════════════════════════════════ */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[10px] text-muted-foreground text-center sm:text-left leading-relaxed max-w-lg">
            Os critérios técnicos foram compilados a partir dos Manuais de Crédito e Normas Operacionais do Banco do Nordeste (BNB).
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold rounded-xl cursor-pointer h-8"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => gerarPdfParecerCritica(relatorio, projeto)}
              className="text-xs gap-1.5 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white cursor-pointer h-8"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>Baixar Parecer (PDF)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENTE INDIVIDUAL: Card de Regra
   ═══════════════════════════════════════════════════════════════════ */

interface RegraCardProps {
  item: ItemCritica;
  onNavigateTab?: (tabId: string) => void;
  onCloseDialog: () => void;
}

const RegraCard: React.FC<RegraCardProps> = ({ item, onNavigateTab, onCloseDialog }) => {
  const abaDestino = REGRA_PARA_ABA[item.id];
  const isBloqueia = item.status === "BLOQUEIA";
  const isAlerta = item.status === "ALERTA";
  const isOk = item.status === "OK";

  const cardBorder = isBloqueia
    ? "border-rose-200 dark:border-rose-900/40"
    : isAlerta
    ? "border-amber-200 dark:border-amber-900/40"
    : "border-border/50 hover:border-border";

  const cardBg = isBloqueia
    ? "bg-rose-50/50 dark:bg-rose-950/10"
    : isAlerta
    ? "bg-amber-50/50 dark:bg-amber-950/10"
    : "bg-card";

  const idBg = isBloqueia
    ? "bg-rose-600"
    : isAlerta
    ? "bg-amber-500"
    : "bg-emerald-600";

  const statusBadge = isBloqueia
    ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
    : isAlerta
    ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
    : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";

  const statusText = isBloqueia ? "BLOQUEIA" : isAlerta ? "ALERTA" : "CONFORME";

  return (
    <div className={`p-3.5 rounded-2xl border transition-all ${cardBorder} ${cardBg} shadow-sm`}>
      {/* Linha superior: ID + Regra + Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black tracking-wide font-mono text-white shrink-0 ${idBg}`}>
            {item.id}
          </span>
          <div className="min-w-0">
            <h4 className="text-[13px] font-bold text-foreground leading-snug break-words">{item.regra}</h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 h-4 border ${getFonteBadge(item.fonte)}`}>
                {item.fonte}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                Confiança: <span className="font-semibold text-foreground">{item.confianca}</span>
              </span>
            </div>
          </div>
        </div>

        <Badge variant="outline" className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl border shrink-0 ${statusBadge}`}>
          {statusText}
        </Badge>
      </div>

      {/* Comparativo de Valores */}
      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/40 p-2 rounded-xl border border-border/30">
          <span className="text-muted-foreground block text-[9px] font-bold uppercase tracking-wider">
            Informado na Proposta
          </span>
          <span className="font-semibold text-foreground text-[12px] break-words">
            {String(item.valorProposta || "Não informado")}
          </span>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/30">
          <span className="text-muted-foreground block text-[9px] font-bold uppercase tracking-wider">
            Parâmetro Oficial BNB
          </span>
          <span className="font-semibold text-foreground text-[12px] break-words">
            {String(item.valorReferencia || "—")}
          </span>
        </div>
      </div>

      {/* Como Resolver — apenas para itens não conformes */}
      {!isOk && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-card border-l-[3px] border-l-primary border border-border/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3 w-3 shrink-0" />
              Como Resolver:
            </span>
            <p className="text-xs text-foreground font-medium leading-relaxed break-words">
              {item.comoResolver}
            </p>
          </div>

          {abaDestino && onNavigateTab && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onNavigateTab(abaDestino);
                onCloseDialog();
              }}
              className="text-[11px] h-7 gap-1 font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 shrink-0 cursor-pointer"
            >
              <span>Corrigir</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
