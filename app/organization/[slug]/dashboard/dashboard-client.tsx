// /app/dashboard/DashboardClient.tsx
"use client";

import { AlumniUpdates } from "@/components/dashboard/alumni-updates";
import { NewsAnnouncements } from "@/components/dashboard/news-announcements";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { UpcomingEvents } from "@/components/dashboard/upcoming-event";
import { WelcomeSection } from "@/components/dashboard/welcome-section";

interface DashboardClientProps {
  profile: any;
  organizations: any[];
  activeOrg: any;
  activeRole: any;
  stats: {
    totalMembers: number;
    totalEvents: number;
    totalNews: number;
  };
}

export default function DashboardClient({
  profile,
  organizations,
  activeOrg,
  activeRole,
  stats,
}: DashboardClientProps) {
  const highestRole = activeRole?.name || "Alumni";

  return (
    <div className="space-y-6 py-4">
      {/* Welcome Section */}
      <WelcomeSection userName={profile.full_name ?? profile.email} role={highestRole} organization={activeOrg?.name} />

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Quick Actions (Role-specific) */}
      <QuickActions role={highestRole} org={activeOrg} />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          <UpcomingEvents orgId={activeOrg?.id} role={highestRole} />
          <NewsAnnouncements orgId={activeOrg?.id} role={highestRole} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AlumniUpdates orgId={activeOrg?.id} role={highestRole} />
        </div>
      </div>
    </div>
  );
}
