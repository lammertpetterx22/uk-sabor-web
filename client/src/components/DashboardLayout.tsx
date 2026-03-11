import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, LogOut, PanelLeft, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  
  // Guardamos y recuperamos el estado del sidebar en localStorage
  // Por defecto es cerrado (false)
  const [defaultOpen, setDefaultOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-open");
    return saved ? saved === "true" : false;
  });

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      open={defaultOpen}
      onOpenChange={(open) => {
        setDefaultOpen(open);
        localStorage.setItem("sidebar-open", String(open));
      }}
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { open, setOpen, toggleSidebar, isMobile } = useSidebar();
  const activeMenuItem = menuItems.find((item) => item.path === location);

  return (
    <>
      {/* Desktop Overlay: Only renders on desktop when the sidebar is open */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity z-[9] md:block hidden ${
          open ? "opacity-100 pointer-events-auto animate-in fade-in" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* The Sidebar wrapper */}
      <div
        className={`fixed inset-y-0 left-0 z-[50] w-[280px] md:w-[280px] bg-sidebar transform transition-transform duration-300 ease-in-out md:block hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar 
          className="border-r-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] w-full h-full [&_[data-slot=sidebar-gap]]:hidden" 
          collapsible="none"
        >
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2 transition-all w-full">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 md:hidden"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold tracking-tight truncate">
                Navigation
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarMenu className="px-2 py-1">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => {
                      setLocation(item.path);
                      // Cerramos automáticamente el sidebar (opcional pero usual en mobile/tablet/desktop drawers)
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                    tooltip={item.label}
                    className="h-10 transition-all font-normal"
                  >
                    <item.icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                    />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1.5">
                    {user?.email || "-"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border shadow-lg bg-popover/95 backdrop-blur-sm z-[100]"
            >
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      </div>

      <SidebarInset className="bg-background relative flex w-full flex-1 flex-col">
        {/* El Header superior visible en todo momento (mobile y desktop) */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-accent transition-colors" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium tracking-tight text-foreground">
                  {activeMenuItem?.label ?? "Menu"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
