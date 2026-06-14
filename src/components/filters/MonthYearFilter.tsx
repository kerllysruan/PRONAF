import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  { value: "all", label: "Todos os meses" },
  { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" }, { value: "4", label: "Abril" },
  { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
  { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

interface MonthYearFilterProps {
  month: string;
  year: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  years: string[];
}

export function MonthYearFilter({ month, year, onMonthChange, onYearChange, years }: MonthYearFilterProps) {
  return (
    <div className="flex gap-2">
      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[130px] h-12 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all truncate text-left">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl max-h-[300px]">
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={onYearChange}>
        <SelectTrigger className="w-[110px] h-12 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl transition-all truncate text-left">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl max-h-[300px]">
          <SelectItem value="all">Todos</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
