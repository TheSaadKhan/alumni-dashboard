"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    GraduationCap,
    Briefcase,
    Globe,
    Linkedin,
    Github,
    Twitter,
    Mail,
    Calendar,
    Edit,
    ExternalLink,
    RefreshCw,
    ChevronRight,
    Award,
    ShieldCheck,
    Loader2,
    Code,
    Sparkles,
    User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarImage } from "@radix-ui/react-avatar";

export default function ProfilePage() {
    const { profile, organization, loading } = useAuthProfile();
    const router = useRouter();

    const slug = organization?.slug || "default";

    if (loading) {
        return (
           <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="text-slate-500 font-medium">Synchronizing identity profile...</p>
           </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-md mx-auto py-24 px-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="p-8 bg-slate-50 rounded-[2.5rem] w-fit mx-auto border border-slate-100 shadow-inner">
                  <User className="h-12 w-12 text-slate-300" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Identity Required</h2>
                  <p className="text-slate-500 font-medium">Please initialize your professional presence to continue.</p>
               </div>
               <Button 
                  className="h-14 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-xl shadow-blue-500/25 transition-all hover:scale-105" 
                  onClick={() => router.push("/auth/complete-profile/member")}
               >
                  Complete Profile
               </Button>
            </div>
        );
    }

    const professional = profile.professional || profile.metadata?.professional || {};
    const social = profile.social || profile.metadata?.social || {};
    const skills = Array.isArray(profile.skills) ? profile.skills : Object.keys(profile.skills || {});

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-500">
            {/* Executive Profile Header */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden relative group">
                <div className="h-56 bg-slate-900 relative">
                   {/* Background Pattern */}
                   <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/40"></div>
                   
                   <div className="absolute top-8 right-8 z-10">
                      <Button 
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-xl rounded-xl font-bold text-xs uppercase tracking-widest h-11 px-6 transition-all" 
                        onClick={() => router.push(`/organization/${slug}/dashboard/profile/edit`)}
                      >
                         <Edit className="h-4 w-4 mr-2" /> Modify Profile
                      </Button>
                   </div>
                </div>
                <div className="px-10 -mt-24 relative z-20 flex flex-col md:flex-row items-end gap-8 pb-12">
                   <Avatar className="h-44 w-44 rounded-[2.5rem] border-[6px] border-white shadow-2xl transition-all group-hover:scale-[1.02]">
                      <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-4xl">{profile.fullName?.[0]}</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 space-y-4 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="space-y-1">
                            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{profile.fullName}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                               <Badge className="bg-blue-50 text-blue-600 border-none rounded-lg text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                                  {profile.userType?.toUpperCase() || "NETWORK MEMBER"}
                               </Badge>
                               <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  <MapPin className="h-3.5 w-3.5 mr-2" />
                                  {profile.location || "Global Node"}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center justify-center gap-3">
                            {social.linkedin_url && (
                              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" onClick={() => window.open(social.linkedin_url, '_blank')}>
                                 <Linkedin className="h-5 w-5" />
                              </Button>
                            )}
                            {social.github_url && (
                              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" onClick={() => window.open(social.github_url, '_blank')}>
                                 <Github className="h-5 w-5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                               <Mail className="h-5 w-5" />
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               {/* Sidebar Metrics */}
               <div className="space-y-10">
                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                           <GraduationCap className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 tracking-tight">Academic History</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Institutional Credentials</p>
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-sm font-bold text-slate-900">{profile.degree || "Bachelor of Science"}</p>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{profile.details?.major || "Scientific Study"}</p>
                           <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200/50">
                              <Calendar className="h-4 w-4 text-slate-300" />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class of {profile.graduationYear || profile.graduation_year || "2024"}</span>
                           </div>
                        </div>
                     </div>
                  </Card>

                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-8 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                           <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 tracking-tight">Identity Status</h3>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Verification</p>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-emerald-50 border border-emerald-100/50">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Verified Institutional Node</span>
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                     </div>
                  </Card>
               </div>

               {/* Bio/Experience Core */}
               <div className="lg:col-span-2 space-y-10">
                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 space-y-6">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Professional Narrative</h3>
                        <p className="text-sm font-medium text-slate-400 mt-1">Core summary of your career and institutional contributions.</p>
                     </div>
                     <div className="p-8 rounded-3xl bg-slate-50/50 border border-slate-100/50">
                        <p className="text-[15px] font-medium text-slate-600 leading-relaxed italic">
                           "{profile.bio || "No biographical intelligence found for this identifier."}"
                        </p>
                     </div>
                  </Card>

                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                           <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Career Experience</h3>
                           <p className="text-sm font-medium text-slate-400">Professional trajectory and market alignments.</p>
                        </div>
                     </div>
                     <div className="space-y-6">
                        {professional.company ? (
                           <div className="flex flex-col md:flex-row md:items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 hover:bg-white transition-all border border-transparent hover:border-blue-50 group">
                              <div className="flex items-center gap-6">
                                 <div className="h-16 w-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                                    <Briefcase className="h-7 w-7" />
                                 </div>
                                 <div>
                                    <h4 className="text-lg font-bold text-slate-900 leading-tight">{professional.current_position || professional.currentTitle || "Executive Role"}</h4>
                                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1.5">{professional.company || professional.currentCompany || "Confidential Organization"}</p>
                                 </div>
                              </div>
                              <Badge className="bg-white text-slate-400 border border-slate-100 rounded-lg px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mt-4 md:mt-0">{professional.industry || "Global Market"}</Badge>
                           </div>
                        ) : (
                           <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No professional telemetry recorded</p>
                           </div>
                        )}
                     </div>
                  </Card>

                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden p-10 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                           <Code className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Core Competencies</h3>
                           <p className="text-sm font-medium text-slate-400">Verified skillsets and technical expertise nodes.</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {skills.length > 0 ? skills.map((skill: string) => (
                           <Badge key={skill} className="px-6 py-3 bg-slate-50 text-slate-500 border border-slate-100/50 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all cursor-default">
                              {skill}
                           </Badge>
                        )) : (
                           <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No skill identifiers mapped.</p>
                        )}
                     </div>
                  </Card>
               </div>
            </div>
        </div>
    );
}
