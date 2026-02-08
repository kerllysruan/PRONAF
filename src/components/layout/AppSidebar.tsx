import {
  LayoutDashboard,
  FileText,
  Columns3,
  FolderCheck,
  CalendarDays,
  Wheat,
  Settings,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Propostas", url: "/propostas", icon: FileText },
  { title: "Kanban", url: "/kanban", icon: Columns3 },
  { title: "Documentação", url: "/documentacao", icon: FolderCheck },
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Gerenciamento", url: "/gerenciamento", icon: Settings },
  { title: "Controle de Acesso", url: "/controle-acesso", icon: Shield },
];

export function AppSidebar() {
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
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-wider font-semibold">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
