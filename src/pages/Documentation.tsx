import { useState, useCallback, useMemo, useEffect } from "react";
import { useDocumentationReview, SubmittedProposal } from "@/hooks/useDocumentationReview";
import {
  getDocLabel,
  DOC_STATUS_COLORS,
  DOC_STATUS_LABELS,
  DOCUMENTATION_REQUIRED,
  DocFileStatus,
} from "@/types/documentation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  FileCheck,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Download,
  Archive,
  ArrowLeft,
  ClipboardList,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  FileText,
  RefreshCw,
  Undo2,
  Link2,
} from "lucide-react";

export default function Documentation() {
  const {
    submissions,
    loading,
    approveDocument,
    rejectDocument,
    approveProposal,
    revertProposal,
    downloadFile,
    getFileUrl,
    downloadAllAsZip,
    approveAllDocuments,
    rejectAllDocuments,
    refetch,
  } = useDocumentationReview();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmittedProposal | null>(null);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [viewingPdfName, setViewingPdfName] = useState("");
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingFileId, setRejectingFileId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  // Keep selectedSubmission in sync when submissions array updates (after approve/reject)
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.token.id === selectedSubmission.token.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions]);

  // ─── Stats ────────────────────────────────────────────────────
  const totalSubmissions = submissions.length;
  const fullyApproved = submissions.filter(
    (s) => s.totalFiles > 0 && s.approvedCount === s.totalFiles
  ).length;
  const withPending = submissions.filter((s) => s.pendingCount > 0).length;
  const withRejections = submissions.filter((s) => s.rejectedCount > 0).length;

  // ─── Filtered list ────────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const term = searchTerm.toLowerCase();
    return submissions.filter(
      (s) =>
        s.proposal.producer_name.toLowerCase().includes(term) ||
        (s.proposal.producer_cpf && s.proposal.producer_cpf.includes(term))
    );
  }, [submissions, searchTerm]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleViewPdf = useCallback(
    async (filePath: string, fileName: string) => {
      setPdfLoading(true);
      setViewingPdfName(fileName);
      try {
        const url = await getFileUrl(filePath);
        if (url) {
          setViewingPdfUrl(url);
          setIsPdfDialogOpen(true);
        }
      } finally {
        setPdfLoading(false);
      }
    },
    [getFileUrl]
  );

  const handleClosePdfDialog = useCallback(() => {
    setIsPdfDialogOpen(false);
    setViewingPdfUrl(null);
    setViewingPdfName("");
  }, []);

  const handleOpenRejectDialog = useCallback((fileId: string) => {
    setRejectingFileId(fileId);
    setRejectReason("");
    setRejectDialogOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectingFileId || !selectedSubmission) return;
    await rejectDocument(rejectingFileId, rejectReason, selectedSubmission.token.id);
    setRejectDialogOpen(false);
    setRejectingFileId(null);
    setRejectReason("");
  }, [rejectingFileId, rejectReason, selectedSubmission, rejectDocument]);

  const handleApproveProposal = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveProposal(selectedSubmission.token.id, selectedSubmission.proposal.id);
  }, [selectedSubmission, approveProposal]);

  const handleApproveAllDocs = useCallback(async () => {
    if (!selectedSubmission) return;
    await approveAllDocuments(selectedSubmission.token.id);
  }, [selectedSubmission, approveAllDocuments]);

  const handleConfirmBulkReject = useCallback(async () => {
    if (!selectedSubmission) return;
    await rejectAllDocuments(selectedSubmission.token.id, bulkRejectReason);
    setBulkRejectDialogOpen(false);
    setBulkRejectReason("");
  }, [selectedSubmission, bulkRejectReason, rejectAllDocuments]);

  // ─── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Detail View ──────────────────────────────────────────────
  if (selectedSubmission) {
    const sub = selectedSubmission;
    const approvedPct =
      sub.totalFiles > 0
        ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
        : 0;
    const allApproved = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;

    return (
      <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setSelectedSubmission(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading font-extrabold text-xl md:text-2xl leading-tight">
                {sub.proposal.producer_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                CPF: {sub.proposal.producer_cpf || "—"} · {sub.proposal.municipio || "—"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`ml-2 text-xs ${
                allApproved
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : sub.rejectedCount > 0
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }`}
            >
              {allApproved
                ? "Totalmente Aprovada"
                : sub.rejectedCount > 0
                ? "Com Reprovações"
                : "Em Análise"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sub.files.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/30"
                  onClick={handleApproveAllDocs}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Aprovar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl text-red-700 border-red-300 hover:bg-red-50 bg-red-50/30"
                  onClick={() => {
                    setBulkRejectReason("");
                    setBulkRejectDialogOpen(true);
                  }}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reprovar Todos
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={() => downloadAllAsZip(sub)}
            >
              <Archive className="h-4 w-4" />
              Baixar Todos em ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={async () => {
                const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                await navigator.clipboard.writeText(url);
                toast({
                  title: "Link copiado! 📋",
                  description: "Link da página de envio copiado para a área de transferência.",
                });
              }}
            >
              <Link2 className="h-4 w-4" />
              Copiar Link Envio
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-amber-700 border-amber-200 hover:bg-amber-50"
              onClick={() => setRevertDialogOpen(true)}
            >
              <Undo2 className="h-4 w-4" />
              Reverter Status
            </Button>
            <Button
              size="sm"
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!allApproved}
              onClick={handleApproveProposal}
            >
              <ShieldCheck className="h-4 w-4" />
              Aprovar Proposta
            </Button>
          </div>
        </div>

        {/* ── Progress Card ──────────────────────────────────── */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6 pb-5 px-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Progresso da Documentação
                </p>
                <p className="font-heading font-extrabold text-2xl mt-1">
                  {sub.approvedCount}
                  <span className="text-muted-foreground font-medium text-base">
                    /{sub.totalFiles}
                  </span>{" "}
                  <span className="text-sm font-medium text-muted-foreground">aprovados</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-heading font-extrabold text-3xl text-primary">
                  {approvedPct}%
                </span>
              </div>
            </div>
            <Progress value={approvedPct} className="h-2.5 rounded-full" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {sub.approvedCount} aprovados
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {sub.pendingCount} pendentes
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                {sub.rejectedCount} reprovados
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Documents Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sub.files.map((file) => {
            const status = file.status as DocFileStatus;
            return (
              <Card
                key={file.id}
                className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg group"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <p className="font-heading font-bold text-sm truncate">
                        {getDocLabel(file.document_type)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${DOC_STATUS_COLORS[status]}`}
                    >
                      {DOC_STATUS_LABELS[status]}
                    </Badge>
                  </div>

                  {status === "reprovado" && file.rejection_reason && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                        <span className="font-bold">Motivo:</span> {file.rejection_reason}
                      </p>
                    </div>
                  )}

                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
                    {file.file_name}
                  </p>

                  <Separator className="opacity-50" />

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl text-xs h-8"
                      disabled={pdfLoading}
                      onClick={() => handleViewPdf(file.file_path, file.file_name)}
                    >
                      {pdfLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-xl text-xs h-8"
                      onClick={() => downloadFile(file.file_path, file.file_name)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </Button>
                    {status !== "aprovado" && (
                      <Button
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => approveDocument(file.id)}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Aprovar
                      </Button>
                    )}
                    {status !== "reprovado" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-1.5 rounded-xl text-xs h-8"
                        onClick={() => handleOpenRejectDialog(file.id)}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Reprovar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sub.files.length === 0 && (
          <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">Nenhum documento enviado nesta proposta.</p>
            </CardContent>
          </Card>
        )}

        {/* ── PDF Viewer Dialog ───────────────────────────────── */}
        <Dialog open={isPdfDialogOpen} onOpenChange={handleClosePdfDialog}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {viewingPdfName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pré-visualização do documento enviado
              </DialogDescription>
            </DialogHeader>
            <div className="h-[80vh] w-full bg-muted/20">
              {viewingPdfUrl ? (
                <iframe
                  src={viewingPdfUrl}
                  className="w-full h-full border-0"
                  title={viewingPdfName}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Reject Dialog ──────────────────────────────────── */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Documento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Confirmar Reprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* ── Bulk Reject Dialog ──────────────────────────────────── */}
        <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Reprovar Todos os Documentos
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Informe o motivo da reprovação em lote de todos os documentos. O link será reaberto para reenvio.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Motivo da reprovação geral..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setBulkRejectDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl gap-2"
                disabled={!bulkRejectReason.trim()}
                onClick={handleConfirmBulkReject}
              >
                <ThumbsDown className="h-4 w-4" />
                Reprovar Todos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Revert Confirmation Dialog ──────────────────────────── */}
        <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading font-extrabold flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-amber-500" />
                Reverter Proposta
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Isto irá restaurar o status da proposta para{" "}
                <strong>{sub.token.previous_status || "CADASTRADA"}</strong>,
                excluir todos os documentos enviados e remover o token de envio.
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setRevertDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isReverting}
                onClick={async () => {
                  setIsReverting(true);
                  const success = await revertProposal(sub);
                  setIsReverting(false);
                  if (success) {
                    setRevertDialogOpen(false);
                    setSelectedSubmission(null);
                  }
                }}
              >
                {isReverting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Revertendo...
                  </>
                ) : (
                  <>
                    <Undo2 className="h-4 w-4" />
                    Confirmar Reversão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── List View (no proposal selected) ─────────────────────────
  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 p-4 md:p-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-11 w-11 rounded-2xl bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl leading-tight">
              Documentação
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de conformidade e análise documental
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl mt-2 md:mt-0"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total Recebidas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight">
                  {totalSubmissions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fully Approved */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Totalmente Aprovadas
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-emerald-600">
                  {fullyApproved}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Pending */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Pendências
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-amber-600">
                  {withPending}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* With Rejections */}
        <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Com Reprovações
                </p>
                <p className="font-heading font-extrabold text-2xl leading-tight text-red-600">
                  {withRejections}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search Bar ───────────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4 px-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do produtor ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl border-border/60 bg-background/60"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Table ────────────────────────────────────────────── */}
      <Card className="border-border/40 shadow-premium rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3 px-6 pt-5">
          <CardTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Propostas Recebidas
            <Badge variant="secondary" className="ml-2 font-mono text-xs">
              {filteredSubmissions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileCheck className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">
                {searchTerm.trim()
                  ? "Nenhuma proposta encontrada com os termos pesquisados."
                  : "Nenhuma documentação recebida até o momento."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-6">
                      Produtor
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Projetista
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status Docs
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Município
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const pct =
                      sub.totalFiles > 0
                        ? Math.round((sub.approvedCount / sub.totalFiles) * 100)
                        : 0;
                    const allOk = sub.totalFiles > 0 && sub.approvedCount === sub.totalFiles;
                    const hasRejects = sub.rejectedCount > 0;

                    return (
                      <TableRow
                        key={sub.token.id}
                        className="cursor-pointer transition-all duration-300 hover:bg-accent/50 border-border/30"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        <TableCell className="pl-6 py-4">
                          <div>
                            <p className="font-semibold text-sm leading-tight">
                              {sub.proposal.producer_name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {sub.proposal.producer_cpf || "CPF não informado"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {sub.proposal.projetista || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[140px]">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                allOk
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : hasRejects
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }`}
                            >
                              {sub.approvedCount}/{sub.totalFiles} aprovados
                            </Badge>
                            <Progress value={pct} className="h-1.5 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {sub.proposal.municipio || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Copiar Link de Envio"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const url = `${window.location.origin}/enviar-documentacao?token=${sub.token.token}`;
                                await navigator.clipboard.writeText(url);
                                toast({
                                  title: "Link copiado! 📋",
                                  description: "Link da página de envio copiado.",
                                });
                              }}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-8 w-8 text-slate-500 hover:text-slate-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmission(sub);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
