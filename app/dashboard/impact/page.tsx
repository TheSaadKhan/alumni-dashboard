"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Users, 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Award, 
  Loader2, 
  DollarSign, 
  Calendar, 
  BookOpen,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  HandHeart,
  Globe
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback } from "@/components/ui/avatar";

export default function ImpactPage() {
  const { profile, organization } = useAuthProfile();
  const [loading, setLoading] = useState(true);
  const [impactStats, setImpactStats] = useState<any>(null);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [contributors, setContributors] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);

  const fetchImpactData = useCallback(async () => {
    if (!organization?.id) return;
    try {
      setLoading(true);
      const [statsRes, initiativesRes, contributorsRes, storiesRes] = await Promise.all([
        fetch(`/api/impact/stats?organizationId=${organization.id}`),
        fetch(`/api/impact/initiatives?organizationId=${organization.id}`),
        fetch(`/api/impact/contributors?organizationId=${organization.id}`),
        fetch(`/api/impact/stories?organizationId=${organization.id}`),
      ]);

      if (statsRes.ok) setImpactStats((await statsRes.json()).stats);
      if (initiativesRes.ok) setInitiatives((await initiativesRes.json()).initiatives);
      if (contributorsRes.ok) setContributors((await contributorsRes.json()).contributors);
      if (storiesRes.ok) setStories((await storiesRes.json()).stories);
    } catch (error) {
      toast.error("Failed to synchronize philanthropy nodes");
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (organization) fetchImpactData();
  }, [organization, fetchImpactData]);

  if (loading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Philanthropy Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-[0.3em]">Philanthropy Hub</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Institutional Impact</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Our Collective Impact</h1>
           <p className="text-slate-500 font-medium mt-1">Witness how alumni synergy is accelerating institutional growth.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
             <RefreshCw className="h-4 w-4 mr-2" /> Sync Stats
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/10">
              <Heart className="h-4 w-4 mr-2" /> Contribute Now
           </Button>
        </div>
      </div>

      {/* Impact Pulse Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { label: "Capital Raised", value: `$${((impactStats?.totalDonations || 0) / 1000).toFixed(0)}K`, icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Goal Fidelity", value: `${Math.round(((impactStats?.totalDonations || 0) / (impactStats?.donationGoal || 1)) * 100)}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Talent Support", value: impactStats?.studentsSupported || 0, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Expertise Hub", value: impactStats?.mentorshipHours || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Forum Cycles", value: impactStats?.eventsHosted || 0, icon: Globe, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Active Synergy", value: impactStats?.volunteers || 0, icon: Award, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group">
            <CardContent className="p-6 text-center space-y-3">
              <div className={`${s.bg} h-12 w-12 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110 shadow-sm`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <div className="space-y-1">
                 <p className="text-2xl font-bold tracking-tighter">{s.value}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Initiatives */}
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
           <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <HandHeart className="h-5 w-5 text-blue-600" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Synergy Vectors</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing philanthropic campaigns.</CardDescription>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-8 space-y-10">
              {initiatives.map((item) => (
                <div key={item.id} className="group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase italic">{item.title}</h3>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-none bg-slate-100 text-slate-500">{item.category}</Badge>
                         </div>
                         <p className="text-xs font-medium text-slate-400 pr-10">{item.description}</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600 italic tracking-tighter">{item.progress}%</p>
                   </div>
                   <div className="space-y-3">
                      <Progress value={item.progress} className="h-1.5 bg-slate-50" />
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">${item.raised.toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">Acquired</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">Quota</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">${item.goal.toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                         <Users className="h-3.5 w-3.5 text-slate-300" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.donors} nodes contributing</span>
                      </div>
                      <Button variant="ghost" className="h-9 px-4 rounded-xl text-blue-600 font-bold uppercase tracking-widest text-[9px] hover:bg-blue-50">Transmit Intent</Button>
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
           <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Award className="h-5 w-5 text-rose-600" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold uppercase tracking-tight italic">Major Nodes</CardTitle>
                    <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Highest institutional impact contributors.</CardDescription>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-8">
              <div className="space-y-4">
                 {contributors.map((user, idx) => (
                    <div key={user.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all group border border-transparent hover:border-slate-50 hover:shadow-xl shadow-slate-200/40">
                       <div className="flex items-center gap-5">
                          <div className="relative">
                             <Avatar className="h-12 w-12 rounded-2xl border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-slate-900 text-white font-black text-xs">
                                   {user.isAnonymous ? "AN" : user.name.split(' ').map((n:any) => n[0]).join('')}
                                </AvatarFallback>
                             </Avatar>
                             {idx < 3 && <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 text-white flex items-center justify-center border-2 border-white shadow-lg"><Star className="h-2.5 w-2.5" /></div>}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 uppercase italic leading-none">{user.isAnonymous ? "Restricted Identity" : user.name}</p>
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">Batch of {user.batch || "Unknown"}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-bold text-rose-600 italic tracking-tighter">${user.amount.toLocaleString()}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1 leading-none">Synergy Load</p>
                       </div>
                    </div>
                 ))}
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Narrative Stream */}
      <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden">
         <div className="p-12 text-center border-b border-slate-50">
            <h2 className="text-2xl font-bold uppercase tracking-tighter italic">Narrative Stream</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Active impact validation from current beneficiaries.</p>
         </div>
         <CardContent className="p-12 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               {stories.map((story) => (
                  <div key={story.id} className="space-y-6 group">
                     <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {story.category === "scholarship" ? <GraduationCap className="h-7 w-7 text-blue-500" /> : <Users className="h-7 w-7 text-purple-500" />}
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-lg font-bold uppercase italic tracking-tight">{story.title}</h4>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{story.category}</p>
                     </div>
                     <p className="text-xs font-medium text-slate-400 leading-loose italic pr-4">"{story.content}"</p>
                     <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                        <Avatar className="h-8 w-8 rounded-xl ring-2 ring-white">
                           <AvatarFallback className="bg-slate-100 text-slate-400 text-[9px] font-black">{story.author[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                           <p className="text-[10px] font-bold text-slate-900 uppercase italic">{story.author}</p>
                           <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{story.authorType}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Impact Engine v1.0.8 • Philanthropic Nexus</p>
      </footer>
    </div>
  );
}

function Star({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
         <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
   );
}