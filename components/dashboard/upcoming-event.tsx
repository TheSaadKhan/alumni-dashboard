// /components/dashboard/upcoming-event.tsx
import React from "react";

export function UpcomingEvents({ orgId, role }: { orgId?: string; role?: string }) {
  // For a real app you'd fetch events server-side or via SWR/React Query.
  // This is a placeholder that explains how to plug in data.
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
      <h4 className="text-lg font-semibold">Upcoming Events</h4>
      <p className="text-sm text-muted-foreground mt-2">A list of upcoming events for this organization will appear here.</p>
      {/* TODO: Replace with server-side or client-side fetch */}
    </div>
  );
}
