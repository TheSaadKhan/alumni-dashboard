"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpcomingEvents({ orgId, slug }: { orgId?: string; role?: string; slug?: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const base = slug ? `/organization/${slug}/dashboard` : "/dashboard";

  useEffect(() => {
    async function loadEvents() {
      if (!orgId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/events?organizationId=${orgId}&limit=3&status=published`);
        if (res.ok) {
          const data = await res.json();
          const upcoming = (data.events || []).filter(
            (e: any) => new Date(e.start_date || e.starts_at) > new Date()
          );
          setEvents(upcoming.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to load upcoming events", error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [orgId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-base font-bold text-slate-900">Upcoming Events</h4>
        <Link href={`${base}/events`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-400 flex-1">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No upcoming events scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center text-blue-600">
                <span className="text-xs font-bold uppercase">
                  {format(new Date(event.start_date || event.starts_at), "MMM")}
                </span>
                <span className="text-lg font-bold">
                  {format(new Date(event.start_date || event.starts_at), "d")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-slate-900 truncate">{event.title}</h5>
                <div className="flex items-center text-xs text-slate-500 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{event.location || event.locationName || "Online"}</span>
                </div>
              </div>
              <Link href={`${base}/events/${event.id}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
