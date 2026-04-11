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
  RefreshCw, 
  Building2, 
  Plus,
  ChevronRight,
  Globe,
  MoreHorizontal
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
  ResponsiveContainer 
} from "recharts";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  isActive: boolean;
  isVerified: boolean;
  memberCount: number;
  eventCount: number;
  jobCount: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = profile?.userType === "super_admin";
  const orgId = profile?.organizationId;

  const loadData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      else setRefreshing(true);

      const res = await fetch("/api/organizations", { cache: "no-store" });
      const data = await res.json();
      
      if (data.success && data.organizations) {
        setOrganizations(data.organizations);
      }

      if (orgId) {
        const statsRes = await fetch(`/api/admin/stats?organizationId=${orgId}`, { cache: "no-store" });
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
      </div>
    );
  }

  // --- SUPER ADMIN GLOBAL VIEW ---
  if (isSuperAdmin && organizations.length > 0 && !orgId) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Network</h1>
            <p className="text-slate-500">Global overview of all institutions and alumni nodes.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => loadData(true)} variant="outline" disabled={refreshing}>
               <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Sync
            </Button>
            <Button onClick={() => router.push("/organization/setup")} className="bg-indigo-600">
               <Plus className="h-4 w-4 mr-2" /> Register New Org
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Institutions</CardDescription>
              <CardTitle className="text-4xl">{organizations.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verified Networks</CardDescription>
              <CardTitle className="text-4xl">{organizations.filter(o => o.isVerified).length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Global Members</CardDescription>
              <CardTitle className="text-4xl">
                {organizations.reduce((acc, curr) => acc + curr.memberCount, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Directory</CardTitle>
            <CardDescription>Comprehensive list of all registered alumni nodes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Platform Use</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-xs text-slate-500">{org.slug}.alumniconnect.com</div>
                    </TableCell>
                    <TableCell>
                      {org.isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{org.memberCount}</TableCell>
                    <TableCell className="text-xs">
                       <p>{org.eventCount} Events</p>
                       <p>{org.jobCount} Jobs</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/organization/${org.slug}/dashboard`)}>
                        Manage <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- NO ORGANIZATION ERROR STATE ---
  if (!stats) {
    return (
       <div className="container py-24 text-center space-y-6">
          <div className="p-6 bg-slate-50 rounded-full w-fit mx-auto border">
             <Building2 className="h-10 w-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold">Organization Discovery Needed</h2>
          <p className="text-slate-500 max-w-sm mx-auto">Initialize your institutional presence to unlock administrative intelligence modules.</p>
          <Button onClick={() => router.push("/organization/setup")} className="bg-indigo-600">Setup Organization</Button>
       </div>
    );
  }

  // --- STANDARD ORGANIZATION ADMIN DASHBOARD ---
  const distributionData = [
    { name: "Alumni", value: stats.users.byType.alumni || 0 },
    { name: "Students", value: stats.users.byType.student || 0 },
    { name: "Staff", value: (stats.users.byType.admin || 0) + (stats.users.byType.super_admin || 0) },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
           <p className="text-slate-500">Welcome back, {user?.firstName}. Institutional metrics at a glance.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => loadData(true)} disabled={refreshing}>
             <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Sync
           </Button>
           <Button size="sm" className="bg-indigo-600" onClick={() => router.push("/admin/users")}>
              <Users className="h-4 w-4 mr-2" /> Manage Users
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: stats.users.total.toLocaleString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: `+${stats.users.growthRate}%` },
          { label: "Active Rate", value: `${stats.users.engagementRate}%`, icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Stable" },
          { label: "Job Postings", value: stats.jobs.active, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50", trend: `${stats.jobs.totalApplications} apps` },
          { label: "Live Events", value: stats.events.upcoming, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", trend: "Next 30d" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Membership Affiliation</CardTitle>
            <CardDescription>Distribution of users by institutional role.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Audit</CardTitle>
            <CardDescription>Recent actions across the network.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y">
                {stats.recentActivity?.slice(0, 5).map((activity: any) => (
                   <div key={activity.id} className="flex items-center gap-3 p-4">
                      <Avatar className="h-8 w-8">
                         <AvatarImage src={activity.actor?.avatarUrl} />
                         <AvatarFallback>{activity.actor?.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-semibold truncate">{activity.actor?.fullName}</p>
                         <p className="text-[10px] text-slate-500 truncate">{activity.action.split('.')[1]} {activity.entityLabel}</p>
                      </div>
                   </div>
                ))}
                {!stats.recentActivity?.length && (
                  <p className="text-center text-xs text-slate-400 py-10">No recent logs.</p>
                )}
             </div>
             <div className="p-4 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600" onClick={() => router.push("/admin/reports")}>
                   Full Audit History <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}