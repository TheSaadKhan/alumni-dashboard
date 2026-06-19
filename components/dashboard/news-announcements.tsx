"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Loader2, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sessionGet, sessionSet } from "@/lib/cache";
import { formatDistanceToNow } from "date-fns";

export function NewsAnnouncements({ orgId }: { orgId?: string; role?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const cacheKey = `news_${orgId}`;
    const cached = sessionGet<any[]>(cacheKey);
    if (cached) {
      setItems(cached);
      setLoading(false);
    }

    async function load() {
      try {
        const res = await fetch(
          `/api/dashboard/news?organizationId=${orgId}&limit=5&type=all`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          const feed = data.items || [];
          setItems(feed);
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

  if (loading && !items.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-blue-600" />
          <h4 className="text-base font-bold text-slate-900">News & Announcements</h4>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 flex-1">No announcements yet. Check back soon.</p>
      ) : (
        <ul className="space-y-3 flex-1">
          {items.slice(0, 5).map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="p-3 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                {item.isPinned && <Pin className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px] uppercase font-semibold">
                      {item.type}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(item.timestamp || item.createdAt || item.publishAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {item.title || item.content?.slice(0, 80)}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {item.content}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
