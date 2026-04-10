"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  CalendarDays,
  Briefcase,
  Mail,
  HeartHandshake,
  Settings,
  LogOut,
  X,
  Shield,
  UserCircle,
  Sun,
  Moon,
  ExternalLink,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthProfile } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

// Navigation items by role
const navigationByRole: Record<string, NavItem[]> = {
  super_admin: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Admin View", href: "/admin", icon: Shield },
    { name: "Network", href: "/dashboard/network", icon: Users },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Careers", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  admin: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Admin View", href: "/admin", icon: Shield },
    { name: "Network", href: "/dashboard/network", icon: Users },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Careers", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  alumni: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Network", href: "/dashboard/network", icon: Users },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Careers", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
  student: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Network", href: "/dashboard/network", icon: Users },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays },
    { name: "Careers", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: Mail },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ],
};

interface RoleBasedSidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function RoleBasedSidebar({ mobileMenuOpen, setMobileMenuOpen }: RoleBasedSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const { profile, loading: profileLoading } = useAuthProfile();

  // Get user role
  const userRole = profile?.userType || "alumni";
  const navigation = navigationByRole[userRole] || navigationByRole.alumni;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
       router.push("/sign-in");
    }
  };

  if (profileLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out flex flex-col shadow-sm",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Banner Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-50 dark:border-slate-800/50 justify-between">
           <Link href="/dashboard" className="flex items-center">
              <Image 
                src="/assets/image/bannerLogo.png" 
                alt="AlumniConnect Logo" 
                width={120} 
                height={30} 
                className="object-contain" 
              />
           </Link>
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden h-8 w-8 text-slate-400"
             onClick={() => setMobileMenuOpen?.(false)}
           >
             <X className="h-4 w-4" />
           </Button>
        </div>

        {/* User Profile Context */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/20">
           <div className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8 rounded-lg border-2 border-white dark:border-slate-800 shadow-sm">
                 <AvatarImage src={profile?.avatarUrl || user?.imageUrl} />
                 <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xs">
                    {profile?.fullName?.charAt(0) || "U"}
                 </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">
                    {profile?.fullName || user?.firstName || "Member"}
                 </p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                    Verified {userRole.replace("_", " ")}
                 </p>
              </div>
           </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
           <div className="space-y-1">
              {navigation.map((item) => {
                 const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                 return (
                    <Link
                       key={item.href}
                       href={item.href}
                       onClick={() => setMobileMenuOpen?.(false)}
                       className={clsx(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                          isActive
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                       )}
                    >
                       <item.icon className={clsx("h-4.5 w-4.5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                       <span className="text-sm">{item.name}</span>
                       {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-600 text-[10px] font-black border-none px-1.5 h-4.5">
                             {item.badge}
                          </Badge>
                       )}
                    </Link>
                 );
              })}
           </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800 gap-2 flex flex-col bg-white dark:bg-slate-900">
           <div className="flex gap-1">
              <Button
                 variant="ghost"
                 size="icon"
                 className="flex-1 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                 onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                 {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-1 h-10 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
           </div>
           <p className="text-[10px] text-center font-bold text-slate-300 uppercase tracking-widest mt-1">Platform v1.0</p>
        </div>
      </aside>
    </>
  );
}
