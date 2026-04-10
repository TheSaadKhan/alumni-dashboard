"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Download,
  MessageSquare,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  Heart,
  Network,
  Zap,
  Globe,
  Plus
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

// Dashboard Data Types
interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    activeLast30Days: number;
    growthRate: number;
    engagementRate: number;
    byType: {
      alumni: number;
      student: number;
      admin: number;
      super_admin: number;
    };
  };
  events: {
    total: number;
    upcoming: number;
    attendanceRate: number;
  };
  jobs: {
    active: number;
    pending: number;
    totalApplications: number;
    topJobs: Array<{
        id: string;
        title: string;
        applications: number;
        views: number;
    }>;
  };
  content: {
    totalPosts: number;
    postsThisMonth: number;
    avgCommentsPerPost: number;
  };
  mentorship: {
    totalRequests: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  connections: {
    total: number;
    newThisMonth: number;
    avgConnectionsPerUser: number;
  };
  financial: {
    totalDonations: number;
    donationsThisMonth: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityLabel: string;
    createdAt: string;
    actor: {
      fullName: string;
      avatarUrl?: string;
    };
  }>;
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { profile } = useAuthProfile();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const orgId = profile?.organizationId;

  const loadDashboard = useCallback(async (isRefreshing = false) => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);

      const res = await fetch(`/api/admin/stats?organizationId=${orgId}`, {
        cache: "no-store",
      });

      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        if (isRefreshing) toast.success("Refreshed successfully");
      }
    } catch (err: any) {
      console.error("Dashboard failed:", err);
      toast.error("Failed to synchronize intelligence core");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadDashboard();
    else if (profile !== null) setLoading(false);
  }, [orgId, profile, loadDashboard]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-200" />
      </div>
    );
  }

  if (!orgId && profile) {
     return (
       <div className="container py-20 px-6">
          <Card className="max-w-xl mx-auto border-none shadow-sm rounded-[3rem] bg-white/60 backdrop-blur-xl text-center p-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="h-20 w-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <ShieldCheck className="h-10 w-10 text-blue-500" />
             </div>
             <div className="flex justify-center items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Institutional Verification</span>
             </div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Node Setup Required</h2>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] leading-relaxed mb-10 max-w-sm mx-auto">Deploy your institution platform to access the centralized administrative command centre.</p>
             <Button onClick={() => router.push("/organization/setup")} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 font-black uppercase tracking-widest text-xs">
                Initialize Hub Protocol
             </Button>
          </Card>
       </div>
     );
  }

  const distributionData = [
    { name: "ALUMNI", value: stats?.users?.byType?.alumni || 0 },
    { name: "STUDENTS", value: stats?.users?.byType?.student || 0 },
    { name: "GOVERNORS", value: (stats?.users?.byType?.admin || 0) + (stats?.users?.byType?.super_admin || 0) },
  ];

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
      {/* COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Central Command Hub</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Temporal Status: Online</span>
           </div>
           <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Administrative Intelligence</h1>
           <p className="text-slate-500 font-medium text-sm mt-1">Hello, Chief {user?.firstName}. System telemetry is optimized and nodes are synchronized.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="ghost" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-white shadow-sm" onClick={() => loadDashboard(true)} disabled={refreshing}>
             <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Sync Core
           </Button>
           <Button className="h-11 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10 text-[10px] font-black uppercase tracking-widest">
              <Plus className="h-4 w-4 mr-2" /> Quick Dispatch
           </Button>
        </div>
      </div>

      {/* PULSE KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Identity Nodes", value: stats?.users?.total?.toLocaleString() || "0", sub: `+${stats?.users?.newThisMonth || 0} RECENT`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Synergy Yield", value: `${stats?.users?.engagementRate || 0}%`, sub: "ACTIVE PROTOCOLS", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Global Mesh", value: stats?.connections?.total?.toLocaleString() || "0", sub: "NETWORK LINKS", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Asset Reserve", value: `$${(stats?.financial?.totalDonations || 0).toLocaleString()}`, sub: "AGGREGATE YIELD", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
            <CardContent className="p-8">
               <div className="flex items-start justify-between mb-6">
                  <div className={`h-12 w-12 rounded-2xl ${kpi.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                     <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{kpi.label}</p>
                  <div className="text-3xl font-black italic tracking-tighter text-slate-900">{kpi.value}</div>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest italic pt-1">{kpi.sub}</p>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* NETWORK DISTRIBUTION */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10 overflow-hidden relative group">
           <div className="flex items-center justify-between mb-12">
              <div>
                 <h3 className="text-xl font-black italic uppercase tracking-tighter">Identity Distribution</h3>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Nodal population by affiliation</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors">
                 <LayoutDashboard className="h-5 w-5" />
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={distributionData}>
                    <defs>
                       <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1', letterSpacing: '0.1em' }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} />
                    <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 20px' }} labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }} itemStyle={{ fontSize: '12px', fontWeight: 700, fontStyle: 'italic' }} />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 8, 8]} barSize={40} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </Card>

        {/* PERFORMANCE RADIUS */}
        <Card className="border-none shadow-sm rounded-[3rem] bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/10 blur-[80px] rounded-full -translate-y-10 translate-x-10 pointer-events-none"></div>
            
            <div className="text-center relative z-10">
               <h3 className="text-xl font-black italic uppercase tracking-tighter">System Yield</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 italic">Institutional verification rate</p>
            </div>

            <div className="relative h-44 w-44 mx-auto flex items-center justify-center my-8 z-10">
               <div className="absolute inset-0 rounded-full border-[10px] border-white/5"></div>
               <div className="text-center">
                  <div className="text-5xl font-black italic tracking-tighter mb-1">{stats?.mentorship?.completionRate || 0}%</div>
                  <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">VERIFIED CYCLES</div>
               </div>
               <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="88" cy="88" r="83" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray={`${(stats?.mentorship?.completionRate || 0) * 5.2} 1000`} strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
               </svg>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 italic">Core Load</span>
                  <span className="text-blue-400">{stats?.mentorship?.completionRate}% SYNC</span>
               </div>
               <Progress value={stats?.mentorship?.completionRate || 0} className="h-2 bg-white/5" />
            </div>
        </Card>
      </div>

      {/* QUICK ORCHESTRA LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Identity Registry", icon: Users, sub: "MANAGE ALL NODES", path: "/admin/users", bg: "bg-blue-50/50" },
           { label: "Career Nexus", icon: Briefcase, sub: `${stats?.jobs?.pending || 0} PENDING AUDITS`, path: "/admin/jobs", bg: "bg-indigo-50/50" },
           { label: "Philanthropy Hub", icon: Heart, sub: "FINANCIAL LEDGER", path: "/admin/donations", bg: "bg-rose-50/50" },
           { label: "Shield Protocol", icon: ShieldCheck, sub: "SECURITY MESH", path: "/admin/settings", bg: "bg-emerald-50/50" },
         ].map((link, i) => (
            <button 
              key={i} 
              onClick={() => router.push(link.path)}
              className={`flex items-center gap-5 p-6 rounded-[2rem] bg-white shadow-sm border border-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group`}
            >
              <div className={`h-12 w-12 flex items-center justify-center ${link.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                 <link.icon className="h-6 w-6 text-slate-600" />
              </div>
              <div className="min-w-0 flex-1">
                 <p className="text-[11px] font-black uppercase tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors">{link.label}</p>
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 truncate">{link.sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-100 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </button>
         ))}
      </div>

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Intelligence Hub v2.1.0 • Institutional Oversight</p>
      </footer>
    </div>
  );
}