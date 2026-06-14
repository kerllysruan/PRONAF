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
  const { user, signOut, role } = useAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b bg-background/60 backdrop-blur-xl px-4 md:px-6 gap-3 shrink-0 sticky top-0 z-30 transition-all">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 hover:bg-accent/10 transition-colors md:hidden" />
              <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground font-heading leading-none">
                  PRONAF
                </span>
                <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">
                  Sistema de Gestão Estoque
                </span>
              </div>
            </div>

            <div className="flex-1 px-2 max-w-md hidden md:block">
              <AgencySelector />
            </div>

            <div className="ml-auto flex items-center gap-2 md:gap-4">
              <div className="md:hidden">
                <AgencySelector />
              </div>
              <div className="h-8 w-px bg-border/60 mx-1 hidden md:block" />
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-foreground">
                  {user?.email?.split('@')[0]}
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
                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
