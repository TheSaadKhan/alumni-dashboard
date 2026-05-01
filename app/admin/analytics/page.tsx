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
  Target,
  Zap,
  Activity,
  ChevronRight
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
    const orgId = profile?.organizationId;

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
            toast.error("Failed to load analytics data");
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
        { name: 'Admin', value: stats.users.byType.admin + stats.users.byType.super_admin }
    ] : [];

    const engagementDistribution = stats ? [
        { name: 'Events', value: stats.events.total },
        { name: 'Jobs', value: stats.jobs.active },
        { name: 'Mentorship', value: stats.mentorship.totalRequests || 0 }
    ] : [];

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                   <p className="text-slate-500 mt-1">Institutional growth and engagement metrics at a glance.</p>
                </div>
                <div className="flex gap-3">
                    <Select defaultValue="30days">
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="quarter">Last Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadAnalytics}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Sync
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Growth Rate", value: `${stats?.users?.growthRate || 0}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Engagement", value: `${stats?.users?.engagementRate || 0}%`, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Avg. Connections", value: stats?.connections?.avgConnectionsPerUser?.toFixed(1) || "0", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Total Donations", value: `$${(stats?.financial?.totalAmount || 0).toLocaleString()}`, icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
                ].map((s, i) => (
                   <Card key={i}>
                     <CardContent className="p-6 flex items-center gap-4">
                       <div className={`${s.bg} p-3 rounded-xl`}>
                         <s.icon className={`h-5 w-5 ${s.color}`} />
                       </div>
                       <div>
                         <p className="text-2xl font-bold">{s.value}</p>
                         <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                       </div>
                     </CardContent>
                   </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">User Distribution</CardTitle>
                        <CardDescription>Members by institutional role.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userDistribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Engagement Mix</CardTitle>
                        <CardDescription>Activity distribution across modules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-center gap-8">
                           <div className="h-[250px] w-full sm:w-1/2">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie
                                          data={engagementDistribution}
                                          dataKey="value"
                                          cx="50%" cy="50%"
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={5}
                                      >
                                          {engagementDistribution.map((_, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                      </Pie>
                                      <Tooltip />
                                  </PieChart>
                              </ResponsiveContainer>
                           </div>
                           <div className="flex flex-col gap-3 w-full sm:w-1/2">
                               {engagementDistribution.map((e, i) => (
                                   <div key={e.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                                       <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                          <span className="text-xs font-semibold">{e.name}</span>
                                       </div>
                                       <span className="text-xs font-bold">{e.value}</span>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Activity Overview</CardTitle>
                        <CardDescription>System interactions over time.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.jobs?.topJobs || []}>
                            <defs>
                                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="title" hide />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="applications" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorApps)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}