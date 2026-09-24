import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Lock, ArrowRight, Loader2, Fingerprint, UserCheck } from "lucide-react";
import { MEDIA_CONFIG } from "@/config/imageConfig";

export default function Auth() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula.trim() || !password) return;
    setLoading(true);

    try {
      const cleanInput = matricula.trim();
      let targetEmail = "";

      if (cleanInput.includes("@")) {
        // Digitou e-mail diretamente
        targetEmail = cleanInput.toLowerCase();
      } else {
        // Tentar resolver matrícula via Edge Function
        try {
          const { data: funcData, error: funcError } = await supabase.functions.invoke(
            "login-by-matricula",
            { body: { matricula: cleanInput.toUpperCase() } }
          );

          if (!funcError && funcData?.email) {
            targetEmail = funcData.email;
          }
        } catch {
          // ignore
        }

        // Se ainda não achou e tem formato de CPF
        if (!targetEmail) {
          const digits = cleanInput.replace(/\D/g, "");
          if (digits.length === 11) {
            const { data: projByCpf } = await supabase
              .from("projetistas")
              .select("email")
              .eq("cpf", cleanInput)
              .maybeSingle();

            if (projByCpf?.email) {
              targetEmail = projByCpf.email;
            }
          }
        }

        // Fallback: tentar o próprio input
        if (!targetEmail) {
          targetEmail = cleanInput.toLowerCase();
        }
      }

      // 1. Autenticar com o email + senha
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("invalid")) {
          throw new Error("Matrícula/E-mail ou senha incorretos");
        }
        throw signInError;
      }

      // 2. Verificar se é projetista e se está aprovado e ativo
      const loggedUser = authData?.user;
      if (loggedUser) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", loggedUser.id)
          .maybeSingle();

        if (roleRow?.role === "projetista") {
          const { data: projRow } = await supabase
            .from("projetistas")
            .select("status, motivo_rejeicao, name")
            .or(`user_id.eq.${loggedUser.id},email.ilike.${loggedUser.email}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (projRow && projRow.status !== "ativo") {
            await supabase.auth.signOut();
            if (projRow.status === "pendente") {
              throw new Error(
                "⏳ Seu cadastro foi recebido com sucesso e está AGUARDANDO VALIDAÇÃO pela equipe técnica. Assim que for ativado pelo administrador, seu acesso será liberado!"
              );
            } else {
              throw new Error(
                `⛔ Cadastro Inativo: ${projRow.motivo_rejeicao || "Seu credenciamento não está ativo no momento. Contate o suporte."}`
              );
            }
          }
        }
      }

      toast({ title: "✅ Bem-vindo de volta!", description: "Acesso autorizado com sucesso." });
    } catch (error: any) {
      toast({
        title: "Acesso não autorizado",
        description: error.message || "Verifique sua matrícula/e-mail e senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative font-sans">
      {/* ── BACKGROUND IMAGE ── */}
      <div
        className="absolute inset-0 bg-cover bg-center filter saturate-[1.3] contrast-[1.12] brightness-[1.08] transform scale-100 transition-all duration-1000"
        style={{ backgroundImage: `url(${MEDIA_CONFIG.images.sunriseDawn})` }}
      />

      {/* Dark Ambient Vignette Overlay for High Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/80 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-amber-400/60 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.35)] transform transition-transform hover:scale-105 duration-500">
            <Wheat className="h-10 w-10 text-amber-300" />
          </div>
          <div>
            <h1
              className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 uppercase tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              SUPER GESTÃO
            </h1>
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-1">
              AGRICULTURA FAMILIAR — PRONAF
            </p>
          </div>
        </div>

        {/* Login Form Glassmorphic Card */}
        <Card className="rounded-[2.5rem] border-2 border-amber-400/30 bg-emerald-950/85 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden text-slate-100">
          <CardHeader className="text-center pt-8 pb-3">
            <CardTitle
              className="text-2xl font-black tracking-tight text-amber-200 drop-shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="font-medium text-emerald-200/90 text-xs sm:text-sm">
              Informe sua matrícula ou e-mail e sua senha para entrar na plataforma
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Matrícula ou E-mail */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-300 ml-1">
                  Matrícula ou E-mail
                </Label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 group-focus-within:text-amber-300 transition-colors" />
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Matrícula (ex: F180227) ou seu e-mail"
                    className="pl-12 h-13 rounded-2xl border-amber-400/30 bg-slate-950/60 text-white placeholder:text-slate-400 focus:bg-slate-950/90 focus:border-amber-400/30 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none outline-none caret-amber-400 transition-all font-bold text-sm"
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-300 ml-1">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400 group-focus-within:text-amber-300 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-13 rounded-2xl border-amber-400/30 bg-slate-950/60 text-white placeholder:text-slate-400 focus:bg-slate-950/90 focus:border-amber-400/30 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none outline-none caret-amber-400 transition-all font-bold text-sm"
                    minLength={6}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all gap-2 mt-3"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-950" />
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Link para Auto-Cadastro de Projetistas */}
            <div className="pt-2 border-t border-amber-400/20 text-center">
              <Link
                to="/cadastro-projetista"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors py-1 hover:underline"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>É projetista técnico? Cadastre-se aqui</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80 drop-shadow-md">
          SUPER GESTÃO PRONAF © {new Date().getFullYear()} • Sistema Seguro
        </p>
      </div>
    </div>
  );
}
