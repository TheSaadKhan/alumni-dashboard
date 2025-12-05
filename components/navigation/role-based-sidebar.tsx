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
  GraduationCap,
  Shield,
  BarChart3,
  DollarSign,
  UserCog,
  Building2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthProfile } from "@/context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  roles?: string[]; // If undefined, show to all roles
}

// Navigation items by role
const navigationByRole: Record<string, NavItem[]> = {
  super_admin: [
    { name: "Dashboard", href: "/dashboard", icon: Home, badge: null },
    { name: "Admin Panel", href: "/admin", icon: Shield, badge: null },
    { name: "Network", href: "/dashboard/network", icon: Users, badge: null },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays, badge: null },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: null },
    { name: "Messages", href: "/dashboard/messages", icon: Mail, badge: null },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
  ],
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: Home, badge: null },
    { name: "Admin Panel", href: "/admin", icon: Shield, badge: null },
    { name: "Network", href: "/dashboard/network", icon: Users, badge: null },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays, badge: null },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: null },
    { name: "Messages", href: "/dashboard/messages", icon: Mail, badge: null },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
  ],
  alumni: [
    { name: "Dashboard", href: "/dashboard", icon: Home, badge: null },
    { name: "Network", href: "/dashboard/network", icon: Users, badge: null },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays, badge: null },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: null },
    { name: "Messages", href: "/dashboard/messages", icon: Mail, badge: null },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
  ],
  student: [
    { name: "Dashboard", href: "/dashboard", icon: Home, badge: null },
    { name: "Network", href: "/dashboard/network", icon: Users, badge: null },
    { name: "Events", href: "/dashboard/events", icon: CalendarDays, badge: null },
    { name: "Jobs", href: "/dashboard/jobs", icon: Briefcase, badge: null },
    { name: "Messages", href: "/dashboard/messages", icon: Mail, badge: null },
    { name: "Mentorship", href: "/dashboard/mentorship", icon: HeartHandshake, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
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
  const { profile, loading: profileLoading } = useAuthProfile();
  const [activeNav, setActiveNav] = useState("dashboard");

  // Get user role
  const userRole = profile?.user_type || "alumni";
  const navigation = navigationByRole[userRole] || navigationByRole.alumni;

  // Update active nav based on current path
  useEffect(() => {
    const currentNav = navigation.find(item =>
      pathname === item.href || pathname.startsWith(item.href + '/')
    );
    if (currentNav) {
      setActiveNav(currentNav.name.toLowerCase());
    }
  }, [pathname, navigation]);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/sign-in");
    }
  };

  if (profileLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out overflow-y-auto",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="relative w-10 h-10">
              <Image
                src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/public/Assets/bannerLogo.png`}
                alt="Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              AlumniConnect
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen?.(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || user?.imageUrl} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name || user?.fullName || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {userRole.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => handleNavClick(item.name)}
                className={clsx(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}

