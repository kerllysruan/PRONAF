import { useState, useRef, useMemo } from "react";
import { useStockProposals } from "@/hooks/useStockProposals";
import { InsertStockProposal, StockProposal } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Box, Calendar, FileText, Trash2, User, Landmark,
  Upload, Search, Filter, MapPin, AlertTriangle, CheckCircle2, XCircle, ShieldCheck,
  FileSpreadsheet, Download, Eye, ChevronDown, ChevronUp, Users, Hash, Send, RotateCcw
} from "lucide-react";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const PROJETISTAS = ["NEY MEDEIRO", "JAIRO SANTANA", "CLEDSO CLOVIS"];

function cleanCSV(str: string | undefined): string | null {
  if (!str) return null;
  const clean = fixBrokenEncoding(str.trim());
  // Filter out CSV noise characters
  if (!clean || clean === '-' || clean === '\uFFFD' || clean === '') return null;
  return clean;
}

function mapCSVRow(cols: string[], index: number): Partial<InsertStockProposal> | null {
  // cols: [Nº, CLIENTES, PENDÊNCIAS, SERASA, CLIENTE RENOVAÇÃO, ANO DO CONTRATO, CPF, AGÊNCIA CADASTRO, MUNICÍPIO, VALOR R$, LINHA DE CRÉDITO, LOCALIZAÇÃO, STATUS, extra?]
  const name = cleanCSV(cols[1]);
  if (!name || /^CLIENTES?$/i.test(name)) return null; // skip header
  const num = cleanCSV(cols[0]);
  if (!num || isNaN(Number(num))) return null; // skip title rows

  return {
    producer_name: name,
    pendencias: cleanCSV(cols[2]),
    serasa: cleanCSV(cols[3]),
    cliente_renovacao: cleanCSV(cols[4]),
    ano_contrato: cleanCSV(cols[5]),
    producer_cpf: cleanCSV(cols[6]),
    agencia_cadastro: cleanCSV(cols[7]),
    municipio: cleanCSV(cols[8]),
    estimated_value: parseBRLValue(cols[9] || ''),
    linha_credito: cleanCSV(cols[10]),
    credit_program: cleanCSV(cols[10]), // same as linha
    localizacao: cleanCSV(cols[11]),
    status: cleanCSV(cols[12]),
    original_csv_status: cleanCSV(cols[12]),
    notes: cleanCSV(cols[13]),
    observacoes_extra: cleanCSV(cols[13]),
    order_index: index,
  };
}

