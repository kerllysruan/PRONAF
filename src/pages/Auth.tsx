import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Mail, Lock, User, ArrowRight, Loader2, Fingerprint } from "lucide-react";

export default function Auth() {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState<'email' | 'matricula'>('matricula');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        if (loginType === 'matricula') {
          // Login com matrícula - precisamos primeiro encontrar o email
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('matricula', matricula)
            .single();

          if (profileError || !profiles) {
            throw new Error('Matrícula não encontrada');
          }

          // Agora precisamos recuperar o email do usuário
          // Como não temos acesso direto ao auth.users, tentaremos fazer login com um email conhecido pattern
          // Este é um flow simplificado - em produção você teria um endpoint backend
          const possibleEmail = `admin-${matricula}@pronaf.local`;

          const { error } = await supabase.auth.signInWithPassword({
            email: possibleEmail,
            password
          });

          if (error) {
            // Tentar sem o padrão
            throw new Error('Matrícula ou senha incorretos');
          }

          toast({ title: "Bem-vindo de volta!" });
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast({ title: "Bem-vindo de volta!" });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
              matricula: loginType === 'matricula' ? matricula : undefined,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Verifique seu e-mail para confirmar o cadastro.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5 p-4 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse " style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary text-primary-foreground shadow-[0_20px_50px_rgba(59,130,246,0.3)] transform transition-transform hover:scale-105 duration-500">
            <Wheat className="h-10 w-10 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h1 className="text-4xl font-black font-heading text-foreground tracking-tighter">PRONAF</h1>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mt-1">Planner Profissional</p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 bg-card/40 backdrop-blur-xl shadow-premium overflow-hidden">
          <CardHeader className="text-center pt-10 pb-4">
            <CardTitle className="text-2xl font-black font-heading tracking-tight">
              {isLogin ? "Bem-vindo de volta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              {isLogin ? "Entre com suas credenciais para continuar" : "Preencha os campos para iniciar sua jornada"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            {isLogin && (
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'matricula')} className="mb-8">
                <TabsList className="grid w-full grid-cols-2 h-12 rounded-2xl bg-muted/20 p-1 border border-border/40">
                  <TabsTrigger value="matricula" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Matrícula</TabsTrigger>
                  <TabsTrigger value="email" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">E-mail</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/10 focus:bg-white transition-all font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              {isLogin && loginType === 'matricula' ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sua Matrícula</Label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                      placeholder="Ex: F180227"
                      className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/10 focus:bg-white transition-all font-bold uppercase tracking-widest"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@email.com"
                      className="pl-12 h-14 rounded-2xl border-border/40 bg-muted/10 focus:bg-white transition-all font-bold"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sua Senha</Label>
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
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-lg gap-3 mt-4" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? "Acessar Plataforma" : "Criar Minha Conta"}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center pt-4 border-t border-border/20">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
              >
                {isLogin ? "Não possui acesso? Cadastre-se agora" : "Já possui conta? Realizar login"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          PRONAF © {new Date().getFullYear()} • Sistema Seguro
        </p>
      </div>
    </div>
  );
}
