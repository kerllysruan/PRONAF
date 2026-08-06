import {
  LayoutDashboard,
  FileText,
  FolderCheck,
  Shield,
  Building2,
  Box,
  Share2,
  Wheat,
  UserCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppData } from "@/contexts/AppDataContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: "can_view_dashboard", badge: null as string | null },
  { title: "Propostas Concluídas", url: "/propostas", icon: FileText, permission: "can_view_proposals", badge: "concluded" as string },
  { title: "Estoque", url: "/estoque", icon: Box, permission: "can_view_proposals", badge: "stock" as string },
  { title: "Troca de Arquivos", url: "/troca-arquivos", icon: Share2, permission: "can_view_proposals", badge: null as string | null },
  { title: "Projetistas", url: "/projetistas", icon: UserCheck, permission: "can_view_proposals", badge: null as string | null },
  { title: "Documentação", url: "/documentacao", icon: FolderCheck, permission: "can_view_documentation", badge: "doc" as string },
  { title: "Controle de Acesso", url: "/controle-acesso", icon: Shield, permission: "can_view_access_control", badge: null as string | null },
  { title: "Gestão de Agências", url: "/admin/agencies", icon: Building2, permission: "can_manage_agencies", badge: null as string | null },
];

export function AppSidebar() {
  const { permissions, isAdmin, loading } = usePermissions();
  const { pendingStockCount, pendingDocCount, concludedCount } = useAppData();

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.permission === "is_admin") return isAdmin;
    return !!permissions[item.permission as keyof typeof permissions];
  });

  function getBadgeCount(badge: string | null): number | null {
    if (!badge) return null;
    if (badge === "stock") return pendingStockCount > 0 ? pendingStockCount : null;
    if (badge === "doc") return pendingDocCount > 0 ? pendingDocCount : null;
    if (badge === "concluded") return concludedCount > 0 ? concludedCount : null;
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <Wheat className="h-5 w-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-black text-sidebar-primary-foreground font-heading tracking-tight">
              SUPER GESTÃO
            </h2>
            <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">
              Plataforma PRONAF
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[9px] tracking-widest font-bold">
              Navegação
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {!loading &&
                filteredMenuItems.map((item) => {
                  const count = getBadgeCount(item.badge);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="hover:bg-sidebar-accent/60 transition-all duration-200 relative"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1">{item.title}</span>
                          {count !== null && (
                            <span className="group-data-[collapsible=icon]:hidden ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center tabular-nums">
                              {count > 99 ? "99+" : count}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Flow status indicator */}
        <div className="mx-3 mt-auto mb-4 group-data-[collapsible=icon]:hidden">
          <div className="rounded-xl border border-sidebar-border/50 bg-sidebar-accent/30 p-3 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
              Pipeline Atual
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-sidebar-accent/50 p-1.5">
                <div className="text-sm font-black text-indigo-400 leading-none">{pendingStockCount}</div>
                <div className="text-[8px] text-sidebar-foreground/50 font-medium mt-0.5">Estoque</div>
              </div>
              <div className="rounded-lg bg-sidebar-accent/50 p-1.5">
                <div className="text-sm font-black text-violet-400 leading-none">{pendingDocCount}</div>
                <div className="text-[8px] text-sidebar-foreground/50 font-medium mt-0.5">Doc.</div>
              </div>
              <div className="rounded-lg bg-sidebar-accent/50 p-1.5">
                <div className="text-sm font-black text-emerald-400 leading-none">{concludedCount}</div>
                <div className="text-[8px] text-sidebar-foreground/50 font-medium mt-0.5">Concluído</div>
              </div>
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
