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
import { Progress } from "@/components/ui/progress";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Mail,
  Download,
  BarChart3,
  Settings,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Tag,
  Globe,
  Video,
  Building,
  UserCog,
  QrCode,
  Copy,
  Trash2,
  ExternalLink,
  MessageSquare,
  Filter,
  Search,
  MoreVertical,
  Activity,
  Zap,
  Award,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthProfile } from "@/context/AuthContext";

type EventType = {
  id: string;
  title: string;
  description: string;
  event_type: string;
  status: "published" | "draft" | "cancelled" | "archived";
  start_date: string;
  end_date: string;
  location: string;
  virtual_link: string;
  max_attendees: number;
  current_attendees: number;
  registration_deadline: string;
  price: number;
  tags: string[];
  cover_image: string;
  featured: boolean;
  requires_approval: boolean;
  additional_info: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  organizer?: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
  };
};

type AttendeeType = {
  id: string;
  user_id: string;
  event_id: string;
  status: "confirmed" | "waiting" | "cancelled" | "checked_in";
  registered_at: string;
  checked_in_at: string;
  notes: string;
  user: {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    role: string;
    batch?: string;
    degree?: string;
  };
};

type EventStats = {
  total_attendees: number;
  confirmed_attendees: number;
  waiting_list: number;
  attendance_rate: number;
  check_in_rate: number;
  gender_distribution: {
    male: number;
    female: number;
    other: number;
  };
  top_batches: Array<{ batch: string; count: number }>;
  registration_trend: Array<{ date: string; count: number }>;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const eventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [event, setEvent] = useState<EventType | null>(null);
  const [attendees, setAttendees] = useState<AttendeeType[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [attendeeFilter, setAttendeeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const organizationId = (profile as any)?.organizationId;

  useEffect(() => {
    if (!eventId || !organizationId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [eventRes, attendeesRes, statsRes] = await Promise.all([
          fetch(`/api/events/${eventId}?organizationId=${organizationId}`),
          fetch(`/api/events/${eventId}/attendees?organizationId=${organizationId}`),
          fetch(`/api/events/${eventId}/stats?organizationId=${organizationId}`),
        ]);

        if (!eventRes.ok) throw new Error("Failed to load event");

        const eventData = await eventRes.json();
        const attendeesData = await attendeesRes.json();
        const statsData = await statsRes.json();

        setEvent(eventData.event);
        setAttendees(attendeesData.attendees || []);
        setStats(statsData.stats || null);
      } catch (error) {
        toast.error("Failed to synchronize event orchestration");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [eventId, organizationId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Event Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/events")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Event Management Hub</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Asset Analysis Cycle</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic tracking-tighter">{event.title}</h1>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest" onClick={() => router.push(`/events/${event.id}`)}>
              <ExternalLink className="h-4 w-4 mr-3" /> Live Page
           </Button>
           <Button onClick={() => router.push(`/admin/events/${event.id}/edit`)} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              <Edit className="h-4 w-4 mr-3" /> Recalibrate Asset
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8 overflow-x-auto no-scrollbar">
                 <TabsTrigger value="overview" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Nodal Overview</TabsTrigger>
                 <TabsTrigger value="attendees" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Identity Registry ({attendees.length})</TabsTrigger>
                 <TabsTrigger value="analytics" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Performance Matrix</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8">Asset Specification</h3>
                       <div className="space-y-6">
                          <div className="flex flex-wrap gap-2 mb-4">
                             <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{event.event_type}</Badge>
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{event.status}</Badge>
                             {event.featured && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">Featured Node</Badge>}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">{event.description}</p>
                          <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-50">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                   <Calendar className="h-5 w-5 text-slate-300" />
                                </div>
                                <div className="text-left">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Temporal Start</p>
                                   <p className="text-sm font-bold text-slate-900 uppercase italic">{new Date(event.start_date).toLocaleDateString()} @ {new Date(event.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                   <MapPin className="h-5 w-5 text-slate-300" />
                                </div>
                                <div className="text-left">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Geographic Vertex</p>
                                   <p className="text-sm font-bold text-slate-900 uppercase italic">{event.location || "VIRTUAL OVERLAY"}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-600 p-10 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                          <Activity className="h-48 w-48" />
                       </div>
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8 relative z-10">Enrolment Yield</h3>
                       <div className="space-y-8 relative z-10">
                          <div className="space-y-3">
                             <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60">Registry Capacity</p>
                                <p className="text-2xl font-bold tracking-tighter">{event.current_attendees} / {event.max_attendees || "∞"}</p>
                             </div>
                             <Progress value={event.max_attendees ? (event.current_attendees / event.max_attendees) * 100 : 100} className="h-2 bg-white/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-6 pt-4">
                             <div>
                                <p className="text-3xl font-bold tracking-tighter mb-1">{event.max_attendees ? event.max_attendees - event.current_attendees : "∞"}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100/60">Available Nodes</p>
                             </div>
                             <div>
                                <p className="text-3xl font-bold tracking-tighter mb-1">${event.price || "0"}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100/60">Entry Yield</p>
                             </div>
                          </div>
                       </div>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent value="attendees" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                       <div className="relative w-full sm:w-96">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <Input 
                             placeholder="FILTER BY IDENTITY HASH OR NAME..." 
                             className="pl-12 h-11 rounded-xl border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest"
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                          />
                       </div>
                       <Button variant="ghost" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 bg-slate-50 shadow-sm"><Filter className="h-4 w-4 mr-3" /> Filter Matrix</Button>
                    </div>
                    <Table>
                       <TableHeader className="bg-slate-50/30">
                          <TableRow className="border-none hover:bg-transparent">
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Institutional Identity</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Temporal Enrollment</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Enrolment State</TableHead>
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {attendees.filter(a => a.user.name.toLowerCase().includes(searchTerm.toLowerCase())).map((a) => (
                             <TableRow key={a.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                                <TableCell className="px-10 py-6">
                                   <div className="flex items-center gap-4">
                                      <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                                         <AvatarImage src={a.user.imageUrl} />
                                         <AvatarFallback className="bg-slate-900 text-white font-black text-[10px] italic">{a.user.name[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{a.user.name}</p>
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5 italic">{a.user.email}</p>
                                      </div>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <div className="flex flex-col items-center">
                                      <span className="text-sm font-bold text-slate-900 italic leading-none">{new Date(a.registered_at).toLocaleDateString()}</span>
                                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">TIMESTAMP</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <Badge className={`border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic ${a.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {a.status}
                                   </Badge>
                                </TableCell>
                                <TableCell className="px-10 text-right">
                                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 text-slate-100 hover:text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button>
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
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic mb-8">Asset Control Protocol</h4>
              <div className="space-y-2">
                 {[
                   { label: "Dispatch Reminder", icon: Mail, sub: "Institutional Relay" },
                   { label: "Registry Export", icon: Download, sub: "Identity Dataset" },
                   { label: "Audit Performance", icon: BarChart3, sub: "Metrics Engine" },
                   { label: "Asset Settings", icon: Settings, sub: "Recalibrate Configuration" }
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
                    <Trash2 className="h-6 w-6 text-rose-400" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold uppercase italic tracking-tighter">Danger Zone</h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-loose">Asset termination is permanent. All enrolling identity nodes will be disconnected. Proceed with extreme caution.</p>
                 </div>
                 <Button variant="ghost" className="w-full h-12 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all">
                    Terminiate Asset Node
                 </Button>
              </div>
           </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Event Governor v1.2.4 • Asset Verification Module</p>
      </footer>
    </div>
  );
}