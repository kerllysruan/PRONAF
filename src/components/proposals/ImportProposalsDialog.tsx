import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProposals } from "@/hooks/useProposals";
import { FileUp, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react";
import Papa from "papaparse";
import { REQUIRED_DOCUMENTS } from "@/types/proposal";

interface ImportProposalsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportProposalsDialog({ open, onOpenChange }: ImportProposalsDialogProps) {
    const { user, agencyId } = useAuth();
    const { refetch } = useProposals();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<{ total: number; success: number; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "text/csv") {
            setFile(selectedFile);
            setStats(null);
            setProgress(0);
        } else if (selectedFile) {
            toast({
                title: "Formato inválido",
                description: "Por favor, selecione um arquivo CSV.",
                variant: "destructive",
            });
        }
    };

    const downloadTemplate = () => {
        const headers = [
            "producer_name",
            "producer_cpf",
            "requested_value",
            "pronaf_line",
            "producer_address",
            "producer_phone",
            "project_designer",
            "entry_date",
            "sicad",
            "proposal_number",
            "notes"
        ];
        const csvContent = headers.join(",") + "\nJoão da Silva,123.456.789-01,50000.00,custeio,Sítio Esperança,(88) 99999-9999,ney_medeiros,2024-02-21,12345678,2024/001,Pendente assinatura";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "modelo_importacao_pronaf.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const runImport = async () => {
        if (!file || !user || !agencyId) return;

        setIsImporting(true);
        setProgress(0);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                const total = rows.length;
                let successCount = 0;
                const errors: any[] = [];

                // Process in batches of 50
                const BATCH_SIZE = 50;

                for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                    const batch = rows.slice(i, i + BATCH_SIZE);

                    const proposalsToInsert = batch.map((row) => ({
                        producer_name: row.producer_name || "Sem Nome",
                        producer_cpf: row.producer_cpf || "000.000.000-00",
                        requested_value: parseFloat(row.requested_value) || 0,
                        pronaf_line: row.pronaf_line || "custeio",
                        producer_address: row.producer_address || "",
                        producer_phone: row.producer_phone || "",
                        project_designer: row.project_designer || null,
                        entry_date: row.entry_date || new Date().toISOString().split('T')[0],
                        sicad: row.sicad || "",
                        proposal_number: row.proposal_number || "",
                        notes: row.notes || "",
                        agency_id: agencyId,
                        created_by: user.id,
                        status: "nova" as const,
                    }));

                    const { data: newProposals, error: insertError } = await supabase
                        .from("proposals")
                        .insert(proposalsToInsert)
                        .select("id");

                    if (insertError) {
                        errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: insertError.message });
                    } else if (newProposals) {
                        successCount += newProposals.length;

                        // Create documents for each in parallel but small batches
                        const allDocs = newProposals.flatMap((p) =>
                            REQUIRED_DOCUMENTS.map((name) => ({
                                proposal_id: p.id,
                                name,
                                completed: false,
                            }))
                        );

                        const { error: docsError } = await supabase.from("proposal_documents").insert(allDocs);
                        if (docsError) console.error("Erro ao criar documentos:", docsError);
                    }

                    setProgress(Math.round(((i + batch.length) / total) * 100));
                }

                setStats({ total, success: successCount, errors });
                setIsImporting(false);
                if (successCount > 0) refetch(true);

                toast({
                    title: "Importação Concluída",
                    description: `${successCount} propostas importadas com sucesso.`,
                });
            },
            error: (error) => {
                console.error("Erro PapaParse:", error);
                setIsImporting(false);
                toast({
                    title: "Erro ao ler arquivo",
                    description: error.message,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/40 shadow-premium rounded-[2rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-black font-heading tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        Importação Massiva
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground pt-2">
                        Selecione um arquivo CSV seguindo o modelo padrão para importar propostas em lote.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 py-4 space-y-6">
                    {!stats && !isImporting && (
                        <div
                            className="border-2 border-dashed border-muted/50 rounded-3xl p-12 text-center space-y-4 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                className="hidden"
                                accept=".csv"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                                <FileUp className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">
                                    {file ? file.name : "Clique para selecionar ou arraste aqui"}
                                </p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                                    Apenas arquivos .CSV (máx 10MB)
                                </p>
                            </div>
                        </div>
                    )}

                    {isImporting && (
                        <div className="space-y-4 py-8">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-foreground">Processando propostas...</p>
                                    <p className="text-xs text-muted-foreground">{progress}% concluído</p>
                                </div>
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            </div>
                            <Progress value={progress} className="h-3 rounded-full bg-muted shadow-inner" />
                        </div>
                    )}

                    {stats && (
                        <div className="bg-card/50 rounded-3xl p-6 border border-border/40 space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-foreground">Resultado da Importação</h4>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Total processado: {stats.total}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Sucesso</p>
                                    <p className="text-2xl font-black text-emerald-700 leading-none">{stats.success}</p>
                                </div>
                                <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Erros</p>
                                    <p className="text-2xl font-black text-rose-700 leading-none">{stats.errors.length}</p>
                                </div>
                            </div>

                            {stats.errors.length > 0 && (
                                <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 max-h-32 overflow-y-auto scrollbar-thin">
                                    <p className="text-[10px] font-black uppercase text-rose-600 mb-2 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" /> Detalhes dos Erros
                                    </p>
                                    {stats.errors.map((err, idx) => (
                                        <p key={idx} className="text-[11px] text-rose-700/80 font-medium border-l-2 border-rose-200 pl-2 mb-2">
                                            Lote {err.batch}: {err.error}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {!stats && !isImporting && (
                            <Button
                                onClick={runImport}
                                disabled={!file}
                                className="h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-base gap-3"
                            >
                                <FileUp className="h-5 w-5" />
                                Iniciar Importação
                            </Button>
                        )}
                        {stats && (
                            <Button
                                onClick={() => onOpenChange(false)}
                                className="h-14 rounded-2xl bg-foreground text-background shadow-lg shadow-foreground/10 hover:shadow-foreground/20 transition-all font-black text-base"
                            >
                                Fechar Relatório
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={downloadTemplate}
                            className="h-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/5 font-bold gap-2 text-sm"
                        >
                            <Download className="h-4 w-4" />
                            Baixar Modelo CSV
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/40 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                        PRONAF • Bulk Data Processor
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
