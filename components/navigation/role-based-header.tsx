"use client";

import { useClerk, useUser } from "@clerk/nextjs";
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
import { 
  Bell, 
  Menu,
  LogOut, 
  User, 
  Shield,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function RoleBasedHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile } = useAuthProfile();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none text-sm outline-none w-48 text-slate-600 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-1 h-9 hover:bg-transparent">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 leading-none">{profile?.fullName || user?.fullName || "User"}</p>
                <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{profile?.userType || "Member"}</p>
              </div>
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarImage src={profile?.avatarUrl || user?.imageUrl} />
                <AvatarFallback>{profile?.fullName?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/organization/${profile?.organization?.slug || 'default'}/dashboard/settings`)}>
              <User className="mr-2 h-4 w-4 text-slate-400" /> Profile Settings
            </DropdownMenuItem>
            {(profile?.userType === "admin" || profile?.userType === "super_admin") && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="mr-2 h-4 w-4 text-slate-400" /> Admin Console
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-rose-600 focus:text-rose-600">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
