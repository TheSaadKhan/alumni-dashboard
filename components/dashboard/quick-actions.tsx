"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus, Briefcase, Calendar } from "lucide-react";

export function QuickActions({ role, org }: { role?: string; org?: { slug?: string; id?: string } }) {
  const slug = org?.slug || org?.id || "default";
  const base = `/organization/${slug}/dashboard`;
  const normalizedRole = (role ?? "").toLowerCase();
  const isAdmin = ["super_admin", "admin"].includes(normalizedRole);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-3">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        <Link href={`${base}/events/create`}>
          <Button size="sm" variant="outline" className="rounded-xl" disabled={!isAdmin}>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
        <Link href={`${base}/jobs/new`}>
          <Button size="sm" variant="outline" className="rounded-xl">
            <Briefcase className="h-4 w-4 mr-2" />
            Post Job
          </Button>
        </Link>
        <Link href={`${base}/invites`}>
          <Button size="sm" variant="outline" className="rounded-xl" disabled={!isAdmin}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </Link>
      </div>
    </div>
  );
}
