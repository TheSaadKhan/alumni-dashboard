"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthProfile } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, Settings, LogOut, User, Shield } from "lucide-react";
import { Menu } from "lucide-react";

interface RoleBasedHeaderProps {
  onMenuToggle?: () => void;
}

export function RoleBasedHeader({ onMenuToggle }: RoleBasedHeaderProps) {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile } = useAuthProfile();
  const [notifications, setNotifications] = useState(0);

  const userRole = profile?.user_type || "alumni";
  const isAdmin = userRole === "super_admin" || userRole === "admin";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      router.push("/sign-in");
    }
  };

  return (
    <header className="w-full h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Menu Toggle (Mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Center: Search (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications > 9 ? "9+" : notifications}
            </span>
          )}
        </Button>

        {/* Admin Panel Link (if admin) */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin")}
            className="hidden sm:flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            <span>Admin</span>
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || user?.imageUrl} />
                <AvatarFallback>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || user?.fullName || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {userRole.replace("_", " ")}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile/edit")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

