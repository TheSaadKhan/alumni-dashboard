"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2, 
  Users, 
  Share2, 
  Bookmark, 
  ArrowLeft, 
  Calendar, 
  RefreshCw,
  Info,
  CheckCircle2,
  Briefcase,
  ExternalLink
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const jobId = params.jobId as string;
  const slug = organization?.slug || "default";

  const [job, setJob] = useState<any>(null);
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
      if (!res.ok) throw new Error("Failed to fetch job");
      const data = await res.json();
      setJob(data.job);
    } catch (err) {
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!profile) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter }),
      });
      if (res.ok) {
        toast.success("Application submitted!");
        await fetchJob();
        setShowApplicationForm(false);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleBookmark = async () => {
    if (!profile) return;
    setBookmarking(true);
    try {
      const method = job?.isBookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/jobs/${jobId}/bookmark`, { method });
      if (res.ok) {
        toast.success(job?.isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
        await fetchJob();
      }
    } catch (err) {
      toast.error("Failed to update bookmark");
    } finally {
      setBookmarking(false);
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
      <div className="container py-24 text-center max-w-sm mx-auto space-y-6">
         <Info className="h-12 w-12 text-slate-200 mx-auto" />
         <h1 className="text-xl font-bold">Job Not Found</h1>
         <p className="text-sm text-slate-500">This job posting might have been removed or expired.</p>
         <Button className="w-full" onClick={() => router.push(`/organization/${slug}/dashboard/jobs`)}>
            Back to Jobs
         </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="uppercase tracking-wider">{job.jobType?.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{job.organization.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">{job.title}</h1>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="icon" onClick={() => {
               navigator.clipboard.writeText(window.location.href);
               toast.success("Link copied!");
           }}>
              <Share2 className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="icon" onClick={handleBookmark} disabled={bookmarking}>
              <Bookmark className={`h-4 w-4 ${job.isBookmarked ? "fill-indigo-600 text-indigo-600" : ""}`} />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Info */}
          <Card>
             <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {job.locationCity || "Remote"}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Salary</p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                        <DollarSign className="h-4 w-4" />
                        {job.showSalary ? `${job.salaryMin ? '$'+(job.salaryMin/1000)+'K' : 'Competitive'}` : "Not disclosed"}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Type</p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        {job.jobType?.replace('_', ' ')}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Posted</p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {formatDistanceToNow(new Date(job.createdAt))} ago
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-6">
             <Card>
                <CardHeader>
                   <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                   </p>
                </CardContent>
             </Card>

             {job.requirements && (
                <Card>
                   <CardHeader>
                      <CardTitle>Requirements</CardTitle>
                   </CardHeader>
                   <CardContent>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                         {job.requirements}
                      </p>
                   </CardContent>
                </Card>
             )}
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <Card className="bg-slate-900 text-white">
              <CardContent className="p-6 space-y-6">
                 {job.userApplication ? (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-center space-y-3">
                       <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                       <p className="font-bold">Application Submitted</p>
                       <p className="text-xs text-slate-400">Status: {job.userApplication.status}</p>
                    </div>
                 ) : !showApplicationForm ? (
                    <div className="space-y-6">
                       <div className="space-y-3 text-xs">
                          <div className="flex justify-between">
                             <span className="text-slate-400">Expires</span>
                             <span>{job.expiresAt ? format(new Date(job.expiresAt), "MMM dd, yyyy") : 'Ongoing'}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-400">Applications</span>
                             <span>{job.applicationCount} applicants</span>
                          </div>
                       </div>
                       <Button 
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                          onClick={() => setShowApplicationForm(true)}
                          disabled={!job.canApply}
                       >
                          Apply Now
                       </Button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase">Cover Letter (Optional)</p>
                          <textarea
                             className="w-full h-32 rounded-md bg-white/5 border border-white/10 text-white p-4 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                             placeholder="Tell us why you're a good fit..."
                             value={coverLetter}
                             onChange={(e) => setCoverLetter(e.target.value)}
                          />
                       </div>
                       <Button 
                          className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                          onClick={handleApply}
                          disabled={applying}
                       >
                          {applying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Submit Application"}
                       </Button>
                       <Button variant="ghost" size="sm" className="w-full text-slate-400 hover:text-white" onClick={() => setShowApplicationForm(false)}>
                          Cancel
                       </Button>
                    </div>
                 )}
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                 <CardTitle className="text-xs font-bold uppercase text-slate-400">Hiring Organization</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                       <AvatarImage src={job.organization.logoUrl || ""} />
                       <AvatarFallback>{job.organization.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                       <p className="font-bold text-sm truncate">{job.organization.name}</p>
                       <p className="text-[10px] text-slate-500 uppercase font-semibold">Verified Client</p>
                    </div>
                 </div>
                 <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => router.push(`/organization/${job.organization.slug}`)}>
                    View Organization
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}