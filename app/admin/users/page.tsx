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
  MoreVertical,
  Loader2,
  UserPlus,
  Trash2,
  RefreshCw,
  Edit,
  Shield,
  User,
  Mail,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  HandHeart,
  Globe,
  Settings,
  MoreHorizontal,
  MailPlus,
  Monitor,
  Save
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

type UserType = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  role: string;
  roleDisplay: string;
  is_active: boolean;
  lastActive?: string;
  joinedAt?: string;
};

type InviteType = {
  id: string;
  email: string;
  organization_roles?: { display_name: string; name: string };
  role?: { display_name: string; name: string };
  status: "pending" | "accepted" | "expired";
  createdAt: string;
};

type RoleType = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { profile } = useAuthProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [invites, setInvites] = useState<InviteType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all");

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "", message: "" });

  const orgId = (profile as any)?.organizationId;

  const loadData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [usersRes, rolesRes, invitesRes] = await Promise.all([
        fetch(`/api/users?organizationId=${orgId}&search=${searchTerm}`),
        fetch(`/api/organizations/${orgId}/roles`),
        fetch(`/api/invitations?organizationId=${orgId}`),
      ]);

      const [usersData, rolesData, invitesData] = await Promise.all([
        usersRes.json(), rolesRes.json(), invitesRes.json()
      ]);

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
      setInvites(invitesData.invites || []);
    } catch (e) {
      toast.error("Failed to synchronize identity directory");
    } finally {
      setLoading(false);
    }
  }, [orgId, searchTerm]);

  useEffect(() => {
    if (orgId) loadData();
  }, [loadData, orgId]);

  useEffect(() => {
    let result = users;
    if (searchTerm) {
      result = result.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      result = result.filter(u => filterStatus === "active" ? u.is_active : !u.is_active);
    }
    setFilteredUsers(result);
  }, [users, searchTerm, filterStatus]);

  const handleInvite = async () => {
    if (!orgId || !inviteForm.email || !inviteForm.roleId) {
      toast.error("Required identifiers missing for invitation");
      return;
    }
    try {
      setInviteLoading(true);
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inviteForm, organizationId: orgId }),
      });
      if (res.ok) {
        toast.success("Institutional invitation dispatched");
        setInviteDialogOpen(false);
        setInviteForm({ email: "", roleId: "", message: "" });
        loadData();
      }
    } catch {
      toast.error("Failed to transmit invitation node");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Directory Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Identity Matrix</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{users.length} Active Nodes</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Directory Governance</h1>
           <p className="text-slate-500 font-medium mt-1">Manage institutional identities, access privileges, and recruitment invitations.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Sync Records
           </Button>
           <Button onClick={() => setInviteDialogOpen(true)} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <UserPlus className="h-4 w-4 mr-2" /> Invite Node
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
         <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 h-12 mb-8">
            <TabsTrigger value="users" className="px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Identity Index</TabsTrigger>
            <TabsTrigger value="invites" className="px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Recruitment Hub</TabsTrigger>
         </TabsList>

         <TabsContent value="users" className="space-y-6 mt-0">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="IDENTIFY NODE BY NAME OR EMAIL..." 
                    className="pl-12 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-blue-500/10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger className="w-full sm:w-56 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase px-6">
                     <Filter className="w-4 h-4 mr-3 text-slate-400" />
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                     <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">All Protocols</SelectItem>
                     <SelectItem value="active" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Active State</SelectItem>
                     <SelectItem value="suspended" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Suspended State</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
               <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Institutional Identity</TableHead>
                        <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Security Level</TableHead>
                        <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Lifecycle State</TableHead>
                        <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                                 <AvatarImage src={user.imageUrl} />
                                 <AvatarFallback className="bg-slate-900 text-white font-black text-[10px]">{user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                 <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{user.name}</p>
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className="rounded-lg border-none bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 px-3 py-1 italic">
                                {user.roleDisplay.toUpperCase()}
                             </Badge>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500'} mb-1`}></span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{user.is_active ? 'ENABLED' : 'ISOLATED'}</span>
                             </div>
                          </TableCell>
                          <TableCell className="px-8 text-right">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 text-slate-400">
                                      <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]">
                                   <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                      <Monitor className="h-3.5 w-3.5 mr-3 text-slate-400" /> Inspect Node
                                   </DropdownMenuItem>
                                   <DropdownMenuItem className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                      <Shield className="h-3.5 w-3.5 mr-3 text-slate-400" /> Access Protocol
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                   <DropdownMenuItem className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4 text-rose-600 hover:bg-rose-50">
                                      <Trash2 className="h-3.5 w-3.5 mr-3" /> Terminate Node
                                   </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </div>
               <CardFooter className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">{filteredUsers.length} NODES TRACKED</p>
                  <Button variant="ghost" className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-blue-600 hover:bg-blue-50" onClick={loadData}>
                     Re-Sync Directory
                  </Button>
               </CardFooter>
            </Card>
         </TabsContent>

         <TabsContent value="invites" className="space-y-6 mt-0">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-12 text-center">
               <div className="max-w-md mx-auto space-y-8">
                  <div className="h-16 w-16 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto">
                     <MailPlus className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                     <h2 className="text-xl font-bold uppercase italic tracking-tight">Recruitment Pipeline</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Transmit invitations to external entities to integrate them into the institutional identity matrix.</p>
                  </div>
                  <Button onClick={() => setInviteDialogOpen(true)} className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]">
                     Initialize Recruitment
                  </Button>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {invites.map((invite) => (
                  <Card key={invite.id} className="border-none shadow-sm rounded-[2rem] bg-white/60 backdrop-blur-xl overflow-hidden group">
                     <CardHeader className="px-8 pt-8 pb-4">
                        <div className="flex items-center justify-between mb-2">
                           <Badge variant="outline" className={`border-none text-[8px] font-black tracking-[0.2em] px-2.5 py-1 rounded-lg ${invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {invite.status.toUpperCase()}
                           </Badge>
                           <Clock className="h-3.5 w-3.5 text-slate-200" />
                        </div>
                        <h3 className="text-sm font-bold uppercase italic truncate text-slate-900">{invite.email}</h3>
                     </CardHeader>
                     <CardContent className="px-8 pb-6">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Security Privilege</p>
                        <p className="text-xs font-bold text-slate-500 mt-2">{(invite.organization_roles || invite.role)?.display_name || "MEMBER ACCESS"}</p>
                     </CardContent>
                     <CardFooter className="px-8 pb-8 pt-0 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-300 uppercase italic">Sent {format(new Date(invite.createdAt), 'MMM dd')}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         </TabsContent>
      </Tabs>

      {/* Recruitment Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
         <DialogContent className="border-none shadow-2xl rounded-[3rem] p-12 max-w-lg">
            <DialogHeader className="space-y-3 mb-6">
               <div className="h-14 w-14 bg-indigo-50 rounded-[2rem] flex items-center justify-center">
                  <UserPlus className="h-7 w-7 text-indigo-600" />
               </div>
               <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Recruit Node</DialogTitle>
               <DialogDescription className="text-[11px] font-black uppercase tracking-widest text-slate-400">Initialize identity invitation protocol.</DialogDescription>
            </DialogHeader>
            <div className="space-y-8">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Email Relay Address</Label>
                  <Input 
                    value={inviteForm.email} 
                    onChange={e => setInviteForm(p=>({...p, email: e.target.value}))}
                    className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
                    placeholder="NODE@MAIL.COM" 
                  />
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Security Privilege</Label>
                  <Select value={inviteForm.roleId} onValueChange={v => setInviteForm(p=>({...p, roleId: v}))}>
                     <SelectTrigger className="h-12 rounded-xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl border-none shadow-2xl">
                        {roles.map(r => <SelectItem key={r.id} value={r.id} className="text-[10px] font-black uppercase tracking-widest">{r.display_name}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Context Payload (Optional)</Label>
                  <Textarea 
                    value={inviteForm.message} 
                    onChange={e => setInviteForm(p=>({...p, message: e.target.value}))}
                    className="rounded-2xl border-none bg-slate-50 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-[10px] font-bold uppercase tracking-widest min-h-[100px] p-4 resize-none" 
                    placeholder="ENTER CONTEXT..." 
                  />
               </div>
            </div>
            <DialogFooter className="pt-10 flex gap-4">
               <Button onClick={() => setInviteDialogOpen(false)} variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400">Abort</Button>
               <Button onClick={handleInvite} disabled={inviteLoading} className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/10 font-black uppercase tracking-widest text-xs">
                  {inviteLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save All
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Identity Governor v1.2.0 • People Management</p>
      </footer>
    </div>
  );
}