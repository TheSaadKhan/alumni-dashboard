"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar, Clock, MapPin, Users, Plus, Loader2, Search, ChevronRight, Inbox, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function EventsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const orgId = profile?.organizationId;
  const slug = organization?.slug || "default";

  const fetchEvents = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any[]>(`events_${orgId}`);
      if (cached) { setEvents(cached); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/events?organizationId=${orgId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const loadedEvents = data.events || [];
        setEvents(loadedEvents);
        sessionSet(`events_${orgId}`, loadedEvents, 5 * 60 * 1000);
      }
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) fetchEvents();
  }, [orgId, fetchEvents]);

  const filteredEvents = events.filter((e: any) => {
    const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    const now = new Date();
    const eventDate = new Date(e.startsAt);
    if (filter === "upcoming") return eventDate > now;
    if (filter === "past") return eventDate <= now;
    return true;
  });

  if (profileLoading && !events.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Events</h1>
          <p className="text-slate-500 font-medium text-sm">Stay engaged with the community through our curated events.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => fetchEvents()} className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {(profile?.userType === "admin" || profile?.userType === "super_admin") && (
            <Button onClick={() => router.push("/admin/events/create")} className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4 mr-2" /> New Event
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <Input 
            placeholder="Search events by name..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
          {["all", "upcoming", "past"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading && !events.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {Array(6).fill(0).map((_, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
               <Skeleton className="h-48 w-full" />
               <div className="p-6 space-y-4">
                 <Skeleton className="h-5 w-3/4 rounded-lg" />
                 <Skeleton className="h-12 w-full rounded-xl" />
                 <Skeleton className="h-10 w-full rounded-xl" />
               </div>
             </div>
           ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="h-20 w-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Calendar className="h-10 w-10 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">No events found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const isUpcoming = new Date(event.startsAt) > new Date();
            return (
              <Card key={event.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                   <img 
                    src={event.coverUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt=""
                   />
                   <div className="absolute top-4 left-4">
                      <Badge className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border-none ${
                        isUpcoming ? "bg-white text-blue-600" : "bg-slate-900 text-white"
                      }`}>
                        {isUpcoming ? "Upcoming" : "Past Event"}
                      </Badge>
                   </div>
                   <div className="absolute bottom-4 right-4 h-12 w-12 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg border border-white/50 backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{format(new Date(event.startsAt), "MMM")}</span>
                      <span className="text-sm font-black text-slate-900 -mt-1">{format(new Date(event.startsAt), "dd")}</span>
                   </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">{event.description}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                       <Clock className="h-3 w-3" /> {format(new Date(event.startsAt), "hh:mm a")} • {event.mode.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                       <MapPin className="h-3 w-3" /> {event.locationName || (event.mode === "online" ? "Virtual Link" : "Campus Location")}
                    </div>
                  </div>

                  <div className="pt-2">
                     <Button 
                      onClick={() => router.push(`/organization/${slug}/events/${event.slug}`)}
                      className="w-full h-11 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-900 font-bold text-xs transition-all border-none"
                     >
                       View Details <ChevronRight className="h-4 w-4 ml-2" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}