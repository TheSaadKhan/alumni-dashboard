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
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Search,
  Calendar,
  Users,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Filter,
  Eye,
  Download,
  Clock,
  CheckCircle,
  Video,
  RefreshCw,
  Tag,
  ChevronRight,
  Target,
  MoreHorizontal,
  Flame,
  Zap
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthProfile } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

type EventType = {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  status: "published" | "draft" | "cancelled" | "archived";
  start_date: string;
  end_date?: string;
  location?: string;
  virtual_link?: string;
  max_attendees?: number;
  current_attendees?: number;
  featured?: boolean;
};

type EventStats = {
  total: number;
  published: number;
  upcoming: number;
  totalAttendees: number;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EventStats>({ total: 0, published: 0, upcoming: 0, totalAttendees: 0 });
  
  const orgId = (profile as any)?.organizationId;

  const loadEvents = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/events?organizationId=${orgId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list: EventType[] = data.events || [];
      setEvents(list);
      
      const now = new Date();
      setStats({
        total: list.length,
        published: list.filter(e => e.status === "published").length,
        upcoming: list.filter(e => new Date(e.start_date) > now && e.status === "published").length,
        totalAttendees: list.reduce((acc, curr) => acc + (curr.current_attendees || 0), 0)
      });
    } catch (err) {
      toast.error("Failed to synchronize event nodes");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadEvents();
  }, [loadEvents, orgId]);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && events.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Event Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Event Orchestration</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.upcoming} active cycles</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Institutional Calendar</h1>
           <p className="text-slate-500 font-medium mt-1">Deploy and monitor high-impact activities across the alumni network.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Program Sync
           </Button>
           <Button onClick={() => router.push("/admin/events/create")} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Plus className="h-4 w-4 mr-2" /> Deploy Cycle
           </Button>
        </div>
      </div>

      {/* Pulse Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Volume", value: stats.total, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Live Nodes", value: stats.published, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Upcoming Cycle", value: stats.upcoming, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Aggregate Reach", value: stats.totalAttendees, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-sm shadow-black/5`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tighter">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Orchestration Table */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="IDENTIFY CYCLE BY TITLE OR DESCRIPTION..." 
                 className="pl-12 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-blue-500/10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <Button variant="ghost" className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-white shadow-sm">
               <Filter className="h-4 w-4 mr-2" /> Global Protocol
            </Button>
         </div>

         <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Event Asset</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Temporal Data</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Venue Vector</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Identity Load</TableHead>
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredEvents.map((event) => (
                     <TableRow key={event.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                       <TableCell className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-sm">
                               {event.featured ? <Flame className="h-6 w-6 text-amber-500" /> : <Calendar className="h-6 w-6 text-indigo-400" />}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900 uppercase italic leading-none truncate max-w-[200px]">{event.title}</p>
                               <Badge className={`text-[8px] font-black uppercase tracking-widest mt-2 border-none rounded-md px-2 ${event.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {event.status}
                               </Badge>
                            </div>
                         </div>
                       </TableCell>
                       <TableCell className="text-center">
                          <p className="text-[11px] font-bold text-slate-500 uppercase italic">{format(new Date(event.start_date), 'MMM dd, yyyy')}</p>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{format(new Date(event.start_date), 'HH:mm')} Cycles</p>
                       </TableCell>
                       <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                             {event.virtual_link ? <Video className="h-3 w-3 text-blue-500" /> : <MapPin className="h-3 w-3 text-slate-300" />}
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{event.virtual_link ? 'Global Virtual' : (event.location || 'Static Node')}</span>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="max-w-[120px] mx-auto space-y-2">
                             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest leading-none bg-slate-50 p-2 rounded-lg">
                                <span className="text-slate-300 italic">Nodes</span>
                                <span className="text-blue-600">{event.current_attendees || 0}</span>
                             </div>
                             <Progress value={Math.min(100, ((event.current_attendees || 0) / (event.max_attendees || 1)) * 100)} className="h-1.5 bg-slate-50" />
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
                                <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}`)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                   <Eye className="h-3.5 w-3.5 mr-3 text-slate-400" /> Detail Insight
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}/edit`)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                   <Edit className="h-3.5 w-3.5 mr-3 text-slate-400" /> Modify Proxy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                <DropdownMenuItem className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4 text-rose-600 hover:bg-rose-50">
                                   <Trash2 className="h-3.5 w-3.5 mr-3" /> Terminate Cycle
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
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Program Infrastructure: Online</p>
               <Button variant="ghost" className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-blue-600 hover:bg-blue-50">
                  Detailed Ledger <ChevronRight className="h-3 w-3 ml-2" />
               </Button>
            </CardFooter>
         </Card>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Calendar Governor v1.1.5 • Event Management</p>
      </footer>
    </div>
  );
}