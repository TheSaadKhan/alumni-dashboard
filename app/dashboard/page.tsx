"use client";

import { AlumniUpdates } from "@/components/dashboard/alumni-updates";
import { NewsAnnouncements } from "@/components/dashboard/news-announcements";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { UpcomingEvents } from "@/components/dashboard/upcoming-event";
import { WelcomeSection } from "@/components/dashboard/welcome-section";

export default function DashboardPage() {
  return (
    <div className="space-y-6 py-4">
      {/* Welcome Section */}
      <WelcomeSection />
      
      {/* Quick Stats */}
      <QuickStats />
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          <UpcomingEvents />
          <NewsAnnouncements />
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          <AlumniUpdates />
        </div>
      </div>
    </div>
  );
}