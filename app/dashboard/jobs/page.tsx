"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, Briefcase, MapPin, Clock, DollarSign, Plus, Building2, 
  Loader2, Eye, TrendingUp, Filter, X, Zap, RefreshCw, ChevronRight,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { JobType, RemoteType } from "@/lib/generated/prisma";
import router from "next/router";

export default function JobsPage() {
  const { profile, loading: profileLoading } = useAuthProfile();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0 });

  const fetchJobs = useCallback(async () => {
    if (!profile?.organizationId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ organizationId: profile.organizationId, status: "active", limit: "50" });
      if (searchTerm) params.append("search", searchTerm);
      if (filterType !== "all") params.append("jobType", filterType);
      
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0,
          featured: data.jobs?.filter((j: any) => j.isFeatured).length || 0,
        });
      }
    } catch (err) {
      toast.error("Failed to synchronize career nodes");
    } finally {
      setLoading(false);
    }
  }, [profile, searchTerm, filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile) fetchJobs();
    }, 500);
    return () => clearTimeout(timer);
  }, [profile, fetchJobs]);

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Career Nexus</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.active} active opportunities</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Career Platform</h1>
           <p className="text-slate-500 font-medium mt-1">Discover roles from alumni and institutional partners.</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button className="h-12 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
            <Plus className="h-4.5 w-4.5 mr-2" /> Publish Opportunity
          </Button>
        </Link>
      </div>

      {/* Grid Pulse Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Market Nodes", value: stats.total, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Stream", value: stats.active, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Premium Roles", value: stats.featured, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Saved Points", value: 0, icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
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

      {/* Search & Filter Matrix */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Search roles, companies, or tech stack..." 
            className="pl-11 h-12 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl">
           {["all", "full_time", "internship", "contract"].map((type) => (
             <button
               key={type}
               onClick={() => setFilterType(type)}
               className={`px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                 filterType === type ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
               }`}
             >
               {type}
             </button>
           ))}
        </div>
      </div>

      {/* Career Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {jobs.map((job) => (
          <Card key={job.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-slate-50 dark:hover:border-slate-800 flex flex-col">
             <div className="p-8 pb-4 flex items-start justify-between">
                <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center p-2 shadow-sm border border-slate-50 dark:border-slate-800">
                    <img 
                      src={job.companyLogoUrl || "/assets/image/placeholder-company.png"} 
                      alt={job.companyName} 
                      className="h-full w-full object-contain filter dark:invert" 
                      onError={(e) => (e.currentTarget.src = "/assets/image/placeholder-company.png")}
                    />
                </div>
                <div className="flex flex-col items-end gap-2">
                   {job.isFeatured && <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] px-2 rounded-lg tracking-widest uppercase italic">FEATURED</Badge>}
                   <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] px-2 rounded-lg tracking-widest uppercase italic">{job.jobType.replace('_', ' ')}</Badge>
                </div>
             </div>
             <CardHeader className="px-8 pt-2 pb-4 space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic leading-none truncate group-hover:text-blue-600 transition-colors">
                   {job.title}
                </CardTitle>
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{job.companyName || "Confidential Org"}</p>
             </CardHeader>
             <CardContent className="px-8 pb-6 pt-2 space-y-4 flex-1">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                      <MapPin className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{job.locationCity || "Remote Node"}</span>
                   </div>
                   {job.salaryMin && (
                     <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span>{job.salaryCurrency} {job.salaryMin.toLocaleString()} - {job.salaryMax?.toLocaleString()}</span>
                     </div>
                   )}
                </div>
                <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">
                   {job.description || "Position intelligence pending for this market node."}
                </p>
                <div className="flex items-center gap-2 pt-2">
                   <Clock className="h-3.5 w-3.5 text-slate-300" />
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Posted {formatDistanceToNow(new Date(job.createdAt))} ago</p>
                </div>
             </CardContent>
             <CardFooter className="px-8 pb-8 pt-0 flex gap-3">
                <Button className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-500/10" onClick={() => router.push(`/dashboard/jobs/${job.slug || job.id}`)}>
                   Apply Now
                </Button>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-400">
                   <Briefcase className="h-4.5 w-4.5" />
                </Button>
             </CardFooter>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="py-24 text-center flex flex-col items-center space-y-6">
           <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-slate-200" />
           </div>
           <div className="space-y-2">
              <h4 className="text-xl font-bold italic uppercase tracking-tighter">Market Void Detetced</h4>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">No career opportunities corresponding to the current search vector were found.</p>
           </div>
           <Button variant="outline" className="h-12 px-8 rounded-2xl font-bold text-slate-400" onClick={() => {setSearchTerm(""); setFilterType("all");}}>
              Vector Reset
           </Button>
        </div>
      )}

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Career Acquisition Protocol v1.0.2 • Global Talent Network</p>
      </footer>
    </div>
  );
}