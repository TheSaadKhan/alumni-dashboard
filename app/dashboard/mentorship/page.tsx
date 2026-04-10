"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Target, 
  Users, 
  Calendar, 
  MessageCircle, 
  Star, 
  BookOpen, 
  GraduationCap, 
  Loader2,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Zap,
  Plus
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MentorshipPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuthProfile();
  const [activeTab, setActiveTab] = useState("mentors");
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorshipData = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const [mentorsRes, requestsRes] = await Promise.all([
        fetch("/api/mentorship?type=mentors"),
        fetch("/api/mentorship?type=requests")
      ]);
      if (mentorsRes.ok) setMentors((await mentorsRes.json()).mentors || []);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        const reqData = data.requests || { sent: [], received: [] };
        
        // Flatten and normalize sent/received requests
        const flattened = [
          ...(reqData.sent || []).map((r: any) => ({ ...r })),
          ...(reqData.received || []).map((r: any) => ({ 
            ...r, 
            mentee: r.student,
            mentorId: profile.id // Mark user as the mentor for received requests
          }))
        ];
        setRequests(flattened);
      }
    } catch (err) {
      toast.error("Failed to synchronize mentorship nodes");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchMentorshipData();
  }, [profile, fetchMentorshipData]);

  const handleRequestMentor = async (mentorId: string) => {
    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId,
          goals: "Professional development and career guidance",
          message: "I would like to request you as my mentor."
        })
      });
      if (res.ok) {
        toast.success("Mentorship request sent!");
        fetchMentorshipData();
      }
    } catch (err) {
      toast.error("Failed to transmit mentorship intent");
    }
  };

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  const stats = {
    totalMentors: mentors.length,
    activeMentorships: requests.filter(r => r.status === 'accepted').length,
    sessionsCompleted: 0,
    hoursMentored: 0
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Mentorship Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Knowledge Nexus</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stats.totalMentors} verified mentors</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Professional Mentorship</h1>
           <p className="text-slate-500 font-medium mt-1">Connect with industry veterans or guide the next generation of graduates.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Program Sync
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
              <Plus className="h-4 w-4 mr-2" /> Become a Mentor
           </Button>
        </div>
      </div>

      {/* Grid Pulse Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Elite Mentors", value: stats.totalMentors, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Links", value: stats.activeMentorships, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Knowledge Hours", value: stats.hoursMentored, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Pending Intents", value: requests.length, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-2xl transition-transform group-hover:scale-110 shadow-sm shadow-black/5`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tighter">{s.value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Protocol Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl w-fit">
        {[
          { id: "mentors", label: "Search Mentors" },
          { id: "my-mentorships", label: "Direct Connections" },
          { id: "apply", label: "Program Application" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-8 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Areas */}
      <div className="relative z-10">
        {activeTab === "mentors" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-slate-50 dark:hover:border-slate-800">
                 <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-end justify-center px-6 relative overflow-hidden group">
                    <div className="absolute top-4 right-4 z-10">
                       <Badge className="bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-black uppercase border-none text-emerald-600 tracking-widest shadow-sm">
                          {mentor.availableSlots > 0 ? `${mentor.availableSlots} SLOTS` : "FULL"}
                       </Badge>
                    </div>
                 </div>
                 <div className="px-6 -mt-10 relative z-10 flex flex-col items-center">
                    <Avatar className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl group-hover:scale-105 transition-transform">
                       <AvatarImage src={mentor.image} />
                       <AvatarFallback className="bg-slate-900 text-white font-black text-xl">{mentor.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="mt-4 text-center space-y-1">
                       <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase italic truncate max-w-[180px]">{mentor.name}</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none truncate max-w-[180px]">{mentor.title || "Elite Professional"}</p>
                    </div>
                 </div>
                 <CardContent className="p-8 pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                       <Star className="h-3.5 w-3.5 text-amber-400 fill-current" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{mentor.experience || 0} Years Experience</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                       {(mentor.skills || mentor.topics || []).slice(0, 3).map((skill: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-[9px] uppercase tracking-widest font-black py-1 px-2.5 bg-slate-50 dark:bg-slate-800 border-none text-slate-400 rounded-lg">
                             {skill}
                          </Badge>
                       ))}
                    </div>
                 </CardContent>
                 <CardFooter className="px-8 pb-8 pt-0 flex gap-3">
                    <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold uppercase tracking-widest text-[9px] border-none bg-slate-50 hover:bg-slate-100" onClick={() => router.push(`/dashboard/network/${mentor.id}`)}>
                       Identify
                    </Button>
                    <Button className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-500/10" onClick={() => handleRequestMentor(mentor.id)}>
                       Connect
                    </Button>
                 </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "my-mentorships" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {requests.map((req) => {
              const other = req.mentorId === profile?.id ? req.mentee : req.mentor;
              const isAccepted = req.status === 'accepted';
              return (
                <Card key={req.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300">
                   <CardHeader className="p-8 pb-4 flex flex-row items-center gap-4">
                      <Avatar className="h-14 w-14 rounded-2xl border-2 border-white shadow-sm">
                         <AvatarImage src={other?.avatarUrl} />
                         <AvatarFallback className="bg-slate-900 text-white font-black">{other?.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-base font-bold uppercase italic truncate">{other?.fullName}</h3>
                            <Badge className={`border-none font-black text-[9px] px-2 rounded-lg ${isAccepted ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                               {req.status.toUpperCase()}
                            </Badge>
                         </div>
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{req.mentorId === profile?.id ? "Institutional Mentee" : "Expert Mentor"}</p>
                      </div>
                   </CardHeader>
                   <CardContent className="px-8 pb-6 pt-2">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-50">
                         <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-2 flex items-center gap-2"><Target className="h-3 w-3" /> Targeted Goals</p>
                         <p className="text-xs font-medium text-slate-500 italic leading-relaxed line-clamp-2">"{req.goals}"</p>
                      </div>
                   </CardContent>
                   <CardFooter className="px-8 pb-8 pt-0 flex gap-3">
                      <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold uppercase tracking-widest text-[9px] border-none bg-slate-50 hover:bg-slate-100" onClick={() => router.push(`/dashboard/messages?userId=${other?.id}`)}>
                         <MessageCircle className="h-4 w-4 mr-2" /> Interface
                      </Button>
                      {isAccepted && (
                        <Button className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-500/10">
                           Schedule Cycle
                        </Button>
                      )}
                   </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "apply" && (
           <Card className="border-none shadow-sm rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="p-16 lg:p-24 flex flex-col items-center text-center space-y-8 relative z-10">
                 <div className="h-20 w-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="h-10 w-10 text-white" />
                 </div>
                 <div className="space-y-3">
                    <h2 className="text-3xl lg:text-5xl font-black uppercase italic tracking-tighter">Institutional Mentor</h2>
                    <p className="text-indigo-100 text-base lg:text-xl font-medium max-w-2xl leading-relaxed">Join the knowledge nexus as a verified mentor and contribute to the growth of students and young professionals within our institutional net.</p>
                 </div>
                 <div className="flex gap-4">
                    <Button className="h-14 px-12 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest text-xs shadow-2xl">Initialize Application</Button>
                    <Button variant="ghost" className="h-14 px-12 rounded-2xl border-none font-black uppercase tracking-widest text-xs text-white hover:bg-white/10">View Governance</Button>
                 </div>
              </div>
           </Card>
        )}
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Mentorship Node v1.0.4 • Knowledge Nexus</p>
      </footer>
    </div>
  );
}