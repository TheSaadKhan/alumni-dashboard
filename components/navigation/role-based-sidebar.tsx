"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  GraduationCap,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  X,
  UserCircle,
  Building2
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export function RoleBasedSidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;
  const { profile, organization } = useAuthProfile();

  const userRole = profile?.userType || "alumni";
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  const getNavItems = () => {
    const base = `/organization/${slug}/dashboard`;

    const common = [
      { name: "Dashboard", href: base, icon: LayoutDashboard },
      { name: "Network", href: `${base}/network`, icon: Users },
      { name: "Jobs", href: `${base}/jobs`, icon: Briefcase },
      { name: "Events", href: `${base}/events`, icon: Calendar },
      { name: "Messages", href: `${base}/messages`, icon: MessageSquare },
    ];

    if (userRole === "alumni") {
      common.push({ name: "Mentorship", href: `${base}/mentorship`, icon: GraduationCap });
    } else if (userRole === "student") {
      common.push({ name: "Mentorship", href: `${base}/mentorship`, icon: GraduationCap });
    }

    if (isAdmin) {
      common.push({ name: "Admin Panel", href: "/admin", icon: Shield });
    }

    return common;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[60] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <Link href="/" className="flex-1 block">
              <img 
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Assets/bannerLogo.png`} 
                alt="Logo" 
                className="h-10 w-auto object-contain max-w-full" 
              />
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 ml-auto" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-100 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100">
            <Link
              href={`/organization/${slug}/dashboard/settings`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Settings
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
