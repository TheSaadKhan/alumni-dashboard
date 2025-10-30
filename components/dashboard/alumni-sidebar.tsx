"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, badge: null },
  { name: "Network", href: "/dashboard/network", icon: Users, badge: 5 },
  { name: "Events", href: "/dashboard/events", icon: CalendarDays, badge: 2 },
  { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: 3 },
  { name: "Messages", href: "/dashboard/messages", icon: Mail, badge: 7 },
  { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake, badge: null },
] as const;

interface AlumniSidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export function AlumniSidebar({ mobileMenuOpen, setMobileMenuOpen }: AlumniSidebarProps) {
  const pathname = usePathname();
  const [activeNav, setActiveNav] = useState("dashboard");

  // Update active nav based on current path
  useEffect(() => {
    const currentNav = navigation.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (currentNav) {
      setActiveNav(currentNav.name.toLowerCase());
    }
  }, [pathname]);

  // Lock background scroll when sidebar is open (mobile)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen?.(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  const handleNavClick = (name: string) => {
    setActiveNav(name.toLowerCase());
    setMobileMenuOpen?.(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen?.(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-screen w-72 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/80",
          "border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl backdrop-blur-lg",
          "flex flex-col transition-transform duration-300 ease-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">AlumniConnect</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back!</p>
            </div>
          </div>

          {/* Close Button (Mobile Only) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setMobileMenuOpen?.(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User Profile Quick Info */}
      

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = activeNav === item.name.toLowerCase();
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => handleNavClick(item.name)}
                    className={clsx(
                      "group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                      "outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
                      isActive
                        ? "bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white hover:shadow-sm border border-transparent"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={clsx(
                        "p-1.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-800/50 dark:group-hover:text-indigo-400"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className={clsx(
                          "bg-indigo-100 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-300 text-xs font-semibold",
                          isActive && "bg-white dark:bg-indigo-900"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}