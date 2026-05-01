"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  Card, 
  CardContent, 
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
  RefreshCw, 
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Globe,
  MoreHorizontal,
  IndianRupee,
  Heart,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { 
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = profile?.userType === "super_admin";
  const orgId = profile?.organizationId;

  const loadData = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any>(`admin_stats_${orgId}`);
      if (cached) { setStats(cached); setLoading(false); }
      else setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await fetch(`/api/admin/stats?organizationId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        sessionSet(`admin_stats_${orgId}`, data.stats, 10 * 60 * 1000); // 10 min cache
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId, loadData]);

  if (loading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-300">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-[2.5rem]" />
          <Skeleton className="h-[400px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Dashboard
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {profile?.organization?.name || "Your Institution"}'s overview and performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => loadData(true)} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push("/admin/settings")} variant="outline" className="h-10 rounded-xl border-slate-200 font-bold px-5">
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Members", value: stats?.users?.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Events Published", value: stats?.events?.total || 0, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Job Opportunities", value: stats?.jobs?.total || 0, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Donations Raised", value: `₹${(stats?.financial?.totalAmount || 0).toLocaleString()}`, icon: IndianRupee, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((item, i) => (
          <Card key={i} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm bg-white p-2">
          <CardHeader className="px-6 pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">Member Growth Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.users?.growthTrend || []}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Quick Actions</h4>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Invite Members", icon: Plus, path: "/admin/users" },
                  { label: "Create Event", icon: Calendar, path: "/admin/events/create" },
                  { label: "Post a Job", icon: Briefcase, path: "/admin/jobs/create" },
                ].map((action, i) => (
                  <Button 
                    key={i}
                    onClick={() => router.push(action.path)}
                    className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 border-none text-white font-bold justify-start px-4 transition-all"
                  >
                    <action.icon className="h-4 w-4 mr-3 text-blue-400" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-6 space-y-4">
             <div className="flex items-center justify-between">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h4>
               <Button variant="ghost" size="sm" onClick={() => router.push("/admin/reports")} className="h-7 text-[10px] font-bold text-blue-600">
                 All Activity
               </Button>
             </div>
             <div className="space-y-4">
                {stats?.recentActivity?.slice(0, 4).map((activity: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                      <Activity className="h-4 w-4 text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{activity.description}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{activity.timeAgo || "Recently"}</p>
                    </div>
                  </div>
                ))}
                {!stats?.recentActivity?.length && (
                  <div className="py-6 text-center text-slate-300">
                    <p className="text-xs font-medium">No recent activity</p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}