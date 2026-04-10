"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { Loading } from "@/components/ui/loading";
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
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AvatarImage } from "@radix-ui/react-avatar";

export default function ProfilePage() {
    const { profile, loading } = useAuthProfile();
    const router = useRouter();

    if (loading) {
        return (
           <div className="flex h-[60vh] items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
           </div>
        );
    }

    if (!profile) {
        return (
            <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
               <ShieldCheck className="h-12 w-12 text-slate-100 mx-auto" />
               <div className="space-y-2">
                  <h1 className="text-xl font-bold italic uppercase tracking-tighter">Null Identity</h1>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">No institutional identifier detected for the current session.</p>
               </div>
               <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/auth/complete-profile")}>
                  Initialize Profile
               </Button>
            </div>
        );
    }

    const professional = profile.professional || profile.metadata?.professional || {};
    const social = profile.social || profile.metadata?.social || {};
    const skills = Array.isArray(profile.skills) ? profile.skills : Object.keys(profile.skills || {});

    return (
        <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
            {/* Premium Profile Header */}
            <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden relative">
                <div className="h-48 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="absolute top-8 right-8 z-10">
                      <Button className="bg-white/10 hover:bg-white/20 border-none text-white backdrop-blur-xl rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 shadow-xl" onClick={() => router.push("/dashboard/profile/edit")}>
                         <Edit className="h-4 w-4 mr-2" /> Modify Profile
                      </Button>
                   </div>
                   <div className="absolute -bottom-1 w-full h-24 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent"></div>
                </div>
                <div className="px-12 -mt-20 relative z-20 flex flex-col items-center sm:items-start text-center sm:text-left">
                   <Avatar className="h-40 w-40 rounded-[2.5rem] border-8 border-white dark:border-slate-900 shadow-2xl group-hover:scale-105 transition-transform">
                      <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
                      <AvatarFallback className="bg-slate-900 text-white font-black text-4xl leading-none">{profile.fullName?.[0]}</AvatarFallback>
                   </Avatar>
                   <div className="mt-8 space-y-2 pb-12 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{profile.fullName}</h1>
                            <div className="flex flex-wrap items-center gap-4 mt-2">
                               <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg">
                                  {profile.userType?.toUpperCase() || "ALUMNI NODE"}
                               </Badge>
                               <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                  <MapPin className="h-3.5 w-3.5 mr-2 text-slate-300" />
                                  {profile.location || "Global Network"}
                               </div>
                               <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                  <Mail className="h-3.5 w-3.5 mr-2 text-slate-300" />
                                  {profile.email}
                               </div>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            {social.linkedin_url && (
                              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => window.open(social.linkedin_url, '_blank')}>
                                 <Linkedin className="h-5 w-5" />
                              </Button>
                            )}
                            {social.github_url && (
                              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-900 hover:bg-slate-200" onClick={() => window.open(social.github_url, '_blank')}>
                                 <Github className="h-5 w-5" />
                              </Button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Identity sidebar */}
               <div className="space-y-8">
                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                     <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-purple-600" />
                           </div>
                           <div>
                              <CardTitle className="text-base font-bold uppercase tracking-tight italic">Academics</CardTitle>
                              <CardDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Institutional Credentials</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8 space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-50">
                           <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{profile.degree || "Advanced Degree"}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{profile.details?.major || "Scientific Study"}</p>
                           <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                              <Calendar className="h-4 w-4 text-slate-300" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class of {profile.graduation_year || "2024"}</span>
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                     <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                              <Award className="h-5 w-5 text-amber-600" />
                           </div>
                           <div>
                              <CardTitle className="text-base font-bold uppercase tracking-tight italic">Status</CardTitle>
                              <CardDescription className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Identity Load</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                           <ShieldCheck className="h-5 w-5 text-emerald-600" />
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Member</span>
                        </div>
                     </CardContent>
                  </Card>
               </div>

               {/* Bio/Experience Core */}
               <div className="lg:col-span-2 space-y-8">
                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
                     <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                        <CardTitle className="text-xl font-bold uppercase tracking-tight italic">Narrative</CardTitle>
                        <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core personal and professional identity.</CardDescription>
                     </CardHeader>
                     <CardContent className="p-8">
                        <p className="text-xs font-bold font-medium text-slate-500 leading-loose italic">
                           "{profile.bio || "No biographical data nodes found for this identity identifier."}"
                        </p>
                     </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                     <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-indigo-600" />
                           </div>
                           <div>
                              <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Experience Matrix</CardTitle>
                              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Professional career telemetry.</CardDescription>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="p-8 space-y-6">
                        {professional.company ? (
                           <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all border border-transparent hover:border-slate-50">
                              <div className="flex items-center gap-5">
                                 <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                                    <Briefcase className="h-6 w-6" />
                                 </div>
                                 <div>
                                    <p className="text-base font-bold text-slate-900 uppercase italic leading-none">{professional.current_position || "Elite Position"}</p>
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1.5">{professional.company || "Confidential Org"}</p>
                                 </div>
                              </div>
                              <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] px-2 rounded-lg tracking-widest uppercase italic">{professional.industry || "Market Node"}</Badge>
                           </div>
                        ) : (
                           <div className="p-8 text-center bg-slate-50 rounded-[2rem]">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-loose">No professional experience telemetry found for this identifier.</p>
                           </div>
                        )}
                     </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                     <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                        <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Skillset Node</CardTitle>
                     </CardHeader>
                     <CardContent className="p-8">
                        <div className="flex flex-wrap gap-2">
                           {skills.length > 0 ? skills.map((skill: string) => (
                              <Badge key={skill} className="px-5 py-2.5 bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-sm transition-all italic">
                                 {skill}
                              </Badge>
                           )) : (
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Zero skills identifiers found.</p>
                           )}
                        </div>
                     </CardContent>
                  </Card>
               </div>
            </div>

            <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Identity Authentication Engine v1.1.2 • Verified Node Directory</p>
            </footer>
        </div>
    );
}
