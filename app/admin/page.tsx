"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  MessageCircle,
  UserPlus,
  Loader2,
  BarChart3,
  Clock,
  RefreshCw,
  Eye,
  Download,
  Filter,
  MoreVertical,
  TrendingDown,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

type AdminStats = {
  totalUsers: number;
  newUsers: number;
  activeEvents: number;
  pendingJobs: number;
  totalDonations: number;
  growthRate: number;
};

export default function AdminDashboardPage() {
  const { user } = useUser();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // ✅ REAL API LOAD
  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;

      try {
        setLoading(true);

        // 1️⃣ Get user's organizations
        const orgRes = await fetch("/api/organizations", { cache: "no-store" });
        if (!orgRes.ok) throw new Error("Failed to load organizations");

        const orgData = await orgRes.json();
        const primaryOrg = orgData.organizations?.[0];

        if (!primaryOrg?.id) {
          toast.error("No organization assigned");
          return;
        }

        setOrganizationId(primaryOrg.id);

        // 2️⃣ Load admin stats
        const statsRes = await fetch(
          `/api/admin/stats?organizationId=${primaryOrg.id}`,
          { cache: "no-store" }
        );

        if (!statsRes.ok) throw new Error("Failed to load stats");

        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  // ✅ REAL REFRESH
  const handleRefresh = async () => {
    if (!organizationId) return;

    setRefreshing(true);
    try {
      const statsRes = await fetch(
        `/api/admin/stats?organizationId=${organizationId}`,
        { cache: "no-store" }
      );

      if (!statsRes.ok) throw new Error();
      const statsData = await statsRes.json();
      setStats(statsData);

      toast.success("Dashboard refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary shadow-glow">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time alumni insights & analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>

          <Button className="gradient-primary text-white shadow-glow">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* ✅ STATS GRID (REAL API DATA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users />}
          trend={`+${stats.growthRate}%`}
          color="from-[var(--chart-4)] to-[var(--primary)]"
        />

        <StatCard
          title="New Users"
          value={stats.newUsers}
          icon={<UserPlus />}
          color="from-[var(--chart-1)] to-[var(--chart-4)]"
        />

        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          icon={<Calendar />}
          color="from-[var(--chart-2)] to-[var(--chart-4)]"
        />

        <StatCard
          title="Total Donations"
          value={`$${(stats.totalDonations / 1000).toFixed(1)}K`}
          icon={<DollarSign />}
          color="from-[var(--chart-3)] to-[var(--chart-5)]"
        />
      </div>

      {/* ✅ QUICK STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-hover border-0">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickStat
              title="Pending Jobs"
              value={stats.pendingJobs}
              icon={<Briefcase />}
              down
            />
          </CardContent>
        </Card>

        {/* ✅ ACTIVITY PLACEHOLDER (until API exists) */}
        <Card className="card-hover border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Activity feed API pending integration
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            This section will auto-sync once messaging/activity APIs are added.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({
  title,
  value,
  icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}) {
  return (
    <Card className="border-0 glass card-hover">
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-muted-foreground text-sm">{title}</p>
          {trend && (
            <div className="flex items-center mt-2 text-emerald-500 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              {trend}
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color}`}
        >
          <div className="text-white">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  title,
  value,
  icon,
  down,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  down?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
      {down ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : (
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      )}
    </div>
  );
}
