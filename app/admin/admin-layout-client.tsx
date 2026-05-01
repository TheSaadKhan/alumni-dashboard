"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Briefcase,
  LayoutDashboard,
  Settings,
  DollarSign,
  Menu,
  X,
  Bell,
  LogOut,
  Sun,
  Moon,
  FileText,
  PieChart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ExternalLink,
  ShieldCheck,
  Search
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useAuthProfile } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Alumni", href: "/admin/alumni", icon: UserCircle },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Donations", href: "/admin/donations", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const { profile, loading: profileLoading } = useAuthProfile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict Role Access Check
  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.userType !== "admin" && profile.userType !== "super_admin") {
        router.push("/dashboard");
      }
    }
  }, [profile, profileLoading, router]);

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ShieldCheck className="h-6 w-6 animate-pulse text-slate-300" />
      </div>
    );
  }

  const initials = user?.firstName?.[0]?.toUpperCase() || "A";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin";

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          {!sidebarCollapsed ? (
            <div className="relative h-10 w-40">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
                alt="AlumniConnect Logo"
                fill
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          ) : (
            <ShieldCheck className="h-6 w-6 text-indigo-600" />
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {adminNavigation
            .filter(item => {
              const isSuperAdmin = profile?.userType === "super_admin";
              const restrictedItems = ["Users", "Settings", "Analytics", "Reports"];
              if (!isSuperAdmin && restrictedItems.includes(item.name)) return false;
              return true;
            })
            .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-slate-100 text-indigo-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {!sidebarCollapsed && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500"
          asChild
        >
          <Link href="/" target="_blank">
            <ExternalLink className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && <span className="text-xs">Live Site</span>}
          </Link>
        </Button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="flex-1 h-9 rounded-md"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <SignOutButton>
             <Button variant="ghost" size="icon" className="flex-1 h-9 rounded-md text-slate-400 hover:text-rose-500">
                <LogOut className="h-4 w-4" />
             </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col transition-all duration-300 border-r border-slate-200 dark:border-slate-800",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className={cn("flex-1", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                   <Menu className="h-5 w-5" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="left" className="p-0 w-64">
                 <SidebarContent />
               </SheetContent>
             </Sheet>
             
             <Button
               variant="ghost"
               size="icon"
               className="hidden lg:flex h-9 w-9 text-slate-400"
               onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
             >
               {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
             </Button>
             
             <div className="hidden sm:block">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Administrator</h2>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Institutional Platform</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Global search..." 
                  className="h-9 w-64 pl-9 rounded-lg border-slate-200 bg-slate-50 text-xs" 
                />
             </div>

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-2 text-center text-xs text-slate-500">No new notifications</div>
                </DropdownMenuContent>
             </DropdownMenu>

             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 rounded-lg cursor-pointer border shadow-sm">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-slate-100 font-bold text-xs text-slate-600">{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                   <DropdownMenuLabel>My Account</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => router.push("/admin/settings")}>Settings</DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <SignOutButton>
                      <DropdownMenuItem className="text-rose-500">Sign Out</DropdownMenuItem>
                   </SignOutButton>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
