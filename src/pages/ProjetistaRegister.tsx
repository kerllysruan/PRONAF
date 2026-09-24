import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  IdCard,
  Phone,
  Mail,
  Award,
  MapPin,
  Building2,
  Trash2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { MEDIA_CONFIG } from "@/config/imageConfig";

interface DocDefinition {
  key: string;
  title: string;
  description: string;
  required: boolean;
  recommended?: boolean;
  accept: string;
}

const DOCUMENT_CARDS: DocDefinition[] = [
  {
    key: "carteira_conselho",
    title: "Carteira do Conselho (CREA / CFTA)",
    description: "Carteira profissional digital ou física legível com número de registro ativo.",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg",
  },
  {
    key: "documento_identificacao",
    title: "Documento de Identidade (RG ou CNH)",
    description: "Documento oficial com foto (RG frente/verso ou CNH aberta).",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg",
  },
  {
    key: "certidao_regularidade",
    title: "Certidão de Quitação / Regularidade",
    description: "Certidão emitida pelo CREA ou CFTA comprovando adimplência no ano vigente.",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg",
  },
  {
    key: "comprovante_residencia",
    title: "Comprovante de Endereço",
    description: "Conta de água, energia, telefone ou extrato bancário emitido nos últimos 90 dias.",
    required: true,
    accept: ".pdf,.png,.jpg,.jpeg",
  },
];

