"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Edit,
  ChevronRight,
  Zap,
  Clock,
  Trash2,
  Eye,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Share2,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      const data = await res.json();
      setJob(data.job);
    } catch (err) {
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-8 w-72 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-52 w-full rounded-3xl" />
            <Skeleton className="h-36 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-slate-100 rounded-full">
          <Briefcase className="h-12 w-12 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Not Found</h2>
          <p className="text-slate-500 mt-2 max-w-sm">The job posting you're looking for doesn't exist or has been removed.</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-xl px-8 h-12">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="flex items-start gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 rounded-xl bg-slate-50 hover:bg-slate-100 border-none transition-all" 
            onClick={() => router.push("/admin/jobs")}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white border-none rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider">
                {job.jobType?.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-500">
                {job.status}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
            <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {job.companyName}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {job.locationCity}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            className="h-12 flex-1 lg:flex-none rounded-xl font-bold px-6 border-slate-200 hover:bg-slate-50 transition-all"
            onClick={() => router.push(`/admin/jobs/edit/${job.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button 
            className="h-12 flex-1 lg:flex-none rounded-xl font-bold px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Applicants", value: job.applicationCount || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Views", value: job.viewCount || 0, icon: Eye, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Time Active", value: `${Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days`, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Relevance", value: "88%", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 rounded-3xl border-none shadow-sm bg-white hover:shadow-md transition-shadow flex items-center gap-5">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit flex gap-1 mb-8">
              <TabsTrigger value="details" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Details</TabsTrigger>
              <TabsTrigger value="candidates" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Candidates</TabsTrigger>
              <TabsTrigger value="insights" className="px-8 rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-10 rounded-[2.5rem] border-none shadow-sm bg-white space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-8 border-b border-slate-50">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center p-3 border border-slate-100 shadow-inner">
                      {job.companyLogoUrl ? (
                        <img src={job.companyLogoUrl} alt={job.companyName} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <Building2 className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{job.companyName}</h3>
                      <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                        <Globe className="h-4 w-4" /> Company Profile
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Compensation</p>
                    <p className="text-3xl font-extrabold text-blue-600 tracking-tight">
                      {job.salaryCurrency} {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}
                    </p>
                    <p className="text-sm font-bold text-slate-400 italic">per {job.salaryPeriod}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> Job Description
                    </h4>
                    <div className="text-slate-600 leading-relaxed text-base font-medium whitespace-pre-wrap">
                      {job.description}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Key Requirements
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements?.split('\n').map((req: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 rounded-xl px-4 py-1.5 text-xs font-bold">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-blue-50/50 border border-blue-100/50 space-y-6">
                      <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                        <Calendar className="h-4 w-4" /> Timeline
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Posted</p>
                          <p className="text-sm font-bold text-blue-900 mt-1">{format(new Date(job.createdAt), 'MMMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Deadline</p>
                          <p className="text-sm font-bold text-blue-900 mt-1">
                            {job.expiresAt ? format(new Date(job.expiresAt), 'MMMM dd, yyyy') : 'No Expiry'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900">Recent Applications</h3>
                  <Button variant="ghost" className="text-blue-600 font-bold">View Pipeline</Button>
                </div>
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-none">
                      <TableHead className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Candidate</TableHead>
                      <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                      <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">Profile Match</TableHead>
                      <TableHead className="px-8 py-5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.applications?.length > 0 ? (
                      job.applications.map((app: any) => (
                        <TableRow key={app.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10 rounded-xl border border-white shadow-sm">
                                <AvatarImage src={app.applicant?.avatar} />
                                <AvatarFallback className="bg-blue-600 text-white font-bold">{app.applicant?.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{app.applicant?.name}</p>
                                <p className="text-[11px] font-medium text-slate-400">{app.applicant?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-blue-50 text-blue-600 border-none rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                              {app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[11px] font-bold text-emerald-700">92% Match</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-8 text-right">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600">
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center text-slate-400 font-medium italic">
                          No applications received yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white space-y-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Actions</h4>
            <div className="space-y-2">
              {[
                { label: "Export Data", icon: Download, sub: "Generate CSV Report", color: "blue" },
                { label: "Contact Admin", icon: Mail, sub: "Message Job Poster", color: "indigo" },
                { label: "Live Preview", icon: ExternalLink, sub: "View Public Page", color: "amber" },
              ].map((action, i) => (
                <button 
                  key={i} 
                  className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 leading-none">{action.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1">{action.sub}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-10 rounded-[2.5rem] border-none bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-rose-500/10 blur-[80px] rounded-full translate-x-12 -translate-y-12"></div>
            <div className="relative z-10 space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                <Trash2 className="h-7 w-7 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Archive Posting</h4>
                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                  Removing this job will hide it from the public network. All current data will be preserved in history.
                </p>
              </div>
              <Button variant="ghost" className="w-full h-12 rounded-xl border border-white/10 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all">
                Delete Job Posting
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

