import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MoveLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/50 via-background to-muted/20">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative flex justify-center">
          <div className="h-32 w-32 rounded-[2.5rem] bg-rose-50 flex items-center justify-center text-rose-500 shadow-xl shadow-rose-500/10">
            <AlertCircle className="h-16 w-16" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-4 bg-white px-6 py-1 rounded-full border-2 border-rose-100 shadow-sm">
            <span className="text-xl font-black text-rose-500 font-heading tracking-widest">404</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <h1 className="text-3xl font-black font-heading tracking-tight text-foreground">Caminho Inválido</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            A página que você está procurando não existe ou foi movida para um novo endereço.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate("/")}
            className="h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-black text-base gap-3"
          >
            <MoveLeft className="h-5 w-5" />
            Voltar ao Início
          </Button>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            PRONAF • Erro de Navegação
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
