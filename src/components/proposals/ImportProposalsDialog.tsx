import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProposals } from "@/hooks/useProposals";
import { useAgency } from "@/contexts/AgencyContext";
import { FileUp, FileSpreadsheet, Loader2 } from "lucide-react";
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
        // Modelo baseado no formato exportado pelo sistema BNB/Sicad
        const headers = [
            "Nome","Cpf/Cnpj","SICAD","Programa Crédito","Tipo Solicitação",
            "Código Agência","Nome Agência","Tarefa","Data Central",
            "Data Início da Atividade","Valor","Último Analista","Dono",
            "Originador","Estado","Data Início","Categoria","Porte do Cliente",
            "Central","Código Superintendência","Nome Superintendencia",
            "Microcrédito","Tipo Renegociação","Tipo de Garantia",
            "Número Proposta","Finalidade do Crédito","Tarefa Central de Cadastro",
            "Dt. Inicio Ativ. C.Cadastro","Aplicação de Recursos",
            "Tratamento Especial","Prazo Judicial","Unidade Solicitante",
            "Convênio","Cultura","Tipo ROC","Assunto POA/PRD","ID Atividade"
        ];
        const exampleRow = [
            "JOÃO DA SILVA","12345678901","9833598","FNE/PRONAF A - RES.5.183/24 (699)",
            "MODELO PARAMETRIZADO RURAL","291","GOVERNADOR NUNES FREIRE",
            "Registrar Ocorrências de Instrução","25/02/2026 10:16:20",
            "25/02/2026 10:16:20","\"49.980,00\"","F154768","C027288",
            "Automático","Em execução","25/02/2026 10:14:15","VAREJO RURAL",
            "PRONAFIANO GRUPO A","CENTRAL VAREJO RURAL","772",
            "SUPERINTENDENCIA ESTADUAL DO MARANHAO","Não","","","",
            "INVESTIMENTO","","","AQUIS. ISOL. MATRIZES","SEM TRATAMENTO ESPECIAL",
            "","GOVERNADOR NUNES FREIRE","Não","","","","_AI:example"
        ];
        const csvContent = headers.join(",") + "\n" + exampleRow.join(",");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "modelo_processos_em_andamento.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sanitizeNumber = (val: any): number => {
        if (val === null || val === undefined || val === "") return 0;
        if (typeof val === "number") return val;

        let str = val.toString().trim();

        // Se a string contiver espaços (ex: colunas compostas), pega a última parte
        if (str.includes(" ")) {
            const parts = str.split(/\s+/);
            str = parts[parts.length - 1];
        }

        // Handle Brazilian format: "49.999,62" -> "49999.62"
        const clean = str
            .replace(/\./g, "")       // Remove dots (thousands)
            .replace(",", ".")        // Replace comma with dot (decimal)
            .replace(/[^\d.]/g, "");  // Remove everything else except digits and dot
        return parseFloat(clean) || 0;
    };

    const sanitizeDate = (val: any): string => {
        if (!val) return new Date().toISOString().split('T')[0];
        const str = val.toString().trim();

        // Regex for DD/MM/YYYY or DD/MM/YYYY HH:MM
        const brDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
        const match = str.match(brDateRegex);

        if (match) {
            const [_, day, month, year] = match;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // If it already looks like YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split(' ')[0];

        return new Date().toISOString().split('T')[0];
    };

    const mapRow = (row: any) => {
        try {
            const getField = (keys: string[]) => {
                const rowKeys = Object.keys(row);
                // 1. Exact match (case-insensitive)
                for (const k of keys) {
                    const found = rowKeys.find(rk => rk.toLowerCase() === k.toLowerCase());
                    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
                }
                // 2. Partial match fallback (only for keys longer than 4 chars)
                for (const k of keys) {
                    if (k.length < 5) continue;
                    const found = rowKeys.find(rk => rk.toLowerCase().includes(k.toLowerCase()));
                    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
                }
                return "";
            };

            const targetAgency = effectiveAgencyId && effectiveAgencyId !== "all" ? effectiveAgencyId : null;

            // Valor: coluna "Valor" no formato brasileiro "49.980,00"
            const requestedValue = sanitizeNumber(getField(["Valor", "requested_value", "VALOR"]));

            // Data de entrada correta: coluna "Data Início" (índice 15 no CSV de processos em andamento)
            const rawEntryDate = getField(["Data Início", "Data In\u00edcio", "Data Inicio", "Data In\u00eacio", "entry_date"]);
            const entryDate = sanitizeDate(rawEntryDate || getField(["Data Central"]));

            // Data central: coluna "Data Central" (índice 8)
            const centralDate = sanitizeDate(getField(["Data Central"]));

            // Estado atual: "Em execução", "Parada", etc.
            const currentState = getField(["Estado"]);

            // Detecta automaticamente se é processo em andamento
            const isInProgress = /execu|parad|andamento/i.test(currentState);
            const proposalStatus = isInProgress ? "em_andamento" : "nova";

            return {
                producer_name: getField(["Nome", "producer_name", "NOME"]) || "Sem Nome",
                producer_cpf: getField(["Cpf/Cnpj", "CPF", "producer_cpf"]).toString().replace(/[^\d]/g, "") || "00000000000",
                requested_value: requestedValue,
                pronaf_line: getField(["Programa Crédito", "Programa Cr\u00e9dito", "Programa Cr閐ito", "Programa Crdito", "pronaf_line"]) || "custeio",
                producer_address: getField(["producer_address", "Endereço", "Endereo"]) || "",
                producer_phone: getField(["producer_phone", "Telefone"]) || "",
                project_designer: getField(["project_designer", "Projetista"]) || null,
                entry_date: entryDate,
                sicad: getField(["SICAD", "sicad"]).toString(),
                proposal_number: getField(["Número Proposta", "N\u00famero Proposta", "N鷐ero Proposta", "Nmero Proposta", "proposal_number"]).toString(),
                notes: getField(["notes", "Observações", "Observaes"]) || "",
                agency_id: targetAgency,
                created_by: user?.id,
                status: proposalStatus,
                credit_program: (() => {
                    const raw = (getField(["Programa Crédito", "Programa Cr\u00e9dito", "Programa Cr閐ito", "Programa Crdito"]) || "").toString().toUpperCase();
                    
                    if (raw.includes("MULHER") || raw.includes("406")) {
                        return 'FNE/PRONAF MULHER - FNE (406)';
                    }
                    if (raw.includes("A") || raw.includes("368") || raw.includes("699") || raw.includes("GRUPO")) {
                        return requestedValue < 50000 
                            ? 'FNE/PRONAF A - RES. 5.183/24 (699)' 
                            : 'FNE/PRONAF GRUPO "A" - FNE (368)';
                    }
                    if (raw.includes("RURAL") || raw.includes("226") || raw.includes("FNE")) {
                        return 'FNE/RURAL (226)';
                    }
                    
                    // Default fallback if unknown
                    return 'FNE/RURAL (226)';
                })(),
                request_type: getField(["Tipo Solicitação", "Tipo Solicita\u00e7\u00e3o", "Tipo Solicita玢o", "Tipo Solicitao"]),
                agency_code: getField(["Código Agência", "C\u00f3digo Ag\u00eancia", "C骴igo Ag阯cia", "Cdigo Agncia"]),
                agency_name: getField(["Nome Agência", "Nome Ag\u00eancia", "Nome Agncia"]),
                task: getField(["Tarefa"]),
                central_date: centralDate,
                activity_start_date: sanitizeDate(getField(["Data Início da Atividade", "Data In\u00edcio da Atividade", "Data In韈io da Atividade", "Data Incio da Atividade"])),
                last_analyst: getField(["Último Analista", "\u00daltimo Analista", "趌timo Analista", "ltimo Analista"]),
                owner: getField(["Dono"]),
                originator: getField(["Originador"]),
                current_state: currentState,
                category: getField(["Categoria"]),
                client_size: getField(["Porte do Cliente"]),
                credit_purpose: getField(["Finalidade do Crédito", "Finalidade do Cr\u00e9dito", "Finalidade do Cr閐ito", "Finalidade do Crdito"]),
                resource_application: getField(["Aplicação de Recursos", "Aplica\u00e7\u00e3o de Recursos", "Aplica玢o de Recursos", "Aplicao de Recursos"]),
                special_treatment: getField(["Tratamento Especial"]),
                central: getField(["Central"]),
                superintendence_code: getField(["Código Superintendência", "C\u00f3digo Superintend\u00eancia", "C骴igo Superintend阯cia", "C骴igo Superinte"]),
                superintendence_name: getField(["Nome Superintendencia", "Nome Superinte"]),
                microcredit: getField(["Microcrédito", "Microcr\u00e9dito", "Microcr閐ito"]),
                renegotiation_type: getField(["Tipo Renegociação", "Tipo Renegocia\u00e7\u00e3o", "Tipo Renegocia玢o"]),
                guarantee_type: getField(["Tipo de Garantia"]),
                registration_central_task: getField(["Tarefa Central de Cadastro", "Tarefa Central de"]),
                registration_central_activity_start: sanitizeDate(getField(["Dt. Inicio Ativ. C.Cadastro", "Dt. Inicio Ativ. C."])),
                judicial_period: getField(["Prazo Judicial"]),
                requesting_unit: getField(["Unidade Solicitante", "Unidade Solicita"]),
                agreement: getField(["Conv\u00eanio", "Conv阯io", "Convênio"]),
                culture: getField(["Cultura"]),
                roc_type: getField(["Tipo ROC"]),
                poa_prd_subject: getField(["Assunto POA/PRD", "Assunto POA/PR"]),
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

            toast({ title: "Atenção", description: `Verifique: ${missing.join(", ")}`, variant: "destructive" });
            return;
        }

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
                            toast({ title: "Arquivo vazio", description: "Nenhum dado encontrado no CSV.", variant: "destructive" });
                            return;
                        }

                        const total = rows.length;
                        let successCount = 0;
                        let duplicateCount = 0;
                        const errors: any[] = [];
                        const BATCH_SIZE = 50;

                        // Gera uma "impressão digital" de todos os campos comparáveis de uma proposta.
                        // Dois registros são considerados idênticos SE E SOMENTE SE todos os campos listados forem iguais.
                        const fingerprint = (p: any): string => [
                            "producer_name", "producer_cpf", "requested_value", "pronaf_line",
                            "sicad", "proposal_number", "activity_id", "task", "entry_date",
                            "current_state", "category", "credit_program", "request_type",
                            "agency_code", "agency_name", "last_analyst", "owner", "originator",
                            "credit_purpose", "resource_application", "special_treatment",
                            "central", "superintendence_code", "superintendence_name",
                            "microcredit", "renegotiation_type", "guarantee_type",
                            "registration_central_task", "registration_central_activity_start",
                            "judicial_period", "requesting_unit", "agreement",
                            "culture", "roc_type", "poa_prd_subject",
                            "central_date", "activity_start_date", "client_size",
                        ].map(k => String(p[k] ?? "").trim()).join("|");

                        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                            const batch = rows.slice(i, i + BATCH_SIZE);
                            const mappedBatch = batch.map(mapRow).filter((p): p is NonNullable<typeof p> => p !== null);

                            if (mappedBatch.length === 0) {
                                setProgress(Math.round(((i + batch.length) / total) * 100));
                                continue;
                            }

                            // ─── Deduplicação por comparação completa ────────────────────
                            // Passo 1: Coleta chaves de narrowing (SICAD / activity_id) para
                            //          buscar candidatos no banco de forma eficiente.
                            const sicadsInBatch = mappedBatch.map(p => p.sicad).filter(s => s && s.trim() !== "");
                            const activityIdsInBatch = mappedBatch.map(p => p.activity_id).filter(a => a && a.trim() !== "");

                            // Passo 2: Busca candidatos no banco com todos os campos comparáveis.
                            const candidateRows: any[] = [];
                            const SELECT_FIELDS = [
                                "producer_name", "producer_cpf", "requested_value", "pronaf_line",
                                "sicad", "proposal_number", "activity_id", "task", "entry_date",
                                "current_state", "category", "credit_program", "request_type",
                                "agency_code", "agency_name", "last_analyst", "owner", "originator",
                                "credit_purpose", "resource_application", "special_treatment",
                                "central", "superintendence_code", "superintendence_name",
                                "microcredit", "renegotiation_type", "guarantee_type",
                                "registration_central_task", "registration_central_activity_start",
                                "judicial_period", "requesting_unit", "agreement",
                                "culture", "roc_type", "poa_prd_subject",
                                "central_date", "activity_start_date", "client_size",
                            ].join(", ");

                            if (sicadsInBatch.length > 0) {
                                const { data } = await supabase
                                    .from("proposals")
                                    .select(SELECT_FIELDS)
                                    .in("sicad", sicadsInBatch);
                                if (data) candidateRows.push(...data);
                            }

                            if (activityIdsInBatch.length > 0) {
                                const { data } = await supabase
                                    .from("proposals")
                                    .select(SELECT_FIELDS)
                                    .in("activity_id", activityIdsInBatch);
                                if (data) candidateRows.push(...data);
                            }

                            // Passo 3: Gera fingerprints de todos os candidatos existentes no banco.
                            const existingFingerprints = new Set<string>(
                                candidateRows.map(fingerprint)
                            );

                            // Passo 4: Filtra — só ignora se o fingerprint completo bater.
                            const proposalsToInsert = mappedBatch.filter(p => {
                                return !existingFingerprints.has(fingerprint(p));
                            });

                            const batchDuplicates = mappedBatch.length - proposalsToInsert.length;
                            duplicateCount += batchDuplicates;
                            // ─────────────────────────────────────────────────────────────

                            if (proposalsToInsert.length > 0) {
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
                            }

                            setProgress(Math.round(((i + batch.length) / total) * 100));
                        }

                        setStats({ total, success: successCount, errors, duplicates: duplicateCount } as any);
                        setIsImporting(false);
                        if (successCount > 0) refetch(true);
                        toast({
                            title: "Importação Concluída",
                            description: duplicateCount > 0
                                ? `${successCount} importadas · ${duplicateCount} já existiam (ignoradas)`
                                : `${successCount} de ${total} registros importados com sucesso.`
                        });
                    } catch (e: any) {
                        console.error("Erro processando CSV:", e);
                        toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
                        setIsImporting(false);
                    }
                },
                error: (e) => {
                    console.error("Erro PapaParse:", e);
                    toast({ title: "Erro ao ler arquivo", description: e.message, variant: "destructive" });
                    setIsImporting(false);
                }
            });
        } catch (e: any) {
            console.error("Erro fatal na importação:", e);
            toast({ title: "Erro fatal", description: (e as Error).message, variant: "destructive" });
            setIsImporting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/40 shadow-premium rounded-[2rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-black font-heading tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        Importar Processos em Andamento
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground pt-2">
                        Importe o CSV exportado do sistema BNB/Sicad. Selecione uma agência no filtro acima antes de importar.
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
                        <div className="bg-card/50 rounded-3xl p-6 border border-border/40 space-y-3 animate-in zoom-in-95">
                            <h4 className="font-bold text-sm">Resultado da Importação</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-2xl bg-emerald-500/10 p-3">
                                    <p className="text-xl font-black text-emerald-600">{(stats as any).success}</p>
                                    <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide">Importadas</p>
                                </div>
                                <div className="rounded-2xl bg-amber-500/10 p-3">
                                    <p className="text-xl font-black text-amber-600">{(stats as any).duplicates ?? 0}</p>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wide">Duplicatas</p>
                                </div>
                                <div className="rounded-2xl bg-rose-500/10 p-3">
                                    <p className="text-xl font-black text-rose-600">{stats.errors.length}</p>
                                    <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wide">Erros</p>
                                </div>
                            </div>
                            {(stats as any).duplicates > 0 && (
                                <p className="text-[10px] text-amber-600/80 font-medium text-center">
                                    ⚠ Registros já existentes foram ignorados automaticamente
                                </p>
                            )}
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
