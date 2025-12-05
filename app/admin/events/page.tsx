"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Calendar, Users, MapPin, MoreVertical, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminEventsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Get organizations
        const orgsRes = await fetch("/api/organizations");
        if (!orgsRes.ok) throw new Error("Failed to load organizations");
        const orgsData = await orgsRes.json();
        
        if (orgsData.organizations && orgsData.organizations.length > 0) {
          const primaryOrg = orgsData.organizations[0];
          setOrganizationId(primaryOrg.id);

          // Load events
          const eventsRes = await fetch(
            `/api/events?organizationId=${primaryOrg.id}&status=${statusFilter}`
          );
          if (!eventsRes.ok) throw new Error("Failed to load events");
          const eventsData = await eventsRes.json();
          setEvents(eventsData.events || []);
        }
      } catch (err: any) {
        console.error("Failed to load events:", err);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, statusFilter]);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      toast.success("Event deleted successfully");
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      reunion: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      webinar: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      career: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      workshop: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      sports: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: events.length,
    active: events.filter((e) => e.status === "published").length,
    draft: events.filter((e) => e.status === "draft").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all alumni events and activities</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          onClick={() => router.push("/admin/events/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Events</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Events</p>
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.draft}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Draft Events</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.cancelled}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Manage and monitor all alumni events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search events by title..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Events Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Attendees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No events found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm
                          ? `No events matching "${searchTerm}"`
                          : "No events available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const attendeeCount = event.event_attendees?.length || 0;
                    const maxAttendees = event.max_attendees || 0;
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {event.title}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                              {event.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={getTypeBadge(event.event_type || "general")}>
                            {event.event_type || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {event.start_date
                              ? new Date(event.start_date).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-900 dark:text-white">
                          {event.location || "Virtual"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {attendeeCount}
                              {maxAttendees > 0 && `/${maxAttendees}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(event.status)}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/events/${event.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/admin/events/${event.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(event.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
