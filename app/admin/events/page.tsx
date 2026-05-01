"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
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
  MapPin,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  MoreHorizontal,
  Video,
  ChevronRight,
  Zap,
  Clock,
  Flame
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
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function AdminEventsPage() {
  const router = useRouter();
  const { profile } = useAuthProfile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const orgId = profile?.organizationId;

  const loadEvents = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/events?organizationId=${orgId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) loadEvents();
  }, [loadEvents, orgId]);

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && events.length === 0) {
    return (
       <div className="flex h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-200" />
       </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
           <p className="text-slate-500 mt-1">Plan and monitor institutional activities and community gatherings.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" onClick={loadEvents}>
             <RefreshCw className="h-4 w-4 mr-2" /> Refresh
           </Button>
           <Button onClick={() => router.push("/admin/events/create")} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Create Event
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: events.length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Events", value: events.filter(e => e.status === 'published').length, icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Upcoming Soon", value: events.filter(e => new Date(e.startsAt) > new Date()).length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Attendees", value: events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`${s.bg} p-3 rounded-xl`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search events by title..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" /> More Filters
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                       {event.isFeatured ? <Flame className="h-5 w-5 text-amber-500" /> : <Calendar className="h-5 w-5 text-indigo-500" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold mt-1">
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <p className="font-medium">{format(new Date(event.startsAt), 'MMM dd, yyyy')}</p>
                    <p className="text-slate-500">{format(new Date(event.startsAt), 'p')}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {event.meetingLink ? <Video className="h-3.5 w-3.5 text-blue-500" /> : <MapPin className="h-3.5 w-3.5" />}
                    {event.meetingLink ? 'Online' : (event.locationName || 'TBD')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-24">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>{event.registeredCount || 0} joined</span>
                    </div>
                    <Progress value={Math.min(100, ((event.registeredCount || 0) / (event.maxCapacity || 1)) * 100)} className="h-1" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}`)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600">
                        Cancel Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!filteredEvents.length && (
               <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                     No events found.
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}