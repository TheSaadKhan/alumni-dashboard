// /components/dashboard/alumni-updates.tsx
import React from "react";

export function AlumniUpdates({ orgId, role }: { orgId?: string; role?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
      <h4 className="text-lg font-semibold">Alumni Activity</h4>
      <p className="text-sm text-muted-foreground mt-2">Recent alumni updates, new connections, and highlights.</p>
      {/* TODO: Replace placeholder with fetch: connection_recommendations, story_likes, etc. */}
    </div>
  );
}
