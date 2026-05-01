"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Plus,
  RefreshCw,
  MoreHorizontal,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  ArrowUpRight,
  Edit,
  Trash2,
  Users,
  Loader2,
  Inbox,
  CheckCircle2,
  XCircle
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
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function AdminJobsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const orgId = profile?.organizationId;

  const loadJobs = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any[]>(`admin_jobs_${orgId}`);
      if (cached) { setJobs(cached); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/jobs?organizationId=${orgId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const loadedJobs = data.jobs || [];
      setJobs(loadedJobs);
      sessionSet(`admin_jobs_${orgId}`, loadedJobs, 5 * 60 * 1000);
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadJobs();
  }, [loadJobs, orgId]);

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         j.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Job posting deleted");
        loadJobs(true);
      } else {
        toast.error("Failed to delete job");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job Board</h1>
          <p className="text-slate-500 font-medium text-sm">Post and manage career opportunities for your community.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            onClick={() => loadJobs()}
            className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
          </Button>
          <Button 
            onClick={() => router.push("/admin/jobs/create")}
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Post New Job
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search roles or companies..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "active", "draft", "filled"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
        {loading && jobs.length === 0 ? (
          <div className="p-0">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
              <Inbox className="h-8 w-8 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">No job postings found</p>
              <p className="text-xs text-slate-400">Time to share some new opportunities.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[400px] text-xs font-bold uppercase tracking-widest text-slate-400 px-8 py-5">Role & Company</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Status</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Applications</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5 text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {job.companyLogoUrl ? (
                            <img src={job.companyLogoUrl} className="h-8 w-8 object-contain rounded-md" alt="" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{job.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {job.companyName || profile?.organization?.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {job.locationCity || "Remote"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <Badge className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight border-none ${
                        job.status === "active" ? "bg-emerald-50 text-emerald-600" : 
                        job.status === "draft" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-600"
                      }`}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{job.applicationCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8 py-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                          <DropdownMenuItem className="py-2.5 font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/jobs/${job.id}`)}>
                            <Users className="h-4 w-4 mr-2" /> View Applicants
                          </DropdownMenuItem>
                          <DropdownMenuItem className="py-2.5 font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Posting
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="py-2.5 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer" onClick={() => handleDelete(job.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Posting
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
    </div>
  );
}
