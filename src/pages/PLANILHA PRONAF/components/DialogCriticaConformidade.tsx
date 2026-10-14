import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { RelatorioCritica, ItemCritica, StatusRegra } from "../engineCritica";
import { gerarPdfParecerCritica } from "../gerarPdfCritica";

interface DialogCriticaConformidadeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatorio: RelatorioCritica | null;
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

export const DialogCriticaConformidade: React.FC<DialogCriticaConformidadeProps> = ({
  open,
  onOpenChange,
  relatorio,
  onNavigateTab,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | "PENDENCIAS" | "BLOQUEIA" | "ALERTA" | "OK">("PENDENCIAS");
  const [busca, setBusca] = useState("");

  if (!relatorio) return null;

  // Filtragem dos itens
  const itensFiltrados = relatorio.itens.filter((item) => {
    // Filtro por severidade
    if (filtroStatus === "PENDENCIAS" && item.status === "OK") return false;
    if (filtroStatus === "BLOQUEIA" && item.status !== "BLOQUEIA") return false;
    if (filtroStatus === "ALERTA" && item.status !== "ALERTA") return false;
    if (filtroStatus === "OK" && item.status !== "OK") return false;

    // Filtro de texto / busca
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      const matchId = item.id.toLowerCase().includes(termo);
      const matchRegra = item.regra.toLowerCase().includes(termo);
      const matchComoResolver = item.comoResolver.toLowerCase().includes(termo);
      return matchId || matchRegra || matchComoResolver;
    }

    return true;
  });

  const totalPendencias = relatorio.totalBloqueios + relatorio.totalAlertas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/60 shadow-2xl">
        {/* ── CABEÇALHO DO MODAL ── */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/20 text-primary-foreground border border-primary/30">
                  Auditoria Automática BNB
                </span>
                <span className="text-xs text-slate-400">27 Parâmetros Oficiais (F1 a F5)</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {relatorio.statusGeral === "BLOQUEIA" && <ShieldAlert className="h-6 w-6 text-rose-500 animate-pulse" />}
                {relatorio.statusGeral === "ALERTA" && <AlertTriangle className="h-6 w-6 text-amber-400" />}
                {relatorio.statusGeral === "CONFORME" && <ShieldCheck className="h-6 w-6 text-emerald-400" />}
                Parecer Técnico de Conformidade
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-xs sm:text-sm">
                Proponente: <span className="font-semibold text-white">{relatorio.proponenteNome}</span> • Município:{" "}
                <span className="font-semibold text-white">{relatorio.municipio} - {relatorio.uf}</span>
              </DialogDescription>
            </div>

            <Button
              onClick={() => gerarPdfParecerCritica(relatorio)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-900/30 transition-all shrink-0 cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              <span>Gerar Parecer em PDF</span>
            </Button>
          </div>

          {/* Banner de Diagnóstico Geral */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {relatorio.statusGeral === "BLOQUEIA" && (
                <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
              )}
              <span className="text-xs sm:text-sm font-semibold">
                Status Geral:{" "}
                {relatorio.statusGeral === "BLOQUEIA" && (
                  <span className="text-rose-400 font-bold uppercase tracking-wider">
                    Bloqueio Técnico (Ajustes Obrigatórios)
                  </span>
                )}
                {relatorio.statusGeral === "ALERTA" && (
                  <span className="text-amber-300 font-bold uppercase tracking-wider">
                    Com Advertências Técnicas
                  </span>
                )}
                {relatorio.statusGeral === "CONFORME" && (
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">
                    Totalmente Conforme com o BNB
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Badge variant="outline" className="bg-slate-800/60 text-slate-200 border-slate-700">
                Total: {relatorio.totalRegras}
              </Badge>
              <Badge variant="outline" className="bg-rose-950/40 text-rose-300 border-rose-800">
                Bloqueios: {relatorio.totalBloqueios}
              </Badge>
              <Badge variant="outline" className="bg-amber-950/40 text-amber-300 border-amber-800">
                Alertas: {relatorio.totalAlertas}
              </Badge>
              <Badge variant="outline" className="bg-emerald-950/40 text-emerald-300 border-emerald-800">
                Conformes: {relatorio.totalOk}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── BARRA DE FILTROS E BUSCA ── */}
        <div className="p-4 bg-muted/30 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant={filtroStatus === "PENDENCIAS" ? "default" : "outline"}
              onClick={() => setFiltroStatus("PENDENCIAS")}
              className="text-xs h-8 rounded-xl font-bold cursor-pointer"
            >
              Pendências ({totalPendencias})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "BLOQUEIA" ? "destructive" : "outline"}
              onClick={() => setFiltroStatus("BLOQUEIA")}
              className="text-xs h-8 rounded-xl font-bold cursor-pointer"
            >
              Bloqueios ({relatorio.totalBloqueios})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "ALERTA" ? "secondary" : "outline"}
              onClick={() => setFiltroStatus("ALERTA")}
              className="text-xs h-8 rounded-xl font-bold cursor-pointer"
            >
              Alertas ({relatorio.totalAlertas})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "OK" ? "default" : "outline"}
              onClick={() => setFiltroStatus("OK")}
              className="text-xs h-8 rounded-xl font-bold cursor-pointer"
            >
              Conformes ({relatorio.totalOk})
            </Button>
            <Button
              size="sm"
              variant={filtroStatus === "TODOS" ? "secondary" : "ghost"}
              onClick={() => setFiltroStatus("TODOS")}
              className="text-xs h-8 rounded-xl font-medium cursor-pointer"
            >
              Todas ({relatorio.totalRegras})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar regra ou palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 text-xs h-8 rounded-xl"
            />
          </div>
        </div>

        {/* ── LISTAGEM DE REGRAS E INCONFORMIDADES ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-background">
          {itensFiltrados.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 stroke-1" />
              <p className="text-sm font-semibold">Nenhuma regra encontrada para este filtro.</p>
              <p className="text-xs text-muted-foreground">Tente alterar o filtro ou o termo de busca.</p>
            </div>
          ) : (
            itensFiltrados.map((item) => {
              const abaDestino = REGRA_PARA_ABA[item.id];
              const isBloqueia = item.status === "BLOQUEIA";
              const isAlerta = item.status === "ALERTA";
              const isOk = item.status === "OK";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isBloqueia
                      ? "bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 shadow-sm"
                      : isAlerta
                      ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40 shadow-sm"
                      : "bg-card border-border/50 hover:border-border"
                  }`}
                >
                  {/* Cabeçalho da Regra */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wide font-mono ${
                          isBloqueia
                            ? "bg-rose-600 text-white"
                            : isAlerta
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {item.id}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight">{item.regra}</h4>
                        <span className="text-[11px] text-muted-foreground">
                          Base de Referência: <span className="font-semibold text-foreground">{item.fonte}</span> • Confiança: {item.confianca}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isBloqueia && (
                        <Badge className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xl">
                          BLOQUEIA
                        </Badge>
                      )}
                      {isAlerta && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xl">
                          ALERTA
                        </Badge>
                      )}
                      {isOk && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-xl">
                          CONFORME
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Comparativo de Valores */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Informado na Proposta:</span>
                      <span className="font-semibold text-foreground">{String(item.valorProposta || "Não informado")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Parâmetro Oficial BNB:</span>
                      <span className="font-semibold text-foreground">{String(item.valorReferencia || "—")}</span>
                    </div>
                  </div>

                  {/* Seção Como Resolver */}
                  {!isOk && (
                    <div className="mt-3 p-3 rounded-xl bg-white dark:bg-card border-l-4 border-l-primary border border-border/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <span className="text-[11px] font-black uppercase text-primary tracking-wider flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" />
                          Como Resolver:
                        </span>
                        <p className="text-xs text-foreground font-medium leading-relaxed">{item.comoResolver}</p>
                      </div>

                      {abaDestino && onNavigateTab && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onNavigateTab(abaDestino);
                            onOpenChange(false);
                          }}
                          className="text-xs h-7 gap-1 font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 shrink-0 cursor-pointer"
                        >
                          <span>Corrigir no formulário</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── RODAPÉ DO MODAL ── */}
        <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground text-center sm:text-left">
            * As regras de auditoria foram compiladas a partir dos Manuais de Crédito e Fórmulas de Crítica do Banco do Nordeste (BNB).
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold rounded-xl cursor-pointer"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => gerarPdfParecerCritica(relatorio)}
              className="text-xs gap-1.5 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white cursor-pointer"
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
