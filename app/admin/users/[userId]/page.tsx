"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Users,
  Shield,
  Edit,
  Activity,
  Settings,
  Loader2,
  Globe,
  Building,
  Award,
  FileText,
  MessageSquare,
  Key,
  Download,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  UserCog,
  ShieldAlert,
  Bell,
  CreditCard,
  History,
  Trash2,
  RefreshCw,
  Zap,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAuthProfile } from "@/context/AuthContext";

type UserType = {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  phone?: string;
  role: string;
  roleDisplay: string;
  is_active: boolean;
  lastActive?: string;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
  bio?: string;
  location?: string;
  company?: string;
  position?: string;
  batch?: string;
  degree?: string;
  skills?: string[];
  metadata?: {
    connections?: number;
    eventsAttended?: number;
    jobsPosted?: number;
    donations?: number;
    profileCompletion?: number;
  };
};

type ActivityType = {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  ip?: string;
  device?: string;
  details?: any;
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const userId = params.userId as string;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserType | null>(null);
  const [activity, setActivity] = useState<ActivityType[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

  const organizationId = (profile as any)?.organizationId;

  useEffect(() => {
    if (!userId || !organizationId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [userRes, activityRes] = await Promise.all([
          fetch(`/api/users/${userId}?organizationId=${organizationId}`),
          fetch(`/api/users/${userId}/activity?organizationId=${organizationId}`),
        ]);

        if (!userRes.ok) throw new Error("Failed to load user data");

        const userData = await userRes.json();
        const activityData = await activityRes.json();

        setUser(userData.user);
        setActivity(activityData.activities || []);
      } catch (error) {
        toast.error("Failed to synchronize identity node");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, organizationId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Identity Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/users")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 rounded-[2rem] border-4 border-white shadow-xl">
                 <AvatarImage src={user.imageUrl} />
                 <AvatarFallback className="bg-slate-900 text-white font-black text-lg italic">{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Identity Hub</span>
                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{user.roleDisplay || user.role}</span>
                 </div>
                 <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic tracking-tighter">{user.name}</h1>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest" onClick={() => router.push("/admin/messages")}>
              <MessageSquare className="h-4 w-4 mr-3" /> Relay Message
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              <UserCog className="h-4 w-4 mr-3" /> Recalibrate Protocol
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8 overflow-x-auto no-scrollbar">
                 <TabsTrigger value="profile" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Identity Profile</TabsTrigger>
                 <TabsTrigger value="activity" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Activity Pulse</TabsTrigger>
                 <TabsTrigger value="settings" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Access Control</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8">Nodal Specifications</h3>
                       <div className="space-y-6">
                          <div className="space-y-4">
                             {[
                               { label: "Entity Correspondence", value: user.email, icon: Mail },
                               { label: "Temporal Join", value: new Date(user.createdAt).toLocaleDateString(), icon: Calendar },
                               { label: "Academic Batch", value: user.batch || "UNCLASSIFIED", icon: GraduationCap },
                               { label: "Professional Station", value: user.position || "INDEPENDENT", icon: Briefcase },
                             ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-50/50">
                                   <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                                      <item.icon className="h-4 w-4" />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                      <p className="text-[11px] font-bold text-slate-900 uppercase italic leading-none">{item.value}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </Card>

                    <div className="space-y-8">
                       <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-600 p-10 text-white relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                             <TrendingUp className="h-48 w-48" />
                          </div>
                          <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8 relative z-10">Synergy Metrics</h3>
                          <div className="grid grid-cols-2 gap-8 relative z-10">
                             <div>
                                <p className="text-4xl font-bold tracking-tighter mb-1">{user.metadata?.connections || 0}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60">Node Integrity</p>
                             </div>
                             <div>
                                <p className="text-4xl font-bold tracking-tighter mb-1">{user.metadata?.eventsAttended || 0}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60">Asset Cluster</p>
                             </div>
                          </div>
                       </Card>

                       <Card className="border-none shadow-sm rounded-[3rem] bg-slate-900 p-10 text-white relative overflow-hidden">
                          <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Profile Synthesis</h3>
                          <div className="space-y-4">
                             <div className="flex justify-between items-end mb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Rate</p>
                                <p className="text-sm font-bold italic">{user.metadata?.profileCompletion || 0}%</p>
                             </div>
                             <Progress value={user.metadata?.profileCompletion || 0} className="h-2 bg-white/10" />
                          </div>
                       </Card>
                    </div>
                 </div>

                 {user.bio && (
                    <Card className="border-none shadow-sm rounded-[3rem] bg-white/40 p-10">
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-6">Manifest Narrative</h3>
                       <p className="text-sm font-medium text-slate-500 leading-relaxed italic">{user.bio}</p>
                    </Card>
                 )}
              </TabsContent>

              <TabsContent value="activity" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                    <Table>
                       <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none hover:bg-transparent">
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Temporal Action</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Identity Device</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Node IP</TableHead>
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Verification</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {activity.map((item) => (
                             <TableRow key={item.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all">
                                <TableCell className="px-10 py-6">
                                   <div className="flex items-center gap-3">
                                      <Activity className="h-3.5 w-3.5 text-blue-400" />
                                      <span className="text-sm font-bold text-slate-900 uppercase italic">{item.action}</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.device || "SYSTEM"}</TableCell>
                                <TableCell className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.ip || "LOCAL"}</TableCell>
                                <TableCell className="px-10 text-right">
                                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 backdrop-blur-xl p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic mb-8">Identity Governance</h4>
              <div className="space-y-2">
                 {[
                   { label: "Dispatch Relay", icon: Mail, sub: "Message Protocol" },
                   { label: "Recalibrate Role", icon: UserCog, sub: "Access Elevation" },
                   { label: "Export Payload", icon: Download, sub: "JSON Object" },
                   { label: "Audit Account", icon: History, sub: "System Check" }
                 ].map((action, i) => (
                    <button 
                       key={i} 
                       className="w-full flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 transition-all group"
                    >
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                             <action.icon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                             <p className="text-[11px] font-bold text-slate-900 uppercase italic leading-none">{action.label}</p>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{action.sub}</p>
                          </div>
                       </div>
                       <ChevronRight className="h-3.5 w-3.5 text-slate-100 group-hover:text-slate-400 transition-transform" />
                    </button>
                 ))}
              </div>
           </Card>

           <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/20 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              <div className="relative z-10 flex flex-col gap-6">
                 <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <Ban className="h-6 w-6 text-rose-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold uppercase italic tracking-tighter">Restriction Protocols</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-loose">Suspending an identity node terminates all active synergy links. Permanent deletion is irreversible.</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" className="h-12 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/5">Suspend</Button>
                    <Button variant="ghost" className="h-12 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all">Terminate</Button>
                 </div>
              </div>
           </Card>

           <div className="p-8 rounded-[2.5rem] bg-indigo-50/50 flex flex-col gap-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto">
                 <ShieldAlert className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Security Index: Verified</p>
           </div>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Identity Matrix v1.4.2 • Verification Protocol Active</p>
      </footer>
    </div>
  );
}