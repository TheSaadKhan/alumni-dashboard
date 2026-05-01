"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Search,
  Calendar,
  Users,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Clock,
  ArrowUpRight,
  Edit,
  Trash2,
  Filter,
  Loader2,
  Inbox
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthProfile } from "@/context/AuthContext";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { sessionGet, sessionSet } from "@/lib/cache";

export default function AdminEventsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const orgId = profile?.organizationId;

  const loadEvents = useCallback(async (silent = false) => {
    if (!orgId) return;
    if (!silent) {
      const cached = sessionGet<any[]>(`admin_events_${orgId}`);
      if (cached) { setEvents(cached); setLoading(false); }
      else setLoading(true);
    }
    try {
      const res = await fetch(`/api/events?organizationId=${orgId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const loadedEvents = data.events || [];
      setEvents(loadedEvents);
      sessionSet(`admin_events_${orgId}`, loadedEvents, 5 * 60 * 1000); // 5 min cache
    } catch (err) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadEvents();
  }, [loadEvents, orgId]);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const now = new Date();
    const eventDate = new Date(e.startsAt);
    const matchesStatus = statusFilter === "all" 
      || (statusFilter === "upcoming" && eventDate > now)
      || (statusFilter === "past" && eventDate <= now);
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Event deleted");
        loadEvents(true);
      } else {
        toast.error("Failed to delete event");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Events</h1>
          <p className="text-slate-500 font-medium text-sm">Manage and monitor institutional gatherings.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="ghost" 
            onClick={() => loadEvents()}
            className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
          </Button>
          <Button 
            onClick={() => router.push("/admin/events/create")}
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search events..." 
            className="pl-10 h-10 rounded-xl border-none bg-slate-50/50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
            {["all", "upcoming", "past"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
        {loading && events.length === 0 ? (
          <div className="p-0">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
              <Inbox className="h-8 w-8 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">No events found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="w-[400px] text-xs font-bold uppercase tracking-widest text-slate-400 px-8 py-5">Event Details</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Date & Time</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5">Attendance</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 py-5 text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const isUpcoming = new Date(event.startsAt) > new Date();
                  return (
                    <TableRow key={event.id} className="hover:bg-slate-50/50 border-slate-50 group transition-colors">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            isUpcoming ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-slate-100 border-slate-200 text-slate-400"
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter rounded-lg border-slate-200 text-slate-500">
                                {event.eventType.replace('_', ' ')}
                              </Badge>
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 capitalize">
                                <Clock className="h-3 w-3" /> {event.mode.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-slate-700">{format(new Date(event.startsAt), "MMM dd, yyyy")}</p>
                          <p className="text-[10px] font-medium text-slate-400">{format(new Date(event.startsAt), "hh:mm a")}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-slate-300" />
                          <span className="text-sm font-bold text-slate-600">{event.registrationsCount || 0}</span>
                          <span className="text-[10px] text-slate-300 font-medium">/ {event.maxCapacity || '∞'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8 py-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                            <DropdownMenuItem className="py-2.5 font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer" onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem className="py-2.5 font-bold text-slate-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer" onClick={() => router.push(`/organization/${profile?.organization?.slug}/events/${event.slug}`)}>
                              <ArrowUpRight className="h-4 w-4 mr-2" /> View Public Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="py-2.5 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer" onClick={() => handleDelete(event.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}