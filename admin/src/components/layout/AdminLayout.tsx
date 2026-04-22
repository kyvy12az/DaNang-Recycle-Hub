import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, ArrowLeftRight, Wallet, Gift,
  MapPin, BookOpen, Brain, Headphones, Bell, Settings, Leaf, LogOut, BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Waste Posts", url: "/waste-posts", icon: FileText },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Wallet & Points", url: "/wallet", icon: Wallet },
  { title: "Rewards", url: "/rewards", icon: Gift },
  { title: "Collection Points", url: "/collection-points", icon: MapPin },
  { title: "Education", url: "/education", icon: BookOpen },
  { title: "AI Logs", url: "/ai-logs", icon: Brain },
  { title: "Support", url: "/support", icon: Headphones },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-5">
          {/* <Leaf className="h-7 w-7 text-sidebar-primary shrink-0" /> */}
          <img src="/logo.png" alt="Logo Admin" className="h-8 w-8" />
          {!collapsed && (
            <span className="font-bold text-base text-sidebar-primary-foreground whitespace-nowrap">
              DaNang Recycle Hub
            </span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover border"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                  {initial}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground">{user?.name || "Admin"}</span>
              <LogOut className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-destructive transition-colors" onClick={() => { logout(); navigate("/login"); }} />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
