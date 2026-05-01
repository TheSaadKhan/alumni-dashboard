"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Briefcase, MapPin, Clock, IndianRupee, Plus, Building2,
  Loader2, TrendingUp, Bookmark, Zap, Inbox, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function JobsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, featured: 0, saved: 0 });

  const orgId = profile?.organizationId;
  const slug = organization?.slug || "default";
  const isStudent = profile?.userType === "student";

  const fetchJobs = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any>(`jobs_${orgId}`);
      if (cached) { setJobs(cached.list); setStats(cached.stats); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/jobs?organizationId=${orgId}&status=active`);
      if (res.ok) {
        const data = await res.json();
        const jobList = data.jobs || [];
        const newStats = {
          active: jobList.length,
          featured: jobList.filter((j: any) => j.isFeatured).length,
          saved: jobList.filter((j: any) => j.isBookmarked).length,
        };
        setJobs(jobList);
        setStats(newStats);
        sessionSet(`jobs_${orgId}`, { list: jobList, stats: newStats }, 5 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load job listings");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) fetchJobs();
  }, [orgId, fetchJobs]);

  const filteredJobs = jobs.filter((j: any) => {
    const matchesSearch = j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         j.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || j.jobType === filterType;
    return matchesSearch && matchesType;
  });

  if (profileLoading && !jobs.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-72 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Career Board</h1>
          <p className="text-slate-500 font-medium text-sm">Discover and apply for opportunities within our network.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => fetchJobs()} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {!isStudent && (
            <Button onClick={() => router.push("/admin/jobs/create")} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4 mr-2" /> Post New Job
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Active Roles", value: stats.active, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Featured Jobs", value: stats.featured, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Bookmarked", value: stats.saved, icon: Bookmark, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item, i) => (
          <Card key={i} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-10 w-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search roles or companies..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "full_time", "internship", "remote"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filterType === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {loading && !jobs.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {Array(6).fill(0).map((_, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm p-6 space-y-4">
               <div className="flex justify-between items-start">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-5 w-16 rounded-full" />
               </div>
               <Skeleton className="h-5 w-3/4 rounded-lg" />
               <Skeleton className="h-12 w-full rounded-xl" />
               <Skeleton className="h-10 w-full rounded-xl" />
             </div>
           ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <Inbox className="h-8 w-8 text-slate-200" />
          </div>
          <p className="text-sm font-bold text-slate-900">No matching jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {job.companyLogoUrl ? (
                      <img src={job.companyLogoUrl} className="h-full w-full object-contain" alt="" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-200" />
                    )}
                  </div>
                  <Badge className="rounded-lg px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border-none">
                    {job.jobType.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-1">
                   <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" /> {job.companyName || profile?.organization?.name}
                   </p>
                </div>

                <div className="flex flex-wrap gap-3">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <MapPin className="h-3.5 w-3.5" /> {job.locationCity || "Remote"}
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <IndianRupee className="h-3.5 w-3.5" /> {job.salaryRange ? job.salaryRange.replace('$', '₹') : "Competitive"}
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex gap-2">
                   <Button 
                    onClick={() => router.push(`/organization/${slug}/dashboard/jobs/${job.id}`)}
                    className="flex-1 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                   >
                     View & Apply
                   </Button>
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600">
                      <Bookmark className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}