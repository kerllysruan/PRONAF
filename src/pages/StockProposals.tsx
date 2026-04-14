import { useState, useRef, useMemo } from "react";
import { useStockProposals } from "@/hooks/useStockProposals";
import { InsertStockProposal, StockProposal } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Box, Calendar, FileText, Trash2, User, Landmark,
  Upload, Search, Filter, MapPin, AlertTriangle, CheckCircle2, XCircle, ShieldCheck,
  FileSpreadsheet, Download, Eye, ChevronDown, ChevronUp, Users, Hash, Send, RotateCcw,
  Edit2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

// ─── CSV parser ────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseBRLValue(raw: string): number {
  if (!raw) return 0;
  let clean = raw.replace(/[^\d.,]/g, '').trim();
  // Detect format: "49.980,00" (BR) or "49,980.00" (US-ish in CSV)
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(clean)) {
    // Brazilian format: 49.980,00
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})*\.\d{2}$/.test(clean)) {
    // US format: 49,980.00
    clean = clean.replace(/,/g, '');
  } else {
    clean = clean.replace(/,/g, '.');
  }
  return parseFloat(clean) || 0;
}

function fixBrokenEncoding(str: string): string {
  if (!str) return str;
  return str
    .replace(/ﾃ/g, 'Ã')
    .replace(/ﾍ/g, 'Í')
    .replace(/ﾉ/g, 'É')
    .replace(/ﾊ/g, 'Ê')
    .replace(/ｺ/g, 'º')
    .replace(/ﾇ/g, 'Ç');
}

const PROJETISTAS = ["NEY MEDEIRO", "JAIRO SANTANA", "CLEDSON CLOVIS"];

const PROGRAMAS_CREDITO = [
  "RURAL (226)",
  "PRONAF MAIS ALIMENTOS (434)",
  "PRONAF COMUM (433)",
  "PRONAF A (368)",
  "PRONAF A (699)"
];

function cleanCSV(str: string | undefined): string | null {
  if (!str) return null;
  const clean = fixBrokenEncoding(str.trim());
  // Filter out CSV noise characters
  if (!clean || clean === '-' || clean === '\uFFFD' || clean === '') return null;
  return clean;
}

function getField(row: any, keys: string[]) {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const found = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
  }
  // Try cleaning weird characters (encoding issues)
  for (const k of keys) {
    const found = rowKeys.find(rk => {
      const cleanRK = rk.replace(/[^\x00-\x7F]/g, "").toLowerCase().trim();
      const cleanK = k.replace(/[^\x00-\x7F]/g, "").toLowerCase().trim();
      return cleanRK === cleanK && cleanK.length > 2;
    });
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
  }
  return "";
}

function mapCSVRow(row: any, index: number): Partial<InsertStockProposal> | null {
  const name = cleanCSV(getField(row, ["CLIENTES", "CLIENTE", "NOME", "producer_name"]));
  if (!name || /^CLIENTES?$/i.test(name)) return null;

  const renovacaoVal = cleanCSV(getField(row, ["CLIENTE RENOVAÇÃO", "RENOVAÇÃO", "RENOVACAO", "PROGRAMA DE CRÉDITO"]));
  const isRenovacao = (renovacaoVal || '').toUpperCase().includes('SIM');
  const automatedLinha = isRenovacao ? 'PRONAF A 699' : 'PRONAF A 368';

  // Join AGÊNCIA and CADASTRO if they are separate columns
  const agencia = getField(row, ["AGÊNCIA", "AGENCIA"]);
  const cadastro = getField(row, ["CADASTRO"]);
  const agenciaCadastro = cleanCSV(getField(row, ["AGÊNCIA CADASTRO", "AGENCIA CADASTRO"])) || 
                           (agencia && cadastro ? `${agencia} ${cadastro}` : (agencia || cadastro || ""));

  return {
    producer_name: name,
    pendencias: cleanCSV(getField(row, ["PENDÊNCIAS", "PENDENCIAS", "OBS"])),
    serasa: cleanCSV(getField(row, ["RESTRIÇÃO", "RESTRICAO", "SERASA"])),
    cliente_renovacao: renovacaoVal,
    ano_contrato: cleanCSV(getField(row, ["ANO DO CONTRATO", "ANO CONTRATO"])),
    producer_cpf: cleanCSV(getField(row, ["CPF", "producer_cpf"])),
    agencia_cadastro: agenciaCadastro,
    municipio: cleanCSV(getField(row, ["MUNICÍPIO", "MUNICIPIO"])),
    estimated_value: parseBRLValue(getField(row, ["VALOR R$", "VALOR R", "VALOR", "estimated_value"])),
    linha_credito: automatedLinha,
    credit_program: cleanCSV(getField(row, ["PROGRAMA DE CRÉDITO", "PROGRAMA CREDITO", "LINHA DE CRÉDITO"])) || automatedLinha,
    localizacao: cleanCSV(getField(row, ["LOCALIZAÇÃO", "LOCALIZACAO"])),
    status: cleanCSV(getField(row, ["STATUS", "original_csv_status"])),
    original_csv_status: cleanCSV(getField(row, ["STATUS", "original_csv_status"])),
    notes: cleanCSV(getField(row, ["notes", "Observações", "Observaes"])),
    observacoes_extra: cleanCSV(getField(row, ["notes", "Observações", "Observaes"])),
    order_index: index,
  };
}

