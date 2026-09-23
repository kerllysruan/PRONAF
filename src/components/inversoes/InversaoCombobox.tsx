import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InversaoReferencia } from "@/types/inversoes";
import { useInversoesReferencia } from "@/hooks/useInversoesReferencia";

interface InversaoComboboxProps {
  value: string;
  onChange: (nome: string, referencia?: InversaoReferencia) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InversaoCombobox({
  value,
  onChange,
  placeholder = "Selecione ou busque a inversão do plano...",
  className = "",
  disabled = false,
}: InversaoComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("TODAS");

  const { inversoes, categorias, loading } = useInversoesReferencia();

  // Categorias formatadas com "TODAS"
  const allCategories = useMemo(() => ["TODAS", ...categorias], [categorias]);

  // Filtragem rápida
  const filteredItems = useMemo(() => {
    let list = inversoes;
    if (selectedCat !== "TODAS") {
      list = list.filter((i) => i.categoria === selectedCat);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.nome_completo.toLowerCase().includes(q) ||
          i.item.toLowerCase().includes(q) ||
          (i.subcategoria && i.subcategoria.toLowerCase().includes(q)) ||
          i.categoria.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inversoes, selectedCat, search]);

  const handleSelect = (item: InversaoReferencia) => {
    onChange(item.nome_completo, item);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full cursor-pointer">
          <input
            type="text"
            readOnly
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            onClick={() => !disabled && setOpen(true)}
            className={`w-full px-3 py-1.5 pr-8 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-background text-foreground cursor-pointer truncate ${className}`}
          />
          <ChevronsUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[90vw] md:w-[560px] p-0 shadow-2xl rounded-2xl border-slate-200 overflow-hidden bg-white z-50"
      >
        {/* Header com Busca */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Digite para filtrar (ex: Bovinos, Matrizes, Cerca, Palma)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-900"
            />
          </div>

          {/* Abas Rápidas de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-1 scrollbar-thin">
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 uppercase ${
                  selectedCat === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Opção rápida para usar texto livre se digitou algo */}
          {search.trim().length > 1 && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 mt-2 text-[11px]">
              <span className="text-slate-500 truncate mr-2">
                Item customizado: <strong className="text-slate-800">"{search.toUpperCase()}"</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange(search.toUpperCase());
                  setOpen(false);
                  setSearch("");
                }}
                className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold shrink-0 text-[10px]"
              >
                Usar este nome
              </button>
            </div>
          )}
        </div>

        {/* Lista de Inversões */}
        <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/60">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Carregando catálogo de inversões...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-500">
                Nenhuma inversão encontrada para "{search}".
              </p>
              {search.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(search.toUpperCase());
                    setOpen(false);
                  }}
                  className="text-xs h-8"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Usar texto digitado: "{search.toUpperCase()}"
                </Button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = value === item.nome_completo;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 text-left ${
                    isSelected
                      ? "bg-emerald-50 border border-emerald-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0 bg-slate-100 text-slate-700"
                      >
                        {item.categoria}
                      </Badge>
                      {item.subcategoria && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          • {item.subcategoria}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                      {item.item}
                    </p>
                  </div>

                  {/* Informação do Teto Máximo e Unidade */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg block">
                      Teto: R$ {item.valor_maximo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 block">
                      Por {item.unidade_padrao}
                    </span>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com atalho */}
        <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 px-3">
          <span>{filteredItems.length} opções disponíveis</span>
          <span className="text-[10px] text-slate-400">Tabela Oficial PRONAF / BNB</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
