"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  Plus, 
  Loader2, 
  Video, 
  Building2, 
  Globe,
  RefreshCw,
  MoreVertical,
  Ticket,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import router from "next/router";

export default function EventsPage() {
  const { profile, loading: profileLoading } = useAuthProfile();
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!profile?.organizationId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/events?organizationId=${profile.organizationId}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      toast.error("Failed to synchronize event nodes");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchEvents();
  }, [profile, fetchEvents]);

  const handleRegister = async (eventId: string) => {
    setRegistering(eventId);
    try {
      const res = await fetch("/api/dashboard/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        toast.success("Successfully registered for event!");
        fetchEvents();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to register for event");
      }
    } catch (err) {
      toast.error("Failed to register for event");
    } finally {
      setRegistering(null);
    }
  };

  const filteredEvents = events.filter((event: any) => {
    if (filter === "all") return true;
    const eventDate = new Date(event.startsAt);
    if (filter === "upcoming") return eventDate >= new Date();
    if (filter === "past") return eventDate < new Date();
    if (filter === "registered") return event.isRegistered;
    return true;
  });

  if (profileLoading) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.3em]">Operational Events</span>
              <div className="h-1 w-1 rounded-full bg-slate-300"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{events.length} active engagements</span>
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Institutional Calendar</h1>
           <p className="text-slate-500 font-medium mt-1">Discover workshops, seminars, and networking sessions.</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="h-12 rounded-xl font-bold px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
            <Plus className="h-4.5 w-4.5 mr-2" /> Publish Event
          </Button>
        </Link>
      </div>

      {/* Protocol Filtering */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/40 rounded-xl">
            {["all", "upcoming", "past", "registered"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
         <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500" />
            <Input 
               placeholder="Search event node..." 
               className="h-11 pl-11 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 text-xs font-bold uppercase tracking-widest" 
            />
         </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="border-none shadow-sm rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 border border-transparent hover:border-slate-50 dark:hover:border-slate-800 flex flex-col">
             <div className="h-40 relative group overflow-hidden">
                <img 
                   src={event.bannerUrl || "/assets/image/placeholder-event.png"} 
                   alt={event.title} 
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                   onError={(e) => (e.currentTarget.src = "/assets/image/placeholder-event.png")}
                />
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                   <Badge className="bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-black uppercase border-none text-slate-900 tracking-widest shadow-sm">
                      {event.mode}
                   </Badge>
                   <Badge className="bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase border-none tracking-widest shadow-sm">
                      {event.eventType}
                   </Badge>
                </div>
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
             <CardHeader className="p-8 pb-4 space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase italic leading-none truncate">{event.title}</h3>
                <p className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">{event.description || "Engagement details pending for this institutional node."}</p>
             </CardHeader>
             <CardContent className="p-8 pt-2 space-y-4 flex-1">
                <div className="space-y-2">
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      <Calendar className="h-4 w-4 text-slate-300" />
                      <span>{format(new Date(event.startsAt), "MMM do, yyyy")}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      <MapPin className="h-4 w-4 text-slate-300" />
                      <span className="truncate">{event.locationName || "Virtual Space"}</span>
                   </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-300" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.registeredCount} Committed</span>
                   </div>
                   {event.isPaid && <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-none font-black text-[9px]">PAID EVENT</Badge>}
                </div>
             </CardContent>
             <CardFooter className="px-8 pb-8 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold uppercase tracking-widest text-[9px] border-none bg-slate-50 hover:bg-slate-100" onClick={() => router.push(`/dashboard/events/${event.slug || event.id}`)}>
                   Examine
                </Button>
                {event.isRegistered ? (
                   <Button className="flex-1 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold uppercase tracking-widest text-[9px]" disabled>
                      COMMITTED
                   </Button>
                ) : (
                   <Button 
                      className="flex-1 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-500/10"
                      onClick={() => handleRegister(event.id)}
                      disabled={registering === event.id || event.isFull}
                   >
                      {registering === event.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : "ENGAGE"}
                   </Button>
                )}
             </CardFooter>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="py-24 text-center flex flex-col items-center space-y-6">
           <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Calendar className="h-8 w-8 text-slate-200" />
           </div>
           <div className="space-y-2">
              <h4 className="text-xl font-bold italic uppercase tracking-tighter">Event Silence Detetced</h4>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-loose max-w-sm mx-auto">No engagements corresponding to the current protocol matrix were found.</p>
           </div>
        </div>
      )}

      <footer className="pt-10 border-t border-slate-50 flex items-center justify-center">
         <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">Integrated Engagement Node v1.0 • Global Calendar</p>
      </footer>
    </div>
  );
}