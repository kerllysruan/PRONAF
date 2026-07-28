import { cn } from "@/lib/utils";
import { getStatusConfig, PIPELINE_STAGES } from "@/utils/statusSystem";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ProposalFlowTimelineProps {
  currentStatus: string | null | undefined;
  compact?: boolean;
  className?: string;
}

const FLOW_STEPS = [
  'AGUARDANDO ENTREVISTA',
  'DOCUMENTAÇÃO PENDENTE',
  'DOCUMENTAÇÃO APROVADA',
  'AUTORIZADO ENVIO CENTRAL',
  'ENVIADO PARA CENTRAL',
  'CONTRATADO',
  'CONCLUÍDO',
] as const;

/**
 * Visual timeline showing a proposal's journey through the pipeline.
 * Used across Estoque, Propostas and Documentação pages.
 */
export function ProposalFlowTimeline({
  currentStatus,
  compact = false,
  className,
}: ProposalFlowTimelineProps) {
  const normalized = (currentStatus || '').trim().toUpperCase();
  const currentConfig = getStatusConfig(normalized);
  const currentOrder = currentConfig.order;

  // Special handling for RESTRIÇÃO and PENDÊNCIA CENTRAL
  const isBlocked = normalized === 'RESTRIÇÃO' || normalized === 'PENDÊNCIA CENTRAL';

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1 overflow-x-auto", className)}>
        {FLOW_STEPS.map((step, idx) => {
          const cfg = getStatusConfig(step);
          const isActive = step === normalized;
          const isPast = cfg.order < currentOrder && !isBlocked;
          const isFuture = !isActive && !isPast;

          return (
            <div key={step} className="flex items-center gap-1 shrink-0">
              {idx > 0 && (
                <ArrowRight className={cn(
                  "h-2.5 w-2.5 shrink-0",
                  isPast ? "text-emerald-500" : "text-slate-300"
                )} />
              )}
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  isActive && "ring-2 ring-offset-1",
                  isPast ? cfg.dotClass + " opacity-70" : "",
                  isActive ? cfg.dotClass + " ring-current scale-125" : "",
                  isFuture ? "bg-slate-200" : ""
                )}
                style={isActive ? { ringColor: cfg.hex } : undefined}
                title={cfg.label}
              />
            </div>
          );
        })}
        {isBlocked && (
          <span className="ml-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">
            {normalized === 'RESTRIÇÃO' ? '⛔ Restrito' : '⚠️ Pendência'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {isBlocked && (
        <div className="mb-3 p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
          <span className="text-base">⛔</span>
          <span>
            {normalized === 'RESTRIÇÃO'
              ? 'Proposta bloqueada por restrição cadastral'
              : 'Pendência solicitada pela Central — aguardando resposta'}
          </span>
        </div>
      )}
      <div className="relative">
        {/* Track line */}
        <div className="absolute top-3.5 left-3.5 right-3.5 h-px bg-slate-200" />
        <div
          className="absolute top-3.5 left-3.5 h-px bg-emerald-400 transition-all duration-700"
          style={{
            width: isBlocked
              ? '0%'
              : `${Math.min(100, (currentOrder / (FLOW_STEPS.length - 1)) * 100)}%`,
          }}
        />

        <div className="relative flex items-start justify-between gap-1">
          {FLOW_STEPS.map((step, idx) => {
            const cfg = getStatusConfig(step);
            const isActive = step === normalized;
            const isPast = cfg.order < currentOrder && !isBlocked;
            const isFuture = !isActive && !isPast;

            return (
              <div key={step} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                {/* Dot */}
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 bg-white shadow-sm",
                    isActive && "border-current scale-110 shadow-md",
                    isPast && "border-emerald-400 bg-emerald-50",
                    isFuture && "border-slate-200 bg-white"
                  )}
                  style={isActive ? { borderColor: cfg.hex, backgroundColor: cfg.hex + '15' } : undefined}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : isActive ? (
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cfg.hex }}
                    />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-center text-[9px] font-semibold leading-tight line-clamp-2 max-w-[56px]",
                    isActive ? "font-bold" : "",
                    isPast ? "text-emerald-600" : "",
                    isFuture ? "text-slate-400" : ""
                  )}
                  style={isActive ? { color: cfg.hex } : undefined}
                >
                  {cfg.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
