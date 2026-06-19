"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Loader2, Users, Briefcase, Calendar, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sessionGet, sessionSet } from "@/lib/cache";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, typeof Activity> = {
  member_joined: Users,
  connection_made: Users,
  post_created: Activity,
  event_created: Calendar,
  job_posted: Briefcase,
  mentorship_request: GraduationCap,
  milestone: Activity,
};

export function AlumniUpdates({ orgId, slug }: { orgId?: string; role?: string; slug?: string }) {
  const router = useRouter();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const cacheKey = `updates_${orgId}`;
    const cached = sessionGet<any[]>(cacheKey);
    if (cached) {
      setUpdates(cached);
      setLoading(false);
    }

    async function load() {
      try {
        const res = await fetch(
          `/api/dashboard/updates?organizationId=${orgId}&limit=8`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          const feed = data.updates || [];
          setUpdates(feed);
          sessionSet(cacheKey, feed, 2 * 60 * 1000);
        }
      } catch {
        // keep cached data if available
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orgId]);

  const resolveLink = (update: any) => {
    const base = slug ? `/organization/${slug}/dashboard` : "/dashboard";
    const link = update.actionLink || "";
    if (link.startsWith("/organization/")) return link;
    if (link.startsWith("/dashboard/")) {
      return link.replace("/dashboard", base);
    }
    return `${base}/network`;
  };

  if (loading && !updates.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-emerald-600" />
        <h4 className="text-base font-bold text-slate-900">Alumni Activity</h4>
      </div>

      {updates.length === 0 ? (
        <p className="text-sm text-slate-400 flex-1">No recent activity in your network.</p>
      ) : (
        <ul className="space-y-3 flex-1">
          {updates.map((update) => {
            const Icon = typeIcons[update.type] || Activity;
            return (
              <li key={update.id}>
                <button
                  type="button"
                  onClick={() => router.push(resolveLink(update))}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-slate-50/50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 line-clamp-2">{update.message}</p>
                    {update.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{update.description}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {update.actor?.avatar && (
                    <Avatar className="h-8 w-8 rounded-lg shrink-0">
                      <AvatarImage src={update.actor.avatar} />
                      <AvatarFallback>{update.actor.name?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
