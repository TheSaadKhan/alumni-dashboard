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
  UserPlus,
  RefreshCw,
  Target,
  Plus,
  Settings,
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  Heart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  const { profile, organization, loading } = useAuthProfile();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const slug = organization?.slug || "default";

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
        setStats(statsData); // Store the whole response which includes .stats and .organization
      }
      
      if (recsRes.ok) {
        const recsData = await recsRes.json();
        setRecommendations(recsData.recommendations || []);
      }
    } catch (error) {
       toast.error("Failed to fetch dashboard data");
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
    <div className="container py-8 max-w-7xl mx-auto px-4 md:px-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {profile.fullName?.split(' ')[0]}
           </h1>
           <p className="text-slate-500 mt-1">
              {profile.userType === "alumni" 
                ? "Connecting with your community and making an impact." 
                : "Explore your network and find new opportunities."}
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loadingStats}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} /> Sync
           </Button>
           <Button 
             size="sm"
             className="bg-indigo-600 hover:bg-indigo-700"
             onClick={() => router.push(profile.userType === "alumni" ? `/organization/${slug}/dashboard/jobs/new` : `/organization/${slug}/dashboard/mentorship`)}
           >
              {profile.userType === "alumni" ? <Plus className="h-4 w-4 mr-2" /> : <Target className="h-4 w-4 mr-2" />}
              {profile.userType === "alumni" ? "Post Job" : "Find Mentor"}
           </Button>
        </div>
      </header>

      {/* Admin Notice */}
      {profile.userType === "super_admin" && !organization && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
           <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                 <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                    <ShieldAlert className="h-6 w-6 text-amber-600" />
                 </div>
                 <div className="flex-1">
                    <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Setup Required</h2>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Your account needs an organization to manage. Please set up your organization to continue.</p>
                 </div>
                 <Button onClick={() => router.push("/organization/setup")} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    Setup Organization
                 </Button>
              </div>
           </CardContent>
        </Card>
      )}

      {/* Admin Quick View (Optional Toggle could be added later) */}
      {(profile.userType === "admin" || profile.userType === "super_admin") && stats?.organization && (
        <div className="space-y-4">
           <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Institutional Performance</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Active Members", value: stats.organization.activeMembers, icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50", trend: `+${stats.organization.memberGrowth}%` },
                { label: "Engagement", value: `${stats.organization.engagementRate}%`, icon: Heart, color: "text-rose-600", bg: "bg-rose-50", trend: "High" },
                { label: "Active Jobs", value: stats.organization.activeJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Pending Invites", value: stats.organization.pendingInvitations, icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((stat, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow border-none shadow-sm bg-white dark:bg-slate-900">
                   <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                         <div className={`${stat.bg} h-10 w-10 rounded-xl flex items-center justify-center dark:bg-slate-800`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                         </div>
                         {stat.trend && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px]">{stat.trend}</Badge>
                         )}
                      </div>
                      <div>
                         <p className="text-2xl font-bold tracking-tight">
                            {loadingStats ? "..." : stat.value}
                         </p>
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
                      </div>
                   </CardContent>
                </Card>
              ))}
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Personal Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Network", value: stats?.stats?.network?.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Saved Jobs", value: stats?.stats?.career?.savedJobs || 0, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Events", value: stats?.stats?.events?.upcoming || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Messages", value: stats?.stats?.notifications?.unread || 0, icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <div className={`${stat.bg} h-10 w-10 rounded-md flex items-center justify-center dark:bg-slate-800`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                   </div>
                </div>
                <div>
                   <p className="text-2xl font-bold">
                      {loadingStats ? "..." : stat.value.toLocaleString()}
                   </p>
                   <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Main Feed / Recommendations */}
         <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-lg">Recommended for You</CardTitle>
                    <CardDescription>Based on your profile and interests.</CardDescription>
                 </div>
                 <Button variant="link" onClick={() => router.push(`/organization/${slug}/dashboard/network`)}>
                    View All
                 </Button>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    {loadingRecs ? (
                      Array(3).fill(0).map((_, i) => (
                         <div key={i} className="h-20 w-full bg-slate-50 dark:bg-slate-800 rounded-md animate-pulse" />
                      ))
                    ) : recommendations.length > 0 ? (
                      recommendations.map((item, i) => (
                         <div 
                           key={i} 
                           className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                           onClick={() => router.push(item.href || `/organization/${slug}/dashboard/${item.type === 'job' ? 'jobs' : 'network'}/${item.id}`)}
                         >
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded border bg-white dark:bg-slate-900 flex items-center justify-center p-2">
                                  <img 
                                    src={item.logo || item.avatar} 
                                    alt={item.title || item.name} 
                                    className="max-h-full max-w-full rounded-md object-cover" 
                                    onError={(e) => (e.currentTarget.src = "/assets/image/placeholder.png")} 
                                  />
                               </div>
                               <div>
                                  <p className="font-semibold text-sm">{item.title || item.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                     <Badge variant="secondary" className="text-[10px] py-0 px-2 h-4 uppercase">{item.type}</Badge>
                                     <span className="text-xs text-slate-400 font-medium">
                                        {item.company || item.headline || item.mode || "Community"}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                         </div>
                      ))
                    ) : (
                       <div className="py-12 text-center text-slate-500">
                          <p>No recommendations available at the moment.</p>
                       </div>
                    )}
                 </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[
                 { title: "Invite Member", icon: UserPlus, href: `/organization/${slug}/dashboard/network/invite` },
                 { title: "Post Job", icon: Briefcase, href: `/organization/${slug}/dashboard/jobs/new` },
                 { title: "Post Event", icon: Calendar, href: `/organization/${slug}/dashboard/events/create` },
               ].map((action, i) => (
                 <Button
                   key={i}
                   variant="outline"
                   className="h-16 justify-start gap-4 px-4 bg-white dark:bg-slate-900"
                   onClick={() => router.push(action.href)}
                 >
                   <action.icon className="h-5 w-5 text-slate-400" />
                   <span className="text-sm font-semibold">{action.title}</span>
                 </Button>
               ))}
            </div>
         </div>

         {/* Sidebar Content */}
         <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Heart className="h-24 w-24" />
               </div>
               <CardContent className="p-6 space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                     <Progress value={stats?.stats?.profile?.completeness || 0} className="flex-1 h-2 bg-slate-700" />
                     <span className="text-sm font-bold">{stats?.stats?.profile?.completeness || 0}%</span>
                  </div>
                  <div>
                     <p className="font-bold tracking-tight">Profile Completeness</p>
                     <p className="text-sm text-slate-400 mt-1">Enhance your profile to unlock more personalized opportunities.</p>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full h-10 rounded-xl font-bold" onClick={() => router.push(`/organization/${slug}/dashboard/profile`)}>
                     Complete Profile
                  </Button>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Quick Links</CardTitle>
               </CardHeader>
               <CardContent className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Network", icon: Users, path: `/organization/${slug}/dashboard/network` },
                    { label: "Jobs", icon: Briefcase, path: `/organization/${slug}/dashboard/jobs` },
                    { label: "Events", icon: Calendar, path: `/organization/${slug}/dashboard/events` },
                    { label: "Settings", icon: Settings, path: `/organization/${slug}/dashboard/settings` },
                  ].map((link, idx) => (
                     <Button 
                        key={idx}
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(link.path)}
                        className="flex flex-col h-20 items-center justify-center border hover:bg-slate-50 rounded-lg gap-2"
                     >
                        <link.icon className="h-5 w-5 text-slate-400" />
                        <span className="text-xs font-medium">{link.label}</span>
                     </Button>
                  ))}
               </CardContent>
            </Card>
         </div>
      </div>

      <footer className="pt-8 border-t text-slate-400 text-xs flex justify-between">
         <p>© 2024 AlumniConnect Dashboard</p>
         <div className="flex gap-4">
            <span className="flex items-center gap-1">
               <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
               System Online
            </span>
         </div>
      </footer>
    </div>
  );
}
