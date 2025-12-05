// /components/dashboard/quick-actions.tsx
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function QuickActions({ role, org }: { role?: string; org?: any }) {
  // Show actions depending on role. You can extend permissions mapping.
  const canCreateEvent = ["SUPERADMIN", "ADMIN", "DEAN", "PRINCIPAL", "faculty"].includes((role ?? "").toUpperCase());
  const canPostNews = canCreateEvent;
  const canInvite = ["SUPERADMIN", "ADMIN", "DEAN", "PRINCIPAL"].includes((role ?? "").toUpperCase());

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex gap-3 items-center">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Quick actions</p>
        <div className="mt-2 flex gap-2">
          <Link href={`/organizations/${org?.slug ?? org?.id}/events/new`}>
            <Button disabled={!canCreateEvent} size="sm">
              Create Event
            </Button>
          </Link>
          <Link href={`/organizations/${org?.slug ?? org?.id}/news/new`}>
            <Button disabled={!canPostNews} size="sm" variant="ghost">
              Post News
            </Button>
          </Link>
          <Link href={`/organizations/${org?.slug ?? org?.id}/members/invite`}>
            <Button disabled={!canInvite} size="sm" variant="outline">
              Invite Member
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
