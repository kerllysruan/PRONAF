import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

/**
 * Componente de seleção com busca para listas grandes (municípios, atividades etc.)
 * Baseado no Command (cmdk) do shadcn/ui.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
  disabled = false,
  loading = false,
  className,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(
    () => options.find((opt) => opt.value === value)?.label ?? "",
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between font-normal h-10 rounded-xl border-border/40 bg-background/50 hover:bg-background",
            !value && "text-muted-foreground",
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </span>
          ) : (
            <span className="truncate">{selectedLabel || placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border/40 shadow-lg" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-10" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value === value ? "" : opt.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
