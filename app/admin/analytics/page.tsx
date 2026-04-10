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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  Download, 
  Users, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  UserPlus,
  RefreshCw,
  LayoutDashboard,
  Target,
  Zap,
  Activity,
  Globe,
  ChevronRight,
  Filter
} from "lucide-react";
import { useAuthProfile } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function AdminAnalyticsPage() {
    const { profile } = useAuthProfile();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const orgId = (profile as any)?.organizationId;

    const loadAnalytics = useCallback(async () => {
        if (!orgId) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/stats?organizationId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch {
            toast.error("Failed to synchronize intelligence nodes");
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (orgId) loadAnalytics();
    }, [orgId, loadAnalytics]);

    const userDistribution = stats ? [
        { name: 'ALUMNI', value: stats.users.byType.alumni },
        { name: 'STUDENTS', value: stats.users.byType.student },
        { name: 'STAFF', value: stats.users.byType.admin + stats.users.byType.super_admin }
    ] : [];

    const engagementDistribution = stats ? [
        { name: 'EVENTS', value: stats.events.total },
        { name: 'JOBS', value: stats.jobs.active },
        { name: 'NODES', value: Math.round(stats.connections.total / 10) },
        { name: 'MENTORSHIP', value: stats.mentorship.totalRequests }
    ] : [];

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-7xl mx-auto px-6 space-y-10 animate-in fade-in duration-700">
            {/* Intelligence Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Matrix Intelligence</span>
                      <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Behavioral Audit Cycle</span>
                   </div>
                   <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Intelligence</h1>
                   <p className="text-slate-500 font-medium mt-1">Nodal behavior patterns and growth telemetry across the ecosystem.</p>
                </div>
                <div className="flex gap-3">
                    <Select defaultValue="30days">
                        <SelectTrigger className="w-44 h-11 rounded-xl border-none shadow-sm bg-white dark:bg-slate-900 font-black text-[10px] uppercase tracking-widest px-6">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="7days" className="text-[10px] font-black uppercase tracking-widest">Last 7 Cycles</SelectItem>
                            <SelectItem value="30days" className="text-[10px] font-black uppercase tracking-widest">Last 30 Cycles</SelectItem>
                            <SelectItem value="quarter" className="text-[10px] font-black uppercase tracking-widest">Quarterly Audit</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="h-11 rounded-xl font-bold text-slate-400 px-6">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            {/* Pulse Stats Matrix */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Growth Velocity", value: `${stats?.users?.growthRate || 0}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Engagement Hub", value: `${stats?.users?.engagementRate || 0}%`, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Synergy Index", value: stats?.connections?.avgConnectionsPerUser?.toFixed(1) || "0", icon: UserPlus, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Yield Pulse", value: `$${(stats?.financial?.totalDonations || 0).toLocaleString()}`, icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Distribution Protocol */}
                <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                    <CardHeader className="px-0 pt-0 pb-10">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                              <Users className="h-5 w-5 text-indigo-600" />
                           </div>
                           <div>
                              <CardTitle className="text-lg font-bold uppercase italic italic tracking-tighter">Identity Distribution</CardTitle>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Nodal allocation by institutional role.</p>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Engagement Nexus */}
                <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                    <CardHeader className="px-0 pt-0 pb-10">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                              <Target className="h-5 w-5 text-emerald-600" />
                           </div>
                           <div>
                              <CardTitle className="text-lg font-bold uppercase italic italic tracking-tighter">Engagement Nexus</CardTitle>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inter-module interaction density.</p>
                           </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                           <div className="h-[280px] w-full md:w-1/2">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie
                                          data={engagementDistribution}
                                          dataKey="value"
                                          cx="50%" cy="50%"
                                          innerRadius={70}
                                          outerRadius={95}
                                          paddingAngle={10}
                                          cornerRadius={12}
                                      >
                                          {engagementDistribution.map((_, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                          ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', padding: '16px' }} />
                                  </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="flex flex-col gap-4 w-full md:w-1/2">
                               {engagementDistribution.map((e, i) => (
                                   <div key={e.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-white transition-all group">
                                       <div className="flex items-center gap-3">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{e.name}</span>
                                       </div>
                                       <span className="text-sm font-bold italic tracking-tighter text-slate-900">{e.value} Nodes</span>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Matrix */}
            <div className="grid grid-cols-1 gap-10">
               <Card className="border-none shadow-sm rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10">
                   <CardHeader className="px-0 pt-0 pb-10">
                      <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                 <Activity className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                 <CardTitle className="text-lg font-bold uppercase italic italic tracking-tighter">Market Performance Matrix</CardTitle>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Opportunity vector acquisition telemetry.</p>
                              </div>
                           </div>
                           <Button variant="ghost" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50">
                              Full Dataset <ChevronRight className="h-3 w-3 ml-2" />
                           </Button>
                      </div>
                   </CardHeader>
                   <CardContent className="px-0 h-[350px]">
                       <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={stats?.jobs?.topJobs || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                               <defs>
                                   <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                       <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                   </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} hide />
                               <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                               <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', padding: '16px' }} />
                               <Area type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
                           </AreaChart>
                       </ResponsiveContainer>
                   </CardContent>
               </Card>
            </div>

            <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
               <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Intelligence Governor v1.0.4 • Analytics Core</p>
            </footer>
        </div>
    );
}