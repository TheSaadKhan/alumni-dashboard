"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  ArrowUpRight,
  UserPlus,
  Rocket,
  Sparkles,
  ArrowRight,
  UserCircle,
  GraduationCap,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Trophy,
  Target,
  Plus,
  Settings
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { profile, organization, loading } = useAuthProfile();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingStats(true);
      setLoadingRecs(true);
      
      const [statsRes, recsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/recommendations")
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      
      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecommendations(recsData.recommendations || []);
      }
    } catch (error) {
       toast.error("Failed to synchronize hub data");
    } finally {
      setLoadingStats(false);
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.onboardingCompleted) {
      fetchDashboardData();
    }
  }, [profile, fetchDashboardData]);

  useEffect(() => {
    if (!loading && !profile?.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
     return (
        <div className="flex h-[60vh] items-center justify-center">
           <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
        </div>
     );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Header Context */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Operational Overview</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{profile.userType} level</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {profile.fullName?.split(' ')[0]}
           </h1>
           <p className="text-slate-500 font-medium mt-1">
              {profile.userType === "alumni" 
                ? "Your influence is shaping the next generation." 
                : "Your network is your bridge to excellence."}
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6" onClick={fetchDashboardData}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} /> Sync
           </Button>
           <Button 
             className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10"
             onClick={() => router.push(profile.userType === "alumni" ? "/dashboard/jobs/new" : "/dashboard/mentorship")}
           >
              {profile.userType === "alumni" ? <Plus className="h-4 w-4 mr-2" /> : <Target className="h-4 w-4 mr-2" />}
              {profile.userType === "alumni" ? "Publish Job" : "Seek Advice"}
           </Button>
        </div>
      </header>

      {/* Persistence Warnings */}
      {profile.userType === "super_admin" && !organization && (
        <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] p-8 border-l-4 border-amber-500">
           <div className="flex items-center gap-6">
              <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                 <ShieldAlert className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                 <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 italic uppercase tracking-tighter">Organizational Void Detected</h2>
                 <p className="text-sm text-amber-700 dark:text-amber-300/80 font-medium leading-relaxed">System initialization requires an active organization node. Please establish your base infrastructure.</p>
              </div>
              <Button onClick={() => router.push("/organization/setup")} className="h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 shadow-2xl shadow-amber-600/20">
                 Establish Organization
              </Button>
           </div>
        </Card>
      )}

      {/* Performance Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Network Density", value: stats?.network?.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Careers Found", value: stats?.career?.savedJobs || 0, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Events Stream", value: stats?.events?.upcoming || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Relay Inbox", value: stats?.notifications?.unread || 0, icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] hover:translate-y-[-4px] transition-all duration-300 cursor-default group">
             <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                   <div className={`${stat.bg} h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                   </div>
                   <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="h-3 w-3 text-slate-400" />
                   </div>
                </div>
                <div className="space-y-1">
                   <p className="text-3xl font-bold tracking-tighter">
                      {loadingStats ? "..." : stat.value.toLocaleString()}
                   </p>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Recommended Stream */}
         <Card className="xl:col-span-2 border-none shadow-sm rounded-[2.5rem] p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl">
           <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle className="text-xl font-bold">Recommended Assets</CardTitle>
                    <CardDescription className="text-xs font-semibold uppercase tracking-widest mt-1">Curated based on your activity node.</CardDescription>
                 </div>
                 <Button variant="ghost" className="h-10 rounded-xl font-bold text-xs uppercase tracking-[0.2em] text-blue-600 hover:bg-blue-50">
                    Explore All <ArrowRight className="h-3.5 w-3.5 ml-2" />
                 </Button>
              </div>
           </CardHeader>
           <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                 {loadingRecs ? (
                   Array(3).fill(0).map((_, i) => (
                      <div key={i} className="h-24 w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                   ))
                 ) : recommendations.length > 0 ? (
                   recommendations.map((item, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-5 rounded-3xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 group hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none cursor-pointer border border-transparent hover:border-slate-50 dark:hover:border-slate-800"
                        onClick={() => router.push(item.href)}
                      >
                         <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center p-2 shadow-sm border border-slate-50 dark:border-slate-800 group-hover:scale-105 transition-transform">
                               <img src={item.logo} alt={item.company} className="h-full w-full object-contain filter dark:invert" onError={(e) => (e.currentTarget.src = "/assets/image/placeholder.png")} />
                            </div>
                            <div className="space-y-1">
                               <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">{item.name}</p>
                               <div className="flex items-center gap-2">
                                  <Badge className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-none px-2 h-5">
                                     {item.type}
                                  </Badge>
                                  <span className="text-xs text-slate-300">•</span>
                                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.company}</p>
                               </div>
                            </div>
                         </div>
                         <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-[-10px]">
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                         </div>
                      </div>
                   ))
                 ) : (
                    <div className="py-20 text-center flex flex-col items-center">
                       <Sparkles className="h-10 w-10 text-slate-200 mb-4" />
                       <h4 className="text-lg font-bold italic uppercase tracking-tighter">Compiling Stream</h4>
                       <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2 max-w-xs leading-loose">Analyzing network nodes to optimize your feed efficiency.</p>
                    </div>
                 )}
              </div>
           </CardContent>
         </Card>

         <div className="space-y-8">
            {/* Achievement / Goal Node */}
            <Card className="border-none shadow-sm rounded-[2.5rem] p-8 bg-slate-900 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                  <Trophy className="h-32 w-32" />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center px-1">
                        <UserCircle className="h-5 w-5 text-white" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-[.3em]">Identity Progress</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-3xl font-bold italic tracking-tighter leading-none">Complete {stats?.profile?.completeness || 0}%</p>
                     <Progress value={stats?.profile?.completeness || 0} className="h-1.5 bg-white/10" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">System verification level 2. Update your credentials to unlock Tier 3 network access.</p>
                  <Button className="w-full h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/dashboard/profile")}>
                     Upgrade Profile
                  </Button>
               </div>
            </Card>

            {/* Quick Link Matrix */}
            <Card className="border-none shadow-sm rounded-[2.5rem] p-8">
               <h4 className="text-xs font-black uppercase tracking-[.3em] mb-8 text-slate-300 border-b border-slate-50 pb-4">Shortcuts</h4>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Inbox", icon: MessageSquare, path: "/dashboard/messages", color: "text-amber-500", bg: "bg-amber-50" },
                    { label: "Network", icon: Users, path: "/dashboard/network", color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Jobs", icon: Briefcase, path: "/dashboard/jobs", color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "Settings", icon: Settings, path: "/dashboard/settings", color: "text-slate-500", bg: "bg-slate-50" },
                  ].map((link, idx) => (
                     <button 
                        key={idx}
                        onClick={() => router.push(link.path)}
                        className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50"
                     >
                        <div className={`h-10 w-10 rounded-xl ${link.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                           <link.icon className={`h-5 w-5 ${link.color}`} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{link.label}</span>
                     </button>
                  ))}
               </div>
            </Card>
         </div>
      </div>

      <footer className="pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.4em]">Integrated Hub Alpha v1.0.4</p>
         </div>
         <div className="flex gap-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Core Status: Operational</span>
         </div>
      </footer>
    </div>
  );
}
