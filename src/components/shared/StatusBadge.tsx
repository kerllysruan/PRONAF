import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/utils/statusSystem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatusBadgeProps {
  status: string | null | undefined;
  variant?: "default" | "compact" | "dot-only" | "pill";
  showTooltip?: boolean;
  className?: string;
  showEmoji?: boolean;
}

/**
 * Universal status badge — uses the unified status system.
 * Consistent across Estoque, Propostas and Documentação pages.
 */
export function StatusBadge({
  status,
  variant = "default",
  showTooltip = false,
  className,
  showEmoji = false,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);

  const badge = (() => {
    if (variant === "dot-only") {
      return (
        <span
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ring-2 ring-white",
            config.dotClass,
            className
          )}
          title={config.label}
        />
      );
    }

    if (variant === "compact") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border",
            config.badgeClass,
            className
          )}
        >
          {showEmoji && <span>{config.emoji}</span>}
          {config.shortLabel}
        </span>
      );
    }

    if (variant === "pill") {
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm transition-all duration-200 hover:shadow-md",
            config.badgeClass,
            className
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", config.dotClass)}
          />
          {showEmoji && <span className="text-[11px]">{config.emoji}</span>}
          {config.label}
        </span>
      );
    }

    // default
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border",
          config.badgeClass,
          className
        )}
      >
        {showEmoji && <span className="text-[11px]">{config.emoji}</span>}
        {config.label}
      </span>
    );
  })();

  if (showTooltip && config.description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs text-center">
          <p className="font-bold mb-0.5">{config.emoji} {config.label}</p>
          <p className="text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
