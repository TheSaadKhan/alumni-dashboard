"use client";

import { useParams, useRouter } from "next/navigation";
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
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Mail, 
  Download, 
  BarChart3, 
  Edit,
  ChevronRight,
  Activity,
  Zap,
  Clock,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  FileText,
  Trash2,
  RefreshCw
} from "lucide-react";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();

  // Mock job data
  const job = {
    id: params.jobId,
    title: "Senior Software Engineer",
    company: "TechCorp",
    type: "full-time",
    status: "published",
    location: "San Francisco, CA",
    salary: "$120,000 - $150,000",
    description: "We are looking for an experienced Software Engineer to join our core platform team. You will be responsible for designing, developing, and maintaining scalable software solutions.",
    requirements: ["5+ years experience", "React/Node.js", "AWS", "TypeScript"],
    posted: "2024-01-15",
    expires: "2024-02-15",
    applications: 24,
    views: 156,
    poster: {
      name: "Sarah Chen",
      email: "sarah.chen@techcorp.com",
      role: "Engineering Manager",
      batch: "2015"
    }
  };

  const applications = [
    { id: 1, name: "Mike Rodriguez", email: "mike@example.com", applied: "2024-01-20", status: "review", match: 85 },
    { id: 2, name: "Emily Davis", email: "emily@example.com", applied: "2024-01-19", status: "interview", match: 92 },
    { id: 3, name: "David Wilson", email: "david@example.com", applied: "2024-01-18", status: "rejected", match: 45 },
    { id: 4, name: "Alex Johnson", email: "alex@example.com", applied: "2024-01-17", status: "review", match: 78 },
    { id: 5, name: "Maria Garcia", email: "maria@example.com", applied: "2024-01-16", status: "accepted", match: 95 }
  ];

  const statistics = {
    applicationRate: 15.4,
    viewToApply: 3.2,
    avgMatchScore: 79,
    topSkills: ["React", "Node.js", "TypeScript", "AWS"]
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Job Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900" onClick={() => router.push("/admin/jobs")}>
              <ArrowLeft className="h-4 w-4" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Market Orchestration</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Asset Verification</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic tracking-tighter">{job.title}</h1>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6 uppercase text-[10px] tracking-widest">
              <Edit className="h-4 w-4 mr-3" /> Recalibrate
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 uppercase text-[10px] tracking-widest">
              <Briefcase className="h-4 w-4 mr-3" /> Manage Node
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
           <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-slate-100 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit flex gap-1 mb-8 overflow-x-auto no-scrollbar">
                 <TabsTrigger value="overview" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Node Overview</TabsTrigger>
                 <TabsTrigger value="applications" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Identity Registry ({applications.length})</TabsTrigger>
                 <TabsTrigger value="analytics" className="h-9 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-slate-400">Market Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="m-0 space-y-10 animate-in fade-in slide-in-from-bottom-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8">Asset Specification</h3>
                       <div className="space-y-6">
                          <div className="flex flex-wrap gap-2 mb-4">
                             <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{job.type}</Badge>
                             <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{job.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                             <Building2 className="h-4 w-4 text-slate-300" />
                             <p className="text-sm font-bold text-slate-900 uppercase italic">{job.company}</p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">{job.description}</p>
                          <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-50">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                   <MapPin className="h-5 w-5 text-slate-300" />
                                </div>
                                <div className="text-left">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Geographic Vertex</p>
                                   <p className="text-sm font-bold text-slate-900 uppercase italic">{job.location}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                   <DollarSign className="h-5 w-5 text-slate-300" />
                                </div>
                                <div className="text-left">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Yield Projection</p>
                                   <p className="text-sm font-bold text-slate-900 uppercase italic">{job.salary}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </Card>

                    <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-600 p-10 text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                          <Activity className="h-48 w-48" />
                       </div>
                       <h3 className="text-xl font-bold italic uppercase tracking-tighter mb-8 relative z-10">Market Pulse</h3>
                       <div className="space-y-8 relative z-10">
                          <div className="grid grid-cols-2 gap-8">
                             <div>
                                <p className="text-4xl font-bold tracking-tighter mb-1">{job.applications}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 mb-1">Total Identities</p>
                                <p className="text-[9px] text-indigo-100/30 font-bold uppercase tracking-widest italic">Received Nodes</p>
                             </div>
                             <div>
                                <p className="text-4xl font-bold tracking-tighter mb-1">{job.views}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60 mb-1">Identity Views</p>
                                <p className="text-[9px] text-indigo-100/30 font-bold uppercase tracking-widest italic">Interaction Pulse</p>
                             </div>
                          </div>
                          <div className="pt-6 border-t border-white/10">
                             <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100/60">Recruitment Yield</p>
                                <p className="text-sm font-bold italic">{statistics.applicationRate}%</p>
                             </div>
                             <Progress value={statistics.applicationRate} className="h-2 bg-white/20" />
                          </div>
                       </div>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent value="applications" className="m-0 animate-in fade-in slide-in-from-bottom-2">
                 <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                    <Table>
                       <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none hover:bg-transparent">
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Candidate Identity</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Match Logic</TableHead>
                             <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Protocol State</TableHead>
                             <TableHead className="px-10 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {applications.map((a) => (
                             <TableRow key={a.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                                <TableCell className="px-10 py-6">
                                   <div className="flex items-center gap-4">
                                      <Avatar className="h-10 w-10 rounded-xl border-2 border-white shadow-sm">
                                         <AvatarImage src={`/avatars/${a.name.toLowerCase().replace(' ', '-')}.jpg`} />
                                         <AvatarFallback className="bg-slate-900 text-white font-black text-[10px] italic">{a.name[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                         <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{a.name}</p>
                                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5 italic">{a.email}</p>
                                      </div>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <div className="flex flex-col items-center gap-2">
                                      <Progress value={a.match} className="h-1.5 w-16 bg-slate-100" />
                                      <span className="text-[10px] font-black text-blue-600 italic">{a.match}% Hub Match</span>
                                   </div>
                                </TableCell>
                                <TableCell className="text-center">
                                   <Badge className="bg-blue-50 text-blue-600 border-none rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1 italic">{a.status}</Badge>
                                </TableCell>
                                <TableCell className="px-10 text-right">
                                   <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-blue-50 text-slate-100 hover:text-slate-400 transition-colors"><Mail className="h-4 w-4" /></Button>
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
                   { label: "Dispatch Relay", icon: Mail, sub: "Identity Message" },
                   { label: "Registry Export", icon: Download, sub: "CSV Dataset" },
                   { label: "Audit Match", icon: TrendingUp, sub: "Logic Recalibration" },
                   { label: "Asset Settings", icon: Briefcase, sub: "Core Configuration" }
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
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 leading-loose">Asset termination is permanent. All candidate identity nodes will be disconnected. Proceed with extreme caution.</p>
                 </div>
                 <Button variant="ghost" className="w-full h-12 rounded-2xl border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all">
                    Terminiate Asset Node
                 </Button>
              </div>
           </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Market Governor v1.1.2 • Career Nexus Analysis</p>
      </footer>
    </div>
  );
}