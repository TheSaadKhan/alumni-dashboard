"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpcomingEvents({ orgId }: { orgId?: string; role?: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          // Filter to show only future events if API returns mixed
          const upcoming = (data.events || []).filter((e: any) => new Date(e.start_date || e.starts_at) > new Date());
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h4>
        <Link href="/dashboard/events" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
          View All
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No upcoming events scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="text-xs font-bold uppercase">{format(new Date(event.start_date || event.starts_at), "MMM")}</span>
                <span className="text-lg font-bold">{format(new Date(event.start_date || event.starts_at), "d")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h5>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>
              <Link href={`/dashboard/events/${event.id}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  &rarr;
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
