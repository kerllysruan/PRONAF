import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export interface VirtualGridColumn<T = unknown> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  render: (row: T, rowIndex: number, onChange: (value: unknown) => void) => React.ReactNode;
}

interface VirtualGridProps<T = unknown> {
  rows: T[];
  columns: VirtualGridColumn<T>[];
  rowHeight?: number;
  maxHeight?: number;
  onRowChange: (rowIndex: number, key: string, value: unknown) => void;
  className?: string;
  emptyMessage?: string;
}

/**
 * Grade virtualizada com @tanstack/react-virtual para listas muito longas.
 * Usado em Avaliação (~1680 linhas) e Atividade Agrícola (~5860 células).
 */
export function VirtualGrid<T = unknown>({
  rows,
  columns,
  rowHeight = 40,
  maxHeight = 500,
  onRowChange,
  className,
  emptyMessage = "Nenhuma linha disponível.",
}: VirtualGridProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const totalWidth = columns.reduce(
    (acc, col) => acc + (col.width ?? col.minWidth ?? 120),
    0
  );

  return (
    <div className={cn("rounded-xl border border-border/40 overflow-hidden", className)}>
      {/* Header */}
      <div
        className="flex bg-muted/40 border-b border-border/40 sticky top-0 z-10"
        style={{ minWidth: totalWidth }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0 border-r border-border/20 last:border-r-0"
            style={{ width: col.width ?? col.minWidth ?? 120, minWidth: col.minWidth ?? 80 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        ref={parentRef}
        style={{ height: Math.min(maxHeight, rows.length * rowHeight + 4), overflowY: "auto" }}
        className="relative"
      >
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full flex border-b border-border/20 last:border-b-0 hover:bg-muted/20 transition-colors"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    minWidth: totalWidth,
                  }}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="px-2 py-1 flex items-center shrink-0 border-r border-border/10 last:border-r-0"
                      style={{ width: col.width ?? col.minWidth ?? 120, minWidth: col.minWidth ?? 80 }}
                    >
                      {col.render(row, virtualRow.index, (value) =>
                        onRowChange(virtualRow.index, col.key, value)
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
