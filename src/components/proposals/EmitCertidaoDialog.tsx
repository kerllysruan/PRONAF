import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Calendar,
  User,
  Hash,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StockProposal } from "@/types/stock";

interface EmitCertidaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: StockProposal | null;
  onSuccess?: () => void;
}

export function EmitCertidaoDialog({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}: EmitCertidaoDialogProps) {
  const { toast } = useToast();
  const [dataNascimento, setDataNascimento] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [existingCertidao, setExistingCertidao] = useState<any | null>(null);
  const [serverOffline, setServerOffline] = useState(false);

  // Result from new emission
  const [result, setResult] = useState<{
    situacao: string;
    data_emissao: string;
    data_validade: string;
    codigo_controle?: string;
    pdf_url?: string;
    arquivo_nome?: string;
  } | null>(null);

  // When dialog opens or proposal changes, load data
  useEffect(() => {
    if (proposal && open) {
      setResult(null);
      setServerOffline(false);
      setDataNascimento((proposal as any).data_nascimento || "");

      // Check if there is already a certificate in the database for this proposal
      const checkExisting = async () => {
        const { data } = await (supabase as any)
          .from("certidoes_produtores")
          .select("*")
          .eq("proposal_id", proposal.id)
          .order("atualizado_em", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          setExistingCertidao(data);
          if (data.data_nascimento && !dataNascimento) {
            setDataNascimento(data.data_nascimento);
          }
        } else {
          setExistingCertidao(null);
        }
      };

      checkExisting();
    }
  }, [proposal, open]);

  // Mask DD/MM/AAAA
  const handleBirthChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 8);
    let formatted = clean;
    if (clean.length > 4) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
    } else if (clean.length > 2) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setDataNascimento(formatted);
  };

  const handleEmitir = async () => {
    if (!proposal) return;
    const cleanCpf = (proposal.producer_cpf || "").replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      toast({
        title: "CPF Inválido",
        description: "A proposta não possui um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (!dataNascimento || dataNascimento.replace(/\D/g, "").length !== 8) {
      toast({
        title: "Data de Nascimento Obrigatória",
        description: "Informe a data de nascimento no formato DD/MM/AAAA exigido pela Receita Federal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setServerOffline(false);
    setLoadingStep("Conectando ao servidor de automação Playwright...");

    try {
      // 1. Atualizar data_nascimento na proposta
      await (supabase as any)
        .from("stock_proposals")
        .update({ data_nascimento: dataNascimento })
        .eq("id", proposal.id);

      setLoadingStep("Acessando portal da Receita Federal e preenchendo dados...");

      // 2. Chamar servidor local Playwright em localhost:3333
      let responseData: any = null;

      let localRes: Response | null = null;
      try {
        localRes = await fetch("http://localhost:3333/emitir-certidao-pf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer supergestao_certidoes_secret_token_2026",
          },
          body: JSON.stringify({
            proposta_id: proposal.id,
            cpf: cleanCpf,
            data_nascimento: dataNascimento,
            nome: proposal.producer_name,
          }),
        });
      } catch (localConnErr) {
        // Servidor local offline — tentar via Edge Function
        setLoadingStep("Servidor local offline, tentando via Edge Function...");
        try {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke("emitir-certidao", {
            body: {
              proposta_id: proposal.id,
              cpf: cleanCpf,
              data_nascimento: dataNascimento,
              nome: proposal.producer_name,
            },
          });
          if (edgeError) throw edgeError;
          if (!edgeData?.success) {
            throw new Error(edgeData?.error || "Erro retornado pela esteira de automação");
          }
          responseData = edgeData;
        } catch (edgeErr: any) {
          setServerOffline(true);
          throw new Error(
            "Servidor de automação não encontrado.\n\n" +
            "Para emitir certidões, inicie o servidor Playwright:\n" +
            "  cd server-certidoes\n" +
            "  npm start\n\n" +
            `Detalhe técnico: ${edgeErr.message}`
          );
        }
      }

      if (!responseData && localRes) {
        const localData = await localRes.json();
        if (!localRes.ok || !localData.success) {
          throw new Error(localData.error || `Erro HTTP ${localRes.status} no servidor de automação`);
        }
        responseData = localData;
      }

      setLoadingStep("Finalizando emissão e salvando PDF no Supabase...");

      if (!responseData?.pdf_url) {
        console.warn("[AVISO] Certidão emitida mas PDF não disponível:", responseData);
      }

      setResult({
        situacao: responseData?.situacao || "CERTIDÃO NEGATIVA",
        data_emissao: responseData?.data_emissao || new Date().toLocaleDateString("pt-BR"),
        data_validade:
          responseData?.data_validade ||
          new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
        codigo_controle: responseData?.codigo_controle,
        pdf_url: responseData?.pdf_url,
        arquivo_nome: responseData?.arquivo_nome || `Certidao_CPF_${cleanCpf}.pdf`,
      });

      toast({
        title: "Certidão Emitida com Sucesso!",
        description: `Situação: ${responseData?.situacao || "CERTIDÃO NEGATIVA"}`,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Erro na emissão:", err);
      toast({
        title: "Falha na Emissão",
        description: err.message || "Não foi possível emitir a certidão no momento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Download PDF handler — downloads the real PDF stored in Supabase Storage
  const handleDownloadPDF = async (pdfUrl?: string, filename?: string) => {
    if (!pdfUrl) {
      toast({
        title: "PDF não disponível",
        description: "Nenhum PDF foi gerado para esta certidão.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Baixar como blob para forçar download em vez de abrir no navegador
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "Certidao_Receita_Federal.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      // Fallback: abrir em nova aba
      window.open(pdfUrl, "_blank");
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Emitir Certidão de Regularidade Fiscal
              </DialogTitle>
              <DialogDescription className="text-xs">
                Receita Federal do Brasil • Pessoa Física (CPF)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Loading State with Steps */}
        {loading ? (
          <div className="py-10 text-center space-y-4">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Processando Emissão na Receita Federal</p>
              <p className="text-xs text-slate-500 animate-pulse">{loadingStep}</p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-indeterminate" />
            </div>
            <p className="text-[11px] text-slate-400">Isso pode levar até 30 segundos...</p>
          </div>
        ) : result ? (
          /* Concluded State with Download Option */
          <div className="space-y-4 py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Certidão Emitida com Sucesso
                </span>
                <Badge className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5">
                  {result.situacao}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-slate-500 block">Titular:</span>
                  <strong className="text-slate-900 font-semibold">{proposal.producer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CPF:</span>
                  <strong className="text-slate-900 font-mono font-semibold">
                    {proposal.producer_cpf || "—"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Data de Emissão:</span>
                  <strong className="text-slate-900">{result.data_emissao}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Validade:</span>
                  <strong className="text-emerald-700 font-bold">{result.data_validade}</strong>
                </div>
              </div>

              {result.codigo_controle && (
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600 font-mono">
                  <span className="text-slate-500">Código de Controle:</span> {result.codigo_controle}
                </div>
              )}

              {!result.pdf_url && (
                <div className="pt-2 border-t border-emerald-200/60">
                  <p className="text-[11px] text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    PDF não disponível para download — certidão registrada no banco de dados.
                  </p>
                </div>
              )}
            </div>

            {/* Ações de Download e Visualização */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <Button
                onClick={() => handleDownloadPDF(result.pdf_url, result.arquivo_nome)}
                disabled={!result.pdf_url}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-md shadow-emerald-900/20 disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {result.pdf_url ? "Baixar PDF Original da Receita" : "PDF Não Disponível"}
              </Button>
              {result.pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(result.pdf_url, "_blank")}
                  className="w-full sm:w-auto text-xs h-10 border-slate-300 hover:bg-slate-50"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Visualizar
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Input / Pre-emission Form */
          <div className="space-y-4 py-2">
            {/* Dados do Cliente */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Dados da Proposta
                </span>
                {proposal.linha_credito && (
                  <Badge variant="secondary" className="text-[10px]">
                    {proposal.linha_credito}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">PRODUTOR:</span>
                  <strong className="text-slate-900 font-semibold">{proposal.producer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CPF:</span>
                  <strong className="text-slate-900 font-mono font-semibold">
                    {proposal.producer_cpf || "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Aviso servidor offline */}
            {serverOffline && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Servidor de Automação Offline
                </div>
                <p className="text-amber-800 text-[11px]">
                  Para emitir a certidão original da Receita Federal, inicie o servidor Playwright:
                </p>
                <code className="block bg-amber-100 text-amber-900 px-2 py-1 rounded text-[10px] font-mono">
                  cd server-certidoes &amp;&amp; npm start
                </code>
              </div>
            )}

            {/* Certidão prévia se já existente */}
            {existingCertidao && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    Certidão já emitida anteriormente:
                  </span>
                  <Badge className="bg-blue-600 text-white text-[9px]">
                    {existingCertidao.situacao}
                  </Badge>
                </div>
                <p className="text-[11px] text-blue-800">
                  Válida até:{" "}
                  <strong>{new Date(existingCertidao.data_validade).toLocaleDateString("pt-BR")}</strong>
                </p>
                {existingCertidao.pdf_url && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(existingCertidao.pdf_url, existingCertidao.arquivo_nome)}
                      className="h-7 text-[11px] bg-white text-blue-800 border-blue-300 hover:bg-blue-100"
                    >
                      <Download className="mr-1.5 h-3 w-3" />
                      Baixar PDF Anterior
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Campo obrigatório: Data de Nascimento */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-nasc" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  Data de Nascimento do Produtor (Obrigatório RFB):
                </Label>
                <span className="text-[10px] text-slate-400">Formato: DD/MM/AAAA</span>
              </div>
              <Input
                id="data-nasc"
                placeholder="Ex: 15/05/1980"
                value={dataNascimento}
                onChange={(e) => handleBirthChange(e.target.value)}
                maxLength={10}
                className="h-10 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500">
                A Receita Federal exige o cruzamento do CPF com a data de nascimento para emissão sem login gov.br.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
          {!result && !loading ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-9">
                Cancelar
              </Button>
              <Button
                onClick={handleEmitir}
                disabled={!proposal.producer_cpf || dataNascimento.replace(/\D/g, "").length !== 8}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Emitir Certidão na Receita Federal
              </Button>
            </>
          ) : result ? (
            <Button onClick={() => onOpenChange(false)} className="text-xs h-9">
              Concluir e Fechar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
