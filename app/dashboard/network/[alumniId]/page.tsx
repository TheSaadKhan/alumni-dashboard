"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Briefcase, GraduationCap, Calendar, Mail, MessageCircle, Users, Award, Loader2, ArrowLeft, Info, Globe, Linkedin, Twitter, Github, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AlumniProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { profile: myProfile } = useAuthProfile();
  const alumniId = params.alumniId as string;

  const [alumni, setAlumni] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [alumniId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/profiles/${alumniId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setAlumni(data.profile);
    } catch (err) {
      toast.error("Failed to synchronize identity node");
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    router.push(`/dashboard/messages?userId=${alumniId}`);
  };

  if (loading) {
     return (
        <div className="flex h-[70vh] items-center justify-center">
           <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
        </div>
     );
  }

  if (!alumni) {
     return (
        <div className="container py-24 text-center space-y-8 max-w-sm mx-auto animate-in fade-in duration-700">
           <div className="h-16 w-16 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <Info className="h-8 w-8 text-rose-500" />
           </div>
           <div className="space-y-3">
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">Null Identity</h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose">The requested institutional identifier has been isolated or deactivated.</p>
           </div>
           <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/dashboard/network")}>
              Back to Matrix
           </Button>
        </div>
     );
  }

  const skills = alumni.skills ? (Array.isArray(alumni.skills) ? alumni.skills : Object.keys(alumni.skills)) : [];

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* Premium Profile Header */}
      <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden relative">
          <div className="h-48 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="absolute top-8 left-8 z-10">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl border-none text-white hover:bg-white/20 transition-all shadow-xl" onClick={() => router.back()}>
                   <ArrowLeft className="h-5 w-5" />
                </Button>
             </div>
             <div className="absolute -bottom-1 w-full h-24 bg-gradient-to-t from-white/90 dark:from-slate-900/90 to-transparent"></div>
          </div>
          <div className="px-12 -mt-20 relative z-20 flex flex-col items-center sm:items-start text-center sm:text-left">
             <Avatar className="h-40 w-40 rounded-[2.5rem] border-8 border-white dark:border-slate-900 shadow-2xl group-hover:scale-105 transition-transform">
                <AvatarImage src={alumni.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-slate-900 text-white font-black text-4xl leading-none">{alumni.full_name?.[0]}</AvatarFallback>
             </Avatar>
             <div className="mt-8 space-y-2 pb-12 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">{alumni.full_name}</h1>
                         {alumni.graduation_year && (
                           <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg">
                              BATCH {alumni.graduation_year}
                           </Badge>
                         )}
                      </div>
                      <div className="flex flex-wrap items-center gap-6">
                         <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            <Briefcase className="h-4 w-4 mr-2 text-slate-300" />
                            {alumni.headline || "ALUMNI NODE"}
                         </div>
                         <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            <MapPin className="h-4 w-4 mr-2 text-slate-300" />
                            {alumni.location || "GLOBAL NETWORK"}
                         </div>
                         <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                            <Mail className="h-4 w-4 mr-2 text-slate-300" />
                            {alumni.email}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <Button className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs" onClick={handleMessage}>
                         <MessageCircle className="h-4 w-4 mr-2" /> Interface
                      </Button>
                      <Button variant="outline" className="h-14 px-10 rounded-2xl border-none bg-slate-50 hover:bg-slate-100 font-black uppercase tracking-widest text-xs">
                         <Users className="h-4 w-4 mr-2" /> Connect
                      </Button>
                   </div>
                </div>
             </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* IDENTITY DETAILS */}
         <div className="lg:col-span-2 space-y-10">
            <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group">
               <CardHeader className="p-10 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                  <CardTitle className="text-xl font-black uppercase tracking-tight italic">Biographical Narrative</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core personal and professional identity details.</CardDescription>
               </CardHeader>
               <CardContent className="p-10">
                  <p className="text-sm font-bold font-medium text-slate-500 leading-relaxed italic">
                     "{alumni.bio || "No biographical data nodes found for this identity identifier."}"
                  </p>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
               <CardHeader className="p-10 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                  <CardTitle className="text-xl font-black uppercase tracking-tight italic">Skillset Matrix</CardTitle>
               </CardHeader>
               <CardContent className="p-10 flex flex-wrap gap-2.5">
                  {skills.length > 0 ? skills.map((skill: string, i: number) => (
                    <Badge key={i} className="px-5 py-2.5 bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white hover:shadow-sm transition-all italic">
                       {skill}
                    </Badge>
                  )) : (
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Zero skill nodes identified.</p>
                  )}
               </CardContent>
            </Card>

            {(alumni.degree || alumni.headline) && (
               <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="p-10 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
                     <CardTitle className="text-xl font-black uppercase tracking-tight italic">Nodal History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-8">
                     {alumni.degree && (
                        <div className="flex gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-50">
                           <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <GraduationCap className="h-7 w-7 text-indigo-600" />
                           </div>
                           <div className="min-w-0">
                             <h4 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">{alumni.degree}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class of {alumni.graduation_year}</p>
                           </div>
                        </div>
                     )}
                     {alumni.headline && (
                        <div className="flex gap-6 p-6 bg-slate-900 rounded-[2rem] text-white">
                           <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center shadow-sm">
                              <Briefcase className="h-7 w-7 text-white" />
                           </div>
                           <div className="min-w-0">
                             <h4 className="text-lg font-black italic uppercase tracking-tighter">{alumni.headline}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <Zap className="h-3 w-3 text-blue-400" />
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Market Presence</p>
                             </div>
                           </div>
                        </div>
                     )}
                  </CardContent>
               </Card>
            )}
         </div>

         {/* SIDEBAR PROTOCOLS */}
         <div className="space-y-10">
            {/* SOCIAL REACH */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-slate-300 border-b border-slate-50 pb-4">Social Reach</h4>
               <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Linkedin, color: "hover:bg-blue-50 hover:text-blue-600" },
                    { icon: Twitter, color: "hover:bg-slate-50 hover:text-slate-900" },
                    { icon: Github, color: "hover:bg-slate-50 hover:text-slate-950" },
                    { icon: Globe, color: "hover:bg-indigo-50 hover:text-indigo-600" },
                  ].map((s, i) => (
                    <Button key={i} variant="ghost" size="icon" className={`h-12 w-12 rounded-2xl bg-slate-50 text-slate-300 transition-all ${s.color}`}>
                       <s.icon className="h-5 w-5" />
                    </Button>
                  ))}
               </div>
            </Card>

            {/* SYNERGY STATS */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-10 text-center relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -translate-y-8 translate-x-8"></div>
               <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-1">
                     <p className="text-3xl font-black italic tracking-tighter">245</p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Connections</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-3xl font-black italic tracking-tighter">12</p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mutual</p>
                  </div>
               </div>
            </Card>

            {/* INSTITUTIONAL NODES */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden p-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-slate-300 border-b border-slate-50 pb-4">Institutional Presence</h4>
               <div className="space-y-6">
                  {alumni.organization_members?.map((m: any) => (
                    <div key={m.organizations.id} className="flex items-center gap-4 group cursor-pointer">
                      <Avatar className="h-11 w-11 rounded-xl group-hover:scale-110 transition-transform">
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black uppercase text-[10px]">
                          {m.organizations.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-blue-600 transition-colors uppercase italic">{m.organizations.name}</p>
                        <p className="text-[9px] text-slate-300 uppercase font-black tracking-widest">Verified Member</p>
                      </div>
                    </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Alumni Insight Matrix v1.4.0 • Verified Node Profile</p>
      </footer>
    </div>
  );
}