const BRAZILIAN_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function formatCPF(val: string): string {
  const digits = val.replace(/\D/g, "").substring(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").substring(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
}

export default function ProjetistaRegister() {
  const { toast } = useToast();

  // Form Data
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [conselho, setConselho] = useState<"CREA" | "CFTA" | "OUTRO">("CREA");
  const [conselhoUf, setConselhoUf] = useState("MA");
  const [conselhoNumero, setConselhoNumero] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [municipio, setMunicipio] = useState("");
  const [uf, setUf] = useState("MA");
  const [observacoes, setObservacoes] = useState("");

  // Files State
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadLabel, setCurrentUploadLabel] = useState("");
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    name: string;
    protocolo: string;
    crea_cfta: string;
    totalDocs: number;
    email: string;
  } | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (key: string, file: File | null) => {
    if (!file) return;

    // Validate size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido por arquivo é de 15 MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  const handleRemoveFile = (key: string) => {
    setSelectedFiles((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const cleanNome = nome.trim().toUpperCase();
    if (!cleanNome || cleanNome.length < 5) {
      toast({
        title: "Nome incompleto",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    const cleanCpfDigits = cpf.replace(/\D/g, "");
    if (cleanCpfDigits.length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Informe um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const cleanRegistro = conselhoNumero.trim().toUpperCase();
    if (!cleanRegistro) {
      toast({
        title: "Número do Conselho obrigatório",
        description: "Informe o número do seu registro no CREA ou CFTA.",
        variant: "destructive",
      });
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length < 10) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe um número de telefone com DDD válido.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast({
        title: "E-mail obrigatório",
        description: "Informe um endereço de e-mail válido para criar seu login.",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Senha obrigatória",
        description: "A senha de acesso deve possuir pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A senha e a confirmação de senha digitadas são diferentes.",
        variant: "destructive",
      });
      return;
    }

    if (!municipio.trim()) {
      toast({
        title: "Município obrigatório",
        description: "Informe o município de atuação.",
        variant: "destructive",
      });
      return;
    }

    // Required Docs check (todos os 4 documentos são obrigatórios)
    const missingDocs = DOCUMENT_CARDS.filter((d) => d.required && !selectedFiles[d.key]);
    if (missingDocs.length > 0) {
      toast({
        title: "Documentos pendentes",
        description: `Por favor, anexe os documentos obrigatórios: ${missingDocs.map((d) => d.title).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(5);
    setCurrentUploadLabel("Criando credenciais de login...");

    try {
      const timestamp = Date.now();
      const slugName = slugify(cleanNome);
      const registroFormatado = `${conselho}-${conselhoUf} ${cleanRegistro}`;
      const id = `proj-${timestamp}`;
      const protocolo = `PROJ-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`;

      // 1. Criar usuário no Supabase Auth
      let authUserId: string | null = null;
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              full_name: cleanNome,
              display_name: cleanNome,
              role: "projetista",
              phone: phone.trim(),
              cpf: cpf.trim(),
            },
          },
        });

        if (signUpError) {
          if (!signUpError.message.toLowerCase().includes("already registered")) {
            console.warn("Aviso no signUp:", signUpError.message);
          }
        }
        authUserId = signUpData?.user?.id || null;
      } catch (authErr: any) {
        console.warn("Exceção ao criar auth user:", authErr);
      }

      // 2. Upload de documentos
      setCurrentUploadLabel("Iniciando upload dos documentos...");
      const uploadedDocsList: any[] = [];
      const keysToUpload = Object.keys(selectedFiles);
      const totalToUpload = keysToUpload.length;

      for (let i = 0; i < totalToUpload; i++) {
        const docKey = keysToUpload[i];
        const file = selectedFiles[docKey];
        const docDef = DOCUMENT_CARDS.find((d) => d.key === docKey);
        const fileExt = file.name.split(".").pop() || "pdf";
        const storagePath = `cadastros/${timestamp}_${slugName}/${docKey}.${fileExt}`;

        setCurrentUploadLabel(`Enviando ${docDef?.title || docKey}...`);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("projetistas_documents")
          .upload(storagePath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Erro ao subir ${docKey}:`, uploadError);
          throw new Error(`Falha no upload do arquivo ${file.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("projetistas_documents")
          .getPublicUrl(storagePath);

        uploadedDocsList.push({
          tipo: docKey,
          titulo: docDef?.title || docKey,
          nome: file.name,
          url: publicUrlData?.publicUrl || "",
          file_path: storagePath,
          tamanho: file.size,
          uploaded_at: new Date().toISOString(),
        });

        const progressPercent = Math.round(((i + 1) / totalToUpload) * 80) + 10;
        setUploadProgress(progressPercent);
      }

      setCurrentUploadLabel("Registrando dados do projetista...");

      // 3. Inserir registro na tabela public.projetistas
      const { error: insertError } = await supabase.from("projetistas").insert({
        id,
        user_id: authUserId,
        name: cleanNome,
        cpf: cpf.trim(),
        crea_cfta: registroFormatado,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        municipio: municipio.trim(),
        uf: uf.trim(),
        chave_pix: "",
        status: "pendente",
        documentos: uploadedDocsList,
        observacoes: observacoes.trim(),
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Erro ao salvar cadastro do projetista:", insertError);
        throw new Error(insertError.message);
      }

      // 4. Logout de segurança para não manter sessão logada antes da ativação pelo admin
      await supabase.auth.signOut();

      setUploadProgress(100);
      setCurrentUploadLabel("Cadastro enviado com sucesso!");

      setSubmittedData({
        id,
        name: cleanNome,
        protocolo,
        crea_cfta: registroFormatado,
        totalDocs: uploadedDocsList.length,
        email: email.trim().toLowerCase(),
      });

      toast({
        title: "Cadastro e Login criados com sucesso! 🎉",
        description: "Seus dados e documentos foram enviados para análise da equipe técnica.",
      });
    } catch (err: any) {
      console.error("Erro no envio:", err);
      toast({
        title: "Erro ao enviar cadastro",
        description: err.message || "Ocorreu uma falha no envio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setNome("");
    setCpf("");
    setConselho("CREA");
    setConselhoUf("MA");
    setConselhoNumero("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setMunicipio("");
    setUf("MA");
    setObservacoes("");
    setSelectedFiles({});
    setSubmittedData(null);
  };

  // Se já concluiu o envio, exibe a tela de confirmação
  if (submittedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full rounded-3xl border border-teal-500/20 shadow-2xl bg-card overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />
          <CardContent className="p-6 md:p-10 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 px-3 py-1 font-bold text-xs uppercase tracking-wider">
                Cadastro e Login Registrados
              </Badge>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground font-heading">
                Cadastro Enviado com Sucesso!
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                Recebemos suas informações, login de acesso e documentos. Nossa equipe fará a conferência cadastral e a validação do seu credenciamento.
              </p>
            </div>

            {/* Protocol Card */}
            <div className="bg-muted/40 rounded-2xl p-5 border border-border/60 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Número de Protocolo
                </span>
                <span className="font-mono font-extrabold text-sm text-teal-600 dark:text-teal-400">
                  {submittedData.protocolo}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Projetista:</p>
                  <p className="font-bold text-foreground text-sm">{submittedData.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">E-mail de Login:</p>
                  <p className="font-mono font-bold text-teal-700 dark:text-teal-300 text-sm truncate">
                    {submittedData.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registro Profissional:</p>
                  <p className="font-bold text-foreground text-sm">{submittedData.crea_cfta}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Documentos Anexados:</p>
                  <p className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                    {submittedData.totalDocs} arquivos enviados
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Status Atual:</p>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold text-[11px] mt-0.5">
                    Aguardando Validação e Ativação
                  </Badge>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-teal-500/5 rounded-2xl p-4 border border-teal-500/10 text-left text-xs space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-300">
                <ShieldCheck className="h-4 w-4" />
                Como funciona o acesso à sua Central de Propostas?
              </div>
              <p>
                1. O administrador acessa a plataforma em <strong>supergestao.digital/projetistas</strong> para conferência dos documentos anexados.
              </p>
              <p>
                2. Após a validação de regularidade, seu cadastro será <strong>Aprovado e Ativado</strong>.
              </p>
              <p>
                3. Você poderá fazer login com seu e-mail <strong>{submittedData.email}</strong> e a senha cadastrada para acessar seu <strong>Painel de Acompanhamento de Propostas</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleResetForm}
                className="rounded-xl w-full sm:w-auto text-xs"
              >
                Cadastrar Outro Projetista
              </Button>
              <Button
                asChild
                className="rounded-xl w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
              >
                <Link to="/auth">
                  Ir para a Tela de Login
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/15 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pb-16">
      {/* ── Top Bar Branding ──────────────────────────────────── */}
      <header className="border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-foreground tracking-tight text-base">
                  SuperGestão
                </span>
                <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0 bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  Digital
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Credenciamento de Projetistas Agropecuários
              </p>
            </div>
          </div>

          <Link
            to="/auth"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span>Área Restrita</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero Title ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 font-bold px-3 py-1 text-xs uppercase tracking-wider">
            Portal de Credenciamento
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold font-heading text-foreground tracking-tight">
            Cadastro de Projetista Técnico
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Cadastre seus dados e envie seus documentos para validação cadastral e credenciamento na plataforma de projetos rurais e PRONAF.
          </p>
        </div>
      </div>

      {/* ── Form Container ────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Card 1: Dados Pessoais & Contato ───────────────── */}
          <Card className="rounded-3xl border border-border/60 shadow-lg bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <IdCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-extrabold font-heading text-foreground">
                    1. Dados Pessoais e de Contato
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informações básicas de identificação e comunicação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  Nome Completo <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value.toUpperCase())}
                  placeholder="EX: JOÃO DA SILVA PEREIRA"
                  className="rounded-xl h-11 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    CPF <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="rounded-xl h-11 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Telefone / WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(99) 90000-0000"
                    maxLength={15}
                    className="rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    E-mail Profissional <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="projetista@email.com"
                    className="rounded-xl h-11 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Município de Residência / Atuação <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ex: São Luís"
                    className="rounded-xl h-11 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Estado (UF) <span className="text-destructive">*</span>
                  </label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_UFS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 2: Criação de Login de Acesso ─────────────── */}
          <Card className="rounded-3xl border border-border/60 shadow-lg bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-extrabold font-heading text-foreground">
                    2. Criação de Login de Acesso
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Defina sua senha para acessar sua Central de Controle de Propostas após a validação e ativação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Senha de Acesso <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      className="rounded-xl h-11 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Confirmar Senha <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita sua senha"
                      minLength={6}
                      className="rounded-xl h-11 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/15 text-xs text-muted-foreground flex items-center gap-2.5">
                <KeyRound className="h-4 w-4 text-teal-600 shrink-0" />
                <span>
                  O seu usuário de login será o e-mail <strong>{email || "(informado acima)"}</strong>. Seu acesso será liberado assim que o cadastro for validado e ativado pela equipe técnica.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 3: Dados Profissionais ───────────────────── */}
          <Card className="rounded-3xl border border-border/60 shadow-lg bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg font-extrabold font-heading text-foreground">
                    3. Dados do Registro Profissional
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informações do conselho de classe para ART/TRT e laudos técnicos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Conselho de Classe <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={conselho}
                    onValueChange={(val: "CREA" | "CFTA" | "OUTRO") => setConselho(val)}
                  >
                    <SelectTrigger className="rounded-xl h-11 text-sm font-bold">
                      <SelectValue placeholder="Selecione o Conselho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREA">CREA (Engenheiros Agrônomos / Florestais)</SelectItem>
                      <SelectItem value="CFTA">CFTA (Técnicos Agrícolas / Agropecuária)</SelectItem>
                      <SelectItem value="OUTRO">Outro Conselho Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    UF do Conselho <span className="text-destructive">*</span>
                  </label>
                  <Select value={conselhoUf} onValueChange={setConselhoUf}>
                    <SelectTrigger className="rounded-xl h-11 text-sm">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_UFS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Número do Registro <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={conselhoNumero}
                    onChange={(e) => setConselhoNumero(e.target.value.toUpperCase())}
                    placeholder="Ex: 12345/D ou 98765/P"
                    className="rounded-xl h-11 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Observações / Formação Acadêmica
                </label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informe sua formação (Ex: Engenheiro Agrônomo pela UEMA, pós-graduação em Solos e Nutrição de Plantas, experiência com PRONAF A/C/Mulher)..."
                  className="rounded-xl text-sm min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Card 4: Cards de Upload de Documentos ─────────── */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg md:text-xl font-extrabold font-heading text-foreground flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-teal-600" />
                  4. Envio de Documentos Comprobatórios
                </h3>
                <p className="text-xs text-muted-foreground">
                  Anexe os arquivos digitais em formato PDF, PNG ou JPG (até 15MB cada)
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-foreground">
                  {Object.keys(selectedFiles).length} de {DOCUMENT_CARDS.length}
                </span>
                <span className="text-muted-foreground">documentos anexados</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOCUMENT_CARDS.map((doc) => {
                const file = selectedFiles[doc.key];
                const isDragOver = dragOverKey === doc.key;

                return (
                  <Card
                    key={doc.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverKey(doc.key);
                    }}
                    onDragLeave={() => setDragOverKey(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverKey(null);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileSelect(doc.key, e.dataTransfer.files[0]);
                      }
                    }}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      file
                        ? "border-teal-500/50 bg-teal-500/5 dark:bg-teal-950/20 shadow-sm"
                        : isDragOver
                        ? "border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/50 dark:bg-teal-950/30"
                        : "border-border/60 hover:border-border bg-card hover:shadow-md"
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-sm text-foreground leading-snug">
                            {doc.title}
                          </h4>
                          {doc.required ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold shrink-0 bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                            >
                              Obrigatório
                            </Badge>
                          ) : doc.recommended ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold shrink-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                            >
                              Recomendado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium shrink-0 text-muted-foreground"
                            >
                              Opcional
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {doc.description}
                        </p>
                      </div>

                      {/* File State */}
                      {file ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-teal-500/30 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(doc.key)}
                            className="h-8 w-8 rounded-lg text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Remover arquivo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            ref={(el) => (fileInputRefs.current[doc.key] = el)}
                            type="file"
                            accept={doc.accept}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileSelect(doc.key, e.target.files[0]);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                            className="w-full rounded-xl border-dashed border-2 border-border/80 hover:border-teal-500 text-xs font-semibold h-12 flex items-center justify-center gap-2 bg-transparent text-muted-foreground hover:text-foreground"
                          >
                            <Upload className="h-4 w-4 text-teal-600" />
                            <span>Clique para anexar ou arraste o arquivo</span>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* ── Progress and Submit Button ─────────────────────── */}
          <div className="space-y-4 pt-4">
            {submitting && (
              <Card className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    <span>{currentUploadLabel}</span>
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 rounded-full" />
              </Card>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-border/60 shadow-lg">
              <div className="text-xs text-muted-foreground max-w-md">
                <p className="font-semibold text-foreground">Declaração de Veracidade:</p>
                Ao submeter este formulário, declaro que as informações e documentos enviados são legítimos e correspondem ao meu exercício profissional regular.
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-xl shadow-teal-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando Cadastro...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Cadastro para Validação</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
