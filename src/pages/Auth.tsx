import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Lock, ArrowRight, Loader2, Fingerprint } from "lucide-react";

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
      // 1. Resolve matrícula → email via edge function pública
      const { data: funcData, error: funcError } = await supabase.functions.invoke(
        "login-by-matricula",
        { body: { matricula: matricula.trim().toUpperCase() } }
      );

      if (funcError || funcData?.error) {
        throw new Error(funcData?.error || funcError?.message || "Matrícula não encontrada");
      }

      const { email } = funcData as { email: string };

      // 2. Autenticar com o email interno + senha
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // Mensagem amigável sem expor o email interno
        if (signInError.message.toLowerCase().includes("invalid")) {
          throw new Error("Matrícula ou senha incorretos");
        }
        throw signInError;
      }

      toast({ title: "✅ Bem-vindo de volta!", description: "Acesso autorizado com sucesso." });
    } catch (error: any) {
      toast({
        title: "Acesso negado",
        description: error.message || "Verifique sua matrícula e senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5 p-4 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(59,130,246,0.3)] transform transition-transform hover:scale-105 duration-500">
            <Wheat className="h-10 w-10 animate-bounce" style={{ animationDuration: "3s" }} />
          </div>
          <div>
            <h1 className="text-4xl font-black font-heading text-foreground tracking-tighter">PRONAF</h1>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Planner Profissional</p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-premium overflow-hidden">
          <CardHeader className="text-center pt-10 pb-4">
            <CardTitle className="text-2xl font-black font-heading tracking-tight">
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Entre com sua matrícula e senha para continuar
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Matrícula */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Matrícula
                </Label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                    placeholder="Ex: F180227"
                    className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/10 focus:bg-white transition-all font-bold uppercase tracking-widest text-slate-900"
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Senha
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/10 focus:bg-white transition-all font-bold"
                    minLength={6}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-lg gap-3 mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span>Acessar Plataforma</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Acesso restrito · Credenciais fornecidas pelo administrador
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          PRONAF © {new Date().getFullYear()} • Sistema Seguro
        </p>
      </div>
    </div>
  );
}
