import {
  LayoutDashboard,
  FileText,
  Columns3,
  FolderCheck,
  ClipboardList,
  DollarSign,
  Wheat,
  Settings,
  Shield,
  Building2,
  Box,
  Share2
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePermissions } from "@/hooks/usePermissions";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permission: "can_view_dashboard" },
  { title: "Propostas Concluídas", url: "/propostas", icon: FileText, permission: "can_view_proposals" },
  { title: "Estoque", url: "/estoque", icon: Box, permission: "can_view_proposals" },
  { title: "Troca de Arquivos", url: "/troca-arquivos", icon: Share2, permission: "can_view_proposals" },
  { title: "Documentação", url: "/documentacao", icon: FolderCheck, permission: "can_view_documentation" },
  { title: "Controle de Acesso", url: "/controle-acesso", icon: Shield, permission: "can_view_access_control" },
  { title: "Gestão de Agências", url: "/admin/agencies", icon: Building2, permission: "can_manage_agencies" },
];

export function AppSidebar() {
  const { permissions, isAdmin, loading } = usePermissions();

  const filteredMenuItems = menuItems.filter(item => {
    // 1. If it's a hardcoded admin route, check role
    if (item.permission === "is_admin") return isAdmin;

    // 2. Check the specific permission flag
    const hasPermission = !!permissions[item.permission as keyof typeof permissions];

    // 3. Developers and Admins see everything unless explicitly disabled
    // But for a better "automatic" experience, let's respect the flag strictly
    // as it's what's shown in the Access Control panel.
    return hasPermission;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Wheat className="h-5 w-5" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-sm font-bold text-sidebar-primary-foreground font-heading tracking-tight">
              PRONAF
            </h2>
            <p className="text-xs text-sidebar-foreground/60">
              Gerenciador de Propostas
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-2">
            <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider font-semibold">
              Menu Principal
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {!loading && filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