// ─── Main Component ────────────────────────────────────────────
export default function StockProposals() {
  const { proposals, loading, addProposal, addProposalsBulk, updateProposal, deleteProposal, deleteAllProposals, refreshProposals } = useStockProposals();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<StockProposal | null>(null);

  const [reportFilters, setReportFilters] = useState({
    municipio: "all",
    status: "all",
    projetista: "all"
  });
  const [importProjetista, setImportProjetista] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProjetista, setFilterProjetista] = useState("all");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<StockProposal>>({
    producer_name: "",
    producer_cpf: "",
    credit_program: "",
    estimated_value: 0,
    municipio: "",
    localizacao: "",
    linha_credito: "",
    notes: "",
    projetista: "",
    serasa: "NAO",
    pendencias: ""
  });

  const [editFormData, setEditFormData] = useState<Partial<StockProposal>>({});

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // ── Derived data ─────────────────────────────────
  const municipios = useMemo(() => {
    const set = new Set(proposals.map(p => p.municipio).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [proposals]);

  const statuses = useMemo(() => {
    const set = new Set(proposals.map(p => p.status).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [proposals]);

  const existingProjetistas = useMemo(() => {
    const set = new Set(proposals.map(p => p.projetista).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [proposals]);

  const filtered = useMemo(() => {
    let result = proposals;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => {
        const fields = [
          p.producer_name,
          p.producer_cpf,
          p.municipio,
          p.localizacao,
          p.pendencias,
          p.serasa,
          p.cliente_renovacao,
          p.ano_contrato,
          p.agencia_cadastro,
          p.linha_credito,
          p.credit_program,
          p.status,
          p.notes,
          p.observacoes_extra,
          p.estimated_value?.toString(),
        ];
        return fields.some(f => f?.toLowerCase().includes(q));
      });
    }
    if (filterMunicipio !== "all") {
      result = result.filter(p => p.municipio === filterMunicipio);
    }
    if (filterStatus !== "all") {
      result = result.filter(p => p.status === filterStatus);
    }
    if (filterProjetista !== "all") {
      result = result.filter(p => p.projetista === filterProjetista);
    }
    return result;
  }, [proposals, searchTerm, filterMunicipio, filterStatus, filterProjetista]);

  const totalEstimated = filtered.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);

  // ── CSV Import ─────────────────────────────────
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: false, // Parse as arrays first to find the header row
      skipEmptyLines: true,
      encoding: "ISO-8859-1",
      complete: async (results) => {
        try {
          const data = results.data as string[][];
          if (data.length === 0) {
            toast({ title: "CSV vazio", description: "O arquivo não contém dados.", variant: "destructive" });
            setIsImporting(false);
            return;
          }

          // 1. Find the header row (contains 'CLIENTE' or 'CPF' or 'Nº')
          let headerIndex = -1;
          for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            const isHeader = row.some(cell => {
              const c = (cell || "").toUpperCase().trim();
              return c === "Nº" || c === "CLIENTES" || c === "CPF" || c === "CLIENTE";
            });
            if (isHeader) {
              headerIndex = i;
              break;
            }
          }

          if (headerIndex === -1) {
            toast({ title: "Cabeçalho não encontrado", description: "Não foi possível identificar a linha de cabeçalho no CSV. Verifique se as colunas estão corretas.", variant: "destructive" });
            setIsImporting(false);
            return;
          }

          const headers = data[headerIndex].map(h => (h || "").trim());
          const records = data.slice(headerIndex + 1);
          
          const rows: Partial<InsertStockProposal>[] = [];
          let validIndex = proposals.length + 1;

          for (const record of records) {
            // Convert array record back to object using detected headers
            const rowObj: any = {};
            headers.forEach((h, idx) => {
              if (h) rowObj[h] = record[idx];
            });

            const mapped = mapCSVRow(rowObj, validIndex);
            if (mapped && mapped.producer_name) {
              rows.push({
                ...mapped,
                projetista: importProjetista || null
              });
              validIndex++;
            }
          }

          if (rows.length === 0) {
            toast({ title: "Nenhuma proposta válida", description: "Nenhuma linha de proposta válida foi encontrada no arquivo.", variant: "destructive" });
            setIsImporting(false);
            return;
          }

          await addProposalsBulk(rows as InsertStockProposal[]);
          toast({
            title: "Importação concluída",
            description: `${rows.length} propostas importadas com sucesso.`,
          });
          await refreshProposals();
        } catch (err: any) {
          console.error("CSV import error:", err);
          toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
        } finally {
          setIsImporting(false);
          setIsImportDialogOpen(false);
          setImportProjetista("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
        setIsImporting(false);
      }
    });
  };

  // ── Manual create ────────────────────────────
  const handleCreate = async () => {
    if (!formData.producer_name) return;
    setIsSubmitting(true);
    
    // Auto-linha logic for manual entry
    const isRenovacao = (formData.cliente_renovacao || '').toUpperCase().includes('SIM');
    const automatedLinha = isRenovacao ? 'PRONAF A 699' : 'PRONAF A 368';

    const newProposal: InsertStockProposal = {
      producer_name: formData.producer_name!,
      producer_cpf: formData.producer_cpf || null,
      credit_program: automatedLinha,
      estimated_value: formData.estimated_value || 0,
      notes: formData.notes || null,
      status: "novo",
      pendencias: null,
      serasa: null,
      cliente_renovacao: formData.cliente_renovacao || null,
      ano_contrato: null,
      agencia_cadastro: null,
      municipio: formData.municipio || null,
      linha_credito: automatedLinha,
      localizacao: formData.localizacao || null,
      observacoes_extra: null,
      projetista: formData.projetista || null,
      order_index: proposals.length > 0 ? proposals.map(p => p.order_index).reduce((a, b) => Math.max(a, b), 0) + 1 : 1,
    };
    const res = await addProposal(newProposal);
    if (res) {
      setIsDialogOpen(false);
      setFormData({ producer_name: "", producer_cpf: "", credit_program: "", estimated_value: 0, municipio: "", localizacao: "", linha_credito: "", notes: "", projetista: "", serasa: "NAO", pendencias: "" });
    }
    setIsSubmitting(false);
  };

  const openEditDialog = (proposal: StockProposal) => {
    setEditingProposal(proposal);
    setEditFormData({
      producer_name: proposal.producer_name,
      producer_cpf: proposal.producer_cpf,
      credit_program: proposal.credit_program,
      estimated_value: proposal.estimated_value,
      municipio: proposal.municipio,
      localizacao: proposal.localizacao,
      linha_credito: proposal.linha_credito,
      status: proposal.status,
      pendencias: proposal.pendencias,
      serasa: proposal.serasa,
      notes: proposal.notes,
      projetista: proposal.projetista
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingProposal || !editFormData.producer_name) return;
    setIsUpdating(true);
    const success = await updateProposal(editingProposal.id, editFormData);
    if (success) {
      setIsEditDialogOpen(false);
      setEditingProposal(null);
      toast({ title: "Proposta atualizada", description: "As alterações foram salvas com sucesso." });
    }
    setIsUpdating(false);
  };

  // ── Status helpers ──────────────────────────
  const getStatusStyle = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('pronto')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s.includes('autorizado')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('falta') || s.includes('flata')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'novo') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const generateProposalsReport = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    
    // Header
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 300, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("RELATÓRIO DE ESTOQUE - PRONAF", 15, 18);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`GERADO EM: ${timestamp}`, 15, 26);
    doc.text(`TOTAL DE PROPOSTAS: ${filtered.length}`, 15, 31);
    doc.text(`VOLUME TOTAL ESTIMADO: ${formatCurrency(totalEstimated)}`, 15, 36);

    // Filters Summary
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    let filterTxt = "FILTROS ATIVOS: ";
    if (searchTerm) filterTxt += `Busca: "${searchTerm}" | `;
    if (filterMunicipio !== "all") filterTxt += `Município: ${filterMunicipio} | `;
    if (filterStatus !== "all") filterTxt += `Status: ${filterStatus} | `;
    if (filterProjetista !== "all") filterTxt += `Projetista: ${filterProjetista} | `;
    if (filterTxt === "FILTROS ATIVOS: ") filterTxt += "Nenhum";
    doc.text(filterTxt, 15, 48);

    const tableData = filtered.map((p, idx) => [
      idx + 1,
      p.producer_name.toUpperCase(),
      p.producer_cpf || '---',
      p.projetista || 'N/A',
      p.municipio || '---',
      p.status.toUpperCase(),
      formatCurrency(p.estimated_value || 0)
    ]);

    autoTable(doc, {
      startY: 52,
      head: [["#", "NOME DO PRODUTOR", "CPF", "PROJETISTA", "MUNICÍPIO", "STATUS", "VALOR R$"]],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [79, 70, 229], // Indigo 600
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { fontStyle: 'bold', cellWidth: 80 },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] } // Slate 50
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Documento para uso interno - Sistema PRONAF Digital - Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`Relatorio_Estoque_${format(new Date(), "yyyyMMdd")}.pdf`);
    
    toast({
      title: "Relatório gerado",
      description: "O download do PDF começou automaticamente.",
    });
  };

  const generatePremiumReport = (filters: typeof reportFilters) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm");
    
    // Filter data specifically for this report run
    let reportData = proposals;
    if (filters.municipio !== "all") reportData = reportData.filter(p => p.municipio === filters.municipio);
    if (filters.status !== "all") reportData = reportData.filter(p => p.status === filters.status);
    if (filters.projetista !== "all") reportData = reportData.filter(p => p.projetista === filters.projetista);
    
    const totalVal = reportData.reduce((acc, p) => acc + (Number(p.estimated_value) || 0), 0);

    // ── Capa / Resumo Executivo ─────────────────────
    doc.setFillColor(7, 33, 20); // Deep Dark Green
    doc.rect(0, 0, 300, 50, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DASHBOARD DE ESTOQUE - PRONAF DIGITAL", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`DATA DE EMISSÃO: ${timestamp}`, 15, 30);
    doc.text(`PROJETISTA RESPONSÁVEL: ${filters.projetista === 'all' ? 'GERAL' : filters.projetista.toUpperCase()}`, 15, 35);

    // KPI Blocks (Graphic elements)
    const drawKPI = (x: number, y: number, title: string, value: string, color: [number, number, number]) => {
      doc.setFillColor(...color);
      doc.roundedRect(x, y, 65, 25, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), x + 5, y + 8);
      doc.setFontSize(14);
      doc.text(value, x + 5, y + 18);
    };

    drawKPI(15, 60, "Total de Propostas", reportData.length.toString(), [79, 70, 229]); // Indigo
    drawKPI(85, 60, "Volume Financeiro", formatCurrency(totalVal), [16, 185, 129]); // Emerald
    drawKPI(155, 60, "Ticket Médio", formatCurrency(reportData.length ? totalVal / reportData.length : 0), [245, 158, 11]); // Amber
    drawKPI(225, 60, "Municípios Atendidos", municipios.length.toString(), [124, 58, 237]); // Violet

    // Status Distribution Table (Mini graph-like summary)
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUIÇÃO POR STATUS", 15, 100);
    
    const statusCounts = statuses.map(s => {
      const count = reportData.filter(p => p.status === s).length;
      const pct = reportData.length ? Math.round((count / reportData.length) * 100) : 0;
      return [s.toUpperCase(), count, `${pct}%`];
    });

    autoTable(doc, {
      startY: 105,
      head: [["STATUS", "QUANTIDADE", "PERCENTUAL (%)"]],
      body: statusCounts,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: 15, right: 180 } // Small narrow table correctly aligned
    });

    // Detailed Table with auto-overflow to new pages
    doc.addPage();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 300, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("DETALHAMENTO ANALÍTICO DAS PROPOSTAS", 15, 10);

    const tableData = reportData.map((p, idx) => [
      idx + 1,
      p.producer_name.toUpperCase(),
      p.projetista || 'N/A',
      p.municipio || '---',
      p.linha_credito || '---',
      p.status.toUpperCase(),
      formatCurrency(p.estimated_value || 0)
    ]);

    autoTable(doc, {
      startY: 20,
      head: [["#", "NOME DO PRODUTOR", "PROJETISTA", "MUNICÍPIO", "LINHA", "STATUS", "VALOR R$"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 8, halign: 'center' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 0: { halign: 'center' }, 6: { halign: 'right', fontStyle: 'bold' } }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Emitido via PRONAF DIGITAL - ${timestamp} - Página ${i} de ${pageCount}`, 150, 205, { align: "center" });
    }

    doc.save(`Analise_Estoque_${format(new Date(), "yyyyMMdd")}.pdf`);
    setIsReportDialogOpen(false);
    toast({ title: "Relatório gerado com sucesso!" });
  };

  const normalizeText = (t: string) => t.normalize('NFKC').replace(/[^a-zA-Z]/g, '').toUpperCase();

  const getSerasaIcon = (serasa: string | null) => {
    if (!serasa) return null;
    const raw = serasa.trim();
    const norm = normalizeText(raw);
    // "NÃO", "NAO", or any broken encoding variant
    if (norm === 'NAO' || norm === 'NO' || raw.toUpperCase().includes('N') && (raw.includes('O') || raw.includes('o')) && !raw.toUpperCase().startsWith('S')) {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    }
    if (norm === 'SIM' || raw.toUpperCase() === 'SIM') {
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    }
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  };

  const getSerasaLabel = (serasa: string | null): string => {
    if (!serasa) return '';
    const norm = normalizeText(serasa.trim());
    if (norm === 'NAO' || norm === 'NO') return 'NÃO';
    if (norm === 'SIM') return 'SIM';
    return serasa;
  };

  const hasSerasaRestriction = (serasa: string | null) => getSerasaLabel(serasa) === 'SIM';

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-3 md:p-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full pb-20 md:pb-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 font-heading tracking-tight flex items-center gap-3">
            <Box className="h-6 w-6 md:h-8 md:w-8 text-indigo-600" />
            Propostas em Estoque
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Controle de propostas prontas para envio à central. Importe via CSV ou cadastre manualmente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Delete All */}
          {proposals.length > 0 && (
            <Button
              variant="outline"
              disabled={isDeleting}
              onClick={async () => {
                if (!confirm(`Tem certeza que deseja APAGAR TODAS as ${proposals.length} propostas do estoque?\n\nEssa ação não pode ser desfeita.`)) return;
                setIsDeleting(true);
                await deleteAllProposals();
                setIsDeleting(false);
              }}
              className="w-full sm:w-auto h-12 md:h-10 border-red-200 text-red-600 hover:bg-red-50 font-bold"
            >
              {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5 md:h-4 md:w-4" />}
              Apagar Todas
            </Button>
          )}

          {/* Report Generation */}
          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 md:h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
              >
                <FileText className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                  <FileText className="h-5 w-5" />
                  Configurar Relatório Premium
                </DialogTitle>
                <DialogDescription>
                  Personalize as informações que aparecerão no seu documento PDF profissional.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Filtrar por Projetista</Label>
                  <Select value={reportFilters.projetista} onValueChange={(v)=>setReportFilters({...reportFilters, projetista: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Projetistas</SelectItem>
                      {existingProjetistas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Município</Label>
                    <Select value={reportFilters.municipio} onValueChange={(v)=>setReportFilters({...reportFilters, municipio: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={reportFilters.status} onValueChange={(v)=>setReportFilters({...reportFilters, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3 mt-2">
                  <AlertTriangle className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div className="text-xs text-indigo-900 leading-relaxed">
                    <strong>Relatório de Gestão:</strong> O documento incluirá gráficos de resumo, KPIs financeiros e detalhamento analítico completo em formato PDF premium.
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => generatePremiumReport(reportFilters)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Download className="mr-2 h-4 w-4" />
                  Gerar PDF agora
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CSV Import */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isImporting}
                className="w-full sm:w-auto h-12 md:h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
              >
                {isImporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileSpreadsheet className="mr-2 h-5 w-5 md:h-4 md:w-4" />}
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                  <FileSpreadsheet className="h-5 w-5" />
                  Importação de Propostas
                </DialogTitle>
                <DialogDescription>
                  Selecione o projetista responsável por este lote e anexe o arquivo CSV.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-3">
                  <Label htmlFor="import-projetista" className="text-sm font-bold text-slate-700">1. Selecione o Projetista</Label>
                  <Select
                    value={importProjetista}
                    onValueChange={setImportProjetista}
                  >
                    <SelectTrigger id="import-projetista" className="w-full h-11 border-indigo-100 bg-indigo-50/30 focus:ring-indigo-500">
                      <SelectValue placeholder="Escolha um projetista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJETISTAS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-slate-700">2. Anexe o arquivo CSV</Label>
                  <div 
                    onClick={() => !isImporting && importProjetista && fileInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
                      ${!importProjetista ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' : 'bg-indigo-50/30 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 group'}
                    `}
                  >
                    <div className={`p-3 rounded-full ${!importProjetista ? 'bg-slate-100' : 'bg-white shadow-sm ring-4 ring-indigo-50 group-hover:scale-110 transition-transform'}`}>
                      <Upload className={`h-6 w-6 ${!importProjetista ? 'text-slate-400' : 'text-indigo-600'}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${!importProjetista ? 'text-slate-400' : 'text-indigo-900'}`}>Clique para selecionar o arquivo</p>
                      <p className="text-[10px] text-slate-500 mt-1">Formatos aceitos: .csv, .txt (Separado por vírgulas)</p>
                    </div>
                    {!importProjetista && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                        Selecione o projetista primeiro
                      </Badge>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleCSVImport}
                    disabled={isImporting || !importProjetista}
                  />
                </div>
              </div>
              {isImporting && (
                <div className="flex items-center justify-center gap-3 p-4 bg-indigo-50 rounded-lg animate-pulse">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  <span className="text-sm font-bold text-indigo-900">Processando arquivo...</span>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Manual Add */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide shadow-lg shadow-indigo-200 h-12 md:h-10">
                <Plus className="mr-2 h-5 w-5 md:h-4 md:w-4" />
                Nova Proposta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                  <Box className="h-5 w-5" />
                  Nova Proposta no Estoque
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produtor *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="name" className="pl-9" placeholder="Ex: João da Silva"
                      value={formData.producer_name}
                      onChange={(e) => setFormData({...formData, producer_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" placeholder="000.000.000-00"
                      value={formData.producer_cpf || ""}
                      onChange={(e) => setFormData({...formData, producer_cpf: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prog">Programa de Crédito</Label>
                    <Select
                      value={formData.credit_program || ""}
                      onValueChange={(val) => setFormData({...formData, credit_program: val})}
                    >
                      <SelectTrigger id="prog">
                        <SelectValue placeholder="Selecione o programa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMAS_CREDITO.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor R$</Label>
                    <Input id="value" type="number" placeholder="0,00"
                      value={formData.estimated_value || ""}
                      onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="municipio">Município</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="municipio" className="pl-9" placeholder="Nome do município"
                        value={formData.municipio || ""}
                        onChange={(e) => setFormData({...formData, municipio: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="localizacao">Localização</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="localizacao" className="pl-9" placeholder="Quadra, PA, Vila..."
                      value={formData.localizacao || ""}
                      onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projetista">Projetista Responsável</Label>
                  <Select
                    value={formData.projetista || ""}
                    onValueChange={(val) => setFormData({...formData, projetista: val})}
                  >
                    <SelectTrigger id="projetista" className="w-full">
                      <SelectValue placeholder="Selecione um projetista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJETISTAS.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <textarea id="notes"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Anotações..."
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={!formData.producer_name || isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-indigo-600" />
              Editar Proposta no Estoque
            </DialogTitle>
            <DialogDescription>
              Atualize as informações desta proposta. As alterações serão salvas imediatamente no banco de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Produtor</Label>
              <Input
                id="edit-name"
                value={editFormData.producer_name || ""}
                onChange={(e) => setEditFormData({...editFormData, producer_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={editFormData.producer_cpf || ""}
                onChange={(e) => setEditFormData({...editFormData, producer_cpf: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-municipio">Município</Label>
              <Input
                id="edit-municipio"
                value={editFormData.municipio || ""}
                onChange={(e) => setEditFormData({...editFormData, municipio: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-localizacao">Localização</Label>
              <Input
                id="edit-localizacao"
                value={editFormData.localizacao || ""}
                onChange={(e) => setEditFormData({...editFormData, localizacao: e.target.value})}
                placeholder="Ex: Assentamento X, Gleba Y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor Estimado (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                value={editFormData.estimated_value || 0}
                onChange={(e) => setEditFormData({...editFormData, estimated_value: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-prog">Programa de Crédito</Label>
              <Select
                value={editFormData.credit_program || ""}
                onValueChange={(val) => setEditFormData({...editFormData, credit_program: val})}
              >
                <SelectTrigger id="edit-prog">
                  <SelectValue placeholder="Selecione o programa..." />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMAS_CREDITO.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  <SelectItem value="OUTRO">OUTRO...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-serasa">Restrição (SIM/NAO)</Label>
              <Select
                value={editFormData.serasa || "NAO"}
                onValueChange={(val) => setEditFormData({...editFormData, serasa: val})}
              >
                <SelectTrigger id="edit-serasa">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">SIM</SelectItem>
                  <SelectItem value="NAO">NÃO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status Atual</Label>
              <Input
                id="edit-status"
                value={editFormData.status || ""}
                onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                placeholder="Ex: CADASTRADO, PENDENTE..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-pendencias">Pendências / Observações</Label>
              <textarea
                id="edit-pendencias"
                value={editFormData.pendencias || ""}
                onChange={(e) => setEditFormData({...editFormData, pendencias: e.target.value})}
                placeholder="Descreva as pendências ou observações relevantes..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "SALVAR ALTERAÇÕES"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Box className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-indigo-600/80 uppercase tracking-wider">Total</p>
                <h3 className="text-xl md:text-2xl font-black text-indigo-900">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : proposals.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-600/80 uppercase tracking-wider">Volume</p>
                <h3 className="text-lg md:text-xl font-black text-emerald-900 tabular-nums">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(totalEstimated)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-amber-600/80 uppercase tracking-wider">Filtrados</p>
                <h3 className="text-xl md:text-2xl font-black text-amber-900">
                  {filtered.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-violet-600/80 uppercase tracking-wider">Municípios</p>
                <h3 className="text-xl md:text-2xl font-black text-violet-900">
                  {municipios.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search & Filters ─── */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar em todos os campos..."
                className="pl-9 h-10 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                <SelectTrigger className="w-full md:w-[180px] h-10">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="Município" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[250px]">
                  <SelectItem value="all">Todos os Municípios</SelectItem>
                  {municipios.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Proposals List ─── */}
      <Card className="shadow-md border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-slate-500" />
              Relação de Estoque
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-white">
              {filtered.length} de {proposals.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Box className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">
                {proposals.length === 0 ? "Estoque vazio" : "Nenhum resultado"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {proposals.length === 0
                  ? "Importe um CSV ou cadastre propostas manualmente."
                  : "Altere os filtros para ver mais resultados."
                }
              </p>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80">
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">#</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">PRODUTOR / CPF</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">PROJETISTA</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">LOCALIDADE</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">PROGRAMA DE CRÉDITO</th>
                      <th className="text-center p-3 font-bold text-slate-600 text-xs tracking-wider">RESTRIÇÃO</th>
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">STATUS</th>
                      <th className="text-center p-3 font-bold text-slate-600 text-xs tracking-wider">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((p, idx) => {
                      const restriction = hasSerasaRestriction(p.serasa);
                      return (
                      <tr key={p.id} className={`transition-colors group ${restriction ? 'bg-red-50/80 hover:bg-red-100/80' : 'hover:bg-indigo-50/30'}`}>
                        <td className={`p-3 text-slate-400 font-mono text-xs align-top ${restriction ? 'border-l-2 border-red-500' : ''}`}>{idx + 1}</td>
                        <td className="p-3 align-top min-w-[200px]">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-2" title={p.producer_name}>{p.producer_name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border border-slate-200 shadow-sm">CPF</span>
                              <span className="text-xs text-slate-500 font-mono tracking-tight">{p.producer_cpf}</span>
                            </div>
                            {p.pendencias && (
                              <div className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1 w-fit mt-1 border border-amber-200">
                                <AlertTriangle className="h-3 w-3" /> {p.pendencias}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{p.projetista || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3 align-top min-w-[200px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-start gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase min-w-[55px] mt-0.5 tracking-wider">Agência</span>
                              <span className="text-xs font-semibold text-slate-700 line-clamp-1" title={p.agencia_cadastro || ''}>{p.agencia_cadastro}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase min-w-[55px] mt-0.5 tracking-wider">Município</span>
                              <span className="text-xs text-slate-600 line-clamp-1" title={p.municipio || ''}>{p.municipio}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase min-w-[55px] mt-0.5 tracking-wider">Localização</span>
                              <span className="text-xs text-slate-500 line-clamp-1" title={p.localizacao || ''}>{p.localizacao}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top min-w-[140px]">
                          <div className="flex flex-col gap-2">
                            <div>
                               <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Valor R$</span>
                               <span className="font-bold text-emerald-700 tabular-nums text-sm bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shadow-sm inline-block min-h-[26px]">
                                 {p.estimated_value ? formatCurrency(Number(p.estimated_value)) : ''}
                               </span>
                            </div>
                            <div>
                               <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Programa</span>
                               <span className="text-xs text-slate-600 font-medium min-h-[16px] block">{p.credit_program}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top min-w-[150px]">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3 min-h-[20px]">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Restrição</span>
                              {restriction ? (
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1 rounded-full text-[10px] uppercase shadow-sm px-2">
                                  <XCircle className="h-3 w-3" /> SIM
                                </Badge>
                              ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                  {getSerasaIcon(p.serasa)}
                                  <span className="text-xs font-semibold">{getSerasaLabel(p.serasa)}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 min-h-[28px]">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Programa de Crédito</span>
                              <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 shadow-sm truncate max-w-[120px]" title={`${p.credit_program || ''} ${p.ano_contrato || ''}`.trim()}>
                                {p.credit_program || ''} {p.ano_contrato || ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Status</span>
                            <Badge variant="outline" className={`text-[10px] font-bold ${getStatusStyle(p.status)} border w-fit`}>
                              {p.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-center align-top min-w-[100px]">
                          <div className="flex items-center justify-center gap-2">
                             <Button
                               variant="outline" size="icon"
                               className="h-8 w-8 text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:text-indigo-700 transition-colors shadow-sm"
                               title="Editar Proposta"
                               onClick={() => openEditDialog(p)}
                             >
                               <Edit2 className="h-3.5 w-3.5" />
                             </Button>
                             {!(p.status || '').toUpperCase().includes("AUTORIZADO") ? (
                               <Button
                                 variant="outline" size="icon"
                                 className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm"
                                 title="Autorizar Envio para Central"
                                 onClick={() => {
                                   if (confirm('Autorizar o envio desta proposta para a central?')) {
                                     updateProposal(p.id, { status: "AUTORIZADO ENVIO PARA CENTRAL" });
                                   }
                                 }}
                               >
                                 <ShieldCheck className="h-3.5 w-3.5" />
                               </Button>
                             ) : (
                               <Button
                                 variant="outline" size="icon"
                                 className="h-8 w-8 text-amber-600 border-amber-200 bg-amber-50/50 hover:bg-amber-100 hover:text-amber-700 transition-colors shadow-sm"
                                 title="Reverter para Status Antigo"
                                 onClick={() => {
                                   if (confirm('Deseja reverter para o status original do sistema?')) {
                                     updateProposal(p.id, { status: p.original_csv_status || 'novo' });
                                   }
                                 }}
                               >
                                 <RotateCcw className="h-3.5 w-3.5" />
                               </Button>
                             )}
                             <Button
                               variant="outline" size="icon"
                               className="h-8 w-8 text-slate-400 border-slate-200 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                               title="Remover do Estoque"
                               onClick={() => {
                                 if (confirm('Remover esta proposta do estoque?')) deleteProposal(p.id);
                               }}
                             >
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {filtered.map((p, idx) => {
                  const restriction = hasSerasaRestriction(p.serasa);
                  return (
                  <div key={p.id} className={`p-4 ${restriction ? 'bg-red-50/80 border-l-4 border-l-red-500' : ''}`}>
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedCard(expandedCard === p.id ? null : p.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-slate-400 font-mono">{idx + 1}</span>
                          <h4 className="font-bold text-slate-900 truncate text-sm">{p.producer_name}</h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.status && (
                            <Badge variant="outline" className={`text-[9px] font-bold ${getStatusStyle(p.status)} border`}>
                              {p.status}
                            </Badge>
                          )}
                          {p.municipio && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {p.municipio}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="font-black text-sm text-indigo-700 tabular-nums">
                          {p.estimated_value ? formatCurrency(Number(p.estimated_value)) : ''}
                        </span>
                        {expandedCard === p.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {expandedCard === p.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {p.producer_cpf && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">CPF</span>
                            <span className="font-mono text-slate-700">{p.producer_cpf}</span>
                          </div>
                        )}
                        {p.localizacao && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Localização</span>
                            <span className="text-slate-700">{p.localizacao}</span>
                          </div>
                        )}
                        {p.linha_credito && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Programa de Crédito</span>
                            <span className="text-slate-700">{p.linha_credito}</span>
                          </div>
                        )}
                        {p.serasa && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Restrição</span>
                            {restriction ? (
                               <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1 rounded-full text-[10px] uppercase shadow-sm">
                                 <XCircle className="h-3 w-3" /> SIM
                               </Badge>
                            ) : (
                              <span className="flex items-center gap-1">{getSerasaIcon(p.serasa)} {getSerasaLabel(p.serasa)}</span>
                            )}
                          </div>
                        )}
                        {p.pendencias && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Pendências</span>
                            <span className="text-amber-600">{p.pendencias}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Projetista</span>
                          <span className="text-indigo-600 font-bold uppercase">{p.projetista || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Programa de Crédito</span>
                          <span className="text-slate-700">{p.credit_program || ''} {p.ano_contrato ? `(${p.ano_contrato})` : ''}</span>
                        </div>
                        {p.agencia_cadastro && (
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Ag. Cadastro</span>
                            <span className="text-slate-700">{p.agencia_cadastro}</span>
                          </div>
                        )}
                        {p.notes && (
                          <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-1">{p.notes}</div>
                        )}
                        <div className="pt-2 flex flex-col gap-2">
                          <Button
                            variant="outline" size="sm"
                            className="w-full h-10 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 font-bold text-xs"
                            onClick={() => openEditDialog(p)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            EDITAR DADOS DA PROPOSTA
                          </Button>
                          {!(p.status || '').toUpperCase().includes("AUTORIZADO") ? (
                            <Button
                              variant="outline" size="sm"
                              className="w-full h-10 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold text-xs"
                              onClick={() => {
                                if (confirm('Autorizar o envio desta proposta para a central?')) {
                                  updateProposal(p.id, { status: "AUTORIZADO ENVIO PARA CENTRAL" });
                                }
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              AUTORIZAR ENVIO PARA CENTRAL
                            </Button>
                          ) : (
                            <Button
                              variant="outline" size="sm"
                              className="w-full h-10 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 font-bold text-xs"
                              onClick={() => {
                                if (confirm('Deseja reverter para o status original do sistema?')) {
                                  updateProposal(p.id, { status: p.original_csv_status || 'novo' });
                                }
                              }}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              REVERTER AUTORIZAÇÃO
                            </Button>
                          )}
                          <Button
                            variant="outline" size="sm"
                            className="w-full h-10 text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold"
                            onClick={() => {
                              if (confirm('Remover esta proposta do estoque?')) deleteProposal(p.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover do Estoque
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
