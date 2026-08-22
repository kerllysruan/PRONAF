import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AgencySelector } from "./AgencySelector";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, role, displayName } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-background/80 backdrop-blur-xl px-3 sm:px-6 gap-2 sm:gap-3 shrink-0 sticky top-0 z-30 transition-all max-w-full overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <SidebarTrigger className="h-9 w-9 hover:bg-accent/10 transition-colors text-foreground rounded-xl flex items-center justify-center" />
              <div className="h-6 w-px bg-border/60 mx-0.5 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-foreground font-heading leading-none tracking-tight">
                  PRONAF
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium hidden sm:block">
                  Sistema de Gestão Estoque
                </span>
              </div>
            </div>

            <div className="flex-1 px-1 sm:px-2 max-w-md hidden md:block">
              <AgencySelector />
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="md:hidden max-w-[140px] sm:max-w-[200px]">
                <AgencySelector />
              </div>
              <div className="h-8 w-px bg-border/60 mx-1 hidden md:block" />
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-foreground">
                  {displayName || user?.user_metadata?.displayName || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider font-bold">
                  {role === 'developer' ? 'Desenvolvedor' :
                    role === 'admin' ? 'Gerente Geral' :
                      role === 'gerente' ? 'Gerente de Agência' :
                        role === 'tecnico' ? 'Técnico' : 'Visitante'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sair"
                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 md:p-6 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
