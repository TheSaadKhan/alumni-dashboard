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
  Briefcase,
  Building2,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Eye,
  RefreshCw,
  Filter,
  Download,
  ChevronRight,
  Target,
  Clock,
  TrendingUp,
  MoreHorizontal,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function AdminJobsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = (profile as any)?.organizationId;

  const loadData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const jobsRes = await fetch(
        `/api/jobs?organizationId=${orgId}&status=${statusFilter}&type=${typeFilter}`
      );
      if (!jobsRes.ok) throw new Error();
      const jobsData = await jobsRes.json();
      setJobs(jobsData.jobs || []);
    } catch (err: any) {
      toast.error("Failed to synchronize career nodes");
    } finally {
      setLoading(false);
    }
  }, [orgId, statusFilter, typeFilter]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, loadData]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Confirm opportunity termination?")) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Job asset removed");
        setJobs(jobs.filter((j) => j.id !== jobId));
      }
    } catch (err: any) {
      toast.error("Termination failed");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    return job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: jobs.length,
    published: jobs.filter((j) => j.status === "published").length,
    pending: jobs.filter((j) => j.status === "pending" || j.status === "draft").length,
    applications: jobs.reduce((sum, j) => sum + (j.job_applications?.length || 0), 0),
  };

  if (loading && jobs.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Career Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Career Nexus Governance</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.published} Active Opportunities</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Professional Market Gate</h1>
           <p className="text-slate-500 font-medium mt-1">Regulate career trajectories and oversee recruitment telemetry.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Global Sync
           </Button>
           <Button onClick={() => router.push("/admin/jobs/create")} className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Plus className="h-4 w-4 mr-2" /> Deploy Asset
           </Button>
        </div>
      </div>

      {/* Pulse Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Listings", value: stats.published, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Talent Responses", value: stats.applications, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Nodes", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Market Growth", value: "+12.4%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
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

      {/* Career Infrastructure Hub */}
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <Input 
                 placeholder="IDENTIFY JOB ASSET BY TITLE OR ENTITY..." 
                 className="pl-12 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase focus:ring-2 focus:ring-blue-500/10"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl border-none bg-white shadow-sm text-[10px] font-black tracking-widest uppercase px-6">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                     <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">Global State</SelectItem>
                     <SelectItem value="published" className="text-[10px] font-black uppercase tracking-widest">Published</SelectItem>
                     <SelectItem value="draft" className="text-[10px] font-black uppercase tracking-widest">Draft Node</SelectItem>
                     <SelectItem value="expired" className="text-[10px] font-black uppercase tracking-widest">Expired</SelectItem>
                  </SelectContent>
               </Select>
               <Button variant="ghost" className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-white shadow-sm">
                  <Download className="h-4 w-4 mr-2" /> Export Hub
               </Button>
            </div>
         </div>

         <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Job Asset</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Source Entity</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Geographic Vector</TableHead>
                      <TableHead className="py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-center">Lifecycle</TableHead>
                      <TableHead className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 italic text-right">Telemetry</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredJobs.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center py-24 text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No job nodes detected in the current matrix.</TableCell>
                     </TableRow>
                   ) : (
                     filteredJobs.map((job) => (
                       <TableRow key={job.id} className="border-b border-slate-50/50 hover:bg-white/40 transition-all group">
                         <TableCell className="px-8 py-5">
                            <div>
                               <p className="text-sm font-bold text-slate-900 uppercase italic leading-none truncate max-w-[220px]">{job.title}</p>
                               <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-none bg-blue-50 text-blue-500 rounded-md px-2">{job.job_applications?.length || 0} RESPONSES</Badge>
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-none bg-slate-100 text-slate-400 rounded-md px-2">{job.employment_type?.toUpperCase() || "FULL-TIME"}</Badge>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1.5">
                               <Building2 className="h-4 w-4 text-slate-300" />
                               <span className="text-[10px] font-bold text-slate-600 uppercase italic">{job.company_name || "Confidential"}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1.5">
                               {job.location?.toLowerCase().includes('remote') ? <Globe className="h-4 w-4 text-emerald-400" /> : <MapPin className="h-4 w-4 text-slate-300" />}
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{job.location || "Global Proxy"}</span>
                            </div>
                         </TableCell>
                         <TableCell className="text-center">
                             <div className="flex flex-col items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full ${job.status === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400'} mb-1`}></span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{job.status.toUpperCase()}</span>
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
                                  <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                     <Eye className="h-3.5 w-3.5 mr-3 text-slate-400" /> Asset Stream
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4">
                                     <Edit className="h-3.5 w-3.5 mr-3 text-slate-400" /> Modify Proxy
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                  <DropdownMenuItem onClick={() => handleDelete(job.id)} className="rounded-xl py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer px-4 text-rose-600 hover:bg-rose-50">
                                     <Trash2 className="h-3.5 w-3.5 mr-3" /> Terminate Node
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </div>
            <CardFooter className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/30">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">Market Infrastructure Optimized</p>
               <Button variant="ghost" className="h-9 px-6 rounded-xl font-bold uppercase tracking-widest text-[9px] text-blue-600 hover:bg-blue-50">
                  Market Analytics <ChevronRight className="h-3 w-3 ml-2" />
               </Button>
            </CardFooter>
         </Card>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Career Governor v1.1.2 • Talent Management</p>
      </footer>
    </div>
  );
}
