import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

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
            .from('user_profiles')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Wheat className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">PRONAF</h1>
          <p className="text-sm text-muted-foreground">Gerenciador de Propostas</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg font-heading">
              {isLogin ? "Entrar na conta" : "Criar nova conta"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Use suas credenciais para acessar" : "Preencha os dados para se cadastrar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin && (
              <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'matricula')} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="matricula">Matrícula</TabsTrigger>
                  <TabsTrigger value="email">E-mail</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {isLogin && loginType === 'matricula' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="matricula"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                        placeholder="Ex: F180227"
                        className="pl-9 uppercase"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">{isLogin ? "E-mail" : "E-mail"}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {isLogin ? "Entrar" : "Cadastrar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
