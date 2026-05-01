"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  Download,
  MoreHorizontal,
  Globe,
  TrendingUp,
  Target,
  Clock
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

export default function AdminJobsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = profile?.organizationId;

  const loadData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs?organizationId=${orgId}&status=${statusFilter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err: any) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [orgId, statusFilter]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, loadData]);

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Job deleted");
        setJobs(jobs.filter((j) => j.id !== jobId));
      }
    } catch (err: any) {
      toast.error("Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    return job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === "published").length,
    applications: jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0),
  };

  if (loading && jobs.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Job Opportunities</h1>
           <p className="text-slate-500 mt-1">Manage career listings and monitor applicant responses.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={loadData}>
             <RefreshCw className="h-4 w-4 mr-2" /> Refresh
           </Button>
           <Button onClick={() => router.push("/admin/jobs/create")} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Post New Job
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: stats.active, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Applications", value: stats.applications, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Review", value: jobs.filter(j => j.status === 'pending').length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Market Interest", value: "+12%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-xl`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search jobs or companies..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-sm">{job.title}</p>
                    <p className="text-xs text-slate-500">{job._count?.applications || 0} applications</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{job.companyName || "Confidential"}</TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.locationCity || job.locationCountry || "TBD"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={job.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}>
                        Edit Job
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(job.id)}>
                        Delete Listing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!filteredJobs.length && (
               <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                     No jobs found.
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
