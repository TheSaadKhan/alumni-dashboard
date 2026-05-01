"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  MailPlus,
  Mail,
  UserCheck,
  UserX,
  User,
  ShieldCheck,
  Zap,
  Filter,
  Inbox,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function AdminUsersPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "invites">("active");

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "alumni", message: "" });

  const orgId = profile?.organizationId;

  const loadData = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any[]>(`admin_users_${orgId}_${activeTab}`);
      if (cached) { setUsers(cached); setLoading(false); }
      else setLoading(true);
    }
    try {
      // Logic for fetching users based on tab
      const status = activeTab === "pending" ? "pending" : "active";
      const res = await fetch(`/api/users?organizationId=${orgId}&status=${status}&search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        const loadedUsers = data.users || [];
        setUsers(loadedUsers);
        sessionSet(`admin_users_${orgId}_${activeTab}`, loadedUsers, 2 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [orgId, activeTab, searchTerm]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, activeTab, loadData]);

  const handleStatusUpdate = async (userId: string, status: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status, organizationId: orgId }),
      });
      if (res.ok) {
        toast.success(`User ${status} successfully`);
        loadData(true);
      } else {
        toast.error("Update failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium text-sm">Control access, verify profiles, and manage institutional roles.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="ghost" size="icon" onClick={() => loadData()} className="h-10 w-10 rounded-xl bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setInviteDialogOpen(true)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm">
            <UserPlus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" onValueChange={(v: any) => setActiveTab(v)} className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <TabsList className="bg-slate-50 p-1 rounded-xl h-auto border-none">
            <TabsTrigger value="active" className="px-5 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Active</TabsTrigger>
            <TabsTrigger value="pending" className="px-5 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Pending</TabsTrigger>
            <TabsTrigger value="invites" className="px-5 py-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Invites</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
            <Input 
              placeholder="Search members..." 
              className="pl-9 h-9 rounded-xl border-none bg-slate-50/50 font-medium text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            {loading && users.length === 0 ? (
              <div className="p-0">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48 rounded-lg" />
                        <Skeleton className="h-3 w-32 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                  <User className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400">No members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="w-[350px] text-[10px] font-bold uppercase tracking-widest text-slate-400 px-8 py-5">User Profile</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-5">Role</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-5">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-5">Joined</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-5 text-right px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-xl shadow-sm border border-white">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">{user.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge className="bg-slate-50 text-slate-500 border-none rounded-lg text-[9px] font-bold uppercase tracking-tighter">
                            {user.userType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold text-slate-600 uppercase">{user.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{format(new Date(user.createdAt), "MMM dd, yyyy")}</p>
                        </TableCell>
                        <TableCell className="text-right px-8 py-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                              <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)} className="py-2.5 font-bold text-slate-700 cursor-pointer">
                                <User className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {user.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, 'active')} className="py-2.5 font-bold text-emerald-600 cursor-pointer">
                                  <UserCheck className="h-4 w-4 mr-2" /> Approve Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="py-2.5 font-bold text-rose-600 cursor-pointer">
                                <UserX className="h-4 w-4 mr-2" /> Suspend Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Invite New Member</DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">Send an invitation link to a student or alumni.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
               <Input 
                placeholder="email@example.com" 
                className="h-11 rounded-xl bg-slate-50 border-none font-medium"
                value={inviteForm.email}
                onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
               />
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Default Role</Label>
                <Select value={inviteForm.role} onValueChange={v => setInviteForm({...inviteForm, role: v})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setInviteDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-500/20">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}