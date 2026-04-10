"use client";

import { useState } from "react";
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
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Shield, 
  Menu,
  Briefcase,
  DollarSign,
  Users as UsersIcon,
  ShieldCheck,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoleBasedHeaderProps {
  onMenuToggle?: () => void;
}

const mockNotifications = [
  { id: "1", title: "Job Opportunity", description: "A new senior developer role was posted in your network.", type: "job", time: "10m ago", unread: true },
  { id: "2", title: "Event Reminder", description: "Global Alumni Meet starts in 2 hours.", type: "event", time: "2h ago", unread: true },
  { id: "3", title: "New Connection", description: "Sarah Miller wants to connect with you.", type: "user", time: "5h ago", unread: false },
];

export function RoleBasedHeader({ onMenuToggle }: RoleBasedHeaderProps) {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile } = useAuthProfile();

  const userRole = profile?.userType || "alumni";
  const isAdmin = userRole === "super_admin" || userRole === "admin";
  const unreadCount = mockNotifications.filter(n => n.unread).length;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      router.push("/sign-in");
    }
  };

  const initials = profile?.fullName?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0) || "U";

  return (
    <header className="w-full h-16 flex items-center justify-between px-6 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/40">
      {/* Mobile Trigger & Branding Fragment */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:flex flex-col">
           <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter italic">Member Hub</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Status: Verified</p>
        </div>
      </div>

      {/* Global Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Search network, jobs, events..."
          className="w-full h-10 pl-11 pr-4 rounded-xl border-none bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
        />
      </div>

      {/* Action Suite */}
      <div className="flex items-center gap-2">
        {/* Intelligence Dropdown */}
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 relative hover:bg-slate-50">
                 <Bell className="h-4.5 w-4.5" />
                 {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-rose-600 rounded-full border-2 border-white dark:border-slate-950"></span>
                 )}
              </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-[300px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-between border-b">
                 <h4 className="text-xs font-bold uppercase tracking-widest">Activity</h4>
                 <Badge className="bg-blue-100 text-blue-600 border-none h-5 text-[10px]">{unreadCount} New</Badge>
              </div>
              <ScrollArea className="h-64">
                 {mockNotifications.map(n => (
                    <DropdownMenuItem key={n.id} className="p-4 border-b border-slate-50 last:border-none cursor-pointer focus:bg-slate-50">
                       <div className="flex gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.unread ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-300'}`}>
                             {n.type === 'job' && <Briefcase className="h-4 w-4" />}
                             {n.type === 'event' && <UsersIcon className="h-4 w-4" />}
                             {n.type === 'user' && <ShieldCheck className="h-4 w-4" />}
                          </div>
                          <div>
                             <p className={`text-xs font-bold ${n.unread ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                             <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{n.description}</p>
                             <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-slate-300" />
                                <span className="text-[9px] font-bold text-slate-300 uppercase">{n.time}</span>
                             </div>
                          </div>
                       </div>
                    </DropdownMenuItem>
                 ))}
              </ScrollArea>
           </DropdownMenuContent>
        </DropdownMenu>

        {/* Identity Context */}
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-1 py-1 rounded-xl hover:bg-slate-50 gap-2 border border-transparent hover:border-slate-100">
                 <div className="hidden sm:flex flex-col items-end px-2">
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{profile?.fullName?.split(' ')[0] || "User"}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{userRole.replace('_', ' ')}</p>
                 </div>
                 <Avatar className="h-8 w-8 rounded-lg border border-slate-100 shadow-sm">
                    <AvatarImage src={profile?.avatarUrl || user?.imageUrl} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">{initials}</AvatarFallback>
                 </Avatar>
              </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-52 rounded-2xl border-none shadow-2xl p-2 mt-2">
              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Entity Profile</DropdownMenuLabel>
              <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-xs font-bold" onClick={() => router.push("/dashboard/profile")}>
                 <User className="mr-2 h-4 w-4 opacity-50" /> Profile View
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-xs font-bold" onClick={() => router.push("/dashboard/settings")}>
                 <Settings className="mr-2 h-4 w-4 opacity-50" /> Preferences
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50" onClick={() => router.push("/admin")}>
                   <Shield className="mr-2 h-4 w-4" /> Nexus Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-2 bg-slate-50" />
              <DropdownMenuItem className="rounded-xl py-2.5 cursor-pointer text-xs font-bold text-rose-500" onClick={handleSignOut}>
                 <LogOut className="mr-2 h-4 w-4" /> Termination
              </DropdownMenuItem>
           </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
