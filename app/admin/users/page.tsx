"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
  User
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  userType: string;
  status: string;
  roles: Array<{ name: string; slug: string }>;
  joinedAt?: string;
  createdAt?: string;
  major?: string;
  graduationYear?: number;
  expectedGraduation?: number;
};

type InviteType = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
};

type RoleType = {
  id: string;
  name: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invites, setInvites] = useState<InviteType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "invites">("active");

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "", message: "" });

  const isSuperAdmin = profile?.userType === "super_admin";
  const orgId = profile?.organizationId;

  const loadData = useCallback(async () => {
    // Super admins can view global users, others need an orgId
    if (!orgId && !isSuperAdmin) return;
    try {
      setLoading(true);
      // Fetch users with different statuses based on tab
      const statusFilter = activeTab === "pending" ? "pending" : "active";
      const queryParams = new URLSearchParams({
         status: statusFilter,
         search: searchTerm
      });
      if (orgId) queryParams.set("organizationId", orgId);

      const requests = [fetch(`/api/users?${queryParams.toString()}`)];
      
      if (orgId) {
        requests.push(fetch(`/api/invitations/create?organizationId=${orgId}`));
        requests.push(fetch(`/api/invitations?organizationId=${orgId}`));
      }

      const responses = await Promise.all(requests);
      const usersData = await responses[0].json();
      
      let rolesData = { roles: [] };
      let invitesData = { invites: [] };

      if (orgId && responses.length === 3) {
        rolesData = await responses[1].json();
        invitesData = await responses[2].json();
      }

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
      setInvites(invitesData.invites || []);
    } catch (e) {
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  }, [orgId, searchTerm, activeTab]);

  useEffect(() => {
    if (orgId || isSuperAdmin) loadData();
  }, [loadData, orgId, isSuperAdmin]);

  const handleApprove = async (userId: string) => {
     try {
        setActionLoading(userId);
        const res = await fetch("/api/users", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ userId, status: "active", organizationId: orgId }),
        });
        if (res.ok) {
           toast.success("Member approved and added to network!");
           loadData();
        } else {
           toast.error("Failed to approve member");
        }
     } catch (err) {
        toast.error("Something went wrong");
     } finally {
        setActionLoading(null);
     }
  };

  const handleReject = async (userId: string) => {
     try {
        setActionLoading(userId);
        // Suspend or delete logic
        const res = await fetch("/api/users", {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ userId, status: "suspended", organizationId: orgId }),
        });
        if (res.ok) {
           toast.info("Request rejected/suspended.");
           loadData();
        }
     } finally {
        setActionLoading(null);
     }
  };

  const handleInvite = async () => {
    if (!orgId || !inviteForm.email || !inviteForm.roleId) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteForm, organizationId: orgId }),
      });
      if (res.ok) {
        toast.success("Invitation sent successfully");
        setInviteDialogOpen(false);
        setInviteForm({ email: "", roleId: "", message: "" });
        loadData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to send invitation");
      }
    } catch {
      toast.error("Failed to send invitation. Network error.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Member Directory</h1>
           <p className="text-slate-500 mt-1">Manage network access, verification, and roles.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={loadData} className="rounded-xl">
             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Sync
           </Button>
           <Button onClick={() => setInviteDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <UserPlus className="h-4 w-4 mr-2" /> Invite Member
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-slate-100 dark:bg-slate-900 border p-1 rounded-2xl h-12">
               <TabsTrigger value="active" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Verified Members</TabsTrigger>
               <TabsTrigger value="pending" className="relative rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                  New Requests
                  {activeTab !== "pending" && (
                     /* If we're not on the pending tab, we can't reliably show the count without a separate API call.
                        For now, we'll hide it to avoid showing the 'active' count as a 'pending' count.
                     */
                     null
                  )}
                  {activeTab === "pending" && users.length > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] text-white items-center justify-center font-bold">{users.length}</span>
                     </span>
                  )}
               </TabsTrigger>
               <TabsTrigger value="invites" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">Invitations</TabsTrigger>
            </TabsList>

            <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="Search members..." 
                 className="pl-9 rounded-2xl h-12 border-slate-200"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <TabsContent value="active" className="space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
               <Table>
                 <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                   <TableRow>
                     <TableHead className="font-bold py-4">Member</TableHead>
                     <TableHead className="font-bold">Role & Type</TableHead>
                     <TableHead className="font-bold">Affiliation</TableHead>
                     <TableHead className="font-bold text-right">Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {users.map((user) => (
                     <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                       <TableCell className="py-4">
                         <div className="flex items-center gap-3">
                           <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{user.name[0]}</AvatarFallback>
                           </Avatar>
                           <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                          <div className="flex flex-wrap gap-1">
                             <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none px-2 py-0.5 capitalize">{user.userType}</Badge>
                             {user.roles.map(r => <Badge key={r.slug} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-none px-2 py-0.5">{r.name}</Badge>)}
                          </div>
                       </TableCell>
                       <TableCell>
                          <p className="text-xs font-medium">{user.major || 'Global Member'}</p>
                          <p className="text-[10px] text-slate-400">{user.graduationYear || user.expectedGraduation ? `Class of ${user.graduationYear || user.expectedGraduation}` : 'Joined ' + (user.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Recently')}</p>
                       </TableCell>
                       <TableCell className="text-right">
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl">
                                   <MoreHorizontal className="h-4 w-4" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-2xl">
                                <DropdownMenuItem className="rounded-xl p-3" onClick={() => router.push(`/admin/users/${user.id}`)}>
                                   View Detailed Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl p-3">
                                   Edit Permissions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="rounded-xl p-3 text-rose-600 focus:bg-rose-50" onClick={() => handleReject(user.id)}>
                                   Suspend Access
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </TableCell>
                     </TableRow>
                   ))}
                   {!loading && !users.length && (
                       <TableRow>
                          <TableCell colSpan={4} className="h-60 text-center">
                             <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="p-4 bg-slate-50 rounded-full"><User className="h-8 w-8" /></div>
                                <p className="font-medium">No verified members found.</p>
                             </div>
                          </TableCell>
                       </TableRow>
                   )}
                 </TableBody>
               </Table>
            </Card>
         </TabsContent>

         <TabsContent value="pending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {users.map((user) => (
                  <Card key={user.id} className="rounded-[2rem] border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-xl shadow-amber-50 dark:shadow-none hover:border-amber-400 transition-all group">
                     <CardHeader className="pb-4 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900">
                        <div className="flex justify-between items-start mb-4">
                           <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 font-bold tracking-tight bg-white animate-pulse">Pending Approval</Badge>
                           <Clock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="flex items-center gap-4">
                           <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-bold">{user.name[0]}</AvatarFallback>
                           </Avatar>
                           <div>
                              <CardTitle className="text-xl font-extrabold">{user.name}</CardTitle>
                              <CardDescription className="flex items-center gap-1 font-medium"><Mail className="h-3 w-3" /> {user.email}</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Role Type</p>
                              <p className="text-sm font-bold capitalize">{user.userType}</p>
                           </div>
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academic</p>
                              <p className="text-sm font-bold truncate">{user.major || 'N/A'}</p>
                              <p className="text-[10px] font-medium text-slate-500">Class of {user.graduationYear || user.expectedGraduation}</p>
                           </div>
                        </div>
                     </CardContent>
                     <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 p-4 flex gap-3">
                        <Button 
                          onClick={() => handleApprove(user.id)} 
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 rounded-2xl h-12 shadow-lg shadow-indigo-100 font-bold"
                          disabled={actionLoading === user.id}
                        >
                           {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserCheck className="h-4 w-4 mr-2" /> Approve Join</>}
                        </Button>
                        <Button 
                           variant="outline" 
                           onClick={() => handleReject(user.id)}
                           className="rounded-2xl h-12 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                           disabled={actionLoading === user.id}
                        >
                           <UserX className="h-4 w-4" />
                        </Button>
                     </CardFooter>
                  </Card>
               ))}
               {!loading && !users.length && (
                  <div className="col-span-full py-24 text-center border-4 border-dashed rounded-[3rem] border-slate-100 bg-slate-50/50">
                     <div className="p-6 bg-white rounded-full w-fit mx-auto shadow-sm mb-4">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">Queue is Clear!</h3>
                     <p className="text-slate-500 max-w-xs mx-auto text-sm">All pending join requests have been processed. Great job maintaining the network.</p>
                  </div>
               )}
            </div>
         </TabsContent>

         <TabsContent value="invites" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {invites.map((invite) => (
                  <Card key={invite.id} className="rounded-3xl border-slate-100">
                     <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-2">
                           <Badge variant={invite.status === 'pending' ? 'outline' : 'secondary'} className="rounded-full px-3">
                              {invite.status}
                           </Badge>
                           <Clock className="h-4 w-4 text-slate-300" />
                        </div>
                        <CardTitle className="text-base truncate">{invite.email}</CardTitle>
                     </CardHeader>
                     <CardFooter className="pt-0 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 rounded-xl">Revoke</Button>
                     </CardFooter>
                  </Card>
               ))}
               {!invites.length && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-slate-400">
                     No active invitations.
                  </div>
               )}
            </div>
         </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
         <DialogContent className="rounded-[2.5rem] p-10 max-w-lg">
            <DialogHeader>
               <DialogTitle className="text-2xl font-extrabold tracking-tight">Invite Professional</DialogTitle>
               <DialogDescription>Grow your institutional network by inviting colleagues.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
               <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Email Destination</Label>
                  <Input 
                    value={inviteForm.email} 
                    onChange={e => setInviteForm(p=>({...p, email: e.target.value}))}
                    placeholder="name@university.edu" 
                    className="h-12 rounded-2xl border-slate-200"
                  />
               </div>
               <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Assigned Role</Label>
                  <Select value={inviteForm.roleId} onValueChange={v => setInviteForm(p=>({...p, roleId: v}))}>
                     <SelectTrigger className="h-12 rounded-2xl border-slate-200">
                        <SelectValue placeholder="Select a role" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl">
                        {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter>
               <Button onClick={handleInvite} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold shadow-xl shadow-indigo-100">
                  <MailPlus className="h-5 w-5 mr-3" /> Send Network Invite
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}