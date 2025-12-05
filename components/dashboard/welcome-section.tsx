// /components/dashboard/welcome-section.tsx
import React from "react";

export function WelcomeSection({ userName, role, organization }: { userName?: string; role?: string; organization?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back, {userName ?? "User"} 👋</h2>
          <p className="text-sm text-muted-foreground">
            Role: <strong>{role}</strong>
            {organization ? <> — {organization}</> : null}
          </p>
        </div>
        <div>
          {/* placeholder for user controls */}
        </div>
      </div>
    </div>
  );
}
