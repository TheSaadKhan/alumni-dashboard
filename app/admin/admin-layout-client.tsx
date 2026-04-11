"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  Search,
  LogOut,
  Sun,
  Moon,
  FileText,
  PieChart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Activity,
  Globe,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle
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
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuthProfile } from "@/context/AuthContext";

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

const mockNotifications = [
  { id: "1", title: "New Alumni Registration", description: "John Doe just registered as an alumnus.", type: "user", time: "2 min ago", unread: true },
  { id: "2", title: "Job Post Pending", description: "TechCorp has posted a new Job requires approval.", type: "job", time: "1 hour ago", unread: true },
  { id: "3", title: "Donation Received", description: "A new donation of $500 was received.", type: "donation", time: "3 hours ago", unread: false },
  { id: "4", title: "Server Update", description: "The system will undergo maintenance at midnight.", type: "system", time: "5 hours ago", unread: false },
];

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  const { profile, loading: profileLoading } = useAuthProfile();
  const router = useRouter();

  // Strict Role Access Check
  useEffect(() => {
    if (!profileLoading && profile) {
      if (profile.userType !== "admin" && profile.userType !== "super_admin") {
        router.push("/dashboard");
      }
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Activity className="h-5 w-5 animate-pulse text-slate-300" />
      </div>
    );
  }

  const initials = user?.firstName?.[0]?.toUpperCase() || "A";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Admin";

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 border-none bg-white dark:bg-slate-900">
          <MobileSidebar
            pathname={pathname}
            fullName={fullName}
            initials={initials}
            setMobileMenuOpen={setMobileMenuOpen}
            theme={theme}
            setTheme={setTheme}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Banner Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
           <Link href="/admin" className="flex items-center w-full justify-center lg:justify-start">
              {sidebarCollapsed ? (
                <Image src="/assets/image/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
              ) : (
                <Image src="/assets/image/bannerLogo.png" alt="AlumniConnect Logo" width={160} height={40} className="object-contain h-10 w-auto" />
              )}
           </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
           <div className="space-y-1">
              {adminNavigation.map((item) => {
                 const isActive = pathname === item.href;
                 return (
                    <Link
                       key={item.href}
                       href={item.href}
                       className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-semibold shadow-sm" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                       } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                       <item.icon className="h-4 w-4" />
                       {!sidebarCollapsed && (
                          <span className="text-sm">{item.name}</span>
                       )}
                    </Link>
                 );
              })}
           </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 gap-2 flex flex-col">
           <Button
              variant="outline"
              size={sidebarCollapsed ? "icon" : "sm"}
              className="w-full text-slate-500 hover:text-blue-600 rounded-lg h-9"
              asChild
           >
              <Link href="/" target="_blank">
                <ExternalLink className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2 text-xs font-semibold">Live Site</span>}
              </Link>
           </Button>
           <div className="flex gap-1">
              <Button
                 variant="ghost"
                 size="icon"
                 className="flex-1 h-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
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
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
         {/* Topbar */}
         <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Button
                 variant="ghost"
                 size="icon"
                 className="lg:hidden h-9 w-9"
                 onClick={() => setMobileMenuOpen(true)}
               >
                 <Menu className="h-5 w-5" />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 className="hidden lg:flex h-9 w-9 text-slate-400 hover:text-slate-900"
                 onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
               >
                 {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
               </Button>
               <div className="hidden md:flex flex-col">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Admin Hub</h2>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Management Framework</p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="relative hidden lg:block group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500" />
                  <Input 
                    placeholder="Quick search..." 
                    className="h-9 w-64 pl-9 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 focus:bg-white transition-all text-xs" 
                  />
               </div>

               {/* Notifications Popover */}
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 relative hover:bg-slate-100 transition-colors">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 bg-rose-600 rounded-full border-2 border-white dark:border-slate-950"></span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[320px] rounded-xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="p-4 border-b bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                       <h4 className="text-sm font-bold">Notifications</h4>
                       <Badge variant="secondary" className="bg-blue-100 text-blue-600 rounded-full">{unreadCount} New</Badge>
                    </div>
                    <ScrollArea className="h-[350px]">
                       {mockNotifications.map(notification => (
                          <DropdownMenuItem key={notification.id} className="p-4 border-b border-slate-50 last:border-none focus:bg-slate-50 cursor-pointer">
                             <div className="flex gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notification.unread ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                   {notification.type === 'user' && <Users className="h-4 w-4" />}
                                   {notification.type === 'job' && <Briefcase className="h-4 w-4" />}
                                   {notification.type === 'donation' && <DollarSign className="h-4 w-4" />}
                                   {notification.type === 'system' && <ShieldCheck className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                   <p className={`text-xs font-bold leading-tight ${notification.unread ? 'text-slate-900' : 'text-slate-500'}`}>{notification.title}</p>
                                   <p className="text-[11px] text-slate-500 line-clamp-2">{notification.description}</p>
                                   <p className="text-[10px] text-slate-400 flex items-center"><Clock className="h-3 w-3 mr-1" /> {notification.time}</p>
                                </div>
                             </div>
                          </DropdownMenuItem>
                       ))}
                    </ScrollArea>
                    <div className="p-2 border-t text-center bg-slate-50">
                       <Button variant="ghost" size="sm" className="w-full text-[11px] font-bold text-blue-600 hover:bg-transparent">Clear All Notifications</Button>
                    </div>
                  </DropdownMenuContent>
               </DropdownMenu>

               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group">
                       <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-none group-hover:text-blue-600 transition-colors">{fullName}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Administrator</p>
                       </div>
                       <Avatar className="h-9 w-9 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <AvatarImage src={user?.imageUrl} />
                          <AvatarFallback className="bg-slate-100 font-bold text-xs text-slate-600">{initials}</AvatarFallback>
                       </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border-none shadow-2xl p-2 mt-2">
                     <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-3 tracking-[0.2em] py-3">Security Access</DropdownMenuLabel>
                     <DropdownMenuItem className="rounded-lg py-2 cursor-pointer text-xs font-bold"><UserCircle className="h-3.5 w-3.5 mr-2" /> Private Profile</DropdownMenuItem>
                     <DropdownMenuItem className="rounded-lg py-2 cursor-pointer text-xs font-bold" onClick={() => router.push("/admin/settings")}><Settings className="h-3.5 w-3.5 mr-2" /> Nexus Settings</DropdownMenuItem>
                     <DropdownMenuSeparator className="my-2 bg-slate-50" />
                     <SignOutButton>
                        <DropdownMenuItem className="rounded-lg py-2 cursor-pointer text-xs font-bold text-rose-500"><LogOut className="h-3.5 w-3.5 mr-2" /> Secure Termination</DropdownMenuItem>
                     </SignOutButton>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </header>

         <main className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
            {children}
         </main>
      </div>
    </div>
  );
}

function MobileSidebar({
  pathname,
  fullName,
  initials,
  setMobileMenuOpen,
  theme,
  setTheme,
}: {
  pathname: string;
  fullName: string;
  initials: string;
  setMobileMenuOpen: (open: boolean) => void;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
       <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
          <Image src="/assets/image/bannerLogo.png" alt="Logo" width={140} height={35} className="object-contain" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
             <X className="h-5 w-5" />
          </Button>
       </div>

       <ScrollArea className="flex-1 p-4">
          <nav className="space-y-1">
             {adminNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                   <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive 
                         ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold" 
                         : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                   >
                      <item.icon className="h-4.5 w-4.5" />
                      <span className="text-sm">{item.name}</span>
                   </Link>
                );
             })}
          </nav>
       </ScrollArea>

       <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
             <Avatar className="h-9 w-9 rounded-lg">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xs">{initials}</AvatarFallback>
             </Avatar>
             <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white leading-none">{fullName}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">Level: Root</p>
             </div>
          </div>
          <Button
            variant="ghost"
            className="w-full h-11 justify-start px-3 text-xs font-bold uppercase tracking-widest rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 mr-3" /> : <Moon className="h-4 w-4 mr-3" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <SignOutButton>
             <Button className="w-full h-11 justify-start px-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                <LogOut className="h-4 w-4 mr-3" /> Termination
             </Button>
          </SignOutButton>
       </div>
    </div>
  );
}
