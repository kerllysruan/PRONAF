import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProposals } from "@/hooks/useProposals";
import { useAgency } from "@/contexts/AgencyContext";
import { FileUp, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download, Search } from "lucide-react";
import Papa from "papaparse";
import { REQUIRED_DOCUMENTS } from "@/types/proposal";

interface ImportProposalsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportProposalsDialog({ open, onOpenChange }: ImportProposalsDialogProps) {
    const { user } = useAuth();
    const { effectiveAgencyId } = useAgency();
    const { refetch } = useProposals();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<{ total: number; success: number; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (open) {
            console.log("Dialog Aberto. Estado:", { user: !!user, agency: effectiveAgencyId, file: !!file });
            // alert("DEBUG: DIALOG DE IMPORTACÃO CARREGADO");
        }
    }, [open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const isCSV = selectedFile.name.toLowerCase().endsWith('.csv') || selectedFile.type === "text/csv";
            if (isCSV) {
                setFile(selectedFile);
                setStats(null);
                setProgress(0);
            } else {
                toast({
                    title: "Formato inválido",
                    description: "Por favor, selecione um arquivo .CSV",
                    variant: "destructive",
                });
            }
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

    const sanitizeNumber = (val: any): number => {
        if (val === null || val === undefined || val === "") return 0;
        if (typeof val === "number") return val;
        // Handle Brazilian format: "49.999,62" -> "49999.62"
        const clean = val.toString()
            .replace(/\./g, "")       // Remove dots (thousands)
            .replace(",", ".")        // Replace comma with dot (decimal)
            .replace(/[^\d.]/g, "");  // Remove everything else except digits and dot
        return parseFloat(clean) || 0;
    };

    const mapRow = (row: any) => {
        try {
            const getField = (keys: string[]) => {
                for (const key of keys) {
                    // Try exact match first, then case-insensitive
                    if (row[key] !== undefined && row[key] !== null) return row[key];

                    // Fallback search for keys that might have different case
                    const lowercaseKey = key.toLowerCase();
                    const actualKey = Object.keys(row).find(k => k.toLowerCase() === lowercaseKey);
                    if (actualKey) return row[actualKey];
                }
                return "";
            };

            const targetAgency = effectiveAgencyId && effectiveAgencyId !== "all" ? effectiveAgencyId : null;

            // Mapping with support for corrupted encoding strings provided by user
            return {
                producer_name: getField(["Nome", "producer_name", "NOME"]) || "Sem Nome",
                producer_cpf: getField(["Cpf/Cnpj", "CPF", "producer_cpf"]).toString().replace(/[^\d]/g, "") || "00000000000",
                requested_value: sanitizeNumber(getField(["Valor", "valor", "requested_value"])),
                pronaf_line: getField(["Programa Crédito", "Programa Cr閐ito", "Programa Crdito", "pronaf_line"]) || "custeio",
                producer_address: getField(["producer_address", "Endereço", "Endereo"]) || "",
                producer_phone: getField(["producer_phone", "Telefone"]) || "",
                project_designer: getField(["project_designer", "Projetista"]) || null,
                entry_date: getField(["Data Início", "Data In韈io", "Data Incio", "entry_date", "Data In韈io"]) || new Date().toISOString().split('T')[0],
                sicad: getField(["SICAD", "sicad"]).toString(),
                proposal_number: getField(["Número Proposta", "N鷐ero Proposta", "Nmero Proposta", "proposal_number"]).toString(),
                notes: getField(["notes", "Observações", "Observaes"]) || "",
                agency_id: targetAgency,
                created_by: user?.id,
                status: "nova" as const,
                // Extra fields from export headers (including corrupted versions)
                credit_program: getField(["Programa Crédito", "Programa Cr閐ito", "Programa Crdito"]),
                request_type: getField(["Tipo Solicitação", "Tipo Solicita玢o", "Tipo Solicitao"]),
                agency_code: getField(["Código Agência", "C骴igo Ag阯cia", "Cdigo Agncia"]),
                agency_name: getField(["Nome Agência", "Nome Agncia"]),
                task: getField(["Tarefa"]),
                central_date: getField(["Data Central"]),
                activity_start_date: getField(["Data Início da Atividade", "Data In韈io da Atividade", "Data Incio da Atividade"]),
                last_analyst: getField(["Último Analista", "趌timo Analista", "ltimo Analista"]),
                owner: getField(["Dono"]),
                originator: getField(["Originador"]),
                current_state: getField(["Estado"]),
                category: getField(["Categoria"]),
                client_size: getField(["Porte do Cliente"]),
                credit_purpose: getField(["Finalidade do Crédito", "Finalidade do Cr閐ito", "Finalidade do Crdito"]),
                resource_application: getField(["Aplicação de Recursos", "Aplica玢o de Recursos", "Aplicao de Recursos"]),
                special_treatment: getField(["Tratamento Especial"]),
                // New fields from latest user request
                superintendence_code: getField(["Código Superintendência", "C骴igo Superintend阯cia"]),
                superintendence_name: getField(["Nome Superintendencia"]),
                microcredit: getField(["Microcrédito", "Microcrito"]),
                renegotiation_type: getField(["Tipo Renegociação", "Tipo Renegocia玢o"]),
                guarantee_type: getField(["Tipo de Garantia"]),
                registration_central_task: getField(["Tarefa Central de Cadastro"]),
                judicial_period: getField(["Prazo Judicial"]),
                requesting_unit: getField(["Unidade Solicitante"]),
                agreement: getField(["Convênio", "Conv阯io"]),
                culture: getField(["Cultura"]),
                roc_type: getField(["Tipo ROC"]),
                poa_prd_subject: getField(["Assunto POA/PRD"]),
                activity_id: getField(["ID Atividade"]),
            };
        } catch (e) {
            console.error("Erro fundamental no mapeamento:", e, row);
            return null;
        }
    };

    const runImport = async (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log("HANDLER TRIGGERED. State:", { file: !!file, user: !!user, agency: effectiveAgencyId });

        const destAgency = effectiveAgencyId === "all" ? null : effectiveAgencyId;

        if (!file || !user || !destAgency) {
            const missing = [];
            if (!file) missing.push("Arquivo (CSV)");
            if (!user) missing.push("Usuário (Auth)");
            if (!destAgency) missing.push("Agência (Filtro Superior)");

            const msg = `Não é possível iniciar. Faltando: ${missing.join(", ")}`;
            alert(msg);
            toast({ title: "Atenção", description: "Verifique o arquivo e o filtro de agência.", variant: "destructive" });
            return;
        }

        alert(`IMPORTAÇÃO INICIADA! Processando: ${file.name}`);

        setIsImporting(true);
        setProgress(0);
        setStats(null);

        try {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                delimiter: "", // Auto-detect
                encoding: "ISO-8859-1",
                complete: async (results) => {
                    try {
                        const rows = results.data as any[];
                        if (rows.length === 0) {
                            setIsImporting(false);
                            alert("Arquivo vazio ou erro de leitura.");
                            return;
                        }

                        const total = rows.length;
                        let successCount = 0;
                        const errors: any[] = [];
                        const BATCH_SIZE = 50;

                        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                            const batch = rows.slice(i, i + BATCH_SIZE);
                            const proposalsToInsert = batch.map(mapRow).filter(p => p !== null);

                            const { data: newProposals, error: insertError } = await supabase
                                .from("proposals")
                                .insert(proposalsToInsert)
                                .select("id");

                            if (insertError) {
                                errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: insertError.message });
                            } else if (newProposals) {
                                successCount += newProposals.length;
                                const allDocs = newProposals.flatMap((p) =>
                                    REQUIRED_DOCUMENTS.map((name) => ({
                                        proposal_id: p.id,
                                        name,
                                        completed: false,
                                    }))
                                );
                                await supabase.from("proposal_documents").insert(allDocs);
                            }
                            setProgress(Math.round(((i + batch.length) / total) * 100));
                        }

                        setStats({ total, success: successCount, errors });
                        setIsImporting(false);
                        if (successCount > 0) refetch(true);
                        toast({ title: "Importação Concluída", description: `${successCount} processadas.` });
                    } catch (e: any) { alert("Erro processando: " + e.message); setIsImporting(false); }
                },
                error: (e) => { alert("Erro PapaParse: " + e.message); setIsImporting(false); }
            });
        } catch (e: any) { alert("Erro fatal: " + e.message); setIsImporting(false); }
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
                        Selecione uma agência no filtro do topo e depois um arquivo CSV.
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
                            <p className="text-sm font-bold text-foreground">{file ? file.name : "Clique para selecionar o CSV"}</p>
                        </div>
                    )}

                    {isImporting && (
                        <div className="space-y-4 py-8">
                            <div className="flex justify-between items-end">
                                <p className="text-sm font-bold">Processando {progress}%...</p>
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            </div>
                            <Progress value={progress} className="h-3 rounded-full" />
                        </div>
                    )}

                    {stats && (
                        <div className="bg-card/50 rounded-3xl p-6 border border-border/40 space-y-4 animate-in zoom-in-95">
                            <h4 className="font-bold">Resultado: {stats.success} Sucessos / {stats.errors.length} Erros</h4>
                            {stats.errors.length > 0 && (
                                <div className="text-[10px] text-rose-600 max-h-32 overflow-y-auto">
                                    {stats.errors.map((e, i) => <p key={i}>Lote {e.batch}: {e.error}</p>)}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {!stats && !isImporting && (
                            <Button
                                onClick={(e) => {
                                    console.log("CLICK EVENT");
                                    runImport(e);
                                }}
                                onPointerDown={(e) => {
                                    console.log("POINTER DOWN EVENT");
                                }}
                                disabled={!file}
                                className="h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-base gap-3"
                            >
                                <FileUp className="h-5 w-5" />
                                {file ? "Clique para Iniciar" : "Selecione o CSV"}
                            </Button>
                        )}
                        <Button variant="ghost" onClick={downloadTemplate} className="font-bold">Baixar Modelo CSV</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
