"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  RefreshCw,
  Building2,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { JobType, RemoteType } from "@/lib/generated/prisma";

export default function JobsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const slug = organization?.slug || "default";

  const fetchJobs = useCallback(async () => {
    if (!profile?.organizationId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/news?organizationId=${profile.organizationId}&type=JOB`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.news || []);
      }
    } catch (err) {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchJobs();
  }, [profile, fetchJobs]);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || job.jobType === filterType;
    return matchesSearch && matchesType;
  });

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Career Platform</h1>
           <p className="text-slate-500 mt-1">Discover opportunities from your network and partners.</p>
        </div>
        <Button onClick={() => router.push(`/organization/${slug}/dashboard/jobs/new`)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Post Opportunity
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by title or company..." 
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {["all", "FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"].map(type => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              className="whitespace-nowrap rounded-full text-xs"
            >
              {type.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow flex flex-col">
             <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start gap-4">
                   <div className="h-12 w-12 rounded border bg-slate-50 flex items-center justify-center p-2">
                      <Briefcase className="h-6 w-6 text-slate-400" />
                   </div>
                   <Badge variant="secondary" className="text-[10px]">{job.jobType}</Badge>
                </div>
                <CardTitle className="text-lg font-bold mt-4 leading-tight">{job.title}</CardTitle>
                <p className="text-indigo-600 text-sm font-semibold">{job.company || "Hiring Company"}</p>
             </CardHeader>
             <CardContent className="p-6 pt-2 space-y-4 flex-1">
                <div className="space-y-2 text-xs text-slate-500">
                   <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{job.location || "Remote / TBD"}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Posted {formatDistanceToNow(new Date(job.createdAt))} ago</span>
                   </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                   {job.description || "View details to learn more about this institutional opportunity."}
                </p>
             </CardContent>
             <CardFooter className="p-6 pt-0">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/organization/${slug}/dashboard/jobs/${job.slug || job.id}`)}>
                   View Details
                </Button>
             </CardFooter>
          </Card>
        ))}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
           <Briefcase className="h-12 w-12 text-slate-200 mx-auto" />
           <p className="text-slate-500">No matching jobs found right now.</p>
        </div>
      )}
    </div>
  );
}