"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Clock, DollarSign, Building2, Users, Share2, Bookmark, 
  ArrowLeft, Calendar, Loader2, Info, CheckCircle2, Briefcase, 
  GraduationCap, Award, Globe, Send, ExternalLink, Mail, RefreshCw, Zap
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ApplicationStatus, JobType, RemoteType } from "@/lib/generated/prisma";

interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  companyName: string | null;
  companyLogoUrl: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  isRemote: boolean;
  remoteType: RemoteType | null;
  jobType: JobType;
  experienceLevel: string | null;
  educationLevel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  showSalary: boolean;
  applicationMethod: string;
  applicationUrl: string | null;
  applicationEmail: string | null;
  isFeatured: boolean;
  isUrgent: boolean;
  status: string;
  applicationCount: number;
  viewCount: number;
  createdAt: string;
  expiresAt: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  postedBy: {
    id: string;
    name: string;
    avatar: string | null;
    title: string | null;
    company: string | null;
  };
  userApplication: {
    id: string;
    status: ApplicationStatus;
    createdAt: string;
  } | null;
  isBookmarked: boolean;
  canApply: boolean;
  isExpiringSoon: boolean;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuthProfile();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job node");
      const data = await res.json();
      setJob(data.job);
    } catch (err) {
      toast.error("Failed to synchronize career node");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!profile) {
      toast.error("Identity authentication required");
      return;
    }

    setApplying(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetter: coverLetter || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application protocol failure");

      toast.success("Application packet transmitted");
      await fetchJob();
      setShowApplicationForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to transmit application");
    } finally {
      setApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!profile) {
      toast.error("Authentication required");
      return;
    }

    setBookmarking(true);
    try {
      const method = job?.isBookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/jobs/${jobId}/bookmark`, { method });
      if (!res.ok) throw new Error("Bookmark protocol failure");

      toast.success(job?.isBookmarked ? "Node removed from archives" : "Node archived for later");
      await fetchJob();
    } catch (err) {
      toast.error("Failed to update archive matrix");
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Career node URL copied");
    } catch (err) {
      toast.error("Clipboard access restricted");
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
         <div className="h-16 w-16 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
            <Info className="h-8 w-8 text-rose-500" />
         </div>
         <div className="space-y-3">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Career Node Isolated</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">The requested market opportunity has been terminated or relocated.</p>
         </div>
         <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/dashboard/jobs")}>
            Back to Exchange
         </Button>
      </div>
    );
  }

  const postedDate = new Date(job.createdAt);

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Interface Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:bg-slate-50 transition-all" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 text-slate-400" />
           </Button>
           <div>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">{job.jobType.replace('_', ' ')}</span>
                 <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{job.organization.name}</span>
              </div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">{job.title}</h1>
           </div>
        </div>
        <div className="flex gap-4">
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50" onClick={handleShare}>
              <Share2 className="h-5 w-5 text-slate-400" />
           </Button>
           <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-none bg-white shadow-sm hover:bg-slate-50" onClick={handleBookmark} disabled={bookmarking}>
              <Bookmark className={`h-5 w-5 ${job.isBookmarked ? "text-indigo-600 fill-current" : "text-slate-400"}`} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* CAREER CORE */}
        <div className="lg:col-span-2 space-y-10">
          {/* OVERVIEW MATRIX */}
          <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Deployment Zone", value: job.locationCity || "GLOBAL", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Asset Valuation", value: job.showSalary ? `${job.salaryMin ? '$'+(job.salaryMin/1000)+'K' : 'Competitive'}` : "DISCLOSED", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Cycle Type", value: job.jobType.replace('_', ' '), icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Node Age", value: formatDistanceToNow(postedDate, { addSuffix: false }), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((item, i) => (
                  <div key={i} className="space-y-3">
                     <div className={`h-10 w-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="text-sm font-black uppercase italic tracking-tighter mt-0.5 truncate">{item.value}</p>
                     </div>
                  </div>
                ))}
             </div>
          </Card>

          {/* SPECIFICATION BLOCKS */}
          <div className="space-y-10">
             <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
                <CardHeader className="px-0 pt-0 pb-8">
                   <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Asset Narrative</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                   <p className="text-sm font-bold font-medium text-slate-500 leading-relaxed italic whitespace-pre-wrap">
                      {job.description}
                   </p>
                </CardContent>
             </Card>

             {job.requirements && (
                <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-950 text-white overflow-hidden p-10 relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full"></div>
                   <CardHeader className="px-0 pt-0 pb-8 relative z-10">
                      <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Nodal Prerequisites</CardTitle>
                   </CardHeader>
                   <CardContent className="px-0 relative z-10">
                      <p className="text-sm font-medium text-indigo-100 leading-relaxed italic whitespace-pre-wrap">
                         {job.requirements}
                      </p>
                   </CardContent>
                </Card>
             )}

             {job.responsibilities && (
               <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-10">
                  <CardHeader className="px-0 pt-0 pb-8">
                     <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Operational Cycle</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0">
                     <p className="text-sm font-bold font-medium text-slate-500 leading-relaxed italic whitespace-pre-wrap">
                        {job.responsibilities}
                     </p>
                  </CardContent>
               </Card>
             )}
          </div>
        </div>

        {/* SIDEBAR PROTOCOLS */}
        <div className="space-y-10">
           {/* DISPATCH CONTROL */}
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8 sticky top-24">
              <div className="space-y-8">
                 {job.userApplication ? (
                    <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center space-y-4">
                       <div className="h-12 w-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/50">
                          <CheckCircle2 className="h-6 w-6" />
                       </div>
                       <div>
                          <p className="text-sm font-black uppercase italic tracking-tighter">NODE TRANSMITTED</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Status: {job.userApplication.status.toUpperCase()}</p>
                       </div>
                    </div>
                 ) : !showApplicationForm ? (
                    <div className="space-y-8">
                       <div className="space-y-4 px-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-500 italic">Temporal Expiry</span>
                             <span className={job.isExpiringSoon ? "text-rose-500" : ""}>{job.expiresAt ? format(new Date(job.expiresAt), "MMM dd, yyyy") : 'PERPETUAL'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-500 italic">Engagement Volume</span>
                             <span>{job.applicationCount} ACTIVE LINKS</span>
                          </div>
                       </div>
                       
                       <Button 
                          className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-xs transition-all"
                          onClick={() => setShowApplicationForm(true)}
                          disabled={!job.canApply}
                       >
                          INITIALIZE APPLICATION
                       </Button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic ml-1">Cover Narrative (Optional)</label>
                          <textarea
                             className="w-full h-40 rounded-2xl bg-white/5 border-none text-white p-5 text-xs font-medium italic resize-none focus:ring-2 focus:ring-blue-500/20"
                             placeholder="WHY SHOULD THIS NODE BE SYNCHRONIZED?"
                             value={coverLetter}
                             onChange={(e) => setCoverLetter(e.target.value)}
                          />
                       </div>
                       <Button 
                          className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px]"
                          onClick={handleApply}
                          disabled={applying}
                       >
                          {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "TRANSMIT PACKET"}
                       </Button>
                       <Button variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-slate-500" onClick={() => setShowApplicationForm(false)}>
                          ABORT
                       </Button>
                    </div>
                 )}
                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                       <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 text-slate-400" />
                       </div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">ALUMNI CONNECT VERIFIED ENCRYPTION FOR ALL TALENT DATA</p>
                    </div>
                 </div>
              </div>
           </Card>

           {/* ENTITY HUB */}
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-slate-300">Originating Entity</h4>
              <div className="flex items-center gap-4 mb-8">
                 <Avatar className="h-14 w-14 rounded-2xl shadow-xl border-2 border-white">
                    <AvatarImage src={job.organization.logoUrl || ""} />
                    <AvatarFallback className="bg-slate-900 text-white font-black">{job.organization.name[0]}</AvatarFallback>
                 </Avatar>
                 <div className="min-w-0">
                    <p className="text-sm font-black uppercase italic truncate tracking-tighter">{job.organization.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VERIFIED INSTITUTION</p>
                 </div>
              </div>
              <Button variant="outline" className="w-full h-12 rounded-xl border-none bg-slate-50 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px]" onClick={() => router.push(`/organization/${job.organization.slug}`)}>
                 VIEW ENTITY MATRIX
              </Button>
           </Card>
        </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Career Nodal Intelligence v1.3.4 • Verified Institutional Exchange</p>
      </footer>
    </div>
  );
}