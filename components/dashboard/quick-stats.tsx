// /components/dashboard/quick-stats.tsx
import React from "react";

export function QuickStats({ stats }: { stats: { totalMembers: number; totalEvents: number; totalNews: number } }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Members</p>
        <h3 className="text-2xl font-bold">{stats.totalMembers}</h3>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Upcoming Events</p>
        <h3 className="text-2xl font-bold">{stats.totalEvents}</h3>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">News</p>
        <h3 className="text-2xl font-bold">{stats.totalNews}</h3>
      </div>
    </div>
  );
}
