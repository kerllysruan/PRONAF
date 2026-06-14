import * as React from "react";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    dataKey?: string;
    payload?: Record<string, any>;
    color?: string;
    fill?: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
  /** Optional title override. Defaults to the label (e.g. bar category name). */
  title?: string;
}

/**
 * Premium custom tooltip for Recharts.
 * Shows the line/category name prominently plus a formatted value.
 * Positioned with pointer-events-none to avoid overlapping interactive elements.
 */
export function ChartTooltip({ active, payload, label, formatter, title }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const formatValue = formatter ?? ((v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  );

  return (
    <div
      style={{
        pointerEvents: "none",
        zIndex: 9999,
        position: "relative",
      }}
      className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl px-4 py-3 shadow-2xl border border-white/10 max-w-[280px]"
    >
      {/* Line / Category Name */}
      {(title || label) && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 inline-block" />
          {title || label}
        </p>
      )}

      {/* Values */}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300 font-medium truncate">
              {entry.name || entry.dataKey || "Valor"}
            </span>
            <span className="text-sm font-black text-white tabular-nums whitespace-nowrap">
              {formatValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