// ─── Main Component ────────────────────────────────────────────
export default function StockProposals() {
  const { proposals, loading, addProposal, addProposalsBulk, updateProposal, deleteProposal, deleteAllProposals, refreshProposals } = useStockProposals();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importProjetista, setImportProjetista] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    projetista: ""
  });

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
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const rows: Partial<InsertStockProposal>[] = [];

      let validIndex = proposals.length + 1;
      for (const line of lines) {
        const cols = parseCSVLine(line);
        const mapped = mapCSVRow(cols, validIndex);
        if (mapped && mapped.producer_name) {
          rows.push({
            ...mapped,
            projetista: importProjetista || null
          });
          validIndex++;
        }
      }

      if (rows.length === 0) {
        toast({ title: "CSV vazio", description: "Nenhuma linha válida encontrada no arquivo.", variant: "destructive" });
        return;
      }

      // Delete existing proposals before importing if not empty to prevent dupes/messing up index, or just append 
      // let's just append as before
      try {
        await addProposalsBulk(rows as InsertStockProposal[]);
        
        toast({
          title: "Importação concluída",
          description: `${rows.length} propostas importadas com sucesso. A ordem foi mantida idêntica ao arquivo.`,
        });
      } catch (err: any) {
        throw new Error(`Falha na importação: ${err.message}`);
      }

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
  };

  // ── Manual create ────────────────────────────
  const handleCreate = async () => {
    if (!formData.producer_name) return;
    setIsSubmitting(true);
    const newProposal: InsertStockProposal = {
      producer_name: formData.producer_name!,
      producer_cpf: formData.producer_cpf || null,
      credit_program: formData.credit_program || formData.linha_credito || null,
      estimated_value: formData.estimated_value || 0,
      notes: formData.notes || null,
      status: "novo",
      pendencias: null,
      serasa: null,
      cliente_renovacao: null,
      ano_contrato: null,
      agencia_cadastro: null,
      municipio: formData.municipio || null,
      linha_credito: formData.linha_credito || null,
      localizacao: formData.localizacao || null,
      observacoes_extra: null,
      projetista: formData.projetista || null,
      order_index: proposals.length > 0 ? proposals.map(p => p.order_index).reduce((a, b) => Math.max(a, b), 0) + 1 : 1,
    };
    const res = await addProposal(newProposal);
    if (res) {
      setIsDialogOpen(false);
      setFormData({ producer_name: "", producer_cpf: "", credit_program: "", estimated_value: 0, municipio: "", localizacao: "", linha_credito: "", notes: "", projetista: "" });
    }
    setIsSubmitting(false);
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
          <Button
            variant="outline"
            onClick={generateProposalsReport}
            className="w-full sm:w-auto h-12 md:h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
          >
            <FileText className="mr-2 h-5 w-5 md:h-4 md:w-4" />
            Relatório
          </Button>

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
                    <Label htmlFor="value">Valor R$</Label>
                    <Input id="value" type="number" placeholder="0,00"
                      value={formData.estimated_value || ""}
                      onChange={(e) => setFormData({...formData, estimated_value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="linha">Linha de Crédito</Label>
                    <Input id="linha" placeholder="Ex: PRONAF A"
                      value={formData.linha_credito || ""}
                      onChange={(e) => setFormData({...formData, linha_credito: e.target.value, credit_program: e.target.value})}
                    />
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
                      <th className="text-left p-3 font-bold text-slate-600 text-xs tracking-wider">PROJETO</th>
                      <th className="text-center p-3 font-bold text-slate-600 text-xs tracking-wider">RESTRIÇÃO / SERASA</th>
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
                              <span className="text-[9px] text-slate-400 font-bold uppercase min-w-[55px] mt-0.5 tracking-wider">Localiza.</span>
                              <span className="text-xs text-slate-500 line-clamp-1" title={p.localizacao || ''}>{p.localizacao}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top min-w-[140px]">
                          <div className="flex flex-col gap-2">
                            <div>
                               <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Valor</span>
                               <span className="font-bold text-emerald-700 tabular-nums text-sm bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shadow-sm inline-block min-h-[26px]">
                                 {p.estimated_value ? formatCurrency(Number(p.estimated_value)) : ''}
                               </span>
                            </div>
                            <div>
                               <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Linha</span>
                               <span className="text-xs text-slate-600 font-medium min-h-[16px] block">{p.linha_credito}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top min-w-[150px]">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between gap-3 min-h-[20px]">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Serasa</span>
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
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Renovação</span>
                              <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 shadow-sm truncate max-w-[80px]" title={`${p.cliente_renovacao || ''} ${p.ano_contrato || ''}`.trim()}>
                                {p.cliente_renovacao || ''} {p.ano_contrato || ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5 tracking-wider">Situação</span>
                            <Badge variant="outline" className={`text-[10px] font-bold ${getStatusStyle(p.status)} border w-fit`}>
                              {p.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3 text-center align-top min-w-[100px]">
                          <div className="flex items-center justify-center gap-2">
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
                            <span className="text-slate-500">Linha</span>
                            <span className="text-slate-700">{p.linha_credito}</span>
                          </div>
                        )}
                        {p.serasa && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Serasa</span>
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
                          <span className="text-slate-500">Renovação</span>
                          <span className="text-slate-700">{p.cliente_renovacao || ''} {p.ano_contrato ? `(${p.ano_contrato})` : ''}</span>
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
