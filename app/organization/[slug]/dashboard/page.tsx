"use client";

import { useAuthProfile } from "@/context/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { sessionGet, sessionSet } from "@/lib/cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Briefcase, Calendar, MessageSquare, UserPlus,
  RefreshCw, Target, Plus, Settings, ShieldAlert,
  ChevronRight, ArrowRight, Activity, Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Skeleton for initial page load ─────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-7 w-14 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
        ))}
      </div>
      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-52 w-full rounded-3xl" />
          <Skeleton className="h-60 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, organization, loading } = useAuthProfile();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const slug = organization?.slug || "default";

  const fetchDashboardData = useCallback(async () => {
    // Serve cached data first for instant render
    const cachedStats = sessionGet<any>("dash_stats");
    const cachedRecs = sessionGet<any[]>("dash_recs");
    if (cachedStats) { setStats(cachedStats); setLoadingStats(false); }
    if (cachedRecs) { setRecommendations(cachedRecs); setLoadingRecs(false); }
    if (cachedStats && cachedRecs) return; // fully cached

    try {
      if (!cachedStats) setLoadingStats(true);
      if (!cachedRecs) setLoadingRecs(true);
      const [statsRes, recsRes] = await Promise.all([
        cachedStats ? null : fetch("/api/dashboard/stats", { cache: "no-store" }),
        cachedRecs ? null : fetch("/api/dashboard/recommendations", { cache: "no-store" }),
      ]);
      if (statsRes?.ok) {
        const d = await statsRes.json();
        setStats(d);
        sessionSet("dash_stats", d, 2 * 60 * 1000); // 2-min cache
      }
      if (recsRes?.ok) {
        const d = await recsRes.json();
        setRecommendations(d.recommendations || []);
        sessionSet("dash_recs", d.recommendations || [], 2 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoadingStats(false);
      setLoadingRecs(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.onboardingCompleted) fetchDashboardData();
  }, [profile, fetchDashboardData]);

  useEffect(() => {
    if (!loading && !profile?.onboardingCompleted) router.push("/onboarding");
  }, [loading, profile, router]);

  if (loading || !profile) return <DashboardSkeleton />;

  const firstName = profile.fullName?.split(" ")[0] || "there";
  const isAlumni = profile.userType === "alumni";
  const isAdmin = profile.userType === "super_admin";

  const statCards = [
    { label: "Network", value: stats?.stats?.network?.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "Members" },
    { label: "Saved Jobs", value: stats?.stats?.career?.savedJobs ?? 0, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Bookmarked" },
    { label: "Upcoming Events", value: stats?.stats?.events?.upcoming ?? 0, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Scheduled" },
    { label: "Unread Messages", value: stats?.stats?.notifications?.unread ?? 0, icon: MessageSquare, color: "text-rose-600", bg: "bg-rose-50", trend: "New" },
  ];

  const quickLinks = [
    { title: "Invite Member", icon: UserPlus, href: `/organization/${slug}/dashboard/network/invite`, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Post Job", icon: Briefcase, href: `/organization/${slug}/dashboard/jobs/new`, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Create Event", icon: Calendar, href: `/organization/${slug}/dashboard/events/create`, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const navLinks = [
    { label: "Network", icon: Users, path: `/organization/${slug}/dashboard/network`, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Jobs", icon: Briefcase, path: `/organization/${slug}/dashboard/jobs`, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Events", icon: Calendar, path: `/organization/${slug}/dashboard/events`, bg: "bg-indigo-50", color: "text-indigo-600" },
    { label: "Settings", icon: Settings, path: `/organization/${slug}/dashboard/settings`, bg: "bg-slate-100", color: "text-slate-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAlumni
              ? "Your activity, network, and opportunities at a glance."
              : isAdmin
              ? "Manage your institution's alumni network."
              : "Explore events, jobs, and connect with alumni."}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loadingStats}
            className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 shadow-sm"
            onClick={() =>
              router.push(
                isAlumni
                  ? `/organization/${slug}/dashboard/jobs/new`
                  : `/organization/${slug}/dashboard/mentorship`
              )
            }
          >
            {isAlumni ? <Plus className="h-4 w-4 mr-2" /> : <Target className="h-4 w-4 mr-2" />}
            {isAlumni ? "Post Job" : "Find Mentor"}
          </Button>
        </div>
      </header>

      {/* Admin setup notice */}
      {isAdmin && !organization && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">Organization Setup Required</p>
            <p className="text-xs text-amber-700 mt-0.5">Register your organization to start managing your alumni network.</p>
          </div>
          <Button
            size="sm"
            className="h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 shrink-0"
            onClick={() => router.push("/organization/setup")}
          >
            Setup Now
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <Badge className="bg-slate-50 text-slate-400 border-none text-[10px] font-semibold rounded-lg">
                {stat.trend}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loadingStats ? <Skeleton className="h-7 w-12 rounded-lg inline-block" /> : stat.value.toLocaleString()}
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Recommendations + Quick Actions */}
        <div className="xl:col-span-2 space-y-5">
          {/* Recommendations */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recommended For You</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Opportunities matched to your profile</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 font-semibold hover:bg-blue-50 rounded-xl text-xs"
                onClick={() => router.push(`/organization/${slug}/dashboard/network`)}
              >
                View All <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>

            <div className="space-y-3">
              {loadingRecs ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100">
                    <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/3 rounded-lg" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                ))
              ) : recommendations.length > 0 ? (
                recommendations.map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all group text-left"
                    onClick={() =>
                      router.push(
                        item.href ||
                        `/organization/${slug}/dashboard/${item.type === "job" ? "jobs" : "network"}/${item.id}`
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl border border-slate-100 bg-white flex items-center justify-center p-2 shadow-sm group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                        {item.logo || item.avatar ? (
                          <img
                            src={item.logo || item.avatar}
                            alt={item.title || item.name}
                            className="max-h-full max-w-full object-cover rounded"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <Activity className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title || item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="bg-slate-100 text-slate-500 border-none rounded text-[9px] font-semibold px-1.5">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-slate-400 font-medium truncate">
                            {item.company || item.headline || item.mode || ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                ))
              ) : (
                <div className="py-14 text-center space-y-3">
                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                    <Activity className="h-6 w-6 text-slate-200" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No recommendations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-4">
            {quickLinks.map((action, i) => (
              <button
                key={i}
                className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-100 transition-all group text-left"
                onClick={() => router.push(action.href)}
              >
                <div className={`${action.bg} h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center sm:text-left">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Profile + Navigation */}
        <div className="space-y-5">
          {/* Profile completeness */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-blue-500/10 blur-3xl rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Profile</p>
                <span className="text-xl font-bold">{stats?.stats?.profile?.completeness ?? 0}%</span>
              </div>
              <Progress value={stats?.stats?.profile?.completeness ?? 0} className="h-1.5 bg-white/10" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete your profile to unlock better networking and personalized opportunities.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white hover:text-slate-900 transition-all"
                onClick={() => router.push(`/organization/${slug}/dashboard/profile`)}
              >
                Update Profile
              </Button>
            </div>
          </div>

          {/* Quick navigation */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Navigation</p>
            <div className="grid grid-cols-2 gap-3">
              {navLinks.map((link, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-blue-100 transition-all group"
                  onClick={() => router.push(link.path)}
                >
                  <div className={`${link.bg} h-9 w-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <link.icon className={`h-4 w-4 ${link.color}`} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">{link.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected · {organization?.name || slug}
          </div>
        </div>
      </div>
    </div>
  );
}
