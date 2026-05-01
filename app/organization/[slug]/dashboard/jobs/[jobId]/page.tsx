"use client";

import {
   MapPin, Clock, IndianRupee, Building2, Share2, Bookmark,
   ArrowLeft, Loader2, CheckCircle2, Briefcase,
   Zap, FileText, Globe, Info
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

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
   jobType: string;
   salaryMin: number | null;
   salaryMax: number | null;
   showSalary: boolean;
   applicationCount: number;
   createdAt: string;

   userApplication: {
      status: string;
   } | null;
   isBookmarked: boolean;
   canApply: boolean;
   organization: {
      id: string;
      name: string;
      logoUrl: string | null;
   };
}

export default function JobDetailPage() {
   const params = useParams();
   const router = useRouter();
   const { profile, organization, loading: profileLoading } = useAuthProfile();
   const jobId = params.jobId as string;

   const [job, setJob] = useState<Job | null>(null);
   const [loading, setLoading] = useState(true);
   const [applying, setApplying] = useState(false);
   const [showForm, setShowForm] = useState(false);
   const [resume, setResume] = useState<File | null>(null);

   useEffect(() => {
      if (jobId) fetchJob();
   }, [jobId]);

   const fetchJob = async () => {
      try {
         setLoading(true);
         const res = await fetch(`/api/jobs/${jobId}`);
         if (res.ok) {
            const data = await res.json();
            setJob(data.job);
         }
      } catch (err) {
         toast.error("Failed to load job details");
      } finally {
         setLoading(false);
      }
   };

   const handleApply = async () => {
      if (!resume) {
         toast.error("Please upload a resume first");
         return;
      }

      setApplying(true);
      try {
         // 1. Upload to Storage via Server API (to bypass RLS)
         const fileExt = resume.name.split('.').pop();
         const fileName = `${jobId}-${profile?.id || 'user'}-${Date.now()}.${fileExt}`;
         const filePath = `resumes/${fileName}`;

         const formData = new FormData();
         formData.append("file", resume);
         formData.append("bucket", "Assets");
         formData.append("path", filePath);

         const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
         });

         const uploadData = await uploadRes.json();

         if (!uploadRes.ok) {
            throw new Error(uploadData.error || "Failed to upload resume");
         }

         const publicUrl = uploadData.publicUrl;

         // 3. Submit application with the real URL
         const res = await fetch(`/api/jobs/${jobId}/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               coverLetter: "Applying via AlumniConnect Platform",
               resumeUrl: publicUrl
            }),
         });

         const data = await res.json();

         if (res.ok) {
            toast.success("Application submitted successfully!");
            setShowForm(false);
            fetchJob();
         } else {
            toast.error(data.error || "Failed to submit application");
         }
      } catch (err: any) {
         toast.error(err.message || "An unexpected error occurred during application");
      } finally {
         setApplying(false);
      }
   };

   if (loading || profileLoading) {
      return (
         <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
         </div>
      );
   }

   if (!job) return <div className="text-center py-20 text-slate-500">Job not found</div>;

   return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
         {/* Back Button */}
         <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
         </Button>

         {/* Header Card */}
         <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
               <div className="bg-slate-50 p-8 border-b border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex items-center gap-5">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                           <AvatarImage src={job.companyLogoUrl || job.organization.logoUrl || ""} />
                           <AvatarFallback className="bg-blue-600 text-white font-bold text-xl">
                              {job.companyName?.[0] || job.organization.name[0]}
                           </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
                           <p className="text-slate-600 font-medium">{job.companyName || job.organization.name}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        {job.userApplication ? (
                           <Badge className="h-10 px-6 bg-emerald-50 text-emerald-600 border-emerald-100 font-bold uppercase tracking-wider">
                              Applied: {job.userApplication.status}
                           </Badge>
                        ) : (
                           <Button
                              onClick={() => setShowForm(true)}
                              disabled={!job.canApply}
                              className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:bg-slate-400 disabled:shadow-none"
                           >
                              {job.canApply ? "Apply Now" : "Cannot Apply"}
                           </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-md">
                           <Bookmark className={`h-5 w-5 ${job.isBookmarked ? "fill-blue-600 text-blue-600" : "text-slate-400"}`} />
                        </Button>
                     </div>
                  </div>
                  {!job.canApply && !job.userApplication && (
                     <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-xs text-amber-700 font-medium">
                        <Info className="h-4 w-4" />
                        {organization?.id !== job.organization
                           .id
                           ? "You can only apply for jobs within your organization."
                           : "You cannot apply for this job posting."}
                     </div>
                  )}
               </div>

               <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                     <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        {job.locationCity || "Remote"}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Type</p>
                     <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salary (INR)</p>
                     <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <IndianRupee className="h-4 w-4 text-emerald-500" />
                        {job.showSalary ? `₹${(job.salaryMin || 0).toLocaleString()} - ₹${(job.salaryMax || 0).toLocaleString()}` : "Not Disclosed"}
                     </div>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posted</p>
                     <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {formatDistanceToNow(new Date(job.createdAt))} ago
                     </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         {/* Main Content */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
               <Card className="border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-8 space-y-6">
                     <div className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4">Description</h3>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap pl-5">{job.description}</div>
                     </div>

                     {job.requirements && (
                        <div className="space-y-3 pt-4">
                           <h3 className="text-lg font-bold text-slate-900 border-l-4 border-blue-600 pl-4">Requirements</h3>
                           <div className="text-slate-600 leading-relaxed whitespace-pre-wrap pl-5">{job.requirements}</div>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </div>

            <div className="space-y-6">
               <Card className="border-slate-200 shadow-sm rounded-xl bg-slate-900 text-white">
                  <CardContent className="p-6 space-y-4">
                     <h4 className="font-bold text-blue-400 uppercase tracking-widest text-[10px]">Quick Info</h4>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-2">
                           <span className="text-slate-400">Applications</span>
                           <span className="font-bold">{job.applicationCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm border-b border-slate-800 pb-2">
                           <span className="text-slate-400">Status</span>
                           <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold">Open</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-400">Remote</span>
                           <span className="font-bold">{job.isRemote ? "Yes" : "No"}</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-slate-200 shadow-sm rounded-xl">
                  <CardContent className="p-6 space-y-4">
                     <h4 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Safety Tips</h4>
                     <div className="space-y-2">
                        <div className="flex gap-2 items-start text-xs text-slate-600">
                           <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                           <p>Never pay for job applications or training.</p>
                        </div>
                        <div className="flex gap-2 items-start text-xs text-slate-600">
                           <Globe className="h-4 w-4 text-blue-500 shrink-0" />
                           <p>Verify the company website before applying.</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>

         {/* Application Modal Overlay */}
         {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
               <Card className="max-w-lg w-full rounded-2xl shadow-2xl border-none animate-in zoom-in-95 duration-200">
                  <CardContent className="p-8 space-y-6">
                     <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">Apply for this role</h2>
                        <p className="text-sm text-slate-500 font-medium">Submit your resume to complete your application.</p>
                     </div>

                     <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                           <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => setResume(e.target.files?.[0] || null)}
                           />
                           <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText className="h-6 w-6 text-blue-600" />
                           </div>
                           <p className="text-sm font-bold text-slate-900">{resume ? resume.name : "Click to upload Resume"}</p>
                           <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">PDF, DOCX up to 5MB</p>
                        </div>
                     </div>

                     <div className="flex gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-1 h-11 font-semibold text-slate-500">Cancel</Button>
                        <Button onClick={handleApply} disabled={applying || !resume} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                           {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
                        </Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}
      </div>
   );
}
