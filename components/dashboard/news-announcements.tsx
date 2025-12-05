// /components/dashboard/news-announcements.tsx
import React from "react";

export function NewsAnnouncements({ orgId, role }: { orgId?: string; role?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
      <h4 className="text-lg font-semibold">News & Announcements</h4>
      <p className="text-sm text-muted-foreground mt-2">Latest news posts and announcements for your organization.</p>
      {/* TODO: Query stories (status: published) and render list */}
    </div>
  );
}
