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
  PieChart, 
  Pie, 
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  Download, 
  Users, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  Zap,
  Activity,
  ArrowUpRight,
  Target
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
import { Skeleton } from "@/components/ui/skeleton";
import { sessionGet, sessionSet } from "@/lib/cache";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function AdminAnalyticsPage() {
    const { profile } = useAuthProfile();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const orgId = profile?.organizationId;

    const loadAnalytics = useCallback(async (silent = false) => {
        if (!orgId) return;
        if (!silent) {
            const cached = sessionGet<any>(`admin_analytics_${orgId}`);
            if (cached) { setStats(cached); setLoading(false); }
            else setLoading(true);
        }
        try {
            const res = await fetch(`/api/admin/stats?organizationId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                sessionSet(`admin_analytics_${orgId}`, data.stats, 10 * 60 * 1000); // 10 min cache
            }
        } catch {
            toast.error("Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (orgId) loadAnalytics();
    }, [orgId, loadAnalytics]);

    const userDistribution = stats ? [
        { name: 'Alumni', value: stats.users.byType.alumni },
        { name: 'Students', value: stats.users.byType.student },
        { name: 'Admins', value: stats.users.byType.admin + stats.users.byType.super_admin }
    ] : [];

    const engagementDistribution = stats ? [
        { name: 'Events', value: stats.events.total },
        { name: 'Jobs', value: stats.jobs.active },
        { name: 'Mentorship', value: stats.mentorship.totalRequests || 0 }
    ] : [];

    if (loading && !stats) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 rounded-xl" />
                        <Skeleton className="h-4 w-64 rounded-lg" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] rounded-3xl" />
                    <Skeleton className="h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
                   <p className="text-slate-500 font-medium text-sm">Institutional growth and engagement insights.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select defaultValue="30days">
                        <SelectTrigger className="h-10 w-40 rounded-xl bg-white shadow-sm border-slate-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100">
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="year">Past Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => loadAnalytics()} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Growth", value: `${stats?.users?.growthRate || 0}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Engagement", value: `${stats?.users?.engagementRate || 0}%`, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Network Avg", value: stats?.connections?.avgConnectionsPerUser?.toFixed(1) || "0", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Raised", value: `$${(stats?.financial?.totalAmount || 0).toLocaleString()}`, icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((s, i) => (
                   <Card key={i} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
                     <CardContent className="p-6 flex items-center gap-4">
                       <div className={`${s.bg} p-3 rounded-2xl`}>
                         <s.icon className={`h-5 w-5 ${s.color}`} />
                       </div>
                       <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                         <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
                       </div>
                     </CardContent>
                   </Card>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-2">
                    <CardHeader className="px-6 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-900">Member Distribution</CardTitle>
                        <CardDescription className="text-xs font-medium">Breakdown by institutional role.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-2">
                    <CardHeader className="px-6 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-900">Engagement Mix</CardTitle>
                        <CardDescription className="text-xs font-medium">Activity across different modules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-center gap-6 h-[280px]">
                           <div className="h-full w-full sm:w-1/2">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie
                                          data={engagementDistribution}
                                          dataKey="value"
                                          cx="50%" cy="50%"
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={8}
                                      >
                                          {engagementDistribution.map((_, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                      </Pie>
                                      <Tooltip />
                                  </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="flex flex-col gap-2 w-full sm:w-1/2">
                               {engagementDistribution.map((e, i) => (
                                   <div key={e.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                       <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{e.name}</span>
                                       </div>
                                       <span className="text-xs font-bold text-slate-900">{e.value}</span>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Activity Trend */}
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-2">
                <CardHeader className="px-6 pb-2 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-900">System Activity Trend</CardTitle>
                        <CardDescription className="text-xs font-medium">Interactions and engagement over time.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50">
                        View Detailed Report <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.jobs?.topJobs || []}>
                            <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="title" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="applications" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}