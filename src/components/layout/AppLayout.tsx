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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-sm px-4 gap-3 shrink-0 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground mr-2">
              Gerenciador PRONAF
            </span>
            <AgencySelector />
            <div className="ml-auto flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-medium text-foreground">
                  {user?.email}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {role === 'developer' ? 'Desenvolvedor' :
                    role === 'admin' ? 'Gerente Geral' :
                      role === 'gerente' ? 'Gerente de Agência' :
                        role === 'tecnico' ? 'Técnico' : 'Visitante'}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sair" className="h-8 w-8">
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
