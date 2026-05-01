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
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  User, 
  Shield, 
  Menu,
  Briefcase,
  Users as UsersIcon,
  ShieldCheck,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockNotifications = [
  { id: "1", title: "Job Opportunity", description: "A new senior developer role was posted in your network.", type: "job", time: "10m ago", unread: true },
  { id: "2", title: "Event Reminder", description: "Global Alumni Meet starts in 2 hours.", type: "event", time: "2h ago", unread: true },
  { id: "3", title: "New Connection", description: "Sarah Miller wants to connect with you.", type: "user", time: "5h ago", unread: false },
];

export function RoleBasedHeader({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { profile } = useAuthProfile();

  const userRole = profile?.userType || "alumni";
  const isAdmin = userRole === "super_admin" || userRole === "admin";
  const [notifications, setNotifications] = useState(mockNotifications);

  // Fetch real notifications for Admins (e.g. pending requests)
  // In a real app we'd fetch this from /api/notifications
  const [pendingReqsCount, setPendingReqsCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
       // Mock fetching pending count for the badge
       fetch(`/api/users?status=pending&limit=1${profile?.organizationId ? `&organizationId=${profile.organizationId}` : ''}`)
         .then(res => res.json())
         .then(data => {
            if (data.success && data.pagination) {
               setPendingReqsCount(data.pagination.total);
            }
         })
         .catch(() => {});
    }
  }, [isAdmin, profile?.organizationId]);

  const unreadCount = notifications.filter(n => n.unread).length + (pendingReqsCount > 0 ? 1 : 0);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const initials = profile?.fullName?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0) || "U";

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-9 pl-10 pr-4 rounded-md border bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
           <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                 <Bell className="h-5 w-5 text-slate-500" />
                 {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-600 rounded-full border-2 border-white"></span>
                 )}
              </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl border-slate-100 shadow-2xl">
              <div className="p-4 border-b flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                 <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                 <Badge className="bg-indigo-100 text-indigo-700 border-none">{unreadCount} New</Badge>
              </div>
              <ScrollArea className="h-80">
                 {pendingReqsCount > 0 && (
                    <DropdownMenuItem 
                      className="p-4 border-b focus:bg-indigo-50 cursor-pointer" 
                      onClick={() => router.push("/admin/users")}
                    >
                      <div className="flex gap-3">
                         <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="h-5 w-5" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900">Pending Join Requests</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{pendingReqsCount} users are waiting for your approval.</p>
                            <p className="text-[10px] text-indigo-600 font-bold mt-1">Review Now →</p>
                         </div>
                      </div>
                    </DropdownMenuItem>
                 )}
                 {notifications.map(n => (
                    <DropdownMenuItem key={n.id} className="p-4 border-b last:border-none focus:bg-slate-50">
                       <div className="flex gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${n.unread ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-400'}`}>
                             {n.type === 'job' && <Briefcase className="h-4 w-4" />}
                             {n.type === 'event' && <UsersIcon className="h-4 w-4" />}
                             {n.type === 'user' && <ShieldCheck className="h-4 w-4" />}
                          </div>
                          <div>
                             <p className={`text-xs font-bold ${n.unread ? 'text-slate-900' : 'text-slate-500'}`}>{n.title}</p>
                             <p className="text-[11px] text-slate-500 line-clamp-2">{n.description}</p>
                             <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                          </div>
                       </div>
                    </DropdownMenuItem>
                 ))}
              </ScrollArea>
           </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
           <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="flex items-center gap-2 px-1">
                  <div className="hidden sm:flex flex-col items-end">
                     <p className="text-xs font-semibold">{profile?.fullName?.split(' ')[0] || "User"}</p>
                     <p className="text-[10px] text-slate-500 capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  <Avatar className="h-8 w-8">
                     <AvatarImage src={profile?.avatarUrl || user?.imageUrl} />
                     <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
               </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/organization/${profile?.organization?.slug || 'default'}/dashboard/profile`)}>
                 <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/organization/${profile?.organization?.slug || 'default'}/dashboard/settings`)}>
                 <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem className="text-indigo-600 font-medium" onClick={() => router.push("/admin")}>
                   <Shield className="mr-2 h-4 w-4" /> Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={handleSignOut}>
                 <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
           </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </header>
  );
}
