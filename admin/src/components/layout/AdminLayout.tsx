import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, ArrowLeftRight, Wallet, Gift,
  MapPin, BookOpen, Brain, Headphones, Bell, Settings, LogOut, BarChart3,
  ChevronRight, Search, User as UserIcon,
  Trophy, 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Waste Posts", url: "/waste-posts", icon: FileText },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Wallet & Points", url: "/wallet", icon: Wallet },
  { title: "Rewards", url: "/rewards", icon: Gift },
  { title: "Collection Points", url: "/collection-points", icon: MapPin },
  { title: "Education", url: "/education", icon: BookOpen },
  { title: "Leaderboard", url: "/ranks", icon: Trophy },
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
  const location = useLocation();

  const currentItem = menuItems.find(item => item.url === location.pathname) || { title: "Hệ thống" };
  const initial = user?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50/40">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-10 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 hover:bg-slate-100 transition-colors" />
              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">Admin</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-foreground">{currentItem.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="hidden lg:flex items-center relative group">
                <Search className="h-4 w-4 absolute left-3 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh..."
                  className="pl-9 pr-4 py-1.5 text-sm rounded-full bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all w-60 outline-none"
                />
              </div>

              <div className="relative p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors group">
                <Bell className="h-5 w-5 text-slate-600 group-hover:text-emerald-600" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-orange-500 rounded-full border-2 border-white"></span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-2 rounded-lg transition-colors">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover border border-emerald-100 shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {initial}
                      </div>
                    )}
                    <div className="hidden md:flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold text-slate-700">{user?.name || "Admin"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Quản trị viên</span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl border-border/50">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                    <UserIcon className="h-4 w-4" /> Hồ sơ cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 py-2">
                    <Settings className="h-4 w-4" /> Cài đặt tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => { logout(); navigate("/login"); }}
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}