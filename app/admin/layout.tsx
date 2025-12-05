"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  Briefcase,
  BarChart3,
  Settings,
  DollarSign,
  Menu,
  X,
  Shield,
  Home,
  Bell,
  Search,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  FileText,
  UserCheck,
  MessageSquare,
  PieChart,
  Building,
  Users2,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "next-themes";
import { useUser, SignOutButton } from "@clerk/nextjs";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Users", href: "/admin/users", icon: Users2 },
  { name: "Alumni", href: "/admin/alumni", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Donations", href: "/admin/donations", icon: DollarSign },
  { name: "Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Organizations", href: "/admin/organizations", icon: Building },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();

  // ✅ REAL USER INFO FROM CLERK
  const initials =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ||
    "U";

  const fullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    "Admin User";

  const email = user?.emailAddresses?.[0]?.emailAddress || "—";

  // ✅ NOTIFICATIONS (API READY – MOCK SAFE)
  const notifications = [
    { id: 1, text: "New user registration pending", time: "5 min ago", read: false },
    { id: 2, text: "Event approval required", time: "1 hour ago", read: false },
    { id: 3, text: "Weekly admin report generated", time: "2 hours ago", read: true },
  ];

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          mobileMenuOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold group-hover:gradient-text transition">
                AlumniConnect
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full status-online"></span>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* USER CARD */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 status-online border-2 border-sidebar rounded-full flex items-center justify-center">
                <UserCheck className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
              <p className="text-xs text-primary font-medium truncate">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="p-4 flex-1 overflow-y-auto space-y-1">
          {adminNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "sidebar-nav-item",
                  isActive && "active"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 mr-3 text-yellow-400" />
            ) : (
              <Moon className="h-4 w-4 mr-3" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>

          <SignOutButton>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </SignOutButton>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="lg:ml-64 flex min-h-screen flex-col">
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div>
                  <h1 className="text-xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage your alumni community
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* SEARCH */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* NOTIFICATIONS */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="notification-dot" />
                    )}
                  </Button>

                  {notificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 glass-card z-40">
                        <div className="p-4 border-b border-border">
                          <h3 className="font-semibold">Notifications</h3>
                          <p className="text-sm text-muted-foreground">
                            {unreadNotifications} unread
                          </p>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={clsx(
                                "p-4 border-b border-border hover:bg-muted cursor-pointer",
                                !notification.read && "bg-primary/5"
                              )}
                            >
                              <p className="text-sm">{notification.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.time}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* BACK TO MAIN */}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard" className="hidden sm:flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Main
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-border bg-background/50 p-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-2">
            <span>© {new Date().getFullYear()} AlumniConnect. All rights reserved.</span>

            <div className="flex items-center gap-4">
              <Link href="/admin/help" className="hover:text-primary">
                <HelpCircle className="h-4 w-4 inline mr-1" />
                Help Center
              </Link>
              <Link href="/admin/settings" className="hover:text-primary">
                Settings
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
