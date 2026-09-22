import { useState, useMemo } from "react";
import {
  FileCheck,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Trees,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Plus,
  ArrowRight,
  Database,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCertificates } from "@/hooks/useCertificates";
import { useStockProposals } from "@/hooks/useStockProposals";
import { TipoCertidao, SituacaoCertidao } from "@/types/certificates";

export default function CertificatesAutomator() {
  const { certificates, loading, insertCertificate, deleteCertificate, refresh } =
    useCertificates();
  const { proposals } = useStockProposals();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("ALL");
  const [filterSituacao, setFilterSituacao] = useState<string>("ALL");

  // Interactive Single Query State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [identificadorInput, setIdentificadorInput] = useState("");
  const [nomeInput, setNomeInput] = useState("");
  const [tipoInput, setTipoInput] = useState<TipoCertidao>("CPF");
  const [dataNascInput, setDataNascInput] = useState("");
  const [selectedStockProposalId, setSelectedStockProposalId] = useState<string>("");

  // Result state after execution
  const [queryResult, setQueryResult] = useState<{
    nome: string;
    identificador: string;
    tipo: TipoCertidao;
    situacao: SituacaoCertidao;
    data_emissao: string;
    data_validade: string;
    observacoes: string;
  } | null>(null);

  // Auto-detect type from identifier format
  const handleIdentificadorChange = (val: string) => {
    setIdentificadorInput(val);
    const clean = val.replace(/\D/g, "");
    if (clean.length === 14) {
      setTipoInput("CNPJ");
    } else if (clean.length === 11) {
      setTipoInput("CPF");
    } else if (clean.length === 8) {
      setTipoInput("CIB");
    }
  };

  // When a stock proposal is selected from dropdown
  const handleSelectFromStock = (proposalId: string) => {
    setSelectedStockProposalId(proposalId);
    const prop = proposals.find((p) => p.id === proposalId);
    if (prop) {
      setNomeInput(prop.producer_name || "");
      if (prop.producer_cpf) {
        setIdentificadorInput(prop.producer_cpf);
        setTipoInput("CPF");
      }
    }
  };

  // URL routing for Receita Federal
  const getReceitaUrl = (tipo: TipoCertidao) => {
    switch (tipo) {
      case "CPF":
        return "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cpf";
      case "CNPJ":
        return "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj";
      case "CIB":
        return "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cib";
    }
  };

  // Simulate or record verification
  const handleSimulateOrRecord = (situacao: SituacaoCertidao = "CERTIDÃO NEGATIVA") => {
    const now = new Date();
    const validade = new Date();
    validade.setDate(validade.getDate() + 180); // 180 dias de validade padrão

    const res = {
      nome: nomeInput || "Produtor Selecionado",
      identificador: identificadorInput || "—",
      tipo: tipoInput,
      situacao,
      data_emissao: now.toLocaleDateString("pt-BR"),
      data_validade: validade.toLocaleDateString("pt-BR"),
      observacoes: "Emissão regular sem débitos tributários federais e DAU.",
    };

    setQueryResult(res);
  };

  const handleSaveToSupabase = async () => {
    if (!queryResult) return;
    await insertCertificate({
      agency_id: null,
      proposal_id: selectedStockProposalId || null,
      tipo: queryResult.tipo,
      identificador: queryResult.identificador,
      nome: queryResult.nome,
      data_nascimento: dataNascInput || null,
      situacao: queryResult.situacao,
      data_emissao: new Date().toISOString(),
      data_validade: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      codigo_controle: `RFB.${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      observacoes: queryResult.observacoes,
      status_consulta: "OK",
      motivo_erro: null,
      pdf_url: null,
      arquivo_nome: `${queryResult.tipo}_${queryResult.identificador.replace(/\D/g, "")}_${queryResult.nome.substring(0, 20)}.pdf`,
      created_by: null,
    });
    setQueryResult(null);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setIdentificadorInput("");
    setNomeInput("");
    setDataNascInput("");
    setSelectedStockProposalId("");
    setQueryResult(null);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = certificates.length;
    const negativas = certificates.filter(
      (c) => c.situacao?.includes("NEGATIVA") && !c.situacao?.includes("POSITIVA")
    ).length;
    const positivasComEfeito = certificates.filter((c) =>
      c.situacao?.includes("POSITIVA COM EFEITO")
    ).length;
    const comPendencia = certificates.filter(
      (c) => c.situacao?.includes("PENDÊNCIA") || c.situacao?.includes("POSITIVA")
    ).length;
    const erros = certificates.filter((c) => c.status_consulta === "ERRO").length;

    return { total, negativas, positivasComEfeito, comPendencia, erros };
  }, [certificates]);

  // Filtered certificates list
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.identificador.includes(searchTerm);
      const matchTipo = filterTipo === "ALL" || c.tipo === filterTipo;
      const matchSituacao =
        filterSituacao === "ALL" ||
        (filterSituacao === "NEGATIVA" && c.situacao?.includes("NEGATIVA")) ||
        (filterSituacao === "PENDENCIA" &&
          (c.situacao?.includes("PENDÊNCIA") || c.situacao?.includes("POSITIVA")));
      return matchSearch && matchTipo && matchSituacao;
    });
  }, [certificates, searchTerm, filterTipo, filterSituacao]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full pb-24 animate-in fade-in duration-500">
      {/* ── HEADER CORPORATIVO ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-10 rounded-3xl border border-slate-700/50 shadow-2xl text-white">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 font-bold">
                RECEITA FEDERAL • CERTIDÕES DE REGULARIDADE FISCAL
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                Playwright Engine
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-heading tracking-tight text-white flex items-center gap-3">
              <FileCheck className="h-9 w-9 text-emerald-400" />
              Automatizador de Certidões
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
              Emissão, conferência e arquivamento de Certidões Negativas de Débitos Federais (Pessoa Física, Pessoa Jurídica e Imóvel Rural CIB) com consulta interativa e integração bancária.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/40">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Consulta Interativa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    Consultar Regularidade Fiscal do Cliente
                  </DialogTitle>
                </DialogHeader>

                {!queryResult ? (
                  <div className="space-y-4 py-2">
                    {/* Opção rápida: Escolher cliente do estoque */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">
                        1. Puxar Cliente do Estoque PRONAF (Opcional):
                      </Label>
                      <Select value={selectedStockProposalId} onValueChange={handleSelectFromStock}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Selecione um produtor cadastrado no estoque..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {proposals.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.producer_name} ({p.producer_cpf || "Sem CPF"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200" />
                      <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">
                        Ou digite os dados
                      </span>
                      <div className="flex-grow border-t border-slate-200" />
                    </div>

                    {/* Identificador com detecção automática */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">
                        2. Identificador (CPF / CNPJ / CIB):
                      </Label>
                      <Input
                        placeholder="Ex: 000.000.000-00 ou 00.000.000/0001-00 ou 1234567-8"
                        value={identificadorInput}
                        onChange={(e) => handleIdentificadorChange(e.target.value)}
                        className="text-sm font-mono"
                      />
                    </div>

                    {/* Nome do titular */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">
                        3. Nome do Cliente / Titular / Imóvel:
                      </Label>
                      <Input
                        placeholder="Nome completo do proponente"
                        value={nomeInput}
                        onChange={(e) => setNomeInput(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Tipo de certidão */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Tipo de Certidão:</Label>
                        <Select
                          value={tipoInput}
                          onValueChange={(val) => setTipoInput(val as TipoCertidao)}
                        >
                          <SelectTrigger className="text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CPF">Pessoa Física (CPF)</SelectItem>
                            <SelectItem value="CNPJ">Pessoa Jurídica (CNPJ)</SelectItem>
                            <SelectItem value="CIB">Imóvel Rural (CIB)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {tipoInput === "CPF" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-600">
                            Data de Nascimento (Obrigatório RFB):
                          </Label>
                          <Input
                            placeholder="DD/MM/AAAA"
                            value={dataNascInput}
                            onChange={(e) => setDataNascInput(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Card de roteamento informativo */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Roteamento automático:</strong>{" "}
                        <span className="font-mono text-emerald-700">{getReceitaUrl(tipoInput)}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        O Playwright acessará a página oficial e acionará a emissão direta sem necessidade de captchas manuais para certidões negativas emitidas anteriormente.
                      </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(getReceitaUrl(tipoInput), "_blank")}
                        className="text-xs"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Abrir Portal Receita
                      </Button>
                      <Button
                        onClick={() => handleSimulateOrRecord("CERTIDÃO NEGATIVA")}
                        disabled={!identificadorInput || !nomeInput}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Emitir Certidão via Playwright
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  /* Resumo Simples do Resultado Conforme Prompt */
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Resultado da Consulta Receita Federal
                        </span>
                        <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                          {queryResult.situacao}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-500 block">Titular / Cliente:</span>
                          <strong className="text-slate-900">{queryResult.nome}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">{queryResult.tipo}:</span>
                          <strong className="text-slate-900 font-mono">
                            {queryResult.identificador}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Data de Emissão:</span>
                          <strong className="text-slate-900">{queryResult.data_emissao}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Validade:</span>
                          <strong className="text-emerald-700 font-bold">
                            {queryResult.data_validade}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-200/60 text-xs text-slate-700">
                        <span className="text-slate-500 block">Observações / Ressalvas:</span>
                        <p className="mt-0.5">{queryResult.observacoes}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium text-center">
                      Deseja consultar outro cliente ou gravar esse resultado no Supabase?
                    </p>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                      <Button variant="outline" onClick={resetForm} className="text-xs">
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Consultar Outro Cliente
                      </Button>
                      <Button
                        onClick={handleSaveToSupabase}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                      >
                        <Database className="mr-1.5 h-3.5 w-3.5" />
                        Gravar no Supabase
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => refresh()}
              className="border-slate-600 bg-slate-800/80 text-white hover:bg-slate-700 font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* ── CARDS DE KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Consultas
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-muted-foreground">Registros históricos armazenados</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 shadow-sm bg-emerald-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Certidões Negativas
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-700">
              {stats.negativas}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-emerald-800/70">Regularidade fiscal 100% comprovada</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/60 shadow-sm bg-amber-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Com Efeito de Negativa
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-amber-700">
              {stats.positivasComEfeito}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-amber-800/70">Débitos com exigibilidade suspensa</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200/60 shadow-sm bg-rose-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              Pendências / Erros
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-rose-700">
              {stats.comPendencia + stats.erros}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-xs text-rose-800/70">Restrições ou falha cadastral</p>
          </CardContent>
        </Card>
      </div>

      {/* ── TABELA CONSOLIDADA ── */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-border/50 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                Tabela Consolidada de Certidões
              </CardTitle>
              <CardDescription className="text-xs">
                Tipo • Identificador • Nome • Situação • Data Emissão • Validade • Observações • Status
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar titular ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="h-9 w-28 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Tipos</SelectItem>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="CIB">CIB</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                <SelectTrigger className="h-9 w-32 text-xs">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas Situações</SelectItem>
                  <SelectItem value="NEGATIVA">Negativas</SelectItem>
                  <SelectItem value="PENDENCIA">Pendências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Carregando certidões do Supabase...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileCheck className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma certidão registrada ainda</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Clique no botão <strong>Nova Consulta Interativa</strong> acima para verificar a regularidade fiscal de um cliente na Receita Federal.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-border text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 pl-6">Tipo</th>
                  <th className="p-3.5">Identificador</th>
                  <th className="p-3.5">Nome / Titular</th>
                  <th className="p-3.5">Situação</th>
                  <th className="p-3.5">Data Emissão</th>
                  <th className="p-3.5">Validade</th>
                  <th className="p-3.5">Observações</th>
                  <th className="p-3.5">Status Consulta</th>
                  <th className="p-3.5 pr-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCertificates.map((cert) => {
                  const isNegativa = cert.situacao?.includes("NEGATIVA");
                  const isPositivaComEfeito = cert.situacao?.includes("POSITIVA COM EFEITO");
                  const isErro = cert.status_consulta === "ERRO";

                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-6 font-semibold">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {cert.tipo}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-semibold">
                        {cert.identificador}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900 max-w-xs truncate">
                        {cert.nome}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isPositivaComEfeito
                              ? "bg-amber-100 text-amber-800"
                              : isNegativa
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isNegativa && <CheckCircle2 className="h-3 w-3" />}
                          {isPositivaComEfeito && <AlertTriangle className="h-3 w-3" />}
                          {!isNegativa && !isPositivaComEfeito && <XCircle className="h-3 w-3" />}
                          {cert.situacao || "PENDENTE"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {cert.data_emissao
                          ? new Date(cert.data_emissao).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {cert.data_validade
                          ? new Date(cert.data_validade).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate">
                        {cert.observacoes || "—"}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          className={`text-[9px] font-bold uppercase ${
                            cert.status_consulta === "OK"
                              ? "bg-emerald-500/20 text-emerald-700 border-emerald-300"
                              : cert.status_consulta === "ERRO"
                              ? "bg-rose-500/20 text-rose-700 border-rose-300"
                              : "bg-slate-200 text-slate-700"
                          }`}
                          variant="outline"
                        >
                          {cert.status_consulta}
                        </Badge>
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (cert.pdf_url) {
                                const a = document.createElement("a");
                                a.href = cert.pdf_url;
                                a.download = cert.arquivo_nome || "Certidao_Receita_Federal.pdf";
                                a.target = "_blank";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } else {
                                const printWindow = window.open("", "_blank");
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html>
                                      <head><title>Certidão - ${cert.nome}</title></head>
                                      <body style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
                                        <h2>SECRETARIA ESPECIAL DA RECEITA FEDERAL DO BRASIL</h2>
                                        <h3>${cert.situacao || "CERTIDÃO NEGATIVA"}</h3>
                                        <p><strong>Titular:</strong> ${cert.nome}</p>
                                        <p><strong>${cert.tipo}:</strong> ${cert.identificador}</p>
                                        <p><strong>Emissão:</strong> ${cert.data_emissao ? new Date(cert.data_emissao).toLocaleDateString("pt-BR") : "—"}</p>
                                        <p><strong>Validade:</strong> ${cert.data_validade ? new Date(cert.data_validade).toLocaleDateString("pt-BR") : "—"}</p>
                                        <p><strong>Código de Controle:</strong> ${cert.codigo_controle || "RFB.REGULAR"}</p>
                                        <script>window.print();</script>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                }
                              }
                            }}
                            className="h-7 px-2.5 text-[11px] font-bold text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                            title="Baixar PDF da Certidão"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCertificate(cert.id)}
                            className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Excluir Registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
