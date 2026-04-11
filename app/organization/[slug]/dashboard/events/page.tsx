"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Plus, 
  RefreshCw,
  Search,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function EventsPage() {
  const { profile, organization, loading: profileLoading } = useAuthProfile();
  const router = useRouter();
  
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<string | null>(null);

  const slug = organization?.slug || "default";

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
      toast.error("Failed to load events");
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
        toast.success("Successfully registered!");
        fetchEvents();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to register");
      }
    } catch (err) {
      toast.error("Failed to register");
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
    <div className="container py-8 max-w-7xl mx-auto px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Events Calendar</h1>
           <p className="text-slate-500 mt-1">Join workshops, networking sessions, and webinars.</p>
        </div>
        <Button onClick={() => router.push(`/organization/${slug}/dashboard/events/create`)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Publish Event
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md">
            {["all", "upcoming", "past", "registered"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-sm text-xs font-semibold capitalize transition-all ${
                  filter === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search events..." className="h-10 pl-10" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow flex flex-col overflow-hidden">
             <div className="h-40 relative">
                <img 
                   src={event.bannerUrl || "/assets/image/placeholder-event.png"} 
                   alt={event.title} 
                   className="w-full h-full object-cover"
                   onError={(e) => (e.currentTarget.src = "/assets/image/placeholder-event.png")}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                   <Badge className="bg-white/90 text-slate-900 text-[10px]">{event.mode}</Badge>
                </div>
             </div>
             <CardHeader className="p-5 pb-2">
                <CardTitle className="text-lg font-bold line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{event.description || "No description provided."}</CardDescription>
             </CardHeader>
             <CardContent className="p-5 pt-2 space-y-3 flex-1">
                <div className="space-y-1.5 text-xs text-slate-500">
                   <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(event.startsAt), "MMM do, yyyy")}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="truncate">{event.locationName || "Virtual/TBD"}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{event.registeredCount} attending</span>
                   </div>
                </div>
             </CardContent>
             <CardFooter className="p-5 pt-0 gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push(`/organization/${slug}/dashboard/events/${event.slug || event.id}`)}>
                   Details
                </Button>
                {event.isRegistered ? (
                   <Button size="sm" className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100" disabled>
                      Registered
                   </Button>
                ) : (
                   <Button 
                      size="sm"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => handleRegister(event.id)}
                      disabled={registering === event.id || event.isFull}
                   >
                      {registering === event.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Register"}
                   </Button>
                )}
             </CardFooter>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
           <Calendar className="h-12 w-12 text-slate-200 mx-auto" />
           <p className="text-slate-500">No events found for this category.</p>
        </div>
      )}
    </div>
  );
